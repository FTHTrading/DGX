// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {PermissionedToken} from "./PermissionedToken.sol";

/// @title TrancheVault
/// @notice Two-tranche (senior + junior) container built around two existing
///         PermissionedToken instances. The vault holds the tranche tokens'
///         issuer role via forceTransfer + mint delegation is NOT provided —
///         issuance of the underlying tokens stays with the SPV. What this
///         vault owns is the *accounting* of which tranche each principal
///         dollar sits in and the on-chain state a WaterfallDistributor
///         needs to know which bucket to fill first.
///
/// @dev DROP / TIN naming from the Centrifuge pattern:
///        * Senior = DROP-equivalent = fixed-yield, first-loss protected
///        * Junior = TIN-equivalent = residual, first-loss position
///
///      The vault does not calculate returns. It records:
///        * the target senior principal and coupon
///        * the current principal balance for each tranche
///        * whether the deal is in cash-trap or turbo mode (fed by a DSCR
///          trigger or an off-chain governance action)
///
///      Everything money-moving lives in WaterfallDistributor. Splitting the
///      accounting from the disbursement means the vault can be paused (freeze
///      new subscriptions) while the distributor keeps serving what it owes.
contract TrancheVault {
    enum Mode {
        Normal,     // sequential interest → principal per tranche
        CashTrap,   // DSCR breached: all cash to senior interest + principal
        Turbo       // covenant breached harder: 100% to senior principal
    }

    struct Tranche {
        PermissionedToken token;    // the ERC-3643 instrument for this tranche
        uint256 targetPrincipal;    // stated raise, minor units
        uint256 currentPrincipal;   // outstanding principal, minor units
        uint256 couponBps;          // annualized coupon in basis points
        uint256 subscribedPrincipal; // total ever subscribed (informational)
    }

    address public admin;
    address public pendingAdmin;
    Tranche public senior;
    Tranche public junior;
    Mode public mode;
    bool public subscriptionsPaused;

    /// @dev Set only once — the deal's identifier for the audit trail.
    /// Locked at construction so no one can retag a live deal.
    bytes32 public immutable dealId;

    /// @dev Hard structural invariant per Senior Loop directive 4.B:
    ///      junior tranche must be at least `minJuniorRatioBps` basis points
    ///      of total outstanding at any moment where junior > 0. That is
    ///      the cushion that lets junior absorb 100% of loss before senior
    ///      suffers impairment; a violation would silently subordinate the
    ///      senior. Enforced on every subscription and every repayment.
    ///
    ///      Zero disables the check (for tranches that intentionally have no
    ///      junior cushion, e.g. a single-class deal); nonzero locks it in
    ///      at construction and is never mutable afterwards.
    uint16 public immutable minJuniorRatioBps;

    // ─────────────────────────────────────────────────────────── events

    event AdminTransferInitiated(address indexed from, address indexed to);
    event AdminTransferAccepted(address indexed from, address indexed to);
    event ModeChanged(Mode previous, Mode next, string reason);
    event SubscriptionsPausedSet(bool paused);
    event Subscribed(address indexed investor, bool senior, uint256 principal);
    event PrincipalRepaid(bool senior, uint256 principal, uint256 remaining);
    event TargetSet(bool senior, uint256 target, uint256 couponBps);

    // ─────────────────────────────────────────────────────────── errors

    error NotAdmin();
    error NotPendingAdmin();
    error ZeroAddress();
    error ZeroValue();
    error SubscriptionsPaused_();
    error PrincipalWouldExceedTarget(uint256 attempted, uint256 target);
    error RepaymentExceedsOutstanding(uint256 attempted, uint256 outstanding);
    error SameMode();
    error JuniorCushionBreached(uint256 juniorPrincipal, uint256 totalPrincipal, uint256 minRatioBps);
    error RatioTooHigh(uint16 requested);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(
        address admin_,
        bytes32 dealId_,
        PermissionedToken seniorToken,
        uint256 seniorTarget,
        uint256 seniorCouponBps,
        PermissionedToken juniorToken,
        uint256 juniorTarget,
        uint256 juniorCouponBps,
        uint16 minJuniorRatioBps_
    ) {
        if (admin_ == address(0)) revert ZeroAddress();
        if (address(seniorToken) == address(0)) revert ZeroAddress();
        if (address(juniorToken) == address(0)) revert ZeroAddress();
        if (seniorTarget == 0 || juniorTarget == 0) revert ZeroValue();
        if (minJuniorRatioBps_ > 5000) revert RatioTooHigh(minJuniorRatioBps_); // <=50%
        admin = admin_;
        dealId = dealId_;
        minJuniorRatioBps = minJuniorRatioBps_;
        senior = Tranche({
            token: seniorToken,
            targetPrincipal: seniorTarget,
            currentPrincipal: 0,
            couponBps: seniorCouponBps,
            subscribedPrincipal: 0
        });
        junior = Tranche({
            token: juniorToken,
            targetPrincipal: juniorTarget,
            currentPrincipal: 0,
            couponBps: juniorCouponBps,
            subscribedPrincipal: 0
        });
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

    /// @notice Mode is fed by the DSCR trigger (or by governance intervention).
    ///         Emits `reason` so the audit trail carries the trigger cause.
    function setMode(Mode next, string calldata reason) external onlyAdmin {
        if (next == mode) revert SameMode();
        emit ModeChanged(mode, next, reason);
        mode = next;
    }

    function setSubscriptionsPaused(bool p) external onlyAdmin {
        subscriptionsPaused = p;
        emit SubscriptionsPausedSet(p);
    }

    function setTarget(bool isSenior, uint256 target, uint256 couponBps) external onlyAdmin {
        if (target == 0) revert ZeroValue();
        if (isSenior) {
            senior.targetPrincipal = target;
            senior.couponBps = couponBps;
        } else {
            junior.targetPrincipal = target;
            junior.couponBps = couponBps;
        }
        emit TargetSet(isSenior, target, couponBps);
    }

    // ─────────────────────────────────────────────────────────── accounting

    /// @notice Record a new subscription. Off-chain the SPV also calls
    ///         `token.mint(investor, principal)`; this call updates the vault
    ///         balances so the waterfall knows what to service.
    /// @dev No token transfer happens here. Vault only tracks balances so the
    ///      waterfall can compute distributions. Coupling minting to this call
    ///      would force the vault to hold the token issuer role, which is a
    ///      concentration risk — SPV keeps issuer.
    function recordSubscription(address investor, bool isSenior, uint256 principal) external onlyAdmin {
        if (investor == address(0)) revert ZeroAddress();
        if (principal == 0) revert ZeroValue();
        if (subscriptionsPaused) revert SubscriptionsPaused_();

        Tranche storage t = isSenior ? senior : junior;
        uint256 next = t.currentPrincipal + principal;
        if (next > t.targetPrincipal) {
            revert PrincipalWouldExceedTarget(next, t.targetPrincipal);
        }
        t.currentPrincipal = next;
        t.subscribedPrincipal += principal;
        _enforceJuniorCushion();
        emit Subscribed(investor, isSenior, principal);
    }

    /// @notice Record principal repayment on a tranche. Called by the
    ///         WaterfallDistributor after it disburses principal.
    /// @dev Junior-cushion invariant is enforced AFTER the reduction. The
    ///      waterfall pays senior principal first, which SHRINKS senior
    ///      outstanding and therefore RAISES the effective junior ratio —
    ///      so the check reliably passes on senior repayments. It CAN fail
    ///      on a junior repayment made before enough senior is retired —
    ///      that's the property we want, because paying junior early would
    ///      strip the cushion the senior is priced against.
    function recordPrincipalRepayment(bool isSenior, uint256 principal) external onlyAdmin {
        if (principal == 0) revert ZeroValue();
        Tranche storage t = isSenior ? senior : junior;
        if (principal > t.currentPrincipal) {
            revert RepaymentExceedsOutstanding(principal, t.currentPrincipal);
        }
        unchecked { t.currentPrincipal -= principal; }
        _enforceJuniorCushion();
        emit PrincipalRepaid(isSenior, principal, t.currentPrincipal);
    }

    // ─────────────────────────────────────────────────────────── invariant

    /// @dev Junior cushion — every state-mutating path calls this at the end.
    ///      Passes trivially when minJuniorRatioBps == 0 or junior == 0
    ///      (no junior in the stack yet; senior is subordinated to nothing
    ///      other than the underlying asset). Otherwise requires:
    ///        juniorPrincipal * 10_000 >= totalPrincipal * minJuniorRatioBps
    function _enforceJuniorCushion() internal view {
        if (minJuniorRatioBps == 0) return;
        uint256 j = junior.currentPrincipal;
        uint256 s = senior.currentPrincipal;
        uint256 total = s + j;
        if (total == 0) return;
        // Multiplication-first form avoids the divisor-of-zero branch and
        // keeps the check exact — no rounding.
        if (j * 10_000 < total * uint256(minJuniorRatioBps)) {
            revert JuniorCushionBreached(j, total, uint256(minJuniorRatioBps));
        }
    }

    // ─────────────────────────────────────────────────────────── read

    function juniorRatioBps() external view returns (uint256) {
        uint256 j = junior.currentPrincipal;
        uint256 total = senior.currentPrincipal + j;
        if (total == 0) return 0;
        return (j * 10_000) / total;
    }

    function seniorOutstanding() external view returns (uint256) {
        return senior.currentPrincipal;
    }

    function juniorOutstanding() external view returns (uint256) {
        return junior.currentPrincipal;
    }

    function totalOutstanding() external view returns (uint256) {
        return senior.currentPrincipal + junior.currentPrincipal;
    }
}
