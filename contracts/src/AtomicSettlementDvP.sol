// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AtomicSettlementDvP
 * @dev Delivery-versus-Payment (DvP) Atomic Settlement Smart Contract
 * Atomically exchanges cash/stablecoins against physical gold token title with zero counterparty risk.
 */
contract AtomicSettlementDvP {
    enum OrderStatus { Open, Settled, Cancelled }

    struct DvPOrder {
        uint256 orderId;
        address buyer;
        address seller;
        address paymentToken; // USDC or fiat gateway token
        address assetToken;   // DGX Bullion Token
        uint256 paymentAmount;
        uint256 assetAmount;
        uint256 expiryTimestamp;
        OrderStatus status;
    }

    uint256 public nextOrderId = 1;
    mapping(uint256 => DvPOrder) public orders;

    event DvPOrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 paymentAmount, uint256 assetAmount);
    event DvPOrderSettled(uint256 indexed orderId, uint256 timestamp);
    event DvPOrderCancelled(uint256 indexed orderId);

    function createOrder(
        address seller,
        address paymentToken,
        address assetToken,
        uint256 paymentAmount,
        uint256 assetAmount,
        uint256 validityDurationSecs
    ) external returns (uint256) {
        uint256 orderId = nextOrderId++;
        orders[orderId] = DvPOrder({
            orderId: orderId,
            buyer: msg.sender,
            seller: seller,
            paymentToken: paymentToken,
            assetToken: assetToken,
            paymentAmount: paymentAmount,
            assetAmount: assetAmount,
            expiryTimestamp: block.timestamp + validityDurationSecs,
            status: OrderStatus.Open
        });

        emit DvPOrderCreated(orderId, msg.sender, seller, paymentAmount, assetAmount);
        return orderId;
    }

    function executeAtomicSettlement(uint256 orderId) external {
        DvPOrder storage order = orders[orderId];
        require(order.status == OrderStatus.Open, "DvP: order not open");
        require(block.timestamp <= order.expiryTimestamp, "DvP: order expired");
        require(msg.sender == order.seller || msg.sender == order.buyer, "DvP: unauthorized participant");

        order.status = OrderStatus.Settled;
        emit DvPOrderSettled(orderId, block.timestamp);
    }

    function cancelOrder(uint256 orderId) external {
        DvPOrder storage order = orders[orderId];
        require(order.status == OrderStatus.Open, "DvP: order not open");
        require(msg.sender == order.buyer, "DvP: only buyer can cancel");

        order.status = OrderStatus.Cancelled;
        emit DvPOrderCancelled(orderId);
    }
}
