// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {PermissionedToken} from "../src/PermissionedToken.sol";
import {TrancheVault} from "../src/TrancheVault.sol";

contract TrancheVaultTest is Test {
    ComplianceRegistry reg;
    PermissionedToken seniorTok;
    PermissionedToken juniorTok;
    TrancheVault vault;

    address admin = address(0xA11CE);
    address verifier = address(0xBEEF);
    address issuer = address(0xCAFE);
    address investor = address(0x1111);

    bytes32 constant DEAL_ID = keccak256("M-HELEN-2026-001");

    uint256[] required;

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

        required = new uint256[](1);
        required[0] = reg.TOPIC_ACCREDITED_506C();
        seniorTok = new PermissionedToken("MH Senior", "MHS", reg, required, issuer);
        juniorTok = new PermissionedToken("MH Mezz",   "MHM", reg, required, issuer);

        // M Helen structure: $25.0M senior + $4.1M mezz-land = $29.1M total.
        // Junior cushion at $4.1M / $29.1M = 14.09% => 1408 bps required.
        vault = new TrancheVault(
            admin,
            DEAL_ID,
            seniorTok, 25_000_000_000_000, 700, // $25.0M @ 7.00%
            juniorTok, 4_100_000_000_000, 1100, // $4.1M @ 11.00%
            1408                                 // min junior cushion 14.08%
        );
    }

    // ─────────────────────────────────────────────────────────── construction

    function test_dealIdIsLocked() public view {
        assertEq(vault.dealId(), DEAL_ID);
    }

    function test_constructorRejectsZeros() public {
        vm.expectRevert(TrancheVault.ZeroAddress.selector);
        new TrancheVault(address(0), DEAL_ID, seniorTok, 1, 100, juniorTok, 1, 100, 0);
        vm.expectRevert(TrancheVault.ZeroValue.selector);
        new TrancheVault(admin, DEAL_ID, seniorTok, 0, 100, juniorTok, 1, 100, 0);
        vm.expectRevert(TrancheVault.ZeroValue.selector);
        new TrancheVault(admin, DEAL_ID, seniorTok, 1, 100, juniorTok, 0, 100, 0);
    }

    function test_constructorRejectsRatioOver50Pct() public {
        vm.expectRevert(abi.encodeWithSelector(TrancheVault.RatioTooHigh.selector, uint16(5001)));
        new TrancheVault(admin, DEAL_ID, seniorTok, 1, 100, juniorTok, 1, 100, 5001);
    }

    function test_juniorCushionImmutable() public view {
        assertEq(vault.minJuniorRatioBps(), 1408);
    }

    /// @dev Senior Loop directive 4.B: junior must absorb 100% loss first.
    ///      That only holds if we never let junior slip below its declared
    ///      cushion ratio. This test builds the scenario where senior alone
    ///      is subscribed and asserts the invariant blocks it.
    function test_seniorOnlySubscriptionBreachesCushion() public {
        // Subscribing $25M senior with $0 junior => junior ratio = 0 <1408 bps
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(
            TrancheVault.JuniorCushionBreached.selector,
            uint256(0), uint256(25_000_000_000_000), uint256(1408)
        ));
        vault.recordSubscription(investor, true, 25_000_000_000_000);
    }

    /// @dev Subscribing junior FIRST establishes the cushion, then senior fits.
    function test_juniorFirstThenSeniorFits() public {
        vm.startPrank(admin);
        vault.recordSubscription(investor, false, 4_100_000_000_000);  // $4.1M junior
        vault.recordSubscription(investor, true,  25_000_000_000_000); // $25M senior
        vm.stopPrank();
        assertEq(vault.juniorRatioBps(), 1408); // exactly at the floor
    }

    /// @dev Cannot repay junior early — would strip the cushion.
    function test_earlyJuniorRepaymentBlocked() public {
        vm.startPrank(admin);
        vault.recordSubscription(investor, false, 4_100_000_000_000);
        vault.recordSubscription(investor, true,  25_000_000_000_000);
        // Try to give junior back $1M while senior is still fully out.
        vm.expectRevert(abi.encodeWithSelector(
            TrancheVault.JuniorCushionBreached.selector,
            uint256(3_100_000_000_000),
            uint256(28_100_000_000_000),
            uint256(1408)
        ));
        vault.recordPrincipalRepayment(false, 1_000_000_000_000);
        vm.stopPrank();
    }

    /// @dev Senior repayment raises the effective ratio and cannot breach.
    function test_seniorRepaymentAlwaysSafe() public {
        vm.startPrank(admin);
        vault.recordSubscription(investor, false, 4_100_000_000_000);
        vault.recordSubscription(investor, true,  25_000_000_000_000);
        vault.recordPrincipalRepayment(true, 10_000_000_000_000);
        vm.stopPrank();
        // Junior 4.1M / (15M + 4.1M) = 21.47% -> 2146 bps
        assertGt(vault.juniorRatioBps(), 1408);
    }

    /// @dev Zero cushion disables the check (single-tranche or unrestricted
    ///      structures still need a working vault).
    function test_zeroCushionDisablesCheck() public {
        TrancheVault v = new TrancheVault(
            admin, DEAL_ID,
            seniorTok, 1_000_000, 500,
            juniorTok, 100, 1000,
            0 // disabled
        );
        vm.prank(admin);
        v.recordSubscription(investor, true, 500_000);
        assertEq(v.seniorOutstanding(), 500_000);
        assertEq(v.juniorOutstanding(), 0);
    }

    // ─────────────────────────────────────────────────────────── subscription

    /// @dev Every subscription flow in this suite seeds junior first so the
    ///      cushion invariant is satisfied. Without the seed the vault (per
    ///      Senior Loop directive 4.B) blocks senior-only subscriptions.
    function _seedJunior() internal {
        vm.prank(admin);
        vault.recordSubscription(investor, false, 4_100_000_000_000);
    }

    function test_subscribeRecordsBalance() public {
        _seedJunior();
        vm.prank(admin);
        vault.recordSubscription(investor, true, 10_000_000_000_000);
        assertEq(vault.seniorOutstanding(), 10_000_000_000_000);
        assertEq(vault.juniorOutstanding(), 4_100_000_000_000);
        assertEq(vault.totalOutstanding(), 14_100_000_000_000);
    }

    function test_cannotOversubscribeSenior() public {
        _seedJunior();
        vm.startPrank(admin);
        vault.recordSubscription(investor, true, 24_000_000_000_000);
        vm.expectRevert(abi.encodeWithSelector(
            TrancheVault.PrincipalWouldExceedTarget.selector,
            26_000_000_000_000, 25_000_000_000_000
        ));
        vault.recordSubscription(investor, true, 2_000_000_000_000);
        vm.stopPrank();
    }

    function test_nonAdminCannotSubscribe() public {
        vm.prank(investor);
        vm.expectRevert(TrancheVault.NotAdmin.selector);
        vault.recordSubscription(investor, true, 1);
    }

    function test_pausedSubscriptionsRevert() public {
        vm.prank(admin);
        vault.setSubscriptionsPaused(true);
        vm.prank(admin);
        vm.expectRevert(TrancheVault.SubscriptionsPaused_.selector);
        vault.recordSubscription(investor, true, 1);
    }

    // ─────────────────────────────────────────────────────────── repayment

    function test_repaymentReducesOutstanding() public {
        _seedJunior();
        vm.startPrank(admin);
        vault.recordSubscription(investor, true, 10_000_000_000_000);
        vault.recordPrincipalRepayment(true, 2_500_000_000_000);
        vm.stopPrank();
        assertEq(vault.seniorOutstanding(), 7_500_000_000_000);
    }

    function test_repaymentBeyondOutstandingReverts() public {
        vm.startPrank(admin);
        vault.recordSubscription(investor, false, 1_000_000_000_000);
        vm.expectRevert(abi.encodeWithSelector(
            TrancheVault.RepaymentExceedsOutstanding.selector,
            2_000_000_000_000, 1_000_000_000_000
        ));
        vault.recordPrincipalRepayment(false, 2_000_000_000_000);
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────── mode

    function test_modeChangeEmitsReason() public {
        vm.expectEmit(true, true, true, true);
        emit TrancheVault.ModeChanged(TrancheVault.Mode.Normal, TrancheVault.Mode.CashTrap, "DSCR 1.18x");
        vm.prank(admin);
        vault.setMode(TrancheVault.Mode.CashTrap, "DSCR 1.18x");
        assertEq(uint256(vault.mode()), uint256(TrancheVault.Mode.CashTrap));
    }

    function test_cannotSetSameMode() public {
        vm.prank(admin);
        vm.expectRevert(TrancheVault.SameMode.selector);
        vault.setMode(TrancheVault.Mode.Normal, "no-op");
    }

    // ─────────────────────────────────────────────────────────── admin

    function test_twoStepAdminHandoff() public {
        vm.prank(admin);
        vault.initiateAdminTransfer(investor);
        vm.prank(investor);
        vault.acceptAdminTransfer();
        assertEq(vault.admin(), investor);
    }

    function test_wrongAdminAcceptReverts() public {
        vm.prank(admin);
        vault.initiateAdminTransfer(investor);
        vm.prank(admin);
        vm.expectRevert(TrancheVault.NotPendingAdmin.selector);
        vault.acceptAdminTransfer();
    }
}
