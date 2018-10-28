pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/IDEXChain.sol";
import "./interfaces/IOrdersDB.sol";

contract NewOrderContract {
    using SafeMath for uint256;

    event PlaceOrder(bytes32 orderHash, address token, address base, uint256 price, uint256 quantity, bool is_bid, address owner);

    address public ordersDBContract;
    address public exchangeContract;

    constructor (address ordersDB_, address exchange_) public {
        ordersDBContract = ordersDB_;
        exchangeContract = exchange_;
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
}