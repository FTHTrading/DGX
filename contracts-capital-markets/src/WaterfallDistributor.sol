// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TrancheVault} from "./TrancheVault.sol";
import {PermissionedToken} from "./PermissionedToken.sol";
import {IERC20} from "./IERC20.sol";

/// @title WaterfallDistributor
/// @notice Deterministic priority-of-payments engine over a `TrancheVault`.
///         Payment order per period:
///
///           1. Fee (bps of gross)             → feeRecipient
///           2. Senior interest (accrued)      → senior tranche
///           3. Junior interest (accrued)      → junior tranche  (Normal mode only)
///           4. Senior principal               → senior tranche
///           5. Junior principal               → junior tranche  (Normal mode only)
///           6. Residual                       → juniorResidualRecipient
///
///         In `CashTrap` mode step 3 is skipped; interest is preserved for the
///         senior. In `Turbo` mode steps 2, 3, 5 are skipped — every cent past
///         the fee lands on senior principal.
///
/// @dev Conservation invariant. Sum of (fee + senior interest + junior
///      interest + senior principal + junior principal + residual) MUST equal
///      the gross payment for every call. Any dust from bps math is added to
///      the residual bucket, and residual is never negative. The `distribute`
///      function returns each bucket so a test suite can verify the identity.
///
/// @dev No on-chain claim register. Distributions push USDC directly to the
///      tranche token contract as pro-rata-per-holder is a per-holder problem
///      handled off chain by the paying agent — the vault only owes each
///      TRANCHE a bucket. Anyone who wants pro-rata pushdown wires it to the
///      tranche token's holder set from these events; that's a separate
///      contract, so it can be replaced without touching this waterfall.
///
///      This mirrors CMBSWaterfall in the ld-capital-contracts package for
///      the M Helen reference deal.
contract WaterfallDistributor {
    IERC20 public immutable payToken;   // USDC or equivalent
    TrancheVault public immutable vault;

    address public admin;
    address public pendingAdmin;
    address public feeRecipient;
    address public seniorPayoutSink;    // receives senior interest + principal
    address public juniorPayoutSink;    // receives junior interest + principal
    address public residualRecipient;   // receives anything left over

    /// @dev Servicing / issuer fee, basis points of gross payment.
    uint16 public feeBps;

    /// @dev Accrued but unpaid interest, minor units.
    uint256 public accruedSeniorInterest;
    uint256 public accruedJuniorInterest;

    /// @dev Timestamp of last interest accrual.
    uint64 public lastAccrualAt;

    struct Distribution {
        uint256 gross;
        uint256 fee;
        uint256 seniorInterest;
        uint256 juniorInterest;
        uint256 seniorPrincipal;
        uint256 juniorPrincipal;
        uint256 residual;
    }

    // ─────────────────────────────────────────────────────────── events

    event AdminTransferInitiated(address indexed from, address indexed to);
    event AdminTransferAccepted(address indexed from, address indexed to);
    event FeeBpsSet(uint16 previous, uint16 next);
    event SinksSet(address feeRecipient, address seniorSink, address juniorSink, address residualRecipient);
    event InterestAccrued(uint256 seniorDelta, uint256 juniorDelta, uint64 periodSeconds);
    event Distributed(
        uint256 gross,
        uint256 fee,
        uint256 seniorInterest,
        uint256 juniorInterest,
        uint256 seniorPrincipal,
        uint256 juniorPrincipal,
        uint256 residual,
        TrancheVault.Mode mode
    );

    // ─────────────────────────────────────────────────────────── errors

    error NotAdmin();
    error NotPendingAdmin();
    error ZeroAddress();
    error ZeroValue();
    error FeeBpsTooHigh(uint16 requested);
    error TransferFailed(address token, address to, uint256 value);
    error ConservationBroken(uint256 gross, uint256 sum);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(
        address admin_,
        IERC20 payToken_,
        TrancheVault vault_,
        address feeRecipient_,
        address seniorSink_,
        address juniorSink_,
        address residualRecipient_,
        uint16 feeBps_
    ) {
        if (admin_ == address(0)) revert ZeroAddress();
        if (address(payToken_) == address(0)) revert ZeroAddress();
        if (address(vault_) == address(0)) revert ZeroAddress();
        if (feeRecipient_ == address(0)) revert ZeroAddress();
        if (seniorSink_ == address(0)) revert ZeroAddress();
        if (juniorSink_ == address(0)) revert ZeroAddress();
        if (residualRecipient_ == address(0)) revert ZeroAddress();
        if (feeBps_ > 1000) revert FeeBpsTooHigh(feeBps_); // hard cap 10%

        admin = admin_;
        payToken = payToken_;
        vault = vault_;
        feeRecipient = feeRecipient_;
        seniorPayoutSink = seniorSink_;
        juniorPayoutSink = juniorSink_;
        residualRecipient = residualRecipient_;
        feeBps = feeBps_;
        lastAccrualAt = uint64(block.timestamp);
    }

    // ─────────────────────────────────────────────────────────── governance

    function initiateAdminTransfer(address next) external onlyAdmin {
        if (next == address(0)) revert ZeroAddress();
        pendingAdmin = next;
        emit AdminTransferInitiated(admin, next);
    }

    function acceptAdminTransfer() external {
        if (msg.sender != pendingAdmin) revert NotPendingAdmin();
        address prev = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferAccepted(prev, admin);
    }

    function setFeeBps(uint16 next) external onlyAdmin {
        if (next > 1000) revert FeeBpsTooHigh(next);
        emit FeeBpsSet(feeBps, next);
        feeBps = next;
    }

    function setSinks(
        address feeRecipient_,
        address seniorSink_,
        address juniorSink_,
        address residualRecipient_
    ) external onlyAdmin {
        if (feeRecipient_ == address(0) || seniorSink_ == address(0)
            || juniorSink_ == address(0) || residualRecipient_ == address(0)) revert ZeroAddress();
        feeRecipient = feeRecipient_;
        seniorPayoutSink = seniorSink_;
        juniorPayoutSink = juniorSink_;
        residualRecipient = residualRecipient_;
        emit SinksSet(feeRecipient_, seniorSink_, juniorSink_, residualRecipient_);
    }

    // ─────────────────────────────────────────────────────────── interest

    /// @notice Accrue interest on both tranches at their configured coupons
    ///         since `lastAccrualAt`. Anyone may call — accrual is a monotonic
    ///         function of elapsed time, not a governance action.
    /// @dev Simple linear accrual: principal * couponBps / 10000 * period / year.
    ///      A more precise engine would compound; this deal uses simple
    ///      interest per the reference model.
    function accrueInterest() external {
        uint64 nowTs = uint64(block.timestamp);
        if (nowTs <= lastAccrualAt) return;
        uint64 dt = nowTs - lastAccrualAt;

        (uint256 sPrincipal, uint256 sBps) = _readTranche(true);
        (uint256 jPrincipal, uint256 jBps) = _readTranche(false);

        uint256 sDelta = _interestFor(sPrincipal, sBps, dt);
        uint256 jDelta = _interestFor(jPrincipal, jBps, dt);
        accruedSeniorInterest += sDelta;
        accruedJuniorInterest += jDelta;
        lastAccrualAt = nowTs;
        emit InterestAccrued(sDelta, jDelta, dt);
    }

    /// @dev principal * bps * seconds / (10000 * 365 days)
    function _interestFor(uint256 principal, uint256 bps, uint64 dt) internal pure returns (uint256) {
        if (principal == 0 || bps == 0 || dt == 0) return 0;
        // 10000 bps = 100%, 365 days = 31_536_000 seconds
        return (principal * bps * dt) / (10000 * 365 days);
    }

    // ─────────────────────────────────────────────────────────── distribute

    /// @notice Pull `gross` of payToken from `payer` (who must have approved
    ///         this contract) and distribute per waterfall. Returns the
    ///         breakdown so a test / off-chain reconciler can verify
    ///         conservation.
    function distribute(address payer, uint256 gross) external onlyAdmin returns (Distribution memory d) {
        if (gross == 0) revert ZeroValue();

        // Pull first so a revert path never leaves us short.
        bool ok = payToken.transferFrom(payer, address(this), gross);
        if (!ok) revert TransferFailed(address(payToken), address(this), gross);

        TrancheVault.Mode m = vault.mode();

        d.gross = gross;
        uint256 remaining = gross;

        // ─── 1. Fee ─────────────────────────────────────────────
        d.fee = (gross * feeBps) / 10000;
        if (d.fee > remaining) d.fee = remaining;
        remaining -= d.fee;
        _push(feeRecipient, d.fee);

        // ─── 2. Senior interest ────────────────────────────────
        if (m != TrancheVault.Mode.Turbo) {
            d.seniorInterest = _min(remaining, accruedSeniorInterest);
            remaining -= d.seniorInterest;
            accruedSeniorInterest -= d.seniorInterest;
            _push(seniorPayoutSink, d.seniorInterest);
        }

        // ─── 3. Junior interest ────────────────────────────────
        if (m == TrancheVault.Mode.Normal) {
            d.juniorInterest = _min(remaining, accruedJuniorInterest);
            remaining -= d.juniorInterest;
            accruedJuniorInterest -= d.juniorInterest;
            _push(juniorPayoutSink, d.juniorInterest);
        }

        // ─── 4. Senior principal ──────────────────────────────
        uint256 sOut = vault.seniorOutstanding();
        d.seniorPrincipal = _min(remaining, sOut);
        if (d.seniorPrincipal > 0) {
            vault.recordPrincipalRepayment(true, d.seniorPrincipal);
            _push(seniorPayoutSink, d.seniorPrincipal);
            remaining -= d.seniorPrincipal;
        }

        // ─── 5. Junior principal ──────────────────────────────
        if (m == TrancheVault.Mode.Normal) {
            uint256 jOut = vault.juniorOutstanding();
            d.juniorPrincipal = _min(remaining, jOut);
            if (d.juniorPrincipal > 0) {
                vault.recordPrincipalRepayment(false, d.juniorPrincipal);
                _push(juniorPayoutSink, d.juniorPrincipal);
                remaining -= d.juniorPrincipal;
            }
        }

        // ─── 6. Residual ──────────────────────────────────────
        d.residual = remaining;
        if (d.residual > 0) {
            _push(residualRecipient, d.residual);
        }

        // Conservation check — reverts the whole distribution if we ever
        // fail to account for a cent. This is the sole safety net against
        // a future refactor introducing a leak.
        uint256 sum = d.fee + d.seniorInterest + d.juniorInterest
                    + d.seniorPrincipal + d.juniorPrincipal + d.residual;
        if (sum != gross) revert ConservationBroken(gross, sum);

        emit Distributed(
            gross, d.fee, d.seniorInterest, d.juniorInterest,
            d.seniorPrincipal, d.juniorPrincipal, d.residual, m
        );
    }

    // ─────────────────────────────────────────────────────────── helpers

    /// @dev The struct getter returns `PermissionedToken` (contract type), not
    ///      address. We only need principal + bps for accrual, so we discard
    ///      the token pointer explicitly.
    function _readTranche(bool isSenior) internal view returns (
        uint256 currentPrincipal,
        uint256 couponBps
    ) {
        if (isSenior) {
            (, /*target*/, currentPrincipal, couponBps, /*sub*/) = vault.senior();
        } else {
            (, /*target*/, currentPrincipal, couponBps, /*sub*/) = vault.junior();
        }
    }

    function _push(address to, uint256 value) internal {
        if (value == 0) return;
        bool ok = payToken.transfer(to, value);
        if (!ok) revert TransferFailed(address(payToken), to, value);
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
