pragma solidity ^0.4.3;

interface IDEXChain {
    function setAuthorities(uint256 _requiredSignatures, address[] _authorities) external;

    function setDataStore(address dataStore_) external;

    function balanceOf(address token, address owner) external view returns (uint256);

    function escrowBalanceOf(address token, address owner) external view returns (uint256);

    function notifyBalanceUpdate(address token, address owner) external;

    function moveToEscrow(address token, address owner, uint256 amount) external;

    function recoverFromEscrow(address token, address owner, uint256 amount) external;

    function releaseEscrow(address token, address fromAddress, address toAddress, uint256 amount) external;

    function deposit(address recipient, address token, uint256 value, bytes32 transactionHash) external;

    function transferHomeViaRelay(address token, uint256 value) external;

    function submitSignature(bytes signature, bytes message) external;

    function signature(bytes32 messageHash, uint256 index) external view returns (bytes);

    function message(bytes32 messageHash) external view returns (bytes);
}
