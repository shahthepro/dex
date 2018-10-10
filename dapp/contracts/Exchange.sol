pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
// import "./core/DataStore.sol";
import "./core/UserWallet.sol";
import "./lib/MessageSigning.sol";
import "./lib/Helpers.sol";
import "./lib/Message.sol";

contract Exchange is Ownable {
    using SafeMath for uint256;
    
    // Dummy event
    event BalanceUpdate(address token, address user, uint256 balance, uint256 escrow);

    // Event created on money transfer
    event Transfer(address from, address to, address token, uint256 tokens);

    function balanceOf(address token, address user) public view returns (uint256) {
        return UserWallet.balanceOf(dataStoreContract, token, user);
    }

    function addToFeeAccount(address token, uint256 amount) private {
        UserWallet.addToBalance(dataStoreContract, token, feeAccount, amount);
    }

    function escrowBalanceOf(address token, address user) public view returns (uint256) {
        return UserWallet.escrowBalanceOf(dataStoreContract, token, user);
    }

    struct SignaturesCollection {
        // Signed message.
        bytes message;
        // Authorities who signed the message.
        address[] signed;
        // Signatures
        bytes[] signatures;
    }

    uint256 public requiredSignatures;

    address public admin;

    address public feeAccount; // the account that will receive fees

    uint256 public makeFee; // percentage times (1 ether)
    uint256 public takeFee; // percentage times (1 ether)
    uint256 public cancelFee; // percentage times (1 ether)

    mapping (address => uint256) public userFeeDiscounts;
    mapping (address => uint256) public tokenFeeDiscounts;

    address[] public authorities;

    address public dataStoreContract;

    // Pending deposits and authorities who confirmed them
    mapping (bytes32 => address[]) deposits;
    mapping (bytes32 => bool) deposited;

    // Pending signatures and authorities who confirmed them
    mapping (bytes32 => SignaturesCollection) signatures;

    // triggered when an authority confirms a deposit
    event DepositConfirmation(address recipient, address token, uint256 value, bytes32 transactionHash);

    // triggered when enough authorities have confirmed a deposit
    event Deposit(address recipient, address token, uint256 value, bytes32 transactionHash);

    // Event created on money withdraw.
    event Withdraw(address recipient, address token, uint256 value);

    event WithdrawSignatureSubmitted(bytes32 messageHash);

    // Collected signatures which should be relayed to home chain.
    event CollectedSignatures(address relayAuthority, bytes32 messageHash);

    constructor (
        uint256 _requiredSignatures,
        address[] _authorities,
        address dataStore_,
        uint256 makeFee_,
        uint256 takeFee_,
        uint256 cancelFee_
    ) public
    {
        require(_requiredSignatures != 0, "ERR_ZERO_REQSIGN");
        require(_requiredSignatures <= _authorities.length, "ERR_INVALID_REQSIGN");
        requiredSignatures = _requiredSignatures;
        authorities = _authorities;
        feeAccount = msg.sender;
        admin = msg.sender;
        makeFee = makeFee_;
        takeFee = takeFee_;
        cancelFee = cancelFee_;

        dataStoreContract = dataStore_;

        userFeeDiscounts[msg.sender] = 1 ether;
    }

    modifier onlyAuthority() {
        require(Helpers.addressArrayContains(authorities, msg.sender), "ERR_PERMISSION");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "ERR_PERMISSION");
        _;
    }

    function changeAdmin(address admin_) public onlyAdmin {
        admin = admin_;
    }

    function setDataStore(address dataStore_) public onlyAdmin {
        dataStoreContract = dataStore_;
    }

    function changeAuthorities(
        uint256 requiredSignaturesParam,
        address[] authoritiesParam
    ) public onlyAdmin {
        require(requiredSignaturesParam != 0, "ERR_ZERO_REQSIGN");
        require(requiredSignaturesParam <= authoritiesParam.length, "ERR_INVALID_REQSIGN");
        requiredSignatures = requiredSignaturesParam;
        authorities = authoritiesParam;
    }

    function changeFeeAccount(address feeAccount_) public onlyAdmin {
        feeAccount = feeAccount_;
    }

    function changeMakeFee(uint256 makeFee_) public onlyAdmin {
        makeFee = makeFee_;
    }

    function changeTakeFee(uint256 takeFee_) public onlyAdmin {
        takeFee = takeFee_;
    }

    function setTokenFeeDiscounts(address token, uint256 discount) public onlyAdmin {
        tokenFeeDiscounts[token] = discount;
    }

    function setUserFeeDiscounts(address user, uint256 discount) public onlyAdmin {
        userFeeDiscounts[user] = discount;
    }

    function deposit(address recipient, address token, uint256 value, bytes32 transactionHash) public onlyAuthority {
        // Protection from misbehaving authority
        bytes32 hash = keccak256(abi.encodePacked(recipient, token, value, transactionHash));

        // don't allow authority to confirm deposit twice
        require(!Helpers.addressArrayContains(deposits[hash], msg.sender), "ERR_RELAY_REENTRY");
        require(deposited[hash] != true, "ERR_RELAY_REENTRY");

        deposits[hash].push(msg.sender);

        if (deposits[hash].length != requiredSignatures) {
            emit DepositConfirmation(recipient, token, value, transactionHash);
            return;
        }

        // balances[token][recipient] += value;
        deposited[hash] = true;
        UserWallet.addToBalance(dataStoreContract, token, recipient, value);
        emit Deposit(recipient, token, value, transactionHash);
        UserWallet.notifyBalanceUpdate(dataStoreContract, token, recipient);
    }

    function transferHomeViaRelay(address token, uint256 value) public {
        require(value > 0, "ERR_ZERO_VALUE");

        UserWallet.subFromBalance(dataStoreContract, token, msg.sender, value);

        emit Withdraw(msg.sender, token, value);

        UserWallet.notifyBalanceUpdate(dataStoreContract, token, msg.sender);
    }

    function submitSignature(bytes signature, bytes message) public onlyAuthority {
        // ensure that `signature` is really `message` signed by `msg.sender`
        require(msg.sender == MessageSigning.recoverAddressFromSignedMessage(signature, message), "ERR_INVALID_SIGN");

        require(message.length == 136, "ERR_INVALID_MESSAGE");
        bytes32 messageHash = MessageSigning.hashMessage(message);

        // each authority can only provide one signature per message
        require(!Helpers.addressArrayContains(signatures[messageHash].signed, msg.sender), "ERR_RELAY_REENTRY");
        signatures[messageHash].message = message;
        signatures[messageHash].signed.push(msg.sender);
        signatures[messageHash].signatures.push(signature);

        // TODO: this may cause troubles if requiredSignatures len is changed
        if (signatures[messageHash].signed.length == requiredSignatures) {
            emit CollectedSignatures(msg.sender, messageHash);
        } else {
            emit WithdrawSignatureSubmitted(messageHash);
        }
    }

    // Get signature
    function signature(bytes32 messageHash, uint256 index) public view returns (bytes) {
        return signatures[messageHash].signatures[index];
    }

    // Get message
    function message(bytes32 messageHash) public view returns (bytes) {
        return signatures[messageHash].message;
    }

    // Calculate fee for trade
    function calculateFee(uint256 cost, uint256 feeAmount) public pure returns (uint256) {
        uint256 fee = (cost.mul(feeAmount)).div(1 ether);
        return fee;
    }

    function computeFeeForTokenAndUser(address token, address user, uint256 cost, uint256 feeAmount) public view returns (uint256) {
        uint256 discount = tokenFeeDiscounts[token].add(userFeeDiscounts[user]);
        uint256 discountedFeeAmount = feeAmount.sub(feeAmount.mul(discount));
        return calculateFee(cost, discountedFeeAmount);
    }

    // Order data structure
    struct Order {
        address owner;
        address token;
        address base;
        uint256 price;
        uint256 quantity;
        uint256 volume;
        uint256 filled;
        bool is_bid;
        bool exists;
        bool open;
    }
    mapping (bytes32 => Order) orders;
    // bytes32[] orderHashes;

    // events for Orderbook
    event PlaceOrder(bytes32 orderHash, address token, address base, uint256 price, uint256 quantity, bool is_bid, address buyer);
    event CancelOrder(bytes32 orderHash);
    
    // To place an order and move funds to ecrow
    function placeOrder(address token, address base, uint256 price, uint256 quantity, bool is_bid, uint256 nonce) public {
        require(base < token, "ERR_INVALID_PAIR");
        require(quantity != 0, "ERR_ZERO_AMOUNT");
        require(price != 0, "ERR_ZERO_PRICE");

        bytes32 h = keccak256(abi.encodePacked(msg.sender, token, base, price, quantity, is_bid, nonce));
        Order memory order = orders[h];

        // Order hash should be unique
        require(order.exists == false, "ERR_NONCE_NOT_UNIQUE");
        order.exists = true;

        uint256 volume = price.mul(quantity);

        // Store order details
        order.owner = msg.sender;
        order.token = token;
        order.base = base;
        order.price = price;
        order.quantity = quantity;
        order.volume = volume;
        order.is_bid = is_bid;
        order.open = true;

        orders[h] = order;
        // orderHashes.push(h);

        // Add balance to wscrow
        if (is_bid) {
            // Buy order
            UserWallet.moveToEscrow(dataStoreContract, base, msg.sender, volume);
            UserWallet.notifyBalanceUpdate(dataStoreContract, base, msg.sender);
        } else {
            // Sell order
            UserWallet.moveToEscrow(dataStoreContract, token, msg.sender, volume);
            UserWallet.notifyBalanceUpdate(dataStoreContract, token, msg.sender);
        }

        // Emit event
        emit PlaceOrder(h, token, base, price, quantity, is_bid, msg.sender);
    }

    // To cancel an order and recover funds from escrow
    function cancelOrder(bytes32 orderHash) public {
        Order memory order = orders[orderHash];
        require(order.exists, "ERR_NOT_FOUND");
        require(order.owner == msg.sender, "ERR_NOT_OWNER");
        require(order.open, "ERR_CLOSED_ORDER");

        // Refund any remaining volume minus cancellation fee
        uint256 volumeLeft = order.volume - order.filled;
        require(volumeLeft > 0, "ERR_FILLED_ORDER");
        uint256 fee = calculateFee(volumeLeft, cancelFee);
        uint256 volumeNoFee = volumeLeft.sub(fee);

        if (order.is_bid) {
            // Buy Order
            UserWallet.recoverFromEscrow(dataStoreContract, order.base, msg.sender, volumeNoFee);
            addToFeeAccount(order.base, fee);
            UserWallet.notifyBalanceUpdate(dataStoreContract, order.base, msg.sender);
            UserWallet.notifyBalanceUpdate(dataStoreContract, order.base, feeAccount);
        } else {
            // Sell Order
            UserWallet.recoverFromEscrow(dataStoreContract, order.token, msg.sender, volumeNoFee);
            addToFeeAccount(order.token, fee);
            UserWallet.notifyBalanceUpdate(dataStoreContract, order.token, msg.sender);
            UserWallet.notifyBalanceUpdate(dataStoreContract, order.token, feeAccount);
        }

        // Mark as cancelled/closed
        order.open = false;
        orders[orderHash] = order;

        emit CancelOrder(orderHash);
    }
}
