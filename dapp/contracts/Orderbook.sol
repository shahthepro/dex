pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./core/DEXContract.sol";
import "./interfaces/IDEXChain.sol";
import "./interfaces/IDataStore.sol";
// import "./lib/FeeHelpers.sol";
// import "./lib/OrderbookHelpers.sol";
// import "./lib/OrderHelpers.sol";

contract Orderbook is DEXContract {
    using SafeMath for uint256;

    // events for Orderbook
    event PlaceOrder(bytes32 orderHash, address token, address base, uint256 price, uint256 quantity, bool is_bid, address owner);
    // event Trade(bytes32 buyOrderHash, bytes32 sellOrderHash, uint256 volume);
    event CancelOrder(bytes32 orderHash);

    address public dataStoreContract;
    address public exchangeContract;

    constructor (address dataStore_, address exchange_) public {
        dataStoreContract = dataStore_;
        exchangeContract = exchange_;
    }

    function setDataStore(address dataStore_) public onlyAdmin {
        dataStoreContract = dataStore_;
    }

    function setExchange(address exchange_) public onlyAdmin {
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
        require(getOrderExists(orderHash) == false, "ERR_NONCE_NOT_UNIQUE");
        setOrderExists(orderHash, true);
        setOrderOwner(orderHash, msg.sender);
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

        // Store order
        setOrderOwner(orderHash, msg.sender);
        setOrderToken(orderHash, token);
        setOrderBase(orderHash, base);
        setOrderPrice(orderHash, price);
        setOrderVolume(orderHash, volume);
        setOrderQuantity(orderHash, quantity);
        setOrderIsBid(orderHash, is_bid);
        setOrderIsOpen(orderHash, true);

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
        // OrderbookHelpers.cancelOrder(dataStoreContract, exchangeContract, orderHash);
        emit CancelOrder(orderHash);
    }

    // function matchOrders(bytes32 buyOrderHash, bytes32 sellOrderHash) public onlyAllowedUsers {
        // OrderbookHelpers.matchOrders(dataStoreContract, exchangeContract, buyOrderHash, sellOrderHash);
    // }

    uint8 constant ORDER_PREFIX = 0xA0;
    uint8 constant ORDER_OWNER_KEY = 0xA1;
    uint8 constant ORDER_TOKEN_KEY = 0xA2;
    uint8 constant ORDER_BASE_KEY = 0xA3;
    uint8 constant ORDER_PRICE_KEY = 0xA4;
    uint8 constant ORDER_QUANTITY_KEY = 0xA5;
    uint8 constant ORDER_VOLUME_KEY = 0xA6;
    uint8 constant ORDER_VOLUME_FILLED_KEY = 0xA7;
    uint8 constant ORDER_IS_BID_KEY = 0xA8;
    uint8 constant ORDER_EXISTS_KEY = 0xA9;
    uint8 constant ORDER_OPEN_KEY = 0xAA;

    function getOrderExists(bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)));
    }

    function setOrderExists(bytes32 orderHash, bool value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)), value);
    }

    function getOrderIsBid(bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)));
    }

    function setOrderIsBid(bytes32 orderHash, bool value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)), value);
    }

    function getOrderIsOpen(bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)));
    }
    
    function setOrderIsOpen(bytes32 orderHash, bool value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)), value);
    }

    function getOrderOwner(bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)));
    }
    
    function setOrderOwner(bytes32 orderHash, address value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)), value);
    }

    function getOrderToken(bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)));
    }
    
    function setOrderToken(bytes32 orderHash, address value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)), value);
    }

    function getOrderBase(bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)));
    }
    
    function setOrderBase(bytes32 orderHash, address value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)), value);
    }

    function getOrderPrice(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)));
    }
    
    function setOrderPrice(bytes32 orderHash, uint256 value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)), value);
    }

    function getOrderQuantity(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)));
    }
    
    function setOrderQuantity(bytes32 orderHash, uint256 value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)), value);
    }

    function getOrderVolume(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)));
    }
    
    function setOrderVolume(bytes32 orderHash, uint256 value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)), value);
    }

    function getOrderFilledVolume(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)));
    }
    
    function setOrderFilledVolume(bytes32 orderHash, uint256 value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)), value);
    }

    function getOrderAvailableVolume(bytes32 orderHash) public view returns (uint256) {
        return getOrderVolume(orderHash).sub(getOrderFilledVolume(orderHash));
    }
}
