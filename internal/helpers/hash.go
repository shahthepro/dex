package helpers

import (
	"strings"

	"github.com/ethereum/go-ethereum/common"
)

// Hash is a wrapper around common.Hash with additional functionalities
type Hash struct {
	common.Hash
}

// Scan implements Scanner.Scan for common.Hash
func (hash *Hash) Scan(value interface{}) error {
	hex := strings.TrimPrefix(value.(string), "0x")
	hash.SetBytes(common.Hex2Bytes(hex))
	return nil
}