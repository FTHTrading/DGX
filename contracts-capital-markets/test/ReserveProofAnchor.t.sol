// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {ReserveProofAnchor} from "../src/ReserveProofAnchor.sol";

/// @dev IMPORTANT for anyone extending this suite: `sha256()` is a PRECOMPILE
///      call (address 0x02), so writing `vm.prank(x); c.anchor(sha256(doc),...)`
///      lets the precompile consume the prank and the real call arrives from the
///      test contract instead. Same trap applies to vm.expectRevert. Always
///      hoist the digest into a local/immutable BEFORE the cheatcode.
contract ReserveProofAnchorTest is Test {
    ReserveProofAnchor anchorC;

    address admin = address(0xA11CE);
    address attestor = address(0xBEEF);
    address stranger = address(0xDEAD);

    bytes constant SBLC_DOC = "CIBC SBLC 2026-0001 / UCP600 / USD 9,800,000";
    bytes constant SBLC_DOC_TAMPERED = "CIBC SBLC 2026-0001 / UCP600 / USD 9,900,000";

    bytes32 D; // sha256(SBLC_DOC), precomputed
    bytes32 D_TAMPERED;

    function setUp() public {
        vm.warp(1_800_000_000); // deterministic base time
        D = sha256(SBLC_DOC);
        D_TAMPERED = sha256(SBLC_DOC_TAMPERED);
        anchorC = new ReserveProofAnchor(admin);
        vm.prank(admin);
        anchorC.setAttestor(attestor, true);
    }

    // ───────────────────────────────────────────── access control

    function test_onlyAttestorCanAnchor() public {
        vm.prank(stranger);
        vm.expectRevert(ReserveProofAnchor.NotAttestor.selector);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", 0);
    }

    function test_onlyAdminCanSetAttestor() public {
        vm.prank(stranger);
        vm.expectRevert(ReserveProofAnchor.NotAdmin.selector);
        anchorC.setAttestor(stranger, true);
    }

    function test_revokedAttestorCannotAnchor() public {
        vm.prank(admin);
        anchorC.setAttestor(attestor, false);
        vm.prank(attestor);
        vm.expectRevert(ReserveProofAnchor.NotAttestor.selector);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", 0);
    }

    // ───────────────────────────────────────────── happy path

    function test_anchorThenVerifyDocument() public {
        uint64 exp = uint64(block.timestamp + 90 days);
        vm.prank(attestor);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "SBLC-2026-0001", "ipfs://x", exp);

        (ReserveProofAnchor.Status st, ReserveProofAnchor.Anchor memory a) = anchorC.verifyDocument(SBLC_DOC);
        assertEq(uint256(st), uint256(ReserveProofAnchor.Status.Active));
        assertEq(a.attestor, attestor);
        assertEq(a.expiresAt, exp);
        assertEq(a.docRef, "SBLC-2026-0001");
        assertTrue(anchorC.isActive(D));
        assertEq(anchorC.anchorCount(), 1);
    }

    /// @dev The core safety property: a document differing by one character
    ///      must NOT verify against the anchor.
    function test_tamperedDocumentDoesNotVerify() public {
        vm.prank(attestor);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", 0);

        (ReserveProofAnchor.Status st,) = anchorC.verifyDocument(SBLC_DOC_TAMPERED);
        assertEq(uint256(st), uint256(ReserveProofAnchor.Status.Unknown));
        assertTrue(D != D_TAMPERED);
    }

    // ───────────────────────────────────────────── lifecycle

    function test_expiryFlipsStatus() public {
        uint64 exp = uint64(block.timestamp + 30 days);
        vm.prank(attestor);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", exp);

        assertTrue(anchorC.isActive(D));
        vm.warp(exp); // expiry is inclusive
        assertEq(uint256(anchorC.statusOf(D)), uint256(ReserveProofAnchor.Status.Expired));
        assertFalse(anchorC.isActive(D));
    }

    function test_revokeFlipsStatusAndIsPermanent() public {
        vm.startPrank(attestor);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", 0);
        anchorC.revoke(D, "instrument cancelled by issuing bank");
        vm.expectRevert(abi.encodeWithSelector(ReserveProofAnchor.AlreadyRevoked.selector, D));
        anchorC.revoke(D, "again");
        vm.stopPrank();

        assertEq(uint256(anchorC.statusOf(D)), uint256(ReserveProofAnchor.Status.Revoked));
        // record survives revocation — the audit trail is the point
        assertEq(anchorC.getAnchor(D).attestor, attestor);
    }

    /// @dev Revocation must win over an unexpired window, not the reverse.
    function test_revokedBeatsActive() public {
        vm.startPrank(attestor);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", uint64(block.timestamp + 365 days));
        anchorC.revoke(D, "cancelled");
        vm.stopPrank();
        assertEq(uint256(anchorC.statusOf(D)), uint256(ReserveProofAnchor.Status.Revoked));
    }

    // ───────────────────────────────────────────── input validation

    function test_cannotAnchorTwice() public {
        vm.startPrank(attestor);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", 0);
        vm.expectRevert(abi.encodeWithSelector(ReserveProofAnchor.AlreadyAnchored.selector, D));
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref2", "", 0);
        vm.stopPrank();
    }

    function test_cannotAnchorZeroDigest() public {
        vm.prank(attestor);
        vm.expectRevert(ReserveProofAnchor.ZeroDigest.selector);
        anchorC.anchor(bytes32(0), ReserveProofAnchor.DocType.SBLC, "ref", "", 0);
    }

    function test_cannotAnchorAlreadyExpired() public {
        uint64 past = uint64(block.timestamp - 1);
        uint64 nowTs = uint64(block.timestamp);
        vm.prank(attestor);
        vm.expectRevert(abi.encodeWithSelector(ReserveProofAnchor.ExpiryInPast.selector, past, nowTs));
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", past);
    }

    function test_unknownDigestIsUnknown() public view {
        assertEq(uint256(anchorC.statusOf(keccak256("never"))), uint256(ReserveProofAnchor.Status.Unknown));
    }

    function test_adminTransfer() public {
        vm.prank(admin);
        anchorC.transferAdmin(stranger);
        assertEq(anchorC.admin(), stranger);
        vm.prank(admin);
        vm.expectRevert(ReserveProofAnchor.NotAdmin.selector);
        anchorC.setAttestor(admin, true);
    }

    // ───────────────────────────────────────────── fuzz

    function testFuzz_onlyExactBytesVerify(bytes calldata doc) public {
        bytes32 dFuzz = sha256(doc);
        vm.assume(dFuzz != D);
        vm.prank(attestor);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", 0);
        (ReserveProofAnchor.Status st,) = anchorC.verifyDocument(doc);
        assertEq(uint256(st), uint256(ReserveProofAnchor.Status.Unknown));
    }

    function testFuzz_nonAttestorNeverAnchors(address who) public {
        vm.assume(who != attestor);
        vm.prank(who);
        vm.expectRevert(ReserveProofAnchor.NotAttestor.selector);
        anchorC.anchor(D, ReserveProofAnchor.DocType.SBLC, "ref", "", 0);
    }
}
