// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/// @title ComplianceRegistry
/// @notice On-chain claim registry backing an ERC-3643 permissioned token.
///         Holds per-investor claims (accreditation, KYC, sanctions screening,
///         jurisdiction) issued by designated verifiers, each with a mandatory
///         expiry and a link to the off-chain evidence digest.
///
/// @dev DESIGN NOTE — why claims MUST expire.
///      Reg D 506(c) permits general solicitation only if the issuer takes
///      "reasonable steps to verify" that every purchaser is accredited.
///      Self-certification does not satisfy 506(c); a check-the-box claim that
///      never expires is exactly the pattern that fails it. So:
///        * only an address holding VERIFIER_ROLE can issue a claim,
///        * `expiresAt` is required and enforced, and
///        * `evidenceDigest` should reference a document anchored in
///          ReserveProofAnchor, so the verification file is itself auditable.
///
///      This contract enforces mechanics, not law. It cannot determine whether
///      the steps a verifier actually took were reasonable — that judgement
///      lives with the broker-dealer's compliance function and its counsel.
contract ComplianceRegistry {
    // ─────────────────────────────────────────────────────────── topics

    /// @dev ONCHAINID-style claim topics. Stable integers; never renumber.
    uint256 public constant TOPIC_KYC = 1;
    uint256 public constant TOPIC_SANCTIONS_CLEARED = 2;
    uint256 public constant TOPIC_ACCREDITED_506C = 3; // US Reg D 506(c)
    uint256 public constant TOPIC_QUALIFIED_PURCHASER = 4; // US 3(c)(7)
    uint256 public constant TOPIC_SOPHISTICATED_S708 = 5; // AU Corporations Act 2001 s708
    uint256 public constant TOPIC_REG_S_NON_US = 6; // Reg S offshore

    // ─────────────────────────────────────────────────────────── types

    struct Claim {
        address issuer;
        uint64 issuedAt;
        uint64 expiresAt; // required, always > issuedAt
        uint64 revokedAt; // 0 == live
        bytes32 evidenceDigest; // anchor in ReserveProofAnchor; 0 if none
    }

    // ─────────────────────────────────────────────────────────── storage

    address public admin;
    mapping(address => bool) public isVerifier;

    /// @dev subject => topic => claim
    mapping(address => mapping(uint256 => Claim)) private _claims;

    /// @dev ISO-3166-1 alpha-2, e.g. "US", "AU". bytes2(0) == unset.
    mapping(address => bytes2) public jurisdictionOf;
    mapping(bytes2 => bool) public isBlockedJurisdiction;

    /// @dev Hard block that overrides every claim (court order, OFAC hit).
    mapping(address => bool) public isFrozen;

    // ─────────────────────────────────────────────────────────── events

    event AdminTransferred(address indexed from, address indexed to);
    event VerifierSet(address indexed verifier, bool enabled);
    event ClaimIssued(
        address indexed subject,
        uint256 indexed topic,
        address indexed issuer,
        uint64 expiresAt,
        bytes32 evidenceDigest
    );
    event ClaimRevoked(address indexed subject, uint256 indexed topic, address indexed issuer, string reason);
    event JurisdictionSet(address indexed subject, bytes2 jurisdiction);
    event JurisdictionBlocked(bytes2 indexed jurisdiction, bool blocked);
    event FrozenSet(address indexed subject, bool frozen, string reason);

    // ─────────────────────────────────────────────────────────── errors

    error NotAdmin();
    error NotVerifier();
    error ZeroAddress();
    error ExpiryNotInFuture(uint64 expiresAt, uint64 now_);
    error NoSuchClaim(address subject, uint256 topic);
    error ClaimAlreadyRevoked(address subject, uint256 topic);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyVerifier() {
        if (!isVerifier[msg.sender]) revert NotVerifier();
        _;
    }

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

    function setVerifier(address verifier, bool enabled) external onlyAdmin {
        if (verifier == address(0)) revert ZeroAddress();
        isVerifier[verifier] = enabled;
        emit VerifierSet(verifier, enabled);
    }

    function setBlockedJurisdiction(bytes2 jurisdiction, bool blocked) external onlyAdmin {
        isBlockedJurisdiction[jurisdiction] = blocked;
        emit JurisdictionBlocked(jurisdiction, blocked);
    }

    /// @notice Hard freeze. Overrides every claim. For court orders and
    ///         sanctions hits, where "let the claim lapse" is not fast enough.
    function setFrozen(address subject, bool frozen, string calldata reason) external onlyAdmin {
        isFrozen[subject] = frozen;
        emit FrozenSet(subject, frozen, reason);
    }

    // ─────────────────────────────────────────────────────────── verifier

    function issueClaim(
        address subject,
        uint256 topic,
        uint64 expiresAt,
        bytes32 evidenceDigest
    ) external onlyVerifier {
        if (subject == address(0)) revert ZeroAddress();
        if (expiresAt <= block.timestamp) revert ExpiryNotInFuture(expiresAt, uint64(block.timestamp));

        _claims[subject][topic] = Claim({
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            revokedAt: 0,
            evidenceDigest: evidenceDigest
        });

        emit ClaimIssued(subject, topic, msg.sender, expiresAt, evidenceDigest);
    }

    function revokeClaim(address subject, uint256 topic, string calldata reason) external onlyVerifier {
        Claim storage c = _claims[subject][topic];
        if (c.issuedAt == 0) revert NoSuchClaim(subject, topic);
        if (c.revokedAt != 0) revert ClaimAlreadyRevoked(subject, topic);
        c.revokedAt = uint64(block.timestamp);
        emit ClaimRevoked(subject, topic, msg.sender, reason);
    }

    function setJurisdiction(address subject, bytes2 jurisdiction) external onlyVerifier {
        if (subject == address(0)) revert ZeroAddress();
        jurisdictionOf[subject] = jurisdiction;
        emit JurisdictionSet(subject, jurisdiction);
    }

    // ─────────────────────────────────────────────────────────── read

    function hasValidClaim(address subject, uint256 topic) public view returns (bool) {
        Claim storage c = _claims[subject][topic];
        if (c.issuedAt == 0) return false;
        if (c.revokedAt != 0) return false;
        if (c.expiresAt <= block.timestamp) return false;
        return true;
    }

    function getClaim(address subject, uint256 topic) external view returns (Claim memory) {
        return _claims[subject][topic];
    }

    /// @notice Baseline gate every holder must clear regardless of offering:
    ///         not frozen, jurisdiction known and permitted, KYC live,
    ///         sanctions screening live.
    function isBaselineEligible(address subject) public view returns (bool) {
        if (isFrozen[subject]) return false;
        bytes2 j = jurisdictionOf[subject];
        if (j == bytes2(0)) return false; // unknown jurisdiction is not a pass
        if (isBlockedJurisdiction[j]) return false;
        if (!hasValidClaim(subject, TOPIC_KYC)) return false;
        if (!hasValidClaim(subject, TOPIC_SANCTIONS_CLEARED)) return false;
        return true;
    }

    /// @notice Baseline plus every topic in `requiredTopics`.
    /// @dev The token contract supplies the offering-specific topic set, so one
    ///      registry can back a 506(c) issue and an s708 tranche at once.
    function isEligible(address subject, uint256[] calldata requiredTopics) external view returns (bool) {
        if (!isBaselineEligible(subject)) return false;
        for (uint256 i = 0; i < requiredTopics.length; ++i) {
            if (!hasValidClaim(subject, requiredTopics[i])) return false;
        }
        return true;
    }
}
