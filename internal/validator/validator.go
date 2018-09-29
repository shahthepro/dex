package validator

import (
	"crypto/ecdsa"

	"github.com/ethereum/go-ethereum/common"
)

// Validator struct
type Validator struct {
	privateKey *ecdsa.PrivateKey
	publicKey  *ecdsa.PublicKey
	address    *common.Address
}
