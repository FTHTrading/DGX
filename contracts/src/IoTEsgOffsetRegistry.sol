// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IoTEsgOffsetRegistry
 * @dev IoT Telemetry & Carbon Offset Retirement Registry for Green Gold Certification
 */
contract IoTEsgOffsetRegistry {
    address public registryAdmin;

    struct CarbonRetirement {
        string mineConcessionId;
        string vcsCreditSerial;
        uint256 co2TonsRetired;
        uint256 goldOzOffset;
        uint256 timestamp;
    }

    CarbonRetirement[] public retirements;

    event CarbonOffsetRetired(string mineConcessionId, uint256 co2TonsRetired, uint256 goldOzOffset, string vcsSerial);

    modifier onlyAdmin() {
        require(msg.sender == registryAdmin, "ESG: caller is not admin");
        _;
    }

    constructor(address _admin) {
        registryAdmin = _admin;
    }

    function retireCarbon(
        string memory mineConcessionId,
        string memory vcsCreditSerial,
        uint256 co2TonsRetired,
        uint256 goldOzOffset
    ) external onlyAdmin {
        retirements.push(CarbonRetirement({
            mineConcessionId: mineConcessionId,
            vcsCreditSerial: vcsCreditSerial,
            co2TonsRetired: co2TonsRetired,
            goldOzOffset: goldOzOffset,
            timestamp: block.timestamp
        }));

        emit CarbonOffsetRetired(mineConcessionId, co2TonsRetired, goldOzOffset, vcsCreditSerial);
    }

    function totalRetirementsCount() external view returns (uint256) {
        return retirements.length;
    }
}
