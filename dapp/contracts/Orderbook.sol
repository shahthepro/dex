pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/IDEXChain.sol";
import "./interfaces/IOrdersDB.sol";
import "./interfaces/IFeeContract.sol";

contract Orderbook {
    using SafeMath for uint256;

    // event PlaceOrder(
    //     bytes32 orderHash,
    //     address token, address base,
    //     uint256 price, uint256 quantity, bool is_bid,
    //     address owner, uint256 timestamp
    // );
    event PlaceBuyOrder(
        bytes32 orderHash,
        address token, address base,
        uint256 price, uint256 quantity,
        address owner, uint256 timestamp
    );
    event PlaceSellOrder(
        bytes32 orderHash,
        address token, address base,
        uint256 price, uint256 quantity,
        address owner, uint256 timestamp
    );
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

        if (is_bid) {
            emit PlaceBuyOrder(orderHash, token, base, price, quantity, msg.sender, now);
        } else {
            emit PlaceSellOrder(orderHash, token, base, price, quantity, msg.sender, now);
        }
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
        ordersDB.setOrderTimestamp(orderHash, now);

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


        IFeeContract feeContract = IFeeContract(feeContractAddress);
        uint256 fee = 0;
        if ((now - ordersDB.getOrderTimestamp(orderHash)) < 2 days) {
            fee = feeContract.calculateCancelFee(volumeLeft);
        }
        address feeAccount = feeContract.getFeeAccount();

        if (ordersDB.getOrderIsBid(orderHash)) {
            transferFundsAfterCancel(ordersDB.getOrderBase(orderHash), volumeLeft, fee, feeAccount);
        } else {
            transferFundsAfterCancel(ordersDB.getOrderToken(orderHash), volumeLeft, fee, feeAccount);
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

    function transferFundsAfterCancel(address token, uint256 amount, uint256 fee, address feeAccount) private {
        IDEXChain chain = IDEXChain(exchangeContract);

        uint256 volumeNoFee = amount.sub(fee);
        
        chain.recoverFromEscrow(token, msg.sender, volumeNoFee);
        chain.releaseEscrow(token, msg.sender, feeAccount, amount.sub(volumeNoFee));
        chain.notifyBalanceUpdate(token, msg.sender);
        chain.notifyBalanceUpdate(token, feeAccount);
    }
}