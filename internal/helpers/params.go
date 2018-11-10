package helpers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/ethereum/go-ethereum/common"
)

// ErrInvalidAddress thrown if not a valid address
var ErrInvalidAddress = errors.New("`%s` is not a valid address")

// ErrMissingAddress thrown if address missing
var ErrMissingAddress = errors.New("Address parameter `%s` is required")

// GetAddressQueryParam sanitizes and returns address
func GetAddressQueryParam(r *http.Request, key string) (*common.Address, error) {
	val := strings.TrimSpace(r.FormValue(key))
	if len(val) == 0 {
		return nil, ErrMissingAddress
	}

	if !common.IsHexAddress(val) {
		return nil, ErrInvalidAddress
	}

	addr := common.HexToAddress(val)

	return &addr, nil
}

// HasQueryParam returns true if query parameter exists
func HasQueryParam(r *http.Request, key string) bool {
	val := strings.TrimSpace(r.FormValue(key))
	if len(val) == 0 {
		return false
	}
	return true
}
