// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MiningStreamingForge
 * @dev Institutional Forward Production Streaming Contract for In-Ground NI 43-101 Gold Reserves
 * Underwrites mine CAPEX in exchange for perpetual or fixed-term physical gold delivery at steep discounts.
 */
contract MiningStreamingForge {
    address public trustee;
    address public dgxTokenAddress;

    struct Concession {
        string concessionId;
        string mineName;
        string jurisdiction;
        uint256 provenReservesOz;
        uint256 upfrontCapexUsd;
        uint256 fixedPricePerOzUsd;
        uint256 totalOzCommitted;
        uint256 totalOzDelivered;
        bool isActive;
        string technicalReportFilingHash; // NI 43-101 or JORC
    }

    mapping(bytes32 => Concession) public concessions;
    bytes32[] public concessionList;

    event ConcessionEnrolled(bytes32 indexed concessionHash, string mineName, uint256 provenOz, uint256 committedOz);
    event RefineryDeliveryLogged(bytes32 indexed concessionHash, uint256 ozDelivered, string refineryRef, uint256 cashPaidUsd);

    modifier onlyTrustee() {
        require(msg.sender == trustee, "MiningForge: caller is not trustee");
        _;
    }

    constructor(address _trustee, address _dgxToken) {
        trustee = _trustee;
        dgxTokenAddress = _dgxToken;
    }

    function enrollConcession(
        string memory concessionId,
        string memory mineName,
        string memory jurisdiction,
        uint256 provenReservesOz,
        uint256 upfrontCapexUsd,
        uint256 fixedPricePerOzUsd,
        uint256 totalOzCommitted,
        string memory technicalReportFilingHash
    ) external onlyTrustee returns (bytes32) {
        require(provenReservesOz >= totalOzCommitted * 2, "MiningForge: Coverage ratio must exceed 2.0x");

        bytes32 concessionHash = keccak256(abi.encodePacked(concessionId, mineName, jurisdiction));
        require(!concessions[concessionHash].isActive, "MiningForge: Concession already enrolled");

        concessions[concessionHash] = Concession({
            concessionId: concessionId,
            mineName: mineName,
            jurisdiction: jurisdiction,
            provenReservesOz: provenReservesOz,
            upfrontCapexUsd: upfrontCapexUsd,
            fixedPricePerOzUsd: fixedPricePerOzUsd,
            totalOzCommitted: totalOzCommitted,
            totalOzDelivered: 0,
            isActive: true,
            technicalReportFilingHash: technicalReportFilingHash
        });

        concessionList.push(concessionHash);
        emit ConcessionEnrolled(concessionHash, mineName, provenReservesOz, totalOzCommitted);
        return concessionHash;
    }

    function logRefineryDelivery(
        bytes32 concessionHash,
        uint256 ozDelivered,
        string memory refineryRef
    ) external onlyTrustee {
        Concession storage c = concessions[concessionHash];
        require(c.isActive, "MiningForge: Inactive concession");

        c.totalOzDelivered += ozDelivered;
        uint256 cashPaid = ozDelivered * c.fixedPricePerOzUsd;

        if (c.totalOzDelivered >= c.totalOzCommitted) {
            c.isActive = false;
        }

        emit RefineryDeliveryLogged(concessionHash, ozDelivered, refineryRef, cashPaid);
    }
}
