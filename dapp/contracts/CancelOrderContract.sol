pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/IDEXChain.sol";
import "./interfaces/IOrdersDB.sol";
import "./interfaces/IFeeContract.sol";

contract CancelOrderContract {
    using SafeMath for uint256;

    event CancelOrder(bytes32 orderHash);

    address public ordersDBContract;
    address public exchangeContract;
    address public dataStoreContract;
    address public feeContractAddress;

    constructor (address ordersDB_, address dataStore_, address exchange_, address fee_) public {
        ordersDBContract = ordersDB_;
        exchangeContract = exchange_;
        dataStoreContract = dataStore_;
        feeContractAddress = fee_;
    }

    // To cancel an order and recover funds from escrow
    function cancelOrder(bytes32 orderHash) public {
        checkIfOrderIsCancellable(orderHash);

        // Refund any remaining volume minus cancellation fee
        IOrdersDB ordersDB = IOrdersDB(ordersDBContract);

        uint256 volumeLeft = ordersDB.getOrderAvailableVolume(orderHash);
        require(volumeLeft > 0, "ERR_FILLED_ORDER");


        if (ordersDB.getOrderIsBid(orderHash)) {
            transferFundsAfterCancel(ordersDB.getOrderBase(orderHash), volumeLeft);
        } else {
            transferFundsAfterCancel(ordersDB.getOrderToken(orderHash), volumeLeft);
        }

        // Mark as cancelled/closed
        ordersDB.setOrderIsOpen(orderHash, false);
        emit CancelOrder(orderHash);
    }

    function checkIfOrderIsCancellable(bytes32 orderHash) private view {
        IOrdersDB ordersDB = IOrdersDB(ordersDBContract);

        require(ordersDB.getOrderExists(orderHash), "ERR_NOT_FOUND");

        require(ordersDB.getOrderOwner(orderHash) == msg.sender, "ERR_NOT_OWNER");

        require(ordersDB.getOrderIsOpen(orderHash), "ERR_CLOSED_ORDER");
    }

    function transferFundsAfterCancel(address token, uint256 amount) private {
        IFeeContract feeContract = IFeeContract(feeContractAddress);
        IDEXChain chain = IDEXChain(exchangeContract);

        uint256 fee = feeContract.calculateCancelFee(amount);
        address feeAccount = feeContract.getFeeAccount();

        uint256 volumeNoFee = (amount.mul(1 ether - fee)) / 1 ether;
        
        chain.recoverFromEscrow(token, msg.sender, volumeNoFee);
        chain.releaseEscrow(token, msg.sender, feeAccount, amount.sub(volumeNoFee));
        chain.notifyBalanceUpdate(token, msg.sender);
        chain.notifyBalanceUpdate(token, feeAccount);
    }

}