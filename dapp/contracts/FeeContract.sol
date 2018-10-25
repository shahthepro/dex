pragma solidity ^0.4.3;

import "./core/DEXContract.sol";
import "./interfaces/IDataStore.sol";
import "./lib/FeeHelpers.sol";

contract FeeContract is DEXContract {

    address public dataStoreContract;

    constructor (address dataStore_) public {
        dataStoreContract = dataStore_;
    }

    function setDataStore(address dataStore_) public onlyAdmin {
        dataStoreContract = dataStore_;
    }

    function updateFees(address feeAccount, uint256 makeFee_, uint256 takeFee_, uint256 cancelFee_) public onlyAdmin {
        FeeHelpers.updateFees(dataStoreContract, makeFee_, takeFee_, cancelFee_);
        FeeHelpers.setFeeAccount(dataStoreContract, feeAccount);
    }

    // function setFeeAccount(address feeAccount) public {
    //     dataStoreContract = feeAccount;
    //     FeeHelpers.setFeeAccount(dataStoreContract, feeAccount);
    // }

    // function getFeeAccount() public view returns (address) {
    //     // return address(this);
    //     // return FeeHelpers.getFeeAccount(dataStoreContract);
    // }
}
