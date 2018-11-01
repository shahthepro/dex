package models

import (
	"hameid.net/cdex/dex/internal/helpers"
	"hameid.net/cdex/dex/internal/store"
)

// Order record
type Order struct {
	Hash         *helpers.Hash    `json:"order_hash"`
	Token        *helpers.Address `json:"token"`
	Base         *helpers.Address `json:"base"`
	Price        *helpers.BigInt  `json:"price"`
	Quantity     *helpers.BigInt  `json:"quantity"`
	IsBid        bool             `json:"is_bid"`
	CreatedAt    uint64           `json:"created_at"`
	CreatedBy    *helpers.Address `json:"created_by"`
	Volume       *helpers.BigInt  `json:"volume"`
	VolumeFilled *helpers.BigInt  `json:"volume_filled"`
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

func (order *Order) Get(store *store.DataStore) error {
	query := `SELECT order_hash, token, base, price, quantity, is_bid, trunc(extract(epoch from created_at::timestamp with time zone)), created_by, volume, volume_filled FROM orders WHERE order_hash=$1`

	row := store.DB.QueryRow(query, order.Hash)

	var t float64

	err := row.Scan(
		&order.Hash,
		&order.Token,
		&order.Base,
		&order.Price,
		&order.Quantity,
		&order.IsBid,
		// &order.CreatedAt,
		&t,
		&order.CreatedBy,
		&order.Volume,
		&order.VolumeFilled,
	)

	order.CreatedAt = uint64(t)

	return err
}
