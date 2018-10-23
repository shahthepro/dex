pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./../interfaces/IDataStore.sol";
import "./../interfaces/IDEXChain.sol";

library OrderHelpers {
    using SafeMath for uint256;
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

    function getOrderExists(address dataStoreContract, bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)));
    }

    function setOrderExists(address dataStoreContract, bytes32 orderHash, bool value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)), value);
    }

    function getOrderIsBid(address dataStoreContract, bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)));
    }

    function setOrderIsBid(address dataStoreContract, bytes32 orderHash, bool value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)), value);
    }

    function getOrderIsOpen(address dataStoreContract, bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)));
    }
    
    function setOrderIsOpen(address dataStoreContract, bytes32 orderHash, bool value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)), value);
    }

    function getOrderOwner(address dataStoreContract, bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)));
    }
    
    function setOrderOwner(address dataStoreContract, bytes32 orderHash, address value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)), value);
    }

    function getOrderToken(address dataStoreContract, bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)));
    }
    
    function setOrderToken(address dataStoreContract, bytes32 orderHash, address value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)), value);
    }

    function getOrderBase(address dataStoreContract, bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)));
    }
    
    function setOrderBase(address dataStoreContract, bytes32 orderHash, address value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)), value);
    }

    function getOrderPrice(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)));
    }
    
    function setOrderPrice(address dataStoreContract, bytes32 orderHash, uint256 value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)), value);
    }

    function getOrderQuantity(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)));
    }
    
    function setOrderQuantity(address dataStoreContract, bytes32 orderHash, uint256 value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)), value);
    }

    function getOrderVolume(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)));
    }
    
    function setOrderVolume(address dataStoreContract, bytes32 orderHash, uint256 value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)), value);
    }

    function getOrderFilledVolume(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)));
    }
    
    function setOrderFilledVolume(address dataStoreContract, bytes32 orderHash, uint256 value) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)), value);
    }

    function getOrderAvailableVolume(address dataStoreContract, bytes32 orderHash) public view returns (uint256) {
        return getOrderVolume(dataStoreContract, orderHash).sub(getOrderFilledVolume(dataStoreContract, orderHash));
    }
}
