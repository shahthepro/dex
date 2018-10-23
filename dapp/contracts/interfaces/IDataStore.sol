pragma solidity ^0.4.3;

interface IDataStore {
    function getUIntValue(bytes32 record) public view returns(uint);

    function setUIntValue(bytes32 record, uint value) public;

    function deleteUIntValue(bytes32 record) public;

    function addUIntValue(bytes32 record, uint value) public;

    function subUIntValue(bytes32 record, uint value) public;

    function getStringValue(bytes32 record) public view returns(string);

    function setStringValue(bytes32 record, string value) public;

    function deleteStringValue(bytes32 record) public;

    function getAddressValue(bytes32 record) public view returns(address);

    function setAddressValue(bytes32 record, address value) public;

    function deleteAddressValue(bytes32 record) public;

    function getBytesValue(bytes32 record) public view returns(bytes);

    function setBytesValue(bytes32 record, bytes value) public;

    function deleteBytesValue(bytes32 record) public;

    function getBooleanValue(bytes32 record) public view returns(bool);

    function setBooleanValue(bytes32 record, bool value) public;

    function deleteBooleanValue(bytes32 record) public;

    function getIntValue(bytes32 record) public view returns(int);

    function setIntValue(bytes32 record, int value) public;

    function deleteIntValue(bytes32 record) public;

    function getTokenValue(address token, address owner, uint16 vault) public view returns(uint);

    function setTokenValue(address token, address owner, uint16 vault, uint value) public;

    function deleteTokenValue(address token, address owner, uint16 vault) public;

    function addTokenValue(address token, address owner, uint16 vault, uint value) public;

    function subTokenValue(address token, address owner, uint16 vault, uint value) public;
}