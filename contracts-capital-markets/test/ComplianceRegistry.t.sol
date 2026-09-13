// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";

contract ComplianceRegistryTest is Test {
    ComplianceRegistry reg;

    address admin = address(0xA11CE);
    address verifier = address(0xBEEF);
    address investor = address(0x1111);
    address stranger = address(0xDEAD);

    bytes2 constant US = "US";
    bytes2 constant AU = "AU";
    bytes2 constant KP = "KP";

    function setUp() public {
        verifier = address(0xBEEF);
        vm.warp(1_800_000_000);
        reg = new ComplianceRegistry(admin);
        vm.prank(admin);
        reg.setVerifier(verifier, true);
    }

    function _fullyOnboard(address who, bytes2 jur, uint64 ttl) internal {
        uint64 exp = uint64(block.timestamp) + ttl;
        vm.startPrank(verifier);
        reg.setJurisdiction(who, jur);
        reg.issueClaim(who, reg.TOPIC_KYC(), exp, bytes32(0));
        reg.issueClaim(who, reg.TOPIC_SANCTIONS_CLEARED(), exp, bytes32(0));
        vm.stopPrank();
    }

    // ───────────────────────────────────────────── access control

    function test_onlyVerifierIssues() public {
        uint64 exp = uint64(block.timestamp + 90 days);
        uint256 topic = reg.TOPIC_KYC();
        vm.prank(stranger);
        vm.expectRevert(ComplianceRegistry.NotVerifier.selector);
        reg.issueClaim(investor, topic, exp, bytes32(0));
    }

    function test_onlyAdminSetsVerifier() public {
        vm.prank(stranger);
        vm.expectRevert(ComplianceRegistry.NotAdmin.selector);
        reg.setVerifier(stranger, true);
    }

    function test_deauthorizedVerifierCannotIssue() public {
        uint64 exp = uint64(block.timestamp + 90 days);
        uint256 topic = reg.TOPIC_KYC();
        vm.prank(admin);
        reg.setVerifier(verifier, false);
        vm.prank(verifier);
        vm.expectRevert(ComplianceRegistry.NotVerifier.selector);
        reg.issueClaim(investor, topic, exp, bytes32(0));
    }

    // ───────────────────────────────────────────── the 506(c) property

    /// @dev THE compliance-critical test. Reg D 506(c) verification is not
    ///      permanent. An accreditation claim must stop being valid on its own
    ///      once expired, with no action by anyone.
    function test_accreditationExpiresWithoutIntervention() public {
        _fullyOnboard(investor, US, 365 days);
        uint64 exp = uint64(block.timestamp + 90 days);
        uint256 topic = reg.TOPIC_ACCREDITED_506C();

        vm.prank(verifier);
        reg.issueClaim(investor, topic, exp, keccak256("verification-file"));
        assertTrue(reg.hasValidClaim(investor, topic));

        vm.warp(exp); // inclusive expiry
        assertFalse(reg.hasValidClaim(investor, topic));

        uint256[] memory need = new uint256[](1);
        need[0] = topic;
        assertFalse(reg.isEligible(investor, need));
    }

    function test_cannotIssueAlreadyExpiredClaim() public {
        uint64 past = uint64(block.timestamp - 1);
        uint64 nowTs = uint64(block.timestamp);
        uint256 topic = reg.TOPIC_KYC();
        vm.prank(verifier);
        vm.expectRevert(abi.encodeWithSelector(ComplianceRegistry.ExpiryNotInFuture.selector, past, nowTs));
        reg.issueClaim(investor, topic, past, bytes32(0));
    }

    // ───────────────────────────────────────────── baseline gating

    function test_unknownJurisdictionIsNotAPass() public {
        uint64 exp = uint64(block.timestamp + 365 days);
        vm.startPrank(verifier);
        reg.issueClaim(investor, reg.TOPIC_KYC(), exp, bytes32(0));
        reg.issueClaim(investor, reg.TOPIC_SANCTIONS_CLEARED(), exp, bytes32(0));
        vm.stopPrank();
        // KYC + sanctions live, but jurisdiction never set
        assertFalse(reg.isBaselineEligible(investor));
    }

    function test_blockedJurisdictionFails() public {
        _fullyOnboard(investor, KP, 365 days);
        assertTrue(reg.isBaselineEligible(investor));
        vm.prank(admin);
        reg.setBlockedJurisdiction(KP, true);
        assertFalse(reg.isBaselineEligible(investor));
    }

    function test_missingSanctionsClaimFails() public {
        uint64 exp = uint64(block.timestamp + 365 days);
        vm.startPrank(verifier);
        reg.setJurisdiction(investor, US);
        reg.issueClaim(investor, reg.TOPIC_KYC(), exp, bytes32(0));
        vm.stopPrank();
        assertFalse(reg.isBaselineEligible(investor));
    }

    /// @dev Freeze must override every live claim — court orders cannot wait
    ///      for a claim to lapse.
    function test_freezeOverridesEverything() public {
        _fullyOnboard(investor, US, 365 days);
        uint256 topic = reg.TOPIC_ACCREDITED_506C();
        vm.prank(verifier);
        reg.issueClaim(investor, topic, uint64(block.timestamp + 365 days), bytes32(0));

        uint256[] memory need = new uint256[](1);
        need[0] = topic;
        assertTrue(reg.isEligible(investor, need));

        vm.prank(admin);
        reg.setFrozen(investor, true, "OFAC match");
        assertFalse(reg.isBaselineEligible(investor));
        assertFalse(reg.isEligible(investor, need));
        // the underlying claim is untouched; only the gate flipped
        assertTrue(reg.hasValidClaim(investor, topic));
    }

    // ───────────────────────────────────────────── revocation

    function test_revokeClaim() public {
        _fullyOnboard(investor, US, 365 days);
        uint256 topic = reg.TOPIC_KYC();
        vm.prank(verifier);
        reg.revokeClaim(investor, topic, "document forged");
        assertFalse(reg.hasValidClaim(investor, topic));
        assertFalse(reg.isBaselineEligible(investor));
    }

    function test_cannotRevokeTwiceOrMissing() public {
        uint256 topic = reg.TOPIC_KYC();
        vm.prank(verifier);
        vm.expectRevert(abi.encodeWithSelector(ComplianceRegistry.NoSuchClaim.selector, investor, topic));
        reg.revokeClaim(investor, topic, "x");

        _fullyOnboard(investor, US, 365 days);
        vm.startPrank(verifier);
        reg.revokeClaim(investor, topic, "once");
        vm.expectRevert(abi.encodeWithSelector(ComplianceRegistry.ClaimAlreadyRevoked.selector, investor, topic));
        reg.revokeClaim(investor, topic, "twice");
        vm.stopPrank();
    }

    // ───────────────────────────────────────────── multi-offering

    /// @dev One registry backs a US 506(c) issue and an AU s708 tranche at once;
    ///      an investor qualified for one must not thereby qualify for the other.
    function test_s708AndReg506cAreIndependent() public {
        address aussie = address(0x2222);
        _fullyOnboard(investor, US, 365 days);
        _fullyOnboard(aussie, AU, 365 days);
        uint64 exp = uint64(block.timestamp + 180 days);

        vm.startPrank(verifier);
        reg.issueClaim(investor, reg.TOPIC_ACCREDITED_506C(), exp, bytes32(0));
        reg.issueClaim(aussie, reg.TOPIC_SOPHISTICATED_S708(), exp, bytes32(0));
        vm.stopPrank();

        uint256[] memory us = new uint256[](1);
        us[0] = reg.TOPIC_ACCREDITED_506C();
        uint256[] memory au = new uint256[](1);
        au[0] = reg.TOPIC_SOPHISTICATED_S708();

        assertTrue(reg.isEligible(investor, us));
        assertFalse(reg.isEligible(investor, au)); // US investor is not s708
        assertTrue(reg.isEligible(aussie, au));
        assertFalse(reg.isEligible(aussie, us)); // AU investor is not accredited
    }

    function test_evidenceDigestIsRecorded() public {
        _fullyOnboard(investor, US, 365 days);
        bytes32 ev = keccak256("accreditation-letter-2026.pdf");
        uint256 topic = reg.TOPIC_ACCREDITED_506C();
        vm.prank(verifier);
        reg.issueClaim(investor, topic, uint64(block.timestamp + 90 days), ev);
        assertEq(reg.getClaim(investor, topic).evidenceDigest, ev);
        assertEq(reg.getClaim(investor, topic).issuer, verifier);
    }

    // ───────────────────────────────────────────── fuzz

    function testFuzz_noClaimNeverEligible(address who) public view {
        vm.assume(who != address(0));
        assertFalse(reg.isBaselineEligible(who));
    }

    function testFuzz_expiryBoundaryIsExclusiveOfExpiryInstant(uint32 ttl) public {
        vm.assume(ttl > 1);
        _fullyOnboard(investor, US, uint64(ttl));
        assertTrue(reg.isBaselineEligible(investor));
        vm.warp(block.timestamp + ttl - 1);
        assertTrue(reg.isBaselineEligible(investor)); // still live one second before
        vm.warp(block.timestamp + 1);
        assertFalse(reg.isBaselineEligible(investor)); // dead at the instant
    }
}
