pragma solidity ^0.4.3;

interface IDataStore {
    function getUIntValue(bytes32 record) external view returns(uint);

    function setUIntValue(bytes32 record, uint value) external;

    function deleteUIntValue(bytes32 record) external;

    function addUIntValue(bytes32 record, uint value) external;

    function subUIntValue(bytes32 record, uint value) external;

    function getStringValue(bytes32 record) external view returns(string);

    function setStringValue(bytes32 record, string value) external;

    function deleteStringValue(bytes32 record) external;

    function getAddressValue(bytes32 record) external view returns(address);

    function setAddressValue(bytes32 record, address value) external;

    function deleteAddressValue(bytes32 record) external;

    function getBytesValue(bytes32 record) external view returns(bytes);

    function setBytesValue(bytes32 record, bytes value) external;

    function deleteBytesValue(bytes32 record) external;

    function getBooleanValue(bytes32 record) external view returns(bool);

    function setBooleanValue(bytes32 record, bool value) external;

    function deleteBooleanValue(bytes32 record) external;

    function getIntValue(bytes32 record) external view returns(int);

    function setIntValue(bytes32 record, int value) external;

    function deleteIntValue(bytes32 record) external;

    function getTokenValue(address token, address owner, uint16 vault) external view returns(uint);

    function setTokenValue(address token, address owner, uint16 vault, uint value) external;

    function deleteTokenValue(address token, address owner, uint16 vault) external;

    function addTokenValue(address token, address owner, uint16 vault, uint value) external;

    function subTokenValue(address token, address owner, uint16 vault, uint value) external;
}