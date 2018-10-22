pragma solidity ^0.4.23;

import "./core/DEXContract.sol";
import "./DEXChain.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./core/DataStore.sol";

contract Orderbook is DEXContract {
    using SafeMath for uint256;

    // events for Orderbook
    event PlaceOrder(bytes32 orderHash, address token, address base, uint256 price, uint256 quantity, bool is_bid, address owner);
    event Trade(bytes32 buyOrderHash, bytes32 sellOrderHash, uint256 volume);
    event CancelOrder(bytes32 orderHash);

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

    uint8 constant FEES_PREFIX = 0xB0;
    uint8 constant FEES_ACCOUNT_KEY = 0xB1;
    uint8 constant FEES_CANCEL_KEY = 0xB2;
    uint8 constant FEES_MAKE_KEY = 0xB3;
    uint8 constant FEES_TAKE_KEY = 0xB4;

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

    function createOrder(bytes32 orderHash) private {
        // Create order
        require(getOrderExists(orderHash) == false, "ERR_NONCE_NOT_UNIQUE");
        setOrderExists(orderHash, true);
    }

    function storeOrder(
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
        setOrderOwner(orderHash, owner);
        setOrderToken(orderHash, token);
        setOrderBase(orderHash, base);
        setOrderPrice(orderHash, price);
        setOrderVolume(orderHash, volume);
        setOrderQuantity(orderHash, quantity);
        setOrderIsBid(orderHash, is_bid);
        setOrderIsOpen(orderHash, true);

        DEXChain chain = DEXChain(exchangeContract);
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

    // To place an order and move funds to ecrow
    function placeOrder(
        address owner, 
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

        bytes32 orderHash = getOrderHash(owner, token, base, price, quantity, is_bid, nonce);

        createOrder(orderHash);

        storeOrder(orderHash, owner, token, base, price, quantity, is_bid);

        // Event
        emit PlaceOrder(orderHash, token, base, price, quantity, is_bid, owner);
    }

    // To cancel an order and recover funds from escrow
    function cancelOrder(address owner, bytes32 orderHash) public {
        require(getOrderExists(orderHash), "ERR_NOT_FOUND");

        require(getOrderOwner(orderHash) == owner, "ERR_NOT_OWNER");

        require(getOrderIsOpen(orderHash), "ERR_CLOSED_ORDER");

        // Refund any remaining volume minus cancellation fee
        uint256 volume = getOrderVolume(orderHash);
        uint256 volumeFilled = getOrderFilledVolume(orderHash);
        uint256 volumeLeft = volume - volumeFilled;
        require(volumeLeft > 0, "ERR_FILLED_ORDER");

        address pairBase = getOrderBase(orderHash);
        address pairToken = getOrderToken(orderHash);

        address feeAccount = getFeeAccount();

        uint256 fee = calculateCancelFee(volumeLeft);
        uint256 volumeNoFee = volumeLeft.sub(fee);

        DEXChain chain = DEXChain(exchangeContract);

        if (getOrderIsBid(orderHash)) {
            // Buy Order
            chain.recoverFromEscrow(pairBase, owner, volumeNoFee);
            addToFeeAccount(pairBase, fee);
            chain.notifyBalanceUpdate(pairBase, owner);
            chain.notifyBalanceUpdate(pairBase, feeAccount);
        } else {
            // Sell Order
            chain.recoverFromEscrow(pairToken, owner, volumeNoFee);
            addToFeeAccount(pairToken, fee);
            chain.notifyBalanceUpdate(pairToken, owner);
            chain.notifyBalanceUpdate(pairToken, feeAccount);
        }

        // Mark as cancelled/closed
        setOrderIsOpen(orderHash, false);

        emit CancelOrder(orderHash);
    }

    // Matches buy and sell orders
    function matchOrders(bytes32 buyOrderHash, bytes32 sellOrderHash) public onlyAllowedUsersOrAdmin {
        // require(getOrderExists(buyOrderHash), "ERR_ORDER_MISSING");
        // require(getOrderExists(sellOrderHash), "ERR_ORDER_MISSING");

        // require(getOrderIsOpen(buyOrderHash), "ERR_ORDER_CLOSED");
        // require(getOrderIsOpen(sellOrderHash), "ERR_ORDER_CLOSED");

        // require(getOrderIsBid(buyOrderHash), "ERR_INVALID_ORDER");
        // require(!getOrderIsBid(sellOrderHash), "ERR_INVALID_ORDER");

        // require(getOrderBase(buyOrderHash) == getOrderBase(sellOrderHash), "ERR_ORDER_MISMATCH");
        // require(getOrderToken(buyOrderHash) == getOrderToken(sellOrderHash), "ERR_ORDER_MISMATCH");
        // require(getOrderPrice(buyOrderHash) == getOrderPrice(sellOrderHash), "ERR_ORDER_MISMATCH");

        // uint256 volumeToTrade = getTradeableOrderVolume(getOrderAvailableVolume(buyOrderHash), getOrderAvailableVolume(sellOrderHash));
        uint256 volumeToTrade = 0;

        address token = getOrderToken(buyOrderHash);
        address base = getOrderBase(buyOrderHash);
        address taker = getOrderOwner(buyOrderHash);
        address maker = getOrderOwner(sellOrderHash);

        uint256 takeFee = calculateTakeFee(volumeToTrade);
        uint256 makeFee = calculateMakeFee(volumeToTrade);

        address feeAccount = getFeeAccount();

        // DEXChain chain = DEXChain(exchangeContract);
        // chain.releaseEscrow(base, taker, maker, volumeToTrade.sub(makeFee));
        // chain.releaseEscrow(base, taker, feeAccount, makeFee);
        // chain.releaseEscrow(token, maker, taker, volumeToTrade.sub(takeFee));
        // chain.releaseEscrow(token, maker, feeAccount, takeFee);

        // chain.notifyBalanceUpdate(base, taker);
        // chain.notifyBalanceUpdate(base, maker);
        // chain.notifyBalanceUpdate(base, feeAccount);
        // chain.notifyBalanceUpdate(token, taker);
        // chain.notifyBalanceUpdate(token, maker);
        // chain.notifyBalanceUpdate(token, feeAccount);

        // emit Trade(buyOrderHash, sellOrderHash, volumeToTrade);
    }

    // function doTrade(bytes32 buyOrderHash, bytes32 sellOrderHash, uint256 volumeToTrade) private {
    //     // address token = getOrderToken(buyOrderHash);
    //     // address base = getOrderBase(buyOrderHash);
    //     // address taker = getOrderOwner(buyOrderHash);
    //     // address maker = getOrderOwner(sellOrderHash);

    //     // uint256 takeFee = calculateTakeFee(volumeToTrade);
    //     // uint256 makeFee = calculateMakeFee(volumeToTrade);

    //     // address feeAccount = getFeeAccount();

    //     // DEXChain chain = DEXChain(exchangeContract);
    //     // chain.releaseEscrow(base, taker, maker, volumeToTrade.sub(makeFee));
    //     // chain.releaseEscrow(base, taker, feeAccount, makeFee);
    //     // chain.releaseEscrow(token, maker, taker, volumeToTrade.sub(takeFee));
    //     // chain.releaseEscrow(token, maker, feeAccount, takeFee);

    //     // chain.notifyBalanceUpdate(base, taker);
    //     // chain.notifyBalanceUpdate(base, maker);
    //     // chain.notifyBalanceUpdate(base, feeAccount);
    //     // chain.notifyBalanceUpdate(token, taker);
    //     // chain.notifyBalanceUpdate(token, maker);
    //     // chain.notifyBalanceUpdate(token, feeAccount);

    //     emit Trade(buyOrderHash, sellOrderHash, volumeToTrade);
    // }

    function getTradeableOrderVolume(uint256 takeVolume, uint256 makeVolume) private pure returns (uint256) {
        require(takeVolume > 0 && makeVolume > 0, "ERR_INVALID_ORDER");
        
        if (takeVolume <= makeVolume) {
            return takeVolume;
        }

        return makeVolume;
    }

    // Order getter/setters
    function getOrderExists(bytes32 orderHash) public view returns (bool) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)));
    }
    
    function setOrderExists(bytes32 orderHash, bool value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)), value);
    }

    function getOrderIsBid(bytes32 orderHash) public view returns (bool) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)));
    }
    
    function setOrderIsBid(bytes32 orderHash, bool value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)), value);
    }

    function getOrderIsOpen(bytes32 orderHash) public view returns (bool) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)));
    }
    
    function setOrderIsOpen(bytes32 orderHash, bool value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)), value);
    }

    function getOrderOwner(bytes32 orderHash) public view returns (address) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)));
    }
    
    function setOrderOwner(bytes32 orderHash, address value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)), value);
    }

    function getOrderToken(bytes32 orderHash) public view returns (address) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)));
    }
    
    function setOrderToken(bytes32 orderHash, address value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)), value);
    }

    function getOrderBase(bytes32 orderHash) public view returns (address) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)));
    }
    
    function setOrderBase(bytes32 orderHash, address value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)), value);
    }

    function getOrderPrice(bytes32 orderHash) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)));
    }
    
    function setOrderPrice(bytes32 orderHash, uint256 value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)), value);
    }

    function getOrderQuantity(bytes32 orderHash) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)));
    }
    
    function setOrderQuantity(bytes32 orderHash, uint256 value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)), value);
    }

    function getOrderVolume(bytes32 orderHash) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)));
    }
    
    function setOrderVolume(bytes32 orderHash, uint256 value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)), value);
    }

    function getOrderFilledVolume(bytes32 orderHash) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)));
    }
    
    function setOrderFilledVolume(bytes32 orderHash, uint256 value) private {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)), value);
    }

    function getOrderAvailableVolume(bytes32 orderHash) public view returns (uint256) {
        return getOrderVolume(orderHash).sub(getOrderFilledVolume(orderHash));
    }

    /**
     * Everything related to fees
     */

    function updateFees(uint256 makeFee_, uint256 takeFee_, uint256 cancelFee_) public onlyAdmin {
        setCancelFee(cancelFee_);
        setMakeFee(makeFee_);
        setTakeFee(takeFee_);
    }

    function addToFeeAccount(address token, uint256 amount) private {
        DEXChain chain = DEXChain(exchangeContract);
        chain.addToBalance(token, getFeeAccount(), amount);
    }

    // Fee account getter
    function getFeeAccount() public view returns (address) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_ACCOUNT_KEY)));
    }

    // Fee account setter
    function setFeeAccount(address feeAccount) public onlyAdmin {
        DataStore ds = DataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_ACCOUNT_KEY)), feeAccount);
    }

    // Cancel fee getter
    function getCancelFee() public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_CANCEL_KEY)));
    }

    // Cancel fee setter
    function setCancelFee(uint256 fee) public onlyAdmin {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_CANCEL_KEY)), fee);
    }

    // Make fee getter
    function getMakeFee() public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_MAKE_KEY)));
    }

    // Make fee setter
    function setMakeFee(uint256 fee) public onlyAdmin {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_MAKE_KEY)), fee);
    }

    // Take fee getter
    function getTakeFee() public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_TAKE_KEY)));
    }

    // Take fee setter
    function setTakeFee(uint256 fee) public onlyAdmin {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_TAKE_KEY)), fee);
    }

    // Calculate fee for trade
    function calculateFee(uint256 cost, uint256 feeAmount) private pure returns (uint256) {
        uint256 fee = (cost.mul(feeAmount)).div(1 ether);
        return fee;
    }

    function calculateTakeFee(uint256 cost) private view returns (uint256) {
        return calculateFee(cost, getTakeFee());
    }

    function calculateMakeFee(uint256 cost) private view returns (uint256) {
        return calculateFee(cost, getMakeFee());
    }

    function calculateCancelFee(uint256 cost) private view returns (uint256) {
        return calculateFee(cost, getCancelFee());
    }

}