// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {PermissionedToken} from "../src/PermissionedToken.sol";
import {TrancheVault} from "../src/TrancheVault.sol";
import {WaterfallDistributor} from "../src/WaterfallDistributor.sol";
import {IERC20} from "../src/IERC20.sol";

/// @dev Minimal USDC-like mock. Reverts on failed transfer instead of returning
///      false, matching how OpenZeppelin ERC-20 tests exercise the paths.
contract MockUSDC is IERC20 {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public constant decimals = 6;
    uint256 public override totalSupply;
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    function mint(address to, uint256 v) external {
        balanceOf[to] += v;
        totalSupply += v;
    }

    function transfer(address to, uint256 v) external override returns (bool) {
        require(balanceOf[msg.sender] >= v, "MOCK: insufficient");
        unchecked { balanceOf[msg.sender] -= v; }
        balanceOf[to] += v;
        return true;
    }

    function approve(address s, uint256 v) external override returns (bool) {
        allowance[msg.sender][s] = v;
        return true;
    }

    function transferFrom(address f, address t, uint256 v) external override returns (bool) {
        uint256 a = allowance[f][msg.sender];
        require(a >= v, "MOCK: allowance");
        require(balanceOf[f] >= v, "MOCK: insufficient");
        if (a != type(uint256).max) {
            unchecked { allowance[f][msg.sender] = a - v; }
        }
        unchecked { balanceOf[f] -= v; }
        balanceOf[t] += v;
        return true;
    }
}

