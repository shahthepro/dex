pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/IDataStore.sol";
// import "./interfaces/IDEXChain.sol";
import "./core/DEXContract.sol";
import "./lib/MessageSigning.sol";
import "./lib/Helpers.sol";
import "./lib/Message.sol";

contract DEXChain is DEXContract {
    using SafeMath for uint256;
    
    event BalanceUpdate(address token, address user, uint256 balance, uint256 escrow);
    event DepositConfirmation(address recipient, address token, uint256 value, bytes32 transactionHash);
    event Deposit(address recipient, address token, uint256 value, bytes32 transactionHash);
    event Withdraw(address recipient, address token, uint256 value);
    event WithdrawSignatureSubmitted(bytes32 messageHash);
    event CollectedSignatures(address relayAuthority, bytes32 messageHash);

    uint16 constant GENERAL_VAULT = 0x1;
    uint16 constant ESCROW_VAULT = 0x2;

    uint256 public requiredSignatures;
    address[] public authorities;
    address public dataStoreContract;

    constructor (address dataStore_) public {
        dataStoreContract = dataStore_;
    }

    function setAuthorities(uint256 _requiredSignatures, address[] _authorities) public onlyAdmin {
        require(_requiredSignatures > 0, "ERR_INVALID_REQSIGN");
        require(_requiredSignatures <= _authorities.length, "ERR_FEWER_AUTHORITIES");
        requiredSignatures = _requiredSignatures;
        authorities = _authorities;
    }

    function setDataStore(address dataStore_) public onlyAdmin {
        dataStoreContract = dataStore_;
    }

    modifier onlyAuthority() {
        require(Helpers.addressArrayContains(authorities, msg.sender), "ERR_PERMISSION");
        _;
    }

    struct SignaturesCollection {
        bytes message;
        address[] signed;
        bytes[] signatures;
    }

    // Pending deposits and authorities who confirmed them
    mapping (bytes32 => address[]) deposits;
    mapping (bytes32 => bool) deposited;

    // Pending signatures and authorities who confirmed them
    mapping (bytes32 => SignaturesCollection) signatures;

    function balanceOf(address token, address owner) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getTokenValue(token, owner, GENERAL_VAULT);
    }

    function escrowBalanceOf(address token, address owner) public view returns (uint256) {
        IDataStore ds = IDataStore(dataStoreContract);
        return ds.getTokenValue(token, owner, ESCROW_VAULT);
    }

    function notifyBalanceUpdate(address token, address owner) public onlyAllowedContracts {
        _notifyBalanceUpdate(token, owner);
    }

    function _notifyBalanceUpdate(address token, address owner) private {
        emit BalanceUpdate(token, owner, balanceOf(token, owner), escrowBalanceOf(token, owner));
    }

    function addToBalance(address token, address owner, uint256 value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.addTokenValue(token, owner, GENERAL_VAULT, value);
    }

    function addToEscrowBalance(address token, address owner, uint256 value) private {
        IDataStore ds = IDataStore(dataStoreContract);
        ds.addTokenValue(token, owner, ESCROW_VAULT, value);
    }

    function subFromBalance(address token, address owner, uint256 value) private {
        require(balanceOf(token, owner) >= value, "ERR_INSUFFICIENT_FUNDS");
        IDataStore ds = IDataStore(dataStoreContract);
        ds.subTokenValue(token, owner, GENERAL_VAULT, value);
    }

    function subFromEscrowBalance(address token, address owner, uint256 value) private {
        require(escrowBalanceOf(token, owner) >= value, "ERR_INSUFFICIENT_FUNDS");
        IDataStore ds = IDataStore(dataStoreContract);
        ds.subTokenValue(token, owner, ESCROW_VAULT, value);
    }

    function moveToEscrow(address token, address owner, uint256 amount) public onlyAllowedContracts {
        subFromBalance(token, owner, amount);
        addToEscrowBalance(token, owner, amount);
    }

    function recoverFromEscrow(address token, address owner, uint256 amount) public onlyAllowedContracts {
        releaseEscrow(token, owner, owner, amount);
    }

    function releaseEscrow(address token, address fromAddress, address toAddress, uint256 amount) public onlyAllowedContracts {
        subFromEscrowBalance(token, fromAddress, amount);
        addToBalance(token, toAddress, amount);
    }

    function deposit(address recipient, address token, uint256 value, bytes32 transactionHash) public onlyAuthority {
        // Protection from misbehaving authority
        bytes32 hash = keccak256(abi.encodePacked(recipient, token, value, transactionHash));

        // don't allow authority to confirm deposit twice
        require(!Helpers.addressArrayContains(deposits[hash], msg.sender), "ERR_RELAY_REENTRY");

        deposits[hash].push(msg.sender);

        if (deposits[hash].length != requiredSignatures || deposited[hash] == true) {
            // Deposit made already or not enough signatures
            emit DepositConfirmation(recipient, token, value, transactionHash);
            return;
        }

        // require(deposited[hash] != true, "ERR_RELAY_REENTRY");
        deposited[hash] = true;

        addToBalance(token, recipient, value);
        emit Deposit(recipient, token, value, transactionHash);
        _notifyBalanceUpdate(token, recipient);
    }

    function transferHomeViaRelay(address token, uint256 value) public {
        require(value > 0, "ERR_ZERO_VALUE");

        subFromBalance(token, msg.sender, value);

        emit Withdraw(msg.sender, token, value);

        _notifyBalanceUpdate(token, msg.sender);
    }

    function submitSignature(bytes signature, bytes message) public onlyAuthority {
        // ensure that `signature` is really `message` signed by `msg.sender`
        require(msg.sender == MessageSigning.recoverAddressFromSignedMessage(signature, message), "ERR_INVALID_SIGN");

        require(message.length == 104, "ERR_INVALID_MESSAGE");
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
}
