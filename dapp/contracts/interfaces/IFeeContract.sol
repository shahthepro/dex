pragma solidity ^0.4.24;

interface IFeeContract {

    function setDataStore(address dataStore_) external;

    function updateFees(address feeAccount, uint256 makeFee_, uint256 takeFee_, uint256 cancelFee_) external;

    // Fee account getter
    function getFeeAccount() external view returns (address);

    // Fee account setter
    function setFeeAccount(address value) external;

    // Cancel fee getter
    function getCancelFee() external view returns (uint256);

    // Cancel fee setter
    function setCancelFee(uint256 fee) external;

    // Make fee getter
    function getMakeFee() external view returns (uint256);

    // Make fee setter
    function setMakeFee(uint256 fee) external;

    // Take fee getter
    function getTakeFee() external view returns (uint256);

    // Take fee setter
    function setTakeFee(uint256 fee) external;

    // Calculate fee for trade
    function calculateFee(uint256 cost, uint256 feeAmount) external pure returns (uint256);

    function calculateTakeFee(uint256 cost) external view returns (uint256);

    function calculateMakeFee(uint256 cost) external view returns (uint256);

    function calculateCancelFee(uint256 cost) external view returns (uint256);
}