contract WaterfallDistributorTest is Test {
    ComplianceRegistry reg;
    PermissionedToken seniorTok;
    PermissionedToken juniorTok;
    TrancheVault vault;
    MockUSDC usdc;
    WaterfallDistributor wf;

    address admin = address(0xA11CE);
    address verifier = address(0xBEEF);
    address issuer = address(0xCAFE);
    address investor = address(0x1111);
    address payer = address(0x9999);
    address feeR = address(0xFEE0);
    address sSink = address(0x5001);
    address jSink = address(0x5002);
    address resR = address(0xE0);

    function setUp() public {
        vm.warp(1_800_000_000);
        reg = new ComplianceRegistry(admin);
        vm.startPrank(admin);
        reg.setVerifier(verifier, true);
        vm.stopPrank();

        vm.startPrank(verifier);
        uint64 exp = uint64(block.timestamp + 365 days);
        reg.setJurisdiction(investor, 0x5553);
        reg.issueClaim(investor, reg.TOPIC_KYC(), exp, bytes32(0));
        reg.issueClaim(investor, reg.TOPIC_SANCTIONS_CLEARED(), exp, bytes32(0));
        reg.issueClaim(investor, reg.TOPIC_ACCREDITED_506C(), exp, bytes32(0));
        vm.stopPrank();

        uint256[] memory req = new uint256[](1);
        req[0] = reg.TOPIC_ACCREDITED_506C();
        seniorTok = new PermissionedToken("MHS", "MHS", reg, req, issuer);
        juniorTok = new PermissionedToken("MHM", "MHM", reg, req, issuer);

        // Small numbers so we can hand-verify the waterfall.
        // Zero cushion here so we don't have to also orchestrate a junior
        // subscription — the waterfall's own tests exercise the vault
        // invariant separately in TrancheVault.t.sol.
        vault = new TrancheVault(
            admin, keccak256("MHELEN"),
            seniorTok, 100_000_000, 500,  // $100 senior @ 5%
            juniorTok, 25_000_000,  1000, // $25 mezz  @ 10%
            0                             // cushion disabled in waterfall tests
        );

        usdc = new MockUSDC();
        wf = new WaterfallDistributor(
            admin, IERC20(address(usdc)), vault,
            feeR, sSink, jSink, resR,
            100 // 1% fee
        );

        // Vault admin needs to be the waterfall so it can recordPrincipalRepayment.
        // We use two-step handoff.
        vm.prank(admin);
        vault.initiateAdminTransfer(address(wf));
        // The waterfall itself has to accept, which it cannot do from its
        // own code. In production a governance script would sequence the
        // handoff; for these tests we grant admin directly by having wf's
        // admin do the accept (impossible from a contract), so we use a
        // shortcut: keep vault.admin as `admin` and give the waterfall
        // separate admin authority via a wrapper below.
        // Simpler approach: set wf.admin AS vault.admin.
        // Revert the pending handoff and instead grant equal admin.
        // For simplicity in this test we re-deploy vault with wf as admin.
        vault = new TrancheVault(
            address(wf), keccak256("MHELEN"),
            seniorTok, 100_000_000, 500,
            juniorTok, 25_000_000,  1000, 0
        );

        // Rebuild waterfall against the new vault since immutable.
        wf = new WaterfallDistributor(
            admin, IERC20(address(usdc)), vault,
            feeR, sSink, jSink, resR,
            100
        );

        // Now the waterfall is the vault admin because we passed address(wf)
        // above but wf was just re-deployed after. That won't work either;
        // we need vault.admin = new wf. Re-do the sequence in one shot:
        wf = _wireWaterfall();

        // Record initial subscriptions through the waterfall — this only
        // works if wf is vault admin AND we prank as wf via vm.prank.
        vm.prank(address(wf));
        vault.recordSubscription(investor, true, 100_000_000);
        vm.prank(address(wf));
        vault.recordSubscription(investor, false, 25_000_000);

        // Seed payer with USDC + approve wf
        usdc.mint(payer, 1_000_000_000);
        vm.prank(payer);
        usdc.approve(address(wf), type(uint256).max);
    }

    /// @dev Deploys vault + waterfall so vault.admin == address(wf) atomically.
    function _wireWaterfall() internal returns (WaterfallDistributor) {
        // 1) Predict wf address using a helper contract's nonce.
        // Easier: use vm.computeCreateAddress from Foundry.
        uint256 nonce = vm.getNonce(address(this));
        address predicted = vm.computeCreateAddress(address(this), nonce + 1);

        vault = new TrancheVault(
            predicted, keccak256("MHELEN"),
            seniorTok, 100_000_000, 500,
            juniorTok, 25_000_000,  1000, 0
        );
        WaterfallDistributor w = new WaterfallDistributor(
            admin, IERC20(address(usdc)), vault,
            feeR, sSink, jSink, resR,
            100
        );
        require(address(w) == predicted, "address prediction wrong");
        return w;
    }

    // ─────────────────────────────────────────────────────────── conservation

    /// @notice The safety property. For any gross > 0, the sum of the
    ///         6 buckets equals gross exactly. Anything else reverts.
    function test_conservationHolds_normal() public {
        // accrue some interest first
        vm.warp(block.timestamp + 30 days);
        wf.accrueInterest();
        assertGt(wf.accruedSeniorInterest(), 0);
        assertGt(wf.accruedJuniorInterest(), 0);

        vm.prank(admin);
        WaterfallDistributor.Distribution memory d = wf.distribute(payer, 10_000_000); // $10

        uint256 sum = d.fee + d.seniorInterest + d.juniorInterest
                    + d.seniorPrincipal + d.juniorPrincipal + d.residual;
        assertEq(sum, d.gross);
        assertEq(d.gross, 10_000_000);
    }

    function test_feeGoesToFeeRecipient() public {
        vm.prank(admin);
        wf.distribute(payer, 10_000_000);
        assertEq(usdc.balanceOf(feeR), 100_000); // 1% of 10M
    }

    // ─────────────────────────────────────────────────────────── mode behavior

    function test_cashTrapSkipsJuniorInterest() public {
        vm.warp(block.timestamp + 30 days);
        wf.accrueInterest();
        uint256 juniorInterestBefore = wf.accruedJuniorInterest();

        // Since vault.admin == address(wf), only the waterfall can call
        // setMode. We test the mode-branching via a direct low-level call.
        vm.prank(address(wf));
        vault.setMode(TrancheVault.Mode.CashTrap, "DSCR breach");

        vm.prank(admin);
        WaterfallDistributor.Distribution memory d = wf.distribute(payer, 500_000);
        assertEq(d.juniorInterest, 0);
        assertEq(wf.accruedJuniorInterest(), juniorInterestBefore);
    }

    function test_turboSendsEverythingToSeniorPrincipal() public {
        vm.prank(address(wf));
        vault.setMode(TrancheVault.Mode.Turbo, "covenant hard breach");
        vm.prank(admin);
        WaterfallDistributor.Distribution memory d = wf.distribute(payer, 5_000_000);
        assertEq(d.seniorInterest, 0);
        assertEq(d.juniorInterest, 0);
        assertEq(d.juniorPrincipal, 0);
        // Fee then everything else against senior principal
        assertEq(d.fee, 50_000); // 1%
        assertEq(d.seniorPrincipal, 4_950_000);
    }

    // ─────────────────────────────────────────────────────────── priority

    function test_seniorInterestPaidBeforeJuniorInterest() public {
        vm.warp(block.timestamp + 30 days);
        wf.accrueInterest();
        uint256 sPre = wf.accruedSeniorInterest();
        uint256 jPre = wf.accruedJuniorInterest();
        assertGt(sPre, 0);
        assertGt(jPre, 0);

        // Payment sized to cover fee + all of senior interest + a little of junior.
        uint256 gross = (sPre * 10_000) / (10_000 - 100) + 1000; // account for fee
        vm.prank(admin);
        WaterfallDistributor.Distribution memory d = wf.distribute(payer, gross);
        assertEq(d.seniorInterest, sPre);
        assertGt(d.juniorInterest, 0);
        assertLt(d.juniorInterest, jPre);
    }

    // ─────────────────────────────────────────────────────────── governance

    function test_nonAdminCannotDistribute() public {
        vm.prank(payer);
        vm.expectRevert(WaterfallDistributor.NotAdmin.selector);
        wf.distribute(payer, 1_000_000);
    }

    function test_feeBpsHardCap() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(WaterfallDistributor.FeeBpsTooHigh.selector, uint16(1001)));
        wf.setFeeBps(1001);
    }

    function test_zeroGrossReverts() public {
        vm.prank(admin);
        vm.expectRevert(WaterfallDistributor.ZeroValue.selector);
        wf.distribute(payer, 0);
    }

    // ─────────────────────────────────────────────────────────── fuzz

    /// @dev The conservation property must hold for ANY gross above 0 and
    ///      ANY plausible fee bps. If a future refactor forgets a bucket,
    ///      this fuzz would surface it inside 256 runs.
    function testFuzz_conservationAlwaysHolds(uint96 gross, uint16 feeBps) public {
        vm.assume(gross > 0 && gross < 1_000_000_000_000);
        vm.assume(feeBps <= 1000);
        vm.prank(admin);
        wf.setFeeBps(feeBps);
        // Give payer enough
        usdc.mint(payer, uint256(gross));
        vm.prank(admin);
        WaterfallDistributor.Distribution memory d = wf.distribute(payer, uint256(gross));
        uint256 sum = d.fee + d.seniorInterest + d.juniorInterest
                    + d.seniorPrincipal + d.juniorPrincipal + d.residual;
        assertEq(sum, uint256(gross));
    }
}
