pragma solidity ^0.4.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract DataStore is Ownable {

    address public admin;
    mapping(address => bool) public allowedContracts;

    constructor() public {
        admin = msg.sender;
        // allowedContracts[contractAddress] = true;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "ERR_PERMISSION");
        _;
    }

    modifier onlyAllowedContracts() {
        require(allowedContracts[msg.sender], "ERR_PERMISSION");
        _;
    }

    function changeAdmin(address admin_) public onlyAdmin {
        admin = admin_;
    }

    function addExchangeContract(address exchangeAddress) public onlyAdmin {
        allowedContracts[exchangeAddress] = true;
    }

    function removeExchangeContract(address exchangeAddress) public onlyAdmin {
        allowedContracts[exchangeAddress] = false;
    }

    function isAllowedContract(address exchangeAddress) public view returns(bool) {
        return allowedContracts[exchangeAddress];
    }

    mapping(bytes32 => uint) UIntStorage;

    function getUIntValue(bytes32 record) public view returns(uint) {
        return UIntStorage[record];
    }

    function setUIntValue(bytes32 record, uint value) public onlyAllowedContracts {
        UIntStorage[record] = value;
    }

    mapping(bytes32 => string) StringStorage;

    function getStringValue(bytes32 record) public view returns(string) {
        return StringStorage[record];
    }

    function setStringValue(bytes32 record, string value) public onlyAllowedContracts {
        StringStorage[record] = value;
    }

    mapping(bytes32 => address) AddressStorage;

    function getAddressValue(bytes32 record) public view returns(address) {
        return AddressStorage[record];
    }

    function setAddressValue(bytes32 record, address value) public onlyAllowedContracts {
        AddressStorage[record] = value;
    }

    mapping(bytes32 => bytes) BytesStorage;

    function getBytesValue(bytes32 record) public view returns(bytes) {
        return BytesStorage[record];
    }

    function setBytesValue(bytes32 record, bytes value) public onlyAllowedContracts {
        BytesStorage[record] = value;
    }

    mapping(bytes32 => bool) BooleanStorage;

    function getBooleanValue(bytes32 record) public view returns(bool) {
        return BooleanStorage[record];
    }

    function setBooleanValue(bytes32 record, bool value) public onlyAllowedContracts {
        BooleanStorage[record] = value;
    }

    mapping(bytes32 => int) IntStorage;

    function getIntValue(bytes32 record) public view returns(int) {
        return IntStorage[record];
    }

    function setIntValue(bytes32 record, int value) public onlyAllowedContracts {
        IntStorage[record] = value;
    }
}