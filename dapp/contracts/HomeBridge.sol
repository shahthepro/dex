pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./lib/MessageSigning.sol";
import "./lib/Helpers.sol";
import "./lib/Message.sol";

contract HomeBridge is Ownable {

    using SafeMath for uint256;

    uint256 public requiredSignatures;

    address[] public authorities;

    mapping (bytes32 => bool) withdraws;

    bool public isWithdrawDisabled;
    bool public isDepositDisabled;

    event Deposit (address recipient, address token, uint256 value);
    event Withdraw (address recipient, address token, uint256 value, bytes32 transactionHash);

    constructor (
        uint256 requiredSignaturesParam,
        address[] authoritiesParam
    ) public
    {
        updateAuthorities(requiredSignaturesParam, authoritiesParam);
        // require(requiredSignaturesParam != 0);
        // require(requiredSignaturesParam <= authoritiesParam.length);
        // requiredSignatures = requiredSignaturesParam;
        // authorities = authoritiesParam;
        isWithdrawDisabled = false;
        isDepositDisabled = false;
    }

    function toggleDeposit(bool enable) public onlyOwner {
        isDepositDisabled = !enable;
    }

    function toggleWithdraw(bool enable) public onlyOwner {
        isWithdrawDisabled = !enable;
    }

    function updateAuthorities(
        uint256 requiredSignaturesParam,
        address[] authoritiesParam
    ) public onlyOwner {
        require(requiredSignaturesParam != 0, "ERR_ZERO_SIGNS");
        require(requiredSignaturesParam <= authoritiesParam.length, "ERR_IMPOSSIBLE_SIGNS");
        requiredSignatures = requiredSignaturesParam;
        authorities = authoritiesParam;
    }

    function deposit(address token, uint256 amount) public payable {
        require(!isDepositDisabled, "ERR_DEPOSIT_DISABLED");

        if (address(0) == token) {
            require(msg.value > 0, "ERR_NO_FUNDS");
            emit Deposit(msg.sender, address(0), msg.value);
        } else {
            require(msg.value == 0 && amount > 0, "ERR_NO_FUNDS");
            assert(IERC20(token).transferFrom(msg.sender, this, amount));
            emit Deposit(msg.sender, token, amount);
        }
    }

    function withdraw(uint8[] vs, bytes32[] rs, bytes32[] ss, bytes message) public {
        require(!isWithdrawDisabled, "ERR_WITHDRAW_DISABLED");
        
        // require(message.length == 104, "MESSAGE_LENGTH_MISMATCH");

        require(Helpers.hasEnoughValidSignatures(message, vs, rs, ss, authorities, requiredSignatures), "ERR_INSUFFICIENT_SIGNS");

        address recipient = Message.getRecipient(message);
        address token = Message.getToken(message);
        uint256 value = Message.getValue(message);
        bytes32 txHash = Message.getTransactionHash(message);

        require(recipient == msg.sender, "ERR_NOT_BENEFICIARY");

        // The following two statements guard against reentry into this function.
        // Duplicated withdraw or reentry.
        require(!withdraws[txHash], "ERR_ALREADY_WITHDRAWN");
        withdraws[txHash] = true;

        if (address(0) == token) {
            recipient.transfer(value);
        } else {
            assert(IERC20(token).transfer(recipient, value));
        }

        emit Withdraw(recipient, token, value, txHash);
    }
}
