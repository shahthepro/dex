pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./DataStore.sol";

library UserWallet {
    using SafeMath for uint256;

    // Event for balance updates
    event BalanceUpdate(address token, address user, uint256 balance, uint256 escrow);

    string constant WALLET_PREFIX = "wallets/";
    string constant BALANCE_KEY = "/balance";
    string constant ESCROW_KEY = "/escrow_balance";

    function balanceOf(address dataStoreContract, address token, address user) internal view returns (uint256) {
        bytes32 h = keccak256(abi.encodePacked(WALLET_PREFIX, token, user, BALANCE_KEY));
        DataStore ds = DataStore(dataStoreContract);

        return ds.getUIntValue(h);
    }

    function escrowBalanceOf(address dataStoreContract, address token, address user) internal view returns (uint256) {
        bytes32 h = keccak256(abi.encodePacked(WALLET_PREFIX, token, user, ESCROW_KEY));
        DataStore ds = DataStore(dataStoreContract);

        return ds.getUIntValue(h);
    }

    function addToBalance(address dataStoreContract, address token, address user, uint256 amount) internal {
        updateBalance(dataStoreContract, token, user, balanceOf(dataStoreContract, token, user).add(amount));
    }

    function updateBalance(address dataStoreContract, address token, address user, uint256 value) private {
        bytes32 h = keccak256(abi.encodePacked(WALLET_PREFIX, token, user, BALANCE_KEY));
        DataStore ds = DataStore(dataStoreContract);

        ds.setUIntValue(h, value);
    }

    function subFromBalance(address dataStoreContract, address token, address user, uint256 amount) internal {
        uint balance = balanceOf(dataStoreContract, token, user);

        require(balance >= amount, "ERR_INSUFFICIENT_BALANCE");

        updateBalance(dataStoreContract, token, user, balance.sub(amount));
    }

    function addToEscrowBalance(address dataStoreContract, address token, address user, uint256 amount) internal {
        updateEscrowBalance(dataStoreContract, token, user, escrowBalanceOf(dataStoreContract, token, user).add(amount));
    }

    function updateEscrowBalance(address dataStoreContract, address token, address user, uint256 value) private {
        bytes32 h = keccak256(abi.encodePacked(WALLET_PREFIX, token, user, ESCROW_KEY));
        DataStore ds = DataStore(dataStoreContract);

        ds.setUIntValue(h, value);
    }

    function subFromEscrowBalance(address dataStoreContract, address token, address user, uint256 amount) internal {
        uint balance = escrowBalanceOf(dataStoreContract, token, user);

        require(balance >= amount, "ERR_INSUFFICIENT_BALANCE");

        updateEscrowBalance(dataStoreContract, token, user, balance.sub(amount));
    }


    function moveToEscrow(address dataStoreContract, address token, address user, uint256 amount) internal {
        uint balance = balanceOf(dataStoreContract, token, user);

        require(balance >= amount, "ERR_INSUFFICIENT_BALANCE");

        subFromBalance(dataStoreContract, token, user, amount);
        addToEscrowBalance(dataStoreContract, token, user, amount);
    }

    function recoverFromEscrow(address dataStoreContract, address token, address user, uint256 amount) internal {
        releaseEscrow(dataStoreContract, token, user, user, amount);
    }

    function releaseEscrow(address dataStoreContract, address token, address fromAddress, address toAddress, uint256 amount) internal {
        uint escrowBalance = escrowBalanceOf(dataStoreContract, token, fromAddress);

        require(escrowBalance >= amount, "ERR_INSUFFICIENT_BALANCE");

        addToBalance(dataStoreContract, token, toAddress, amount);
        subFromEscrowBalance(dataStoreContract, token, fromAddress, amount);
    }

    function notifyBalanceUpdate(address dataStoreContract, address token, address user) internal {
        emit BalanceUpdate(token, user, balanceOf(dataStoreContract, token, user), escrowBalanceOf(dataStoreContract, token, user));
    }
}