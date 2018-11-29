pragma solidity ^0.4.24;

import "./Helpers.sol";

// helpers for message signing.
// `internal` so they get compiled into contracts using them.
library MessageSigning {
    function recoverAddressFromSignedMessage(bytes signature, bytes message) internal pure returns (address) {
        require(signature.length == 65);
        bytes32 r;
        bytes32 s;
        bytes1 vb;
        uint8 v;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            vb := mload(add(signature, 0x60))
        }

        v = uint8(vb);

        if (v < 27) {
            v = v + 27;
        }

        return ecrecover(hashMessage(message), v, r, s);
    }

    function hashMessage(bytes message) internal pure returns (bytes32) {
        // bytes memory prefix = "\x19Ethereum Signed Message:\n";
        // return keccak256(abi.encodePacked(prefix, Helpers.uintToString(message.length), message));
        return keccak256(message);
    }
}


/// Library used only to test MessageSigning library via rpc calls
library MessageSigningTest {
    function recoverAddressFromSignedMessage(bytes signature, bytes message) public pure returns (address) {
        return MessageSigning.recoverAddressFromSignedMessage(signature, message);
    }
}
