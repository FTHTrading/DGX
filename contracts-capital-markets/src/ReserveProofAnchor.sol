// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/// @title ReserveProofAnchor
/// @notice Anchors the cryptographic digest of an off-chain instrument (SBLC,
///         custody receipt, assay, appraisal) to chain, with an attestor of
///         record, a timestamp, an expiry, and a revocation path.
///
/// @dev WHAT AN ANCHOR PROVES, PRECISELY:
///      That an address holding the ATTESTOR_ROLE submitted this exact digest
///      at this block timestamp. That is the entire claim.
///
///      WHAT AN ANCHOR DOES NOT PROVE — read this before integrating:
///        * That the underlying instrument is genuine, funded, or enforceable.
///        * That any bank issued, confirmed, or advised it.
///        * That a custodian holds the referenced collateral.
///        * That the document at `uri` matches `digest`. Nothing on chain can
///          check that; a verifier MUST re-hash the bytes it received and
///          compare, rather than trusting `uri`.
///        * That the attestor was honest. This contract records who asserted
///          what and when. It does not make the assertion true.
///
///      An anchor is evidence of assertion, not evidence of fact. Presenting it
///      as proof that an instrument exists or is funded misstates what the
///      chain records.
contract ReserveProofAnchor {
    // ─────────────────────────────────────────────────────────── types

    enum DocType {
        Unspecified,
        SBLC, // standby letter of credit
        CustodyReceipt, // vault / custodian holding receipt
        Assay, // metal assay certificate
        Appraisal, // third-party valuation
        SubscriptionAgreement,
        AuditReport,
        Other
    }

    /// @notice Result of a verification query. Callers MUST branch on this
    ///         rather than on mere existence — an expired or revoked SBLC is
    ///         not a valid one, and conflating them is the whole risk here.
    enum Status {
        Unknown, // never anchored
        Active, // anchored, not expired, not revoked
        Expired, // past expiresAt
        Revoked // explicitly revoked by an attestor
    }

    struct Anchor {
        bytes32 digest; // SHA-256 of the instrument bytes
        address attestor; // who asserted it
        uint64 anchoredAt;
        uint64 expiresAt; // 0 == no stated expiry
        uint64 revokedAt; // 0 == not revoked
        DocType docType;
        string docRef; // human reference, e.g. "SBLC-2026-0001"
        string uri; // UNTRUSTED pointer; never rely on it
    }

    // ─────────────────────────────────────────────────────────── storage

    address public admin;
    mapping(address => bool) public isAttestor;

    /// @dev digest => anchor. One digest anchors once; re-anchoring the same
    ///      bytes is rejected so the audit trail has a single origin per doc.
    mapping(bytes32 => Anchor) private _anchors;
    bytes32[] private _digests;

    // ─────────────────────────────────────────────────────────── events

    event AdminTransferred(address indexed from, address indexed to);
    event AttestorSet(address indexed attestor, bool enabled);
    event Anchored(
        bytes32 indexed digest,
        address indexed attestor,
        DocType indexed docType,
        string docRef,
        uint64 expiresAt
    );
    event Revoked(bytes32 indexed digest, address indexed attestor, string reason);

    // ─────────────────────────────────────────────────────────── errors

    error NotAdmin();
    error NotAttestor();
    error ZeroAddress();
    error ZeroDigest();
    error AlreadyAnchored(bytes32 digest);
    error NotAnchored(bytes32 digest);
    error AlreadyRevoked(bytes32 digest);
    error ExpiryInPast(uint64 expiresAt, uint64 now_);

    // ─────────────────────────────────────────────────────────── modifiers

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyAttestor() {
        if (!isAttestor[msg.sender]) revert NotAttestor();
        _;
    }

    // ─────────────────────────────────────────────────────────── init

    constructor(address admin_) {
        if (admin_ == address(0)) revert ZeroAddress();
        admin = admin_;
        emit AdminTransferred(address(0), admin_);
    }

    // ─────────────────────────────────────────────────────────── admin

    function transferAdmin(address next) external onlyAdmin {
        if (next == address(0)) revert ZeroAddress();
        emit AdminTransferred(admin, next);
        admin = next;
    }

    function setAttestor(address attestor, bool enabled) external onlyAdmin {
        if (attestor == address(0)) revert ZeroAddress();
        isAttestor[attestor] = enabled;
        emit AttestorSet(attestor, enabled);
    }

    // ─────────────────────────────────────────────────────────── write

    /// @notice Anchor a document digest.
    /// @param digest SHA-256 over the exact instrument bytes.
    /// @param expiresAt Unix seconds; pass 0 for instruments with no expiry.
    ///        An SBLC always has one — pass it.
    function anchor(
        bytes32 digest,
        DocType docType,
        string calldata docRef,
        string calldata uri,
        uint64 expiresAt
    ) external onlyAttestor {
        if (digest == bytes32(0)) revert ZeroDigest();
        if (_anchors[digest].anchoredAt != 0) revert AlreadyAnchored(digest);
        if (expiresAt != 0 && expiresAt <= block.timestamp) {
            revert ExpiryInPast(expiresAt, uint64(block.timestamp));
        }

        _anchors[digest] = Anchor({
            digest: digest,
            attestor: msg.sender,
            anchoredAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            revokedAt: 0,
            docType: docType,
            docRef: docRef,
            uri: uri
        });
        _digests.push(digest);

        emit Anchored(digest, msg.sender, docType, docRef, expiresAt);
    }

    /// @notice Revoke an anchor. Use when an instrument is cancelled, replaced,
    ///         or was anchored in error. Anchors are never deleted — the record
    ///         that it once existed is the point of an audit trail.
    function revoke(bytes32 digest, string calldata reason) external onlyAttestor {
        Anchor storage a = _anchors[digest];
        if (a.anchoredAt == 0) revert NotAnchored(digest);
        if (a.revokedAt != 0) revert AlreadyRevoked(digest);
        a.revokedAt = uint64(block.timestamp);
        emit Revoked(digest, msg.sender, reason);
    }

    // ─────────────────────────────────────────────────────────── read

    /// @notice Status of a digest. Branch on this, never on existence alone.
    function statusOf(bytes32 digest) public view returns (Status) {
        Anchor storage a = _anchors[digest];
        if (a.anchoredAt == 0) return Status.Unknown;
        if (a.revokedAt != 0) return Status.Revoked;
        if (a.expiresAt != 0 && a.expiresAt <= block.timestamp) return Status.Expired;
        return Status.Active;
    }

    /// @notice Convenience for integrators. True ONLY for Active.
    function isActive(bytes32 digest) external view returns (bool) {
        return statusOf(digest) == Status.Active;
    }

    /// @notice Verify caller-supplied bytes against the anchor in one step.
    ///         Preferred over `statusOf` because it forces the caller to hold
    ///         the actual document rather than just its hash.
    function verifyDocument(bytes calldata document) external view returns (Status, Anchor memory) {
        bytes32 digest = sha256(document);
        return (statusOf(digest), _anchors[digest]);
    }

    function getAnchor(bytes32 digest) external view returns (Anchor memory) {
        return _anchors[digest];
    }

    function anchorCount() external view returns (uint256) {
        return _digests.length;
    }

    function digestAt(uint256 i) external view returns (bytes32) {
        return _digests[i];
    }
}
