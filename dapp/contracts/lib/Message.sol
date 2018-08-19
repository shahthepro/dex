pragma solidity ^0.4.23;

import "./MessageSigning.sol";
import "./Helpers.sol";

library Message {
    // layout of message :: bytes:
    // offset  0: 32 bytes :: uint256 (big endian) - message length (not part of message. any `bytes` begins with the length in memory)
    // offset 32: 20 bytes :: address - recipient address
    // offset 52: 20 bytes :: address - token address
    // offset 72: 32 bytes :: uint256 (big endian) - value
    // offset 104: 32 bytes :: bytes32 - transaction hash

    // mload always reads 32 bytes.
    // if mload reads an address it only interprets the last 20 bytes as the address.
    // so we can and have to start reading recipient at offset 20 instead of 32.
    // if we were to read at 32 the address would contain part of value and be corrupted.
    // when reading from offset 20 mload will ignore 12 bytes followed
    // by the 20 recipient address bytes and correctly convert it into an address.
    // this saves some storage/gas over the alternative solution
    // which is padding address to 32 bytes and reading recipient at offset 32.
    // for more details see discussion in:
    // https://github.com/paritytech/parity-bridge/issues/61

    function getRecipient(bytes message) internal pure returns (address) {
        address recipient;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            recipient := mload(add(message, 20))
        }
        return recipient;
    }

    function getToken(bytes message) internal pure returns (address) {
        address token;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            token := mload(add(message, 40))
        }
        return token;
    }

    function getValue(bytes message) internal pure returns (uint256) {
        uint256 value;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            value := mload(add(message, 72))
        }
        return value;
    }

    function getTransactionHash(bytes message) internal pure returns (bytes32) {
        bytes32 hash;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            hash := mload(add(message, 104))
        }
        return hash;
    }
}


/// Library used only to test Message library via rpc calls
library MessageTest {
    function getRecipient(bytes message) public pure returns (address) {
        return Message.getRecipient(message);
    }

    function getToken(bytes message) public pure returns (address) {
        return Message.getToken(message);
    }

    function getValue(bytes message) public pure returns (uint256) {
        return Message.getValue(message);
    }

    function getTransactionHash(bytes message) public pure returns (bytes32) {
        return Message.getTransactionHash(message);
    }
}
