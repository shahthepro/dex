pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./core/DEXContract.sol";
import "./interfaces/IDataStore.sol";

contract FeeContract is DEXContract {
    using SafeMath for uint256;
    
    address public dataStoreContract;

    constructor (address dataStore_) public {
        dataStoreContract = dataStore_;
    }

    function setDataStore(address dataStore_) public onlyAdmin {
        dataStoreContract = dataStore_;
    }

    uint8 constant FEES_PREFIX = 0xB0;
    uint8 constant FEES_ACCOUNT_KEY = 0xB1;
    uint8 constant FEES_CANCEL_KEY = 0xB2;
    uint8 constant FEES_MAKE_KEY = 0xB3;
    uint8 constant FEES_TAKE_KEY = 0xB4;

    function updateFees(address feeAccount, uint256 makeFee_, uint256 takeFee_, uint256 cancelFee_) public onlyAdmin {
        setFeeAccount(feeAccount);
        setCancelFee(cancelFee_);
        setMakeFee(makeFee_);
        setTakeFee(takeFee_);
    }

    // Fee account getter
    function getFeeAccount() public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_ACCOUNT_KEY)));
    }

    // Fee account setter
    function setFeeAccount(address value) public onlyAdmin {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_ACCOUNT_KEY)), value);
    }

    // Cancel fee getter
    function getCancelFee() public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_CANCEL_KEY)));
    }

    // Cancel fee setter
    function setCancelFee(uint256 fee) public onlyAdmin {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_CANCEL_KEY)), fee);
    }

    // Make fee getter
    function getMakeFee() public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_MAKE_KEY)));
    }

    // Make fee setter
    function setMakeFee(uint256 fee) public onlyAdmin {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_MAKE_KEY)), fee);
    }

    // Take fee getter
    function getTakeFee() public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_TAKE_KEY)));
    }

    // Take fee setter
    function setTakeFee(uint256 fee) public onlyAdmin {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_TAKE_KEY)), fee);
    }

    // Calculate fee for trade
    function calculateFee(uint256 cost, uint256 feeAmount) public pure returns (uint256) {
        uint256 fee = (cost.mul(feeAmount)).div(1 ether);
        return fee;
    }

    function calculateTakeFee(uint256 cost) public view returns (uint256) {
        return calculateFee(cost, getTakeFee());
    }

    function calculateMakeFee(uint256 cost) public view returns (uint256) {
        return calculateFee(cost, getMakeFee());
    }

    function calculateCancelFee(uint256 cost) public view returns (uint256) {
        return calculateFee(cost, getCancelFee());
    }
}
