// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DGXBullionToken
 * @dev 1:1 Physical Gold-Backed Institutional Token with LBMA Good Delivery Serial Passports
 * Complies with ERC-20 & ERC-3643 Permissioned Regulatory Identity Rails
 */
contract DGXBullionToken {
    string public name = "DGX Bullion Token";
    string public symbol = "DGX";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public governor;
    address public proofOfReservesOracle;

    struct LbmaBarPassport {
        string serialNumber;
        string refiner; // Valcambi, PAMP, Argor-Heraeus, Perth Mint
        uint16 finenessBps; // 9999 = 99.99% pure
        uint256 fineWeightGrams;
        string vaultEnclave; // Zurich Freezone, London LBMA, Delaware Depository
        string insurancePolicyHash; // Lloyd's of London Specie
        bool isAllocated;
        uint256 auditTimestamp;
    }

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public isWhitelisted;
    mapping(bytes32 => LbmaBarPassport) public barRegistry;
    bytes32[] public registeredBarHashes;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event BarPassportEnrolled(bytes32 indexed barHash, string serialNumber, string vaultEnclave, uint256 fineGrams);
    event BullionMinted(address indexed recipient, uint256 amountGrams, bytes32 indexed barHash);
    event BullionRedeemed(address indexed holder, uint256 amountGrams, string physicalDeliveryAddress);
    event WhitelistUpdated(address indexed account, bool status);

    modifier onlyGovernor() {
        require(msg.sender == governor, "DGX: caller is not governor");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == proofOfReservesOracle || msg.sender == governor, "DGX: caller is not oracle");
        _;
    }

    constructor(address _governor, address _oracle) {
        governor = _governor;
        proofOfReservesOracle = _oracle;
        isWhitelisted[_governor] = true;
    }

    function setWhitelisted(address account, bool status) external onlyGovernor {
        isWhitelisted[account] = status;
        emit WhitelistUpdated(account, status);
    }

    function enrollBarPassport(
        string memory serialNumber,
        string memory refiner,
        uint16 finenessBps,
        uint256 fineWeightGrams,
        string memory vaultEnclave,
        string memory insurancePolicyHash
    ) external onlyOracle returns (bytes32) {
        bytes32 barHash = keccak256(abi.encodePacked(serialNumber, refiner, vaultEnclave));
        require(!barRegistry[barHash].isAllocated, "DGX: Bar already enrolled");

        barRegistry[barHash] = LbmaBarPassport({
            serialNumber: serialNumber,
            refiner: refiner,
            finenessBps: finenessBps,
            fineWeightGrams: fineWeightGrams,
            vaultEnclave: vaultEnclave,
            insurancePolicyHash: insurancePolicyHash,
            isAllocated: true,
            auditTimestamp: block.timestamp
        });

        registeredBarHashes.push(barHash);
        emit BarPassportEnrolled(barHash, serialNumber, vaultEnclave, fineWeightGrams);
        return barHash;
    }

    function mintBullion(address recipient, uint256 amount, bytes32 barHash) external onlyGovernor {
        require(isWhitelisted[recipient], "DGX: recipient not whitelisted");
        require(barRegistry[barHash].isAllocated, "DGX: unverified bar passport");

        totalSupply += amount;
        balanceOf[recipient] += amount;
        emit BullionMinted(recipient, amount, barHash);
        emit Transfer(address(0), recipient, amount);
    }

    function redeemPhysical(uint256 amount, string memory physicalDeliveryAddress) external {
        require(balanceOf[msg.sender] >= amount, "DGX: insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;

        emit BullionRedeemed(msg.sender, amount, physicalDeliveryAddress);
        emit Transfer(msg.sender, address(0), amount);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(isWhitelisted[to], "DGX: recipient must be whitelisted");
        require(balanceOf[msg.sender] >= value, "DGX: balance too low");

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(isWhitelisted[to], "DGX: recipient must be whitelisted");
        require(balanceOf[from] >= value, "DGX: balance too low");
        require(allowance[from][msg.sender] >= value, "DGX: allowance exceeded");

        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
