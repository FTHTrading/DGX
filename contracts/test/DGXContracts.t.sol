// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/DGXBullionToken.sol";
import "../src/MiningStreamingForge.sol";
import "../src/AtomicSettlementDvP.sol";
import "../src/ProofOfReservesOracle.sol";
import "../src/IoTEsgOffsetRegistry.sol";

/**
 * @title DGXContractsTest
 * @dev Verification suite for institutional gold tokenization & streaming
 */
contract DGXContractsTest {
    DGXBullionToken public token;
    MiningStreamingForge public forge;
    AtomicSettlementDvP public dvp;
    ProofOfReservesOracle public oracle;
    IoTEsgOffsetRegistry public esg;

    address public governor = address(this);
    address public auditor = address(0x1111);
    address public institution = address(0x2222);

    function setUp() public {
        oracle = new ProofOfReservesOracle(auditor);
        token = new DGXBullionToken(governor, address(oracle));
        forge = new MiningStreamingForge(governor, address(token));
        dvp = new AtomicSettlementDvP();
        esg = new IoTEsgOffsetRegistry(governor);
    }

    function testEnrollBarAndMint() public {
        bytes32 barHash = token.enrollBarPassport(
            "VAL-CH-994820",
            "Valcambi SA",
            9999,
            12441, // ~400 oz in grams
            "Zurich Freezone Switzerland",
            "LLOYDS-SPECIE-VAL-001"
        );

        token.setWhitelisted(institution, true);
        token.mintBullion(institution, 12441 ether, barHash);
        require(token.balanceOf(institution) == 12441 ether, "Balance mismatch");
    }

    function testConcessionStreaming() public {
        bytes32 concessionHash = forge.enrollConcession(
            "EUREKA-NV-01",
            "Eureka Gold Mine",
            "Nevada, USA",
            500000, // 500k oz P&P
            25000000, // $25M CAPEX
            750, // $750 / oz fixed delivery price
            100000, // 100k oz committed stream
            "NI43-101-SEC-EDGAR-FILING-99482"
        );

        forge.logRefineryDelivery(concessionHash, 1000, "VALCAMBI-BATCH-001");
    }
}
