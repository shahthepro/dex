pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./core/DEXContract.sol";
import "./interfaces/IDataStore.sol";

contract OrdersDB is DEXContract {
    using SafeMath for uint256;

    address public dataStoreContract;

    constructor (address dataStore_) public {
        dataStoreContract = dataStore_;
    }

    function setDataStore(address dataStore_) public onlyAdmin {
        dataStoreContract = dataStore_;
    }

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
    uint8 constant ORDER_TIMESTAMP_KEY = 0xAB;

    function getOrderExists(bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)));
    }

    function setOrderExists(bytes32 orderHash, bool value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_EXISTS_KEY)), value);
    }

    function getOrderTimestamp(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TIMESTAMP_KEY)));
    }

    function setOrderTimestamp(bytes32 orderHash, uint256 value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TIMESTAMP_KEY)), value);
    }

    function getOrderIsBid(bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)));
    }

    function setOrderIsBid(bytes32 orderHash, bool value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_IS_BID_KEY)), value);
    }

    function getOrderIsOpen(bytes32 orderHash) public view returns (bool) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)));
    }
    
    function setOrderIsOpen(bytes32 orderHash, bool value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setBooleanValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OPEN_KEY)), value);
    }

    function getOrderOwner(bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)));
    }
    
    function setOrderOwner(bytes32 orderHash, address value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_OWNER_KEY)), value);
    }

    function getOrderToken(bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)));
    }
    
    function setOrderToken(bytes32 orderHash, address value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_TOKEN_KEY)), value);
    }

    function getOrderBase(bytes32 orderHash) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)));
    }
    
    function setOrderBase(bytes32 orderHash, address value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_BASE_KEY)), value);
    }

    function getOrderPrice(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)));
    }
    
    function setOrderPrice(bytes32 orderHash, uint256 value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_PRICE_KEY)), value);
    }

    function getOrderQuantity(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)));
    }
    
    function setOrderQuantity(bytes32 orderHash, uint256 value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_QUANTITY_KEY)), value);
    }

    function getOrderVolume(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)));
    }
    
    function setOrderVolume(bytes32 orderHash, uint256 value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_KEY)), value);
    }

    function getOrderFilledVolume(bytes32 orderHash) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)));
    }
    
    function addOrderFilledVolume(bytes32 orderHash, uint256 value) public onlyAllowedContracts {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.addUIntValue(keccak256(abi.encodePacked(ORDER_PREFIX, orderHash, ORDER_VOLUME_FILLED_KEY)), value);
    }

    function getOrderAvailableVolume(bytes32 orderHash) public view returns (uint256) {
        return getOrderVolume(orderHash).sub(getOrderFilledVolume(orderHash));
    }
}
