pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./core/DEXContract.sol";
import "./interfaces/IDEXChain.sol";
import "./interfaces/IDataStore.sol";
import "./lib/FeeHelpers.sol";
import "./lib/OrderbookHelpers.sol";

contract Orderbook is DEXContract {
    using SafeMath for uint256;

    // events for Orderbook
    event PlaceOrder(bytes32 orderHash, address token, address base, uint256 price, uint256 quantity, bool is_bid, address owner);
    event Trade(bytes32 buyOrderHash, bytes32 sellOrderHash, uint256 volume);
    event CancelOrder(bytes32 orderHash);

    address public dataStoreContract;
    address public exchangeContract;

    constructor (address dataStore_, address exchange_) public {
        dataStoreContract = dataStore_;
        exchangeContract = exchange_;
    }

    function setDataStore(address dataStore_) public onlyAdmin {
        dataStoreContract = dataStore_;
    }

    function setExchange(address exchange_) public onlyAdmin {
        exchangeContract = exchange_;
    }

    // To place an order and move funds to escrow
    function placeOrder(
        address token, 
        address base, 
        uint256 price, 
        uint256 quantity, 
        bool is_bid, 
        uint256 nonce
    ) public {
        OrderbookHelpers.placeOrder(dataStoreContract, exchangeContract, token, base, price, quantity, is_bid, nonce);
        // emit PlaceOrder(orderHash, token, base, price, quantity, is_bid, owner);
    }

    // To cancel an order and recover funds from escrow
    function cancelOrder(bytes32 orderHash) public {
        OrderbookHelpers.cancelOrder(dataStoreContract, exchangeContract, orderHash);
        emit CancelOrder(orderHash);
    }

    function matchOrders(bytes32 buyOrderHash, bytes32 sellOrderHash) public onlyAllowedUsers {
        OrderbookHelpers.matchOrders(dataStoreContract, exchangeContract, buyOrderHash, sellOrderHash);
    }

    // function updateFees(uint256 makeFee_, uint256 takeFee_, uint256 cancelFee_) public onlyAdmin {
    //     FeeHelpers.setMakeFee(dataStoreContract, makeFee_);
    //     FeeHelpers.setTakeFee(dataStoreContract, takeFee_);
    //     FeeHelpers.setCancelFee(dataStoreContract, cancelFee_);
    // }

    // function getFeeAccount() public view returns (address) {
    //     return FeeHelpers.getFeeAccount(dataStoreContract);
    // }
}
