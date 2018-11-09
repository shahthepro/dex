package wrappers

import (
	"errors"
	"fmt"
	"math/big"
)

// BigInt is Marshall/Unmarshall-friendly big.Int wrapper
type BigInt struct {
	big.Int
}

func (i *BigInt) MarshalJSON() ([]byte, error) {
	return []byte(fmt.Sprintf(`"%s"`, i.String())), nil
}

func (i *BigInt) UnmarshalJSON(text []byte) error {
	_, ok := i.SetString(string(text[1:len(text)-1]), 10)

	if !ok {
		fmt.Println("Failed to Unmarshall: " + string(text))
	}

	return nil
}

// Cmp compares two big ints
func (i *BigInt) Cmp(y *BigInt) int {
	return i.Int.Cmp(&y.Int)
}

func (i *BigInt) Scan(value interface{}) error {
	v := string(value.([]uint8))
	_, ok := i.SetString(v, 10)

	if !ok {
		return errors.New("Cannot parse BigInt: " + v)
	}

	return nil
}

// WrapBigInt wraps big.Int
func WrapBigInt(i *big.Int) *BigInt {
	return &BigInt{*i}
}
