pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./core/DEXContract.sol";
import "./interfaces/IDEXChain.sol";
import "./interfaces/IOrdersDB.sol";
import "./interfaces/IFeeContract.sol";

contract OrderMatchContract is DEXContract {
    using SafeMath for uint256;

    event Trade(bytes32 buyOrderHash, bytes32 sellOrderHash, uint256 volume);

    address public ordersDBContract;
    address public exchangeContract;
    address public feeContractAddress;

    constructor (address ordersDB_, address exchange_, address fee_) public {
        ordersDBContract = ordersDB_;
        exchangeContract = exchange_;
        feeContractAddress = fee_;
    }

    function ensureOrdersMatch(bytes32 buyOrderHash, bytes32 sellOrderHash) private view {
        IOrdersDB ordersDB = IOrdersDB(ordersDBContract);

        require(ordersDB.getOrderExists(buyOrderHash), "ERR_ORDER_MISSING");
        require(ordersDB.getOrderExists(sellOrderHash), "ERR_ORDER_MISSING");

        require(ordersDB.getOrderIsOpen(buyOrderHash), "ERR_ORDER_CLOSED");
        require(ordersDB.getOrderIsOpen(sellOrderHash), "ERR_ORDER_CLOSED");

        require(ordersDB.getOrderIsBid(buyOrderHash), "ERR_INVALID_ORDER");
        require(!ordersDB.getOrderIsBid(sellOrderHash), "ERR_INVALID_ORDER");

        require(ordersDB.getOrderBase(buyOrderHash) == ordersDB.getOrderBase(sellOrderHash), "ERR_ORDER_MISMATCH");
        require(ordersDB.getOrderToken(buyOrderHash) == ordersDB.getOrderToken(sellOrderHash), "ERR_ORDER_MISMATCH");
        require(ordersDB.getOrderPrice(buyOrderHash) == ordersDB.getOrderPrice(sellOrderHash), "ERR_ORDER_MISMATCH");
    }

    // Matches buy and sell orders
    function matchOrders(bytes32 buyOrderHash, bytes32 sellOrderHash) public onlyAllowedUsersOrAdmin {
        ensureOrdersMatch(buyOrderHash, sellOrderHash);
        
        IOrdersDB ordersDB = IOrdersDB(ordersDBContract);
        IFeeContract feeContract = IFeeContract(feeContractAddress);

        uint256 volumeToTrade = getTradeableOrderVolume(
            ordersDB.getOrderAvailableVolume(buyOrderHash), 
            ordersDB.getOrderAvailableVolume(sellOrderHash));
        
        address token = ordersDB.getOrderToken(buyOrderHash);
        address base = ordersDB.getOrderBase(buyOrderHash);
        address taker = ordersDB.getOrderOwner(buyOrderHash);
        address maker = ordersDB.getOrderOwner(sellOrderHash);

        uint256 takeFee = feeContract.calculateTakeFee(volumeToTrade);
        uint256 makeFee = feeContract.calculateMakeFee(volumeToTrade);

        address feeAccount = feeContract.getFeeAccount();

        tradeFunds(token, base, taker, maker, takeFee, makeFee, volumeToTrade, feeAccount);
    }

    function tradeFunds(
        address token, address base, 
        address taker, address maker,
        uint256 takeFee, uint256 makeFee,
        uint256 volumeToTrade, address feeAccount
	) private {

        uint256 noFeeMakeVolume = volumeToTrade.sub(makeFee);
        uint256 noFeeTakeVolume = volumeToTrade.sub(takeFee);

        IDEXChain chain = IDEXChain(exchangeContract);
        chain.releaseEscrow(base, taker, maker, noFeeMakeVolume);
        chain.releaseEscrow(base, taker, feeAccount, volumeToTrade.sub(noFeeMakeVolume));
        chain.releaseEscrow(token, maker, taker, noFeeTakeVolume);
        chain.releaseEscrow(token, maker, feeAccount, volumeToTrade.sub(noFeeTakeVolume));

        chain.notifyBalanceUpdate(base, taker);
        chain.notifyBalanceUpdate(base, maker);
        chain.notifyBalanceUpdate(base, feeAccount);
        chain.notifyBalanceUpdate(token, taker);
        chain.notifyBalanceUpdate(token, maker);
        chain.notifyBalanceUpdate(token, feeAccount);
    }

    function getTradeableOrderVolume(uint256 takeVolume, uint256 makeVolume) private pure returns (uint256) {
        require(takeVolume > 0 && makeVolume > 0, "ERR_INVALID_ORDER");
        
        if (takeVolume <= makeVolume) {
            return takeVolume;
        }

        return makeVolume;
    }

}