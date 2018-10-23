pragma solidity ^0.4.3;

import "./../interfaces/IDataStore.sol";
import "./../interfaces/IDEXChain.sol";
import "./OrderHelpers.sol";
import "./FeeHelpers.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library OrderbookHelpers {
    using SafeMath for uint256;

    function getOrderHash(
        address owner, address token, address base, 
        uint256 price, uint256 quantity, bool is_bid, uint256 nonce) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner, token, base, price, quantity, is_bid, nonce));
    }

    function createOrder(address dataStoreContract, bytes32 orderHash) private {
        // Create order
        require(OrderHelpers.getOrderExists(dataStoreContract, orderHash) == false, "ERR_NONCE_NOT_UNIQUE");
        OrderHelpers.setOrderExists(dataStoreContract, orderHash, true);
    }

    function storeOrder(
        address dataStoreContract,
        address exchangeContract,
        bytes32 orderHash,
        address owner, 
        address token, 
        address base, 
        uint256 price, 
        uint256 quantity, 
        bool is_bid
    ) private {
        uint256 volume = price.mul(quantity);

        // Store order
        OrderHelpers.setOrderOwner(dataStoreContract, orderHash, owner);
        OrderHelpers.setOrderToken(dataStoreContract, orderHash, token);
        OrderHelpers.setOrderBase(dataStoreContract, orderHash, base);
        OrderHelpers.setOrderPrice(dataStoreContract, orderHash, price);
        OrderHelpers.setOrderVolume(dataStoreContract, orderHash, volume);
        OrderHelpers.setOrderQuantity(dataStoreContract, orderHash, quantity);
        OrderHelpers.setOrderIsBid(dataStoreContract, orderHash, is_bid);
        OrderHelpers.setOrderIsOpen(dataStoreContract, orderHash, true);

        IDEXChain chain = IDEXChain(exchangeContract);
        if (is_bid) {
            // Buy order
            chain.moveToEscrow(base, owner, volume);
            chain.notifyBalanceUpdate(base, owner);
        } else {
            // Sell order
            chain.moveToEscrow(token, owner, volume);
            chain.notifyBalanceUpdate(token, owner);
        }
    }

    // To place an order and move funds to escrow
    function placeOrder(
        address dataStoreContract,
        address exchangeContract,
        address token, 
        address base, 
        uint256 price, 
        uint256 quantity, 
        bool is_bid, 
        uint256 nonce
    ) public {
        require(base < token, "ERR_INVALID_PAIR");
        require(quantity != 0, "ERR_ZERO_AMOUNT");
        require(price != 0, "ERR_ZERO_PRICE");

        bytes32 orderHash = getOrderHash(msg.sender, token, base, price, quantity, is_bid, nonce);

        createOrder(dataStoreContract, orderHash);

        storeOrder(dataStoreContract, exchangeContract, orderHash, msg.sender, token, base, price, quantity, is_bid);
    }

    // To cancel an order and recover funds from escrow
    function cancelOrder(address dataStoreContract, address exchangeContract, bytes32 orderHash) public {
        require(OrderHelpers.getOrderExists(dataStoreContract, orderHash), "ERR_NOT_FOUND");

        require(OrderHelpers.getOrderOwner(dataStoreContract, orderHash) == msg.sender, "ERR_NOT_OWNER");

        require(OrderHelpers.getOrderIsOpen(dataStoreContract, orderHash), "ERR_CLOSED_ORDER");

        // Refund any remaining volume minus cancellation fee
        uint256 volume = OrderHelpers.getOrderVolume(dataStoreContract, orderHash);
        uint256 volumeFilled = OrderHelpers.getOrderFilledVolume(dataStoreContract, orderHash);
        uint256 volumeLeft = volume - volumeFilled;
        require(volumeLeft > 0, "ERR_FILLED_ORDER");

        address pairBase = OrderHelpers.getOrderBase(dataStoreContract, orderHash);
        address pairToken = OrderHelpers.getOrderToken(dataStoreContract, orderHash);

        address feeAccount = FeeHelpers.getFeeAccount(dataStoreContract);

        uint256 fee = FeeHelpers.calculateCancelFee(dataStoreContract, volumeLeft);
        uint256 volumeNoFee = volumeLeft.sub(fee);

        IDEXChain chain = IDEXChain(exchangeContract);

        if (OrderHelpers.getOrderIsBid(dataStoreContract, orderHash)) {
            // Buy Order
            chain.recoverFromEscrow(pairBase, msg.sender, volumeNoFee);
            chain.recoverFromEscrow(pairBase, feeAccount, fee);
            chain.notifyBalanceUpdate(pairBase, msg.sender);
            chain.notifyBalanceUpdate(pairBase, feeAccount);
        } else {
            // Sell Order
            chain.recoverFromEscrow(pairToken, msg.sender, volumeNoFee);
            chain.recoverFromEscrow(pairToken, feeAccount, fee);
            chain.notifyBalanceUpdate(pairToken, msg.sender);
            chain.notifyBalanceUpdate(pairToken, feeAccount);
        }

        // Mark as cancelled/closed
        OrderHelpers.setOrderIsOpen(dataStoreContract, orderHash, false);

    }

    function ensureOrdersMatch(address dataStoreContract, address exchangeContract, bytes32 buyOrderHash, bytes32 sellOrderHash) private view {
        require(OrderHelpers.getOrderExists(dataStoreContract, buyOrderHash), "ERR_ORDER_MISSING");
        require(OrderHelpers.getOrderExists(dataStoreContract, sellOrderHash), "ERR_ORDER_MISSING");

        require(OrderHelpers.getOrderIsOpen(dataStoreContract, buyOrderHash), "ERR_ORDER_CLOSED");
        require(OrderHelpers.getOrderIsOpen(dataStoreContract, sellOrderHash), "ERR_ORDER_CLOSED");

        require(OrderHelpers.getOrderIsBid(dataStoreContract, buyOrderHash), "ERR_INVALID_ORDER");
        require(!OrderHelpers.getOrderIsBid(dataStoreContract, sellOrderHash), "ERR_INVALID_ORDER");

        require(OrderHelpers.getOrderBase(dataStoreContract, buyOrderHash) == OrderHelpers.getOrderBase(dataStoreContract, sellOrderHash), "ERR_ORDER_MISMATCH");
        require(OrderHelpers.getOrderToken(dataStoreContract, buyOrderHash) == OrderHelpers.getOrderToken(dataStoreContract, sellOrderHash), "ERR_ORDER_MISMATCH");
        require(OrderHelpers.getOrderPrice(dataStoreContract, buyOrderHash) == OrderHelpers.getOrderPrice(dataStoreContract, sellOrderHash), "ERR_ORDER_MISMATCH");
    }

    // Matches buy and sell orders
    function matchOrders(address dataStoreContract, address exchangeContract, bytes32 buyOrderHash, bytes32 sellOrderHash) public {
        ensureOrdersMatch(dataStoreContract, exchangeContract, buyOrderHash, sellOrderHash);
        uint256 volumeToTrade = getTradeableOrderVolume(
            OrderHelpers.getOrderAvailableVolume(dataStoreContract, buyOrderHash), 
            OrderHelpers.getOrderAvailableVolume(dataStoreContract, sellOrderHash));
        
        address token = OrderHelpers.getOrderToken(dataStoreContract, buyOrderHash);
        address base = OrderHelpers.getOrderBase(dataStoreContract, buyOrderHash);
        address taker = OrderHelpers.getOrderOwner(dataStoreContract, buyOrderHash);
        address maker = OrderHelpers.getOrderOwner(dataStoreContract, sellOrderHash);

        uint256 takeFee = FeeHelpers.calculateTakeFee(dataStoreContract, volumeToTrade);
        uint256 makeFee = FeeHelpers.calculateMakeFee(dataStoreContract, volumeToTrade);

        address feeAccount = FeeHelpers.getFeeAccount(dataStoreContract);

        tradeFunds(exchangeContract, token, base, taker, maker, takeFee, makeFee, volumeToTrade, feeAccount);
    }

    function tradeFunds(
        address exchangeContract, 
        address token, address base, 
        address taker, address maker,
        uint256 takeFee, uint256 makeFee,
        uint256 volumeToTrade,
        address feeAccount) private {

        IDEXChain chain = IDEXChain(exchangeContract);
        chain.releaseEscrow(base, taker, maker, volumeToTrade.sub(makeFee));
        chain.releaseEscrow(base, taker, feeAccount, makeFee);
        chain.releaseEscrow(token, maker, taker, volumeToTrade.sub(takeFee));
        chain.releaseEscrow(token, maker, feeAccount, takeFee);

        chain.notifyBalanceUpdate(base, taker);
        chain.notifyBalanceUpdate(base, maker);
        chain.notifyBalanceUpdate(base, feeAccount);
        chain.notifyBalanceUpdate(token, taker);
        chain.notifyBalanceUpdate(token, maker);
        chain.notifyBalanceUpdate(token, feeAccount);
    }

    function getTradeableOrderVolume(uint256 takeVolume, uint256 makeVolume) private pure returns (uint256) {
        require(takeVolume > 0 && makeVolume > 0, "ERR_INVALID_ORDER");
        
        if (takeVolume <= makeVolume) {
            return takeVolume;
        }

        return makeVolume;
    }
}