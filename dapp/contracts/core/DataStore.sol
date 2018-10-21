pragma solidity ^0.4.3;

// import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./DEXContract.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract DataStore is DEXContract {
    using SafeMath for uint256;

    mapping(bytes32 => uint) UIntStorage;

    function getUIntValue(bytes32 record) public view returns(uint) {
        return UIntStorage[record];
    }

    function setUIntValue(bytes32 record, uint value) public onlyAllowedContractsOrAdmin {
        UIntStorage[record] = value;
    }

    function deleteUIntValue(bytes32 record) public onlyAllowedContractsOrAdmin {
        delete UIntStorage[record];
    }

    function addUIntValue(bytes32 record, uint value) public onlyAllowedContractsOrAdmin {
        UIntStorage[record] = UIntStorage[record].add(value);
    }

    function subUIntValue(bytes32 record, uint value) public onlyAllowedContractsOrAdmin {
        UIntStorage[record] = UIntStorage[record].sub(value);
    }

    mapping(bytes32 => string) StringStorage;

    function getStringValue(bytes32 record) public view returns(string) {
        return StringStorage[record];
    }

    function setStringValue(bytes32 record, string value) public onlyAllowedContractsOrAdmin {
        StringStorage[record] = value;
    }

    function deleteStringValue(bytes32 record) public onlyAllowedContractsOrAdmin {
        delete StringStorage[record];
    }

    mapping(bytes32 => address) AddressStorage;

    function getAddressValue(bytes32 record) public view returns(address) {
        return AddressStorage[record];
    }

    function setAddressValue(bytes32 record, address value) public onlyAllowedContractsOrAdmin {
        AddressStorage[record] = value;
    }

    function deleteAddressValue(bytes32 record) public onlyAllowedContractsOrAdmin {
        delete AddressStorage[record];
    }

    mapping(bytes32 => bytes) BytesStorage;

    function getBytesValue(bytes32 record) public view returns(bytes) {
        return BytesStorage[record];
    }

    function setBytesValue(bytes32 record, bytes value) public onlyAllowedContractsOrAdmin {
        BytesStorage[record] = value;
    }

    function deleteBytesValue(bytes32 record) public onlyAllowedContractsOrAdmin {
        delete BytesStorage[record];
    }

    mapping(bytes32 => bool) BooleanStorage;

    function getBooleanValue(bytes32 record) public view returns(bool) {
        return BooleanStorage[record];
    }

    function setBooleanValue(bytes32 record, bool value) public onlyAllowedContractsOrAdmin {
        BooleanStorage[record] = value;
    }

    function deleteBooleanValue(bytes32 record) public onlyAllowedContractsOrAdmin {
        delete BooleanStorage[record];
    }

    mapping(bytes32 => int) IntStorage;

    function getIntValue(bytes32 record) public view returns(int) {
        return IntStorage[record];
    }

    function setIntValue(bytes32 record, int value) public onlyAllowedContractsOrAdmin {
        IntStorage[record] = value;
    }

    function deleteIntValue(bytes32 record) public onlyAllowedContractsOrAdmin {
        delete IntStorage[record];
    }

    mapping(address => mapping(address => mapping(uint16 => uint))) TokensStorage;

    function getTokenValue(address token, address owner, uint16 vault) public view returns(uint) {
        return TokensStorage[token][owner][vault];
    }

    function setTokenValue(address token, address owner, uint16 vault, uint value) public onlyAllowedContractsOrAdmin {
        TokensStorage[token][owner][vault] = value;
    }

    function deleteTokenValue(address token, address owner, uint16 vault) public onlyAllowedContractsOrAdmin {
        delete TokensStorage[token][owner][vault];
    }

    function addTokenValue(address token, address owner, uint16 vault, uint value) public onlyAllowedContractsOrAdmin {
        TokensStorage[token][owner][vault] = TokensStorage[token][owner][vault].add(value);
    }

    function subTokenValue(address token, address owner, uint16 vault, uint value) public onlyAllowedContractsOrAdmin {
        TokensStorage[token][owner][vault] = TokensStorage[token][owner][vault].sub(value);
    }
}