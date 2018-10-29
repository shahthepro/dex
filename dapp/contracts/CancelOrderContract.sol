pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/IDEXChain.sol";
import "./interfaces/IOrdersDB.sol";
import "./interfaces/IFeeContract.sol";

contract CancelOrderContract {
    using SafeMath for uint256;

    event PlaceOrder(bytes32 orderHash, address token, address base, uint256 price, uint256 quantity, bool is_bid, address owner);
    event Trade(bytes32 buyOrderHash, bytes32 sellOrderHash, uint256 volume);
    event CancelOrder(bytes32 orderHash);

    address public ordersDBContract;
    address public exchangeContract;
    address public feeContractAddress;

    constructor (address ordersDB_, address exchange_, address fee_) public {
        ordersDBContract = ordersDB_;
        exchangeContract = exchange_;
        feeContractAddress = fee_;
    }

    function getOrderHash(
        address owner, address token, address base, 
        uint256 price, uint256 quantity, bool is_bid, uint256 nonce) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner, token, base, price, quantity, is_bid, nonce));
    }

    // To place an order and move funds to escrow
    function placeOrder(
        address token, 
        address base, 
        uint256 price, 
        uint256 quantity, 
        bool is_bid, 
        uint256 nonce
    ) public {
        bytes32 orderHash = getOrderHash(msg.sender, token, base, price, quantity, is_bid, nonce);

        createOrder(orderHash);
        storeOrder(orderHash, token, base, price, quantity, is_bid);

        emit PlaceOrder(orderHash, token, base, price, quantity, is_bid, msg.sender);
    }

    function createOrder(bytes32 orderHash) private {
        IOrdersDB ordersDB = IOrdersDB(ordersDBContract);
        require(ordersDB.getOrderExists(orderHash) == false, "ERR_NONCE_NOT_UNIQUE");
        ordersDB.setOrderExists(orderHash, true);
        ordersDB.setOrderOwner(orderHash, msg.sender);
    }

    function storeOrder(
        bytes32 orderHash,
        address token, 
        address base, 
        uint256 price, 
        uint256 quantity, 
        bool is_bid
    ) private {
        uint256 volume = price.mul(quantity);

        IOrdersDB ordersDB = IOrdersDB(ordersDBContract);

        // Store order
        ordersDB.setOrderOwner(orderHash, msg.sender);
        ordersDB.setOrderToken(orderHash, token);
        ordersDB.setOrderBase(orderHash, base);
        ordersDB.setOrderPrice(orderHash, price);
        ordersDB.setOrderVolume(orderHash, volume);
        ordersDB.setOrderQuantity(orderHash, quantity);
        ordersDB.setOrderIsBid(orderHash, is_bid);
        ordersDB.setOrderIsOpen(orderHash, true);

        IDEXChain chain = IDEXChain(exchangeContract);
        if (is_bid) {
            // Buy order
            chain.moveToEscrow(base, msg.sender, volume);
            chain.notifyBalanceUpdate(base, msg.sender);
        } else {
            // Sell order
            chain.moveToEscrow(token, msg.sender, volume);
            chain.notifyBalanceUpdate(token, msg.sender);
        }
    }

    // To cancel an order and recover funds from escrow
    function cancelOrder(bytes32 orderHash) public {
        checkIfOrderIsCancellable(orderHash);

        // Refund any remaining volume minus cancellation fee
        IOrdersDB ordersDB = IOrdersDB(ordersDBContract);

        uint256 volumeLeft = ordersDB.getOrderAvailableVolume(orderHash);
        require(volumeLeft > 0, "ERR_FILLED_ORDER");


        if (ordersDB.getOrderIsBid(orderHash)) {
            transferFundsAfterCancel(ordersDB.getOrderBase(orderHash), volumeLeft);
        } else {
            transferFundsAfterCancel(ordersDB.getOrderToken(orderHash), volumeLeft);
        }

        // Mark as cancelled/closed
        ordersDB.setOrderIsOpen(orderHash, false);
        emit CancelOrder(orderHash);
    }

    function checkIfOrderIsCancellable(bytes32 orderHash) private view {
        IOrdersDB ordersDB = IOrdersDB(ordersDBContract);

        require(ordersDB.getOrderExists(orderHash), "ERR_NOT_FOUND");

        require(ordersDB.getOrderOwner(orderHash) == msg.sender, "ERR_NOT_OWNER");

        require(ordersDB.getOrderIsOpen(orderHash), "ERR_CLOSED_ORDER");
    }

    function transferFundsAfterCancel(address token, uint256 amount) private {
        IFeeContract feeContract = IFeeContract(feeContractAddress);
        IDEXChain chain = IDEXChain(exchangeContract);

        uint256 fee = feeContract.calculateCancelFee(amount);
        address feeAccount = feeContract.getFeeAccount();

        uint256 volumeNoFee = (amount.mul(1 ether - fee)) / 1 ether;
        
        chain.recoverFromEscrow(token, msg.sender, volumeNoFee);
        chain.releaseEscrow(token, msg.sender, feeAccount, amount.sub(volumeNoFee));
        chain.notifyBalanceUpdate(token, msg.sender);
        chain.notifyBalanceUpdate(token, feeAccount);
    }

    // function ensureOrdersMatch(bytes32 buyOrderHash, bytes32 sellOrderHash) private view {
    //     IOrdersDB ordersDB = IOrdersDB(ordersDBContract);

    //     require(ordersDB.getOrderExists(buyOrderHash), "ERR_ORDER_MISSING");
    //     require(ordersDB.getOrderExists(sellOrderHash), "ERR_ORDER_MISSING");

    //     require(ordersDB.getOrderIsOpen(buyOrderHash), "ERR_ORDER_CLOSED");
    //     require(ordersDB.getOrderIsOpen(sellOrderHash), "ERR_ORDER_CLOSED");

    //     require(ordersDB.getOrderIsBid(buyOrderHash), "ERR_INVALID_ORDER");
    //     require(!ordersDB.getOrderIsBid(sellOrderHash), "ERR_INVALID_ORDER");

    //     require(ordersDB.getOrderBase(buyOrderHash) == ordersDB.getOrderBase(sellOrderHash), "ERR_ORDER_MISMATCH");
    //     require(ordersDB.getOrderToken(buyOrderHash) == ordersDB.getOrderToken(sellOrderHash), "ERR_ORDER_MISMATCH");
    //     require(ordersDB.getOrderPrice(buyOrderHash) == ordersDB.getOrderPrice(sellOrderHash), "ERR_ORDER_MISMATCH");
    // }

    // // Matches buy and sell orders
    // function matchOrders(bytes32 buyOrderHash, bytes32 sellOrderHash) public {
    //     ensureOrdersMatch(buyOrderHash, sellOrderHash);
        
    //     IOrdersDB ordersDB = IOrdersDB(ordersDBContract);
    //     IFeeContract feeContract = IFeeContract(feeContractAddress);

    //     uint256 volumeToTrade = getTradeableOrderVolume(
    //         ordersDB.getOrderAvailableVolume(buyOrderHash), 
    //         ordersDB.getOrderAvailableVolume(sellOrderHash));
        
    //     address token = ordersDB.getOrderToken(buyOrderHash);
    //     address base = ordersDB.getOrderBase(buyOrderHash);
    //     address taker = ordersDB.getOrderOwner(buyOrderHash);
    //     address maker = ordersDB.getOrderOwner(sellOrderHash);

    //     uint256 takeFee = feeContract.calculateTakeFee(volumeToTrade);
    //     uint256 makeFee = feeContract.calculateMakeFee(volumeToTrade);

    //     address feeAccount = feeContract.getFeeAccount();

    //     tradeFunds(token, base, taker, maker, takeFee, makeFee, volumeToTrade, feeAccount);
    // }

    // function tradeFunds(
    //     address token, address base, 
    //     address taker, address maker,
    //     uint256 takeFee, uint256 makeFee,
    //     uint256 volumeToTrade,
    //     address feeAccount) private {

    //     IDEXChain chain = IDEXChain(exchangeContract);
    //     chain.releaseEscrow(base, taker, maker, volumeToTrade.sub(makeFee));
    //     chain.releaseEscrow(base, taker, feeAccount, makeFee);
    //     chain.releaseEscrow(token, maker, taker, volumeToTrade.sub(takeFee));
    //     chain.releaseEscrow(token, maker, feeAccount, takeFee);

    //     chain.notifyBalanceUpdate(base, taker);
    //     chain.notifyBalanceUpdate(base, maker);
    //     chain.notifyBalanceUpdate(base, feeAccount);
    //     chain.notifyBalanceUpdate(token, taker);
    //     chain.notifyBalanceUpdate(token, maker);
    //     chain.notifyBalanceUpdate(token, feeAccount);
    // }

    // function getTradeableOrderVolume(uint256 takeVolume, uint256 makeVolume) private pure returns (uint256) {
    //     require(takeVolume > 0 && makeVolume > 0, "ERR_INVALID_ORDER");
        
    //     if (takeVolume <= makeVolume) {
    //         return takeVolume;
    //     }

    //     return makeVolume;
    // }

}