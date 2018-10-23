pragma solidity ^0.4.3;

interface IDEXChain {
    function setAuthorities(uint256 _requiredSignatures, address[] _authorities) public;

    function setDataStore(address dataStore_) public;

    function balanceOf(address token, address owner) public view returns (uint256);

    function escrowBalanceOf(address token, address owner) public view returns (uint256);

    function notifyBalanceUpdate(address token, address owner) public;

    function addToBalance(address token, address owner, uint256 value) public;

    function addToEscrowBalance(address token, address owner, uint256 value) public;

    function subFromBalance(address token, address owner, uint256 value) public;

    function subFromEscrowBalance(address token, address owner, uint256 value) public;

    function moveToEscrow(address token, address owner, uint256 amount) public;

    function recoverFromEscrow(address token, address owner, uint256 amount) public;

    function releaseEscrow(address token, address fromAddress, address toAddress, uint256 amount) public;

    function deposit(address recipient, address token, uint256 value, bytes32 transactionHash) public;

    function transferHomeViaRelay(address token, uint256 value) public;

    function submitSignature(bytes signature, bytes message) public;

    function signature(bytes32 messageHash, uint256 index) public view returns (bytes);

    function message(bytes32 messageHash) public view returns (bytes);
}
