// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {PermissionedToken} from "../src/PermissionedToken.sol";

/// @dev The reason `_beforeUpdate` sits on `_update` is so mint and burn
///      cannot bypass the compliance gate. Every test in here that asserts
///      revert must also confirm state was NOT mutated — otherwise a partial
///      update would look like a pass in aggregate reports.
contract PermissionedTokenTest is Test {
    ComplianceRegistry reg;
    PermissionedToken tok;

    address admin = address(0xA11CE);
    address verifier = address(0xBEEF);
    address issuer = address(0xCAFE);
    address alice = address(0x1111);   // eligible
    address bob = address(0x2222);     // eligible
    address chuck = address(0x3333);   // NOT eligible (no accreditation)
    address dave = address(0x4444);    // eligible but frozen

    bytes2 constant US = 0x5553; // "US"

    uint256[] required;

    function setUp() public {
        vm.warp(1_800_000_000);

        reg = new ComplianceRegistry(admin);
        vm.startPrank(admin);
        reg.setVerifier(verifier, true);
        reg.setBlockedJurisdiction(0x494E, true); // "IN" example blocked
        vm.stopPrank();

        // baseline claims for alice + bob + dave
        uint64 exp = uint64(block.timestamp + 365 days);
        vm.startPrank(verifier);
        for (uint256 i = 0; i < 3; ++i) {
            address who = [alice, bob, dave][i];
            reg.setJurisdiction(who, US);
            reg.issueClaim(who, reg.TOPIC_KYC(), exp, bytes32(0));
            reg.issueClaim(who, reg.TOPIC_SANCTIONS_CLEARED(), exp, bytes32(0));
            reg.issueClaim(who, reg.TOPIC_ACCREDITED_506C(), exp, bytes32(0));
        }
        // chuck is KYC + sanctions only (no accreditation)
        reg.setJurisdiction(chuck, US);
        reg.issueClaim(chuck, reg.TOPIC_KYC(), exp, bytes32(0));
        reg.issueClaim(chuck, reg.TOPIC_SANCTIONS_CLEARED(), exp, bytes32(0));
        vm.stopPrank();

        // freeze dave
        vm.prank(admin);
        reg.setFrozen(dave, true, "court order");

        // build token requiring accreditation
        required = new uint256[](1);
        required[0] = reg.TOPIC_ACCREDITED_506C();
        tok = new PermissionedToken("M Helen Senior", "MHS", reg, required, issuer);
    }

    // ─────────────────────────────────────────────────────────── construction

    function test_constructorRejectsEmptyTopics() public {
        uint256[] memory empty = new uint256[](0);
        vm.expectRevert(PermissionedToken.EmptyRequiredTopics.selector);
        new PermissionedToken("x", "X", reg, empty, issuer);
    }

    function test_constructorRejectsZeroRegistry() public {
        vm.expectRevert(PermissionedToken.ZeroAddress.selector);
        new PermissionedToken("x", "X", ComplianceRegistry(address(0)), required, issuer);
    }

    function test_constructorRejectsZeroIssuer() public {
        vm.expectRevert(PermissionedToken.ZeroAddress.selector);
        new PermissionedToken("x", "X", reg, required, address(0));
    }

    // ─────────────────────────────────────────────────────────── mint

    function test_issuerCanMintToEligible() public {
        vm.prank(issuer);
        tok.mint(alice, 1_000_000);
        assertEq(tok.balanceOf(alice), 1_000_000);
        assertEq(tok.totalSupply(), 1_000_000);
    }

    function test_nonIssuerCannotMint() public {
        vm.prank(alice);
        vm.expectRevert(PermissionedToken.NotIssuer.selector);
        tok.mint(alice, 1);
    }

    function test_cannotMintZero() public {
        vm.prank(issuer);
        vm.expectRevert(PermissionedToken.ZeroValue.selector);
        tok.mint(alice, 0);
    }

    /// @dev The core 3643 property: even the issuer cannot mint into an
    ///      account that fails the compliance topic set.
    function test_cannotMintToIneligibleHolder() public {
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(PermissionedToken.RecipientIneligible.selector, chuck));
        tok.mint(chuck, 1_000_000);
        assertEq(tok.balanceOf(chuck), 0);
        assertEq(tok.totalSupply(), 0);
    }

    function test_cannotMintToFrozenHolder() public {
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(PermissionedToken.RecipientIneligible.selector, dave));
        tok.mint(dave, 1);
    }

    // ─────────────────────────────────────────────────────────── transfer

    function _seed() internal {
        vm.prank(issuer);
        tok.mint(alice, 1_000_000);
    }

    function test_eligibleHoldersCanTransfer() public {
        _seed();
        vm.prank(alice);
        tok.transfer(bob, 250_000);
        assertEq(tok.balanceOf(alice), 750_000);
        assertEq(tok.balanceOf(bob), 250_000);
    }

    function test_transferToIneligibleReverts() public {
        _seed();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PermissionedToken.RecipientIneligible.selector, chuck));
        tok.transfer(chuck, 100);
        assertEq(tok.balanceOf(alice), 1_000_000);
        assertEq(tok.balanceOf(chuck), 0);
    }

    function test_transferFromIneligibleSenderReverts() public {
        // Give alice tokens then revoke her accreditation. Hoist the topic
        // getter out of the prank — external view calls consume vm.prank
        // (same trap as sha256() at 0x02).
        _seed();
        uint256 topic = reg.TOPIC_ACCREDITED_506C();
        vm.prank(verifier);
        reg.revokeClaim(alice, topic, "reason lapsed");
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PermissionedToken.SenderIneligible.selector, alice));
        tok.transfer(bob, 1);
    }

    /// @dev Allowance path must NOT bypass the gate.
    function test_transferFromRespectsGate() public {
        _seed();
        vm.prank(alice);
        tok.approve(bob, 500_000);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(PermissionedToken.RecipientIneligible.selector, chuck));
        tok.transferFrom(alice, chuck, 100);
    }

    // ─────────────────────────────────────────────────────────── pause

    function test_pauseBlocksTransfers() public {
        _seed();
        vm.prank(issuer);
        tok.setPaused(true);
        vm.prank(alice);
        vm.expectRevert(PermissionedToken.TokenPaused.selector);
        tok.transfer(bob, 1);
    }

    function test_pauseBlocksMint() public {
        vm.prank(issuer);
        tok.setPaused(true);
        vm.prank(issuer);
        vm.expectRevert(PermissionedToken.TokenPaused.selector);
        tok.mint(alice, 1);
    }

    // ─────────────────────────────────────────────────────────── burn

    function test_issuerCanBurn() public {
        _seed();
        vm.prank(issuer);
        tok.burn(alice, 400_000);
        assertEq(tok.balanceOf(alice), 600_000);
        assertEq(tok.totalSupply(), 600_000);
    }

    function test_burnBeyondBalanceReverts() public {
        _seed();
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(
            PermissionedToken.InsufficientBalance.selector, alice, 1_000_000, 1_000_001));
        tok.burn(alice, 1_000_001);
    }

    // ─────────────────────────────────────────────────────────── forceTransfer

    function test_forceTransferMovesFundsWithReason() public {
        _seed();
        vm.prank(issuer);
        tok.forceTransfer(alice, bob, 100_000, "court order 2026-CV-1234");
        assertEq(tok.balanceOf(alice), 900_000);
        assertEq(tok.balanceOf(bob), 100_000);
    }

    function test_forceTransferStillRequiresRecipientEligibility() public {
        _seed();
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(PermissionedToken.RecipientIneligible.selector, chuck));
        tok.forceTransfer(alice, chuck, 1, "recovery");
    }

    // ─────────────────────────────────────────────────────────── issuer transfer

    function test_twoStepIssuerHandoff() public {
        vm.prank(issuer);
        tok.initiateIssuerTransfer(alice);
        assertEq(tok.pendingIssuer(), alice);
        assertEq(tok.issuer(), issuer);

        // wrong sender cannot accept
        vm.prank(bob);
        vm.expectRevert(PermissionedToken.NotPendingIssuer.selector);
        tok.acceptIssuerTransfer();

        vm.prank(alice);
        tok.acceptIssuerTransfer();
        assertEq(tok.issuer(), alice);
        assertEq(tok.pendingIssuer(), address(0));
    }

    // ─────────────────────────────────────────────────────────── fuzz

    function testFuzz_mintRejectsIneligibleAlways(address who, uint96 amount) public {
        vm.assume(amount > 0);
        vm.assume(who != address(0));
        vm.assume(who != alice && who != bob && who != dave); // eligible set
        vm.prank(issuer);
        try tok.mint(who, uint256(amount)) {
            // If it did NOT revert, `who` must have been eligible via some
            // path we didn't set up — assert eligibility directly.
            assertTrue(tok.isEligible(who));
        } catch {
            // Reverted; state must be unchanged.
            assertEq(tok.balanceOf(who), 0);
            assertEq(tok.totalSupply(), 0);
        }
    }
}
