package models

import (
	"math/big"

	"hameid.net/cdex/dex/internal/helpers"
	"hameid.net/cdex/dex/internal/store"
)

// Order record
type Order struct {
	Hash         *helpers.Hash    `json:"order_hash"`
	Token        *helpers.Address `json:"token"`
	Base         *helpers.Address `json:"base"`
	Price        *big.Int         `json:"price"`
	Quantity     *big.Int         `json:"quantity"`
	IsBid        bool             `json:"is_bid"`
	CreatedAt    uint64           `json:"created_at"`
	CreatedBy    *helpers.Address `json:"created_by"`
	Volume       *big.Int         `json:"volume"`
	VolumeFilled *big.Int         `json:"volume_filled"`
}

// Save inserts Order
func (order *Order) Save(store *store.DataStore) error {
	query := `INSERT INTO orders (
		order_hash, token, base, price, quantity, is_bid, created_at, created_by, volume)
		VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), $8, $9)`

	_, err := store.DB.Exec(
		query,
		order.Hash,
		order.Token,
		order.Base,
		order.Price.String(),
		order.Quantity.String(),
		order.IsBid,
		order.CreatedAt,
		order.CreatedBy,
		order.Volume.String(),
	)

	return err
}
