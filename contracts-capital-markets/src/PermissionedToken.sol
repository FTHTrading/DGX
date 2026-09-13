// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ComplianceRegistry} from "./ComplianceRegistry.sol";

/// @title PermissionedToken
/// @notice Minimal ERC-20 whose every mint / transfer / burn passes through the
///         ComplianceRegistry gate. Modelled on the transfer-restriction layer
///         of ERC-3643 (T-REX). No allowance path bypasses the registry — the
///         gate is on _update, so approvals cannot end-run it.
///
/// @dev Design choices that matter for a 506(c) tranche:
///
///   * `requiredTopics` is captured at construction and locked. Every transfer
///     must satisfy the baseline (KYC, sanctions, jurisdiction, unfrozen) AND
///     the offering-specific topic set (e.g. TOPIC_ACCREDITED_506C). Making
///     this mutable would let an issuer downgrade eligibility mid-offering,
///     which is exactly the pattern 506(c) reasonable-steps guidance rejects.
///
///   * The token has NO admin transfer path. An owner can `forceTransfer` on
///     court order, but the record survives (event includes reason). There is
///     no silent moveFunds function. The audit trail is the point.
///
///   * `pause` is not a general kill switch. It only blocks transfers of the
///     token; it cannot rewrite claims. That belongs to the registry admin.
///
///   * Uses uint256 for balances but treats supply as integer minor units,
///     never fractional cents. Fractional accounting bugs are how tokenized
///     debt distributes wrong.
///
///   * `_beforeTokenTransfer` semantics are enforced in `_update`, which is
///     the correct hook for OpenZeppelin-style ERC-20s post-v5. Every path
///     (mint, transfer, burn) flows through it.
contract PermissionedToken {
    ComplianceRegistry public immutable registry;
    string public name;
    string public symbol;
    uint8 public constant decimals = 6; // USDC-parity minor units

    /// @dev The set of topics EVERY holder of this token must additionally
    ///      satisfy on top of the registry baseline. Locked at construction.
    uint256[] private _requiredTopics;

    address public issuer;              // deploys, mints, burns, force-transfers
    address public pendingIssuer;
    bool public paused;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ─────────────────────────────────────────────────────────── events

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event IssuerTransferInitiated(address indexed from, address indexed to);
    event IssuerTransferAccepted(address indexed from, address indexed to);
    event PausedSet(bool paused);
    event ForceTransfer(address indexed from, address indexed to, uint256 value, string reason);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    // ─────────────────────────────────────────────────────────── errors

    error NotIssuer();
    error NotPendingIssuer();
    error ZeroAddress();
    error ZeroValue();
    error TokenPaused();
    error InsufficientBalance(address who, uint256 have, uint256 want);
    error InsufficientAllowance(address owner, address spender, uint256 have, uint256 want);
    error RecipientIneligible(address to);
    error SenderIneligible(address from);
    error EmptyRequiredTopics();

    modifier onlyIssuer() {
        if (msg.sender != issuer) revert NotIssuer();
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        ComplianceRegistry registry_,
        uint256[] memory requiredTopics_,
        address issuer_
    ) {
        if (address(registry_) == address(0)) revert ZeroAddress();
        if (issuer_ == address(0)) revert ZeroAddress();
        if (requiredTopics_.length == 0) revert EmptyRequiredTopics();

        name = name_;
        symbol = symbol_;
        registry = registry_;
        issuer = issuer_;

        for (uint256 i = 0; i < requiredTopics_.length; ++i) {
            _requiredTopics.push(requiredTopics_[i]);
        }
    }

    // ─────────────────────────────────────────────────────────── governance

    function initiateIssuerTransfer(address next) external onlyIssuer {
        if (next == address(0)) revert ZeroAddress();
        pendingIssuer = next;
        emit IssuerTransferInitiated(issuer, next);
    }

    /// @notice Two-step transfer prevents fat-fingering issuer to a wallet
    ///         the intended recipient does not control.
    function acceptIssuerTransfer() external {
        if (msg.sender != pendingIssuer) revert NotPendingIssuer();
        address prev = issuer;
        issuer = pendingIssuer;
        pendingIssuer = address(0);
        emit IssuerTransferAccepted(prev, issuer);
    }

    function setPaused(bool p) external onlyIssuer {
        paused = p;
        emit PausedSet(p);
    }

    // ─────────────────────────────────────────────────────────── issuance

    function mint(address to, uint256 value) external onlyIssuer {
        if (value == 0) revert ZeroValue();
        _update(address(0), to, value);
        emit Mint(to, value);
    }

    function burn(address from, uint256 value) external onlyIssuer {
        if (value == 0) revert ZeroValue();
        _update(from, address(0), value);
        emit Burn(from, value);
    }

    /// @notice Issuer-controlled recovery — court order, lost keys, sanctions
    ///         hit that also required freezing. Reason is required and
    ///         emitted so a regulator can reconstruct the event.
    function forceTransfer(address from, address to, uint256 value, string calldata reason) external onlyIssuer {
        if (value == 0) revert ZeroValue();
        // Recipient must still be baseline-eligible, or we recreate the OFAC
        // exposure we were trying to unwind.
        if (!_isEligible(to)) revert RecipientIneligible(to);
        _update(from, to, value);
        emit ForceTransfer(from, to, value, reason);
    }

    // ─────────────────────────────────────────────────────────── ERC-20

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _update(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a < value) revert InsufficientAllowance(from, msg.sender, a, value);
        if (a != type(uint256).max) {
            unchecked { allowance[from][msg.sender] = a - value; }
        }
        _update(from, to, value);
        return true;
    }

    // ─────────────────────────────────────────────────────────── gate

    /// @dev Every value-moving path funnels here. Adding a new external
    ///      function that skips this is the class of bug that turns
    ///      "permissioned" into "not really permissioned."
    function _update(address from, address to, uint256 value) internal {
        if (paused) revert TokenPaused();

        // Mint into an ineligible holder is the same class of leak as a
        // transfer into one — check both ends when either is nonzero.
        if (from != address(0) && !_isEligible(from)) revert SenderIneligible(from);
        if (to != address(0) && !_isEligible(to)) revert RecipientIneligible(to);

        if (from == address(0)) {
            totalSupply += value;
        } else {
            uint256 fromBal = balanceOf[from];
            if (fromBal < value) revert InsufficientBalance(from, fromBal, value);
            unchecked { balanceOf[from] = fromBal - value; }
        }

        if (to == address(0)) {
            unchecked { totalSupply -= value; }
        } else {
            balanceOf[to] += value;
        }

        emit Transfer(from, to, value);
    }

    function _isEligible(address who) internal view returns (bool) {
        return registry.isEligible(who, _requiredTopics);
    }

    // ─────────────────────────────────────────────────────────── read

    function requiredTopics() external view returns (uint256[] memory) {
        return _requiredTopics;
    }

    function isEligible(address who) external view returns (bool) {
        return _isEligible(who);
    }
}
