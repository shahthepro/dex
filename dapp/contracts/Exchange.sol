pragma solidity ^0.4.23;

import "./lib/MessageSigning.sol";
import "./lib/Helpers.sol";
import "./lib/Message.sol";

contract Exchange {
    // Map Tokens => Users => Balances
    mapping (address => mapping (address => uint256)) public balances;

    // Event created on money transfer
    event Transfer(address from, address to, address token, uint256 tokens);

    function balanceOf(address token, address user) public view returns (uint256) {
        return balances[token][user];
    }

    struct SignaturesCollection {
        /// Signed message.
        bytes message;
        /// Authorities who signed the message.
        address[] signed;
        /// Signatures
        bytes[] signatures;
    }

    uint256 public requiredSignatures;

    address[] public authorities;

    // Pending deposits and authorities who confirmed them
    mapping (bytes32 => address[]) deposits;

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
        address[] _authorities
    ) public
    {
        require(_requiredSignatures != 0);
        require(_requiredSignatures <= _authorities.length);
        requiredSignatures = _requiredSignatures;
        authorities = _authorities;
    }

    modifier onlyAuthority() {
        require(Helpers.addressArrayContains(authorities, msg.sender));
        _;
    }

    function deposit(address recipient, address token, uint256 value, bytes32 transactionHash) public onlyAuthority() {
        // Protection from misbehaving authority
        bytes32 hash = keccak256(abi.encodePacked(recipient, token, value, transactionHash));

        // don't allow authority to confirm deposit twice
        require(!Helpers.addressArrayContains(deposits[hash], msg.sender));

        deposits[hash].push(msg.sender);

        if (deposits[hash].length != requiredSignatures) {
            emit DepositConfirmation(recipient, token, value, transactionHash);
            return;
        }

        balances[token][recipient] += value;
        emit Deposit(recipient, token, value, transactionHash);
    }

    function transferHomeViaRelay(address token, uint256 value) public {
        require(balances[token][msg.sender] >= value);
        require(value > 0);

        balances[token][msg.sender] -= value;

        emit Withdraw(msg.sender, token, value);
    }

    function submitSignature(bytes signature, bytes message) public onlyAuthority() {
        // ensure that `signature` is really `message` signed by `msg.sender`
        require(msg.sender == MessageSigning.recoverAddressFromSignedMessage(signature, message));

        require(message.length == 136);
        bytes32 messageHash = MessageSigning.hashMessage(message);

        // each authority can only provide one signature per message
        require(!Helpers.addressArrayContains(signatures[messageHash].signed, msg.sender));
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

    /// Get signature
    function signature(bytes32 messageHash, uint256 index) public view returns (bytes) {
        return signatures[messageHash].signatures[index];
    }

    /// Get message
    function message(bytes32 messageHash) public view returns (bytes) {
        return signatures[messageHash].message;
    }
}
