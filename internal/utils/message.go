package utils

import (
	"bytes"
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

func SerializeWithdrawalMessage(recepient common.Address, token common.Address, amount *big.Int, transactionHash common.Hash) ([]byte, error) {
	byteSlice := make([]byte, 104)

	paddedAmount, amountErr := leftPadByteSlice(amount.Bytes(), 32, 0)
	if amountErr != nil {
		return nil, amountErr
	}

	// paddedGasPrice, gasErr := leftPadByteSlice(gasPrice.Bytes(), 32, 0)
	// if gasErr != nil {
	// 	return nil, gasErr
	// }

	copy(byteSlice[0:20], recepient.Bytes()[:])
	copy(byteSlice[20:40], token.Bytes()[:])
	copy(byteSlice[40:72], paddedAmount)
	copy(byteSlice[72:104], transactionHash.Bytes()[:])

	return byteSlice, nil
}

func leftPadByteSlice(data []byte, blockLen int, padValue int) ([]byte, error) {
	if blockLen == len(data) {
		return data, nil
	}

	if blockLen <= 0 {
		return nil, fmt.Errorf("Invalid block size: %d", blockLen)
	}

	padLen := blockLen - len(data)

	pad := bytes.Repeat([]byte{byte(padLen)}, padValue)
	slice := make([]byte, blockLen)
	copy(slice[0:padLen], pad)
	copy(slice[padLen:blockLen], data)

	return slice, nil
}

type Signature struct {
	Raw  []byte
	Hash []byte
	R    [32]byte
	S    [32]byte
	V    uint8
}

func SignMessageWithPrivateKey(message []byte, p *ecdsa.PrivateKey) (Signature, error) {
	hashRaw := crypto.Keccak256(message)
	signature, err := crypto.Sign(hashRaw, p)
	if err != nil {
		return Signature{}, err
	}

	return Signature{
		signature,
		hashRaw,
		ByteSliceToByte32(signature[:32]),
		ByteSliceToByte32(signature[32:64]),
		uint8(int(signature[64])) + 27, // Yes add 27, weird Ethereum quirk
	}, nil
}

func ByteSliceToByte32(s []byte) [32]byte {
	var b [32]byte

	for i := 0; i < 16; i++ {
		b[i], b[32-i-1] = s[i], s[32-i-1]
	}

	return b
}
