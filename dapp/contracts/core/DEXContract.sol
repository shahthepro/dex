pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/utils/Address.sol";

contract DEXContract {
    address public admin;
    mapping(address => bool) public allowedContracts;
    mapping(address => bool) public allowedUsers;

    constructor() public {
        admin = msg.sender;
        allowedContracts[address(this)] = true;
        allowedUsers[admin] = true;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "ERR_PERMISSION");
        _;
    }

    modifier onlyAllowedContracts() {
        require(allowedContracts[msg.sender], "ERR_PERMISSION");
        _;
    }

    modifier onlyAllowedContractsOrAdmin() {
        require(msg.sender == admin || allowedContracts[msg.sender], "ERR_PERMISSION");
        _;
    }

    modifier onlyAllowedUsers() {
        require(allowedUsers[msg.sender], "ERR_PERMISSION");
        _;
    }

    modifier onlyAllowedUsersOrAdmin() {
        require(msg.sender == admin || allowedUsers[msg.sender], "ERR_PERMISSION");
        _;
    }

    function changeAdmin(address admin_) public onlyAdmin {
        admin = admin_;
    }

    function whitelistContract(address contractAddress) public onlyAdmin {
        require(Address.isContract(contractAddress), "ERR_NOT_CONTRACT");
        allowedContracts[contractAddress] = true;
    }

    function blacklistContract(address contractAddress) public onlyAdmin {
        require(Address.isContract(contractAddress), "ERR_NOT_CONTRACT");
        allowedContracts[contractAddress] = false;
    }

    function whitelistUser(address userAddress) public onlyAdmin {
        allowedUsers[userAddress] = true;
    }

    function blacklistUser(address userAddress) public onlyAdmin {
        allowedUsers[userAddress] = false;
    }

    function isContractAllowed(address contractAddress) public view returns(bool) {
        return allowedContracts[contractAddress];
    }
}
