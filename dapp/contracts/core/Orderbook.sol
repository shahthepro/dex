pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./DataStore.sol";
import "./UserWallet.sol";

library Orderbook {
    using SafeMath for uint256;

    string constant ORDER_PREFIX = "orders/";

    string constant ORDER_OWNER_KEY = "/owner";
    string constant ORDER_TOKEN_KEY = "/token";
    string constant ORDER_BASE_KEY = "/base";
    string constant ORDER_PRICE_KEY = "/price";
    string constant ORDER_QUANTITY_KEY = "/quantity";
    string constant ORDER_VOLUME_KEY = "/volume";
    string constant ORDER_VOLUME_FILLED_KEY = "/volume_filled";
    string constant ORDER_IS_BID_KEY = "/is_bid";
    string constant ORDER_EXISTS_KEY = "/exists";
    string constant ORDER_OPEN_KEY = "/open";

    // events for Orderbook
    event PlaceOrder(bytes32 orderHash, address token, address base, uint256 price, uint256 quantity, bool is_bid, address owner);
    event CancelOrder(bytes32 orderHash);

    // To place an order and move funds to ecrow
    function placeOrder(
        address dataStoreContract, 
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

        bytes32 orderHash = keccak256(abi.encodePacked(owner, token, base, price, quantity, is_bid, nonce));

        // Create order
        require(getOrderExists(dataStoreContract, orderHash) == false, "ERR_NONCE_NOT_UNIQUE");
        setOrderExists(dataStoreContract, orderHash, true);

        // Store order
        uint256 volume = price.mul(quantity);
        setOrderOwner(dataStoreContract, orderHash, owner);
        setOrderToken(dataStoreContract, orderHash, token);
        setOrderBase(dataStoreContract, orderHash, base);
        setOrderPrice(dataStoreContract, orderHash, price);
        setOrderVolume(dataStoreContract, orderHash, volume);
        setOrderQuantity(dataStoreContract, orderHash, quantity);
        setOrderIsBid(dataStoreContract, orderHash, is_bid);
        setOrderIsOpen(dataStoreContract, orderHash, true);

        if (is_bid) {
            // Buy order
            UserWallet.moveToEscrow(dataStoreContract, base, owner, volume);
            UserWallet.notifyBalanceUpdate(dataStoreContract, base, owner);
        } else {
            // Sell order
            UserWallet.moveToEscrow(dataStoreContract, token, owner, volume);
            UserWallet.notifyBalanceUpdate(dataStoreContract, token, owner);
        }

        // Event
        emit PlaceOrder(orderHash, token, base, price, quantity, is_bid, owner);
    }

    // To cancel an order and recover funds from escrow
    function cancelOrder(address dataStoreContract, address owner, bytes32 orderHash) public {
        require(getOrderExists(dataStoreContract, orderHash), "ERR_NOT_FOUND");

        require(getOrderOwner(dataStoreContract, orderHash) == owner, "ERR_NOT_OWNER");

        require(getOrderIsOpen(dataStoreContract, orderHash), "ERR_CLOSED_ORDER");

        // Refund any remaining volume minus cancellation fee
        uint256 volume = getOrderVolume(dataStoreContract, orderHash);
        uint256 volumeFilled = getOrderFilledVolume(dataStoreContract, orderHash);
        uint256 volumeLeft = volume - volumeFilled;
        require(volumeLeft > 0, "ERR_FILLED_ORDER");

        address pairBase = getOrderBase(dataStoreContract, orderHash);
        address pairToken = getOrderToken(dataStoreContract, orderHash);

        address feeAccount = getFeeAccount(dataStoreContract);
        uint256 cancelFee = getCancelFee(dataStoreContract);

        uint256 fee = calculateFee(volumeLeft, cancelFee);
        uint256 volumeNoFee = volumeLeft.sub(fee);

        if (getOrderIsBid(dataStoreContract, orderHash)) {
            // Buy Order
            UserWallet.recoverFromEscrow(dataStoreContract, pairBase, owner, volumeNoFee);
            // // UserWallet.releaseEscrow(dataStoreContract, pairBase, owner, owner, volumeNoFee);
            addToFeeAccount(dataStoreContract, pairBase, fee);
            UserWallet.notifyBalanceUpdate(dataStoreContract, pairBase, owner);
            UserWallet.notifyBalanceUpdate(dataStoreContract, pairBase, feeAccount);
        } else {
            // Sell Order
            UserWallet.recoverFromEscrow(dataStoreContract, pairToken, owner, volumeNoFee);
            addToFeeAccount(dataStoreContract, pairToken, fee);
            UserWallet.notifyBalanceUpdate(dataStoreContract, pairToken, owner);
            UserWallet.notifyBalanceUpdate(dataStoreContract, pairToken, feeAccount);
        }

        // Mark as cancelled/closed
        setOrderIsOpen(dataStoreContract, orderHash, false);

        emit CancelOrder(orderHash);
    }

    // Order getter/setters
    function getOrderExists(address dataStoreContract, bytes32 orderHash) public view returns (bool) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)));
    }
    
    function setOrderExists(address dataStoreContract, bytes32 orderHash, bool value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)), value);
    }

    function getOrderIsBid(address dataStoreContract, bytes32 orderHash) public view returns (bool) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)));
    }
    
    function setOrderIsBid(address dataStoreContract, bytes32 orderHash, bool value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)), value);
    }

    function getOrderIsOpen(address dataStoreContract, bytes32 orderHash) public view returns (bool) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)));
    }
    
    function setOrderIsOpen(address dataStoreContract, bytes32 orderHash, bool value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)), value);
    }

    function getOrderOwner(address dataStoreContract, bytes32 orderHash) public view returns (address) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)));
    }
    
    function setOrderOwner(address dataStoreContract, bytes32 orderHash, address value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)), value);
    }

    function getOrderToken(address dataStoreContract, bytes32 orderHash) public view returns (address) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)));
    }
    
    function setOrderToken(address dataStoreContract, bytes32 orderHash, address value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)), value);
    }

    function getOrderBase(address dataStoreContract, bytes32 orderHash) public view returns (address) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)));
    }
    
    function setOrderBase(address dataStoreContract, bytes32 orderHash, address value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)), value);
    }

    function getOrderPrice(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)));
    }
    
    function setOrderPrice(address dataStoreContract, bytes32 orderHash, uint256 value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)), value);
    }

    function getOrderQuantity(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)));
    }
    
    function setOrderQuantity(address dataStoreContract, bytes32 orderHash, uint256 value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)), value);
    }

    function getOrderVolume(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)));
    }
    
    function setOrderVolume(address dataStoreContract, bytes32 orderHash, uint256 value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)), value);
    }

    function getOrderFilledVolume(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)));
    }
    
    function setOrderFilledVolume(address dataStoreContract, bytes32 orderHash, uint256 value) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)), value);
    }

    // Everything related to fees
    string constant FEES_PREFIX = "fees/";
    string constant FEES_ACCOUNT_KEY = "account";
    string constant FEES_CANCEL_KEY = "cancel_fee";

    function addToFeeAccount(address dataStoreContract, address token, uint256 amount) private {
        UserWallet.addToBalance(dataStoreContract, token, getFeeAccount(dataStoreContract), amount);
    }

    // Fee account getter
    function getFeeAccount(address dataStoreContract) public view returns (address) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_ACCOUNT_KEY)));
    }

    // Fee account setter
    function setFeeAccount(address dataStoreContract, address feeAccount) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_ACCOUNT_KEY)), feeAccount);
    }

    // Cancel fee getter
    function getCancelFee(address dataStoreContract) public view returns (uint256) {
        DataStore ds = DataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_CANCEL_KEY)));
    }

    // Cancel fee setter
    function setCancelFee(address dataStoreContract, uint256 fee) public {
        DataStore ds = DataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_CANCEL_KEY)), fee);
    }

    // Calculate fee for trade
    function calculateFee(uint256 cost, uint256 feeAmount) private pure returns (uint256) {
        uint256 fee = (cost.mul(feeAmount)).div(1 ether);
        return fee;
    }

}