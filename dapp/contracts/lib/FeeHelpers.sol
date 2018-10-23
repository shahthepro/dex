pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./../interfaces/IDataStore.sol";
import "./../interfaces/IDEXChain.sol";

library FeeHelpers {
    using SafeMath for uint256;

    uint8 constant FEES_PREFIX = 0xB0;
    uint8 constant FEES_ACCOUNT_KEY = 0xB1;
    uint8 constant FEES_CANCEL_KEY = 0xB2;
    uint8 constant FEES_MAKE_KEY = 0xB3;
    uint8 constant FEES_TAKE_KEY = 0xB4;

    function updateFees(address dataStoreContract, uint256 makeFee_, uint256 takeFee_, uint256 cancelFee_) public {
        setCancelFee(dataStoreContract, cancelFee_);
        setMakeFee(dataStoreContract, makeFee_);
        setTakeFee(dataStoreContract, takeFee_);
    }

    // function addToFeeAccount(address dataStoreContract, address exchangeContract, address token, uint256 amount) private {
    //     IDEXChain chain = IDEXChain(exchangeContract);
    //     chain.addToBalance(token, getFeeAccount(dataStoreContract), amount);
    // }

    // Fee account getter
    function getFeeAccount(address dataStoreContract) public view returns (address) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getAddressValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_ACCOUNT_KEY)));
    }

    // Fee account setter
    function setFeeAccount(address dataStoreContract, address feeAccount) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setAddressValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_ACCOUNT_KEY)), feeAccount);
    }

    // Cancel fee getter
    function getCancelFee(address dataStoreContract) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_CANCEL_KEY)));
    }

    // Cancel fee setter
    function setCancelFee(address dataStoreContract, uint256 fee) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_CANCEL_KEY)), fee);
    }

    // Make fee getter
    function getMakeFee(address dataStoreContract) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_MAKE_KEY)));
    }

    // Make fee setter
    function setMakeFee(address dataStoreContract, uint256 fee) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_MAKE_KEY)), fee);
    }

    // Take fee getter
    function getTakeFee(address dataStoreContract) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_TAKE_KEY)));
    }

    // Take fee setter
    function setTakeFee(address dataStoreContract, uint256 fee) public {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.setUIntValue(keccak256(abi.encodePacked(FEES_PREFIX, FEES_TAKE_KEY)), fee);
    }

    // Calculate fee for trade
    function calculateFee(uint256 cost, uint256 feeAmount) public pure returns (uint256) {
        uint256 fee = (cost.mul(feeAmount)).div(1 ether);
        return fee;
    }

    function calculateTakeFee(address dataStoreContract, uint256 cost) public view returns (uint256) {
        return calculateFee(cost, getTakeFee(dataStoreContract));
    }

    function calculateMakeFee(address dataStoreContract, uint256 cost) public view returns (uint256) {
        return calculateFee(cost, getMakeFee(dataStoreContract));
    }

    function calculateCancelFee(address dataStoreContract, uint256 cost) public view returns (uint256) {
        return calculateFee(cost, getCancelFee(dataStoreContract));
    }
}