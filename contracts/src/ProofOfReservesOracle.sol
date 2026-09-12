// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProofOfReservesOracle
 * @dev Cryptographic Oracle for Allocated Bullion Bar Audits & Depository Telemetry
 */
contract ProofOfReservesOracle {
    address public primaryAuditor;
    uint256 public totalVaultedGrams;
    uint256 public lastAuditTimestamp;
    string public auditReportIpfsHash;

    event ReservesUpdated(uint256 totalVaultedGrams, string auditReportIpfsHash, uint256 timestamp);

    modifier onlyAuditor() {
        require(msg.sender == primaryAuditor, "PoR: caller is not auditor");
        _;
    }

    constructor(address _auditor) {
        primaryAuditor = _auditor;
    }

    function updateReserves(uint256 _totalVaultedGrams, string memory _ipfsHash) external onlyAuditor {
        totalVaultedGrams = _totalVaultedGrams;
        auditReportIpfsHash = _ipfsHash;
        lastAuditTimestamp = block.timestamp;

        emit ReservesUpdated(_totalVaultedGrams, _ipfsHash, block.timestamp);
    }
}
