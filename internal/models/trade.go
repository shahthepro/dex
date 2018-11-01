package models

import (
	"math/big"

	"hameid.net/cdex/dex/internal/helpers"
	"hameid.net/cdex/dex/internal/store"
)

// Trade record
type Trade struct {
	BuyOrderHash  *helpers.Hash    `json:"buy_order_hash"`
	SellOrderHash *helpers.Hash    `json:"sell_order_hash"`
	Token         *helpers.Address `json:"token"`
	Base          *helpers.Address `json:"base"`
	Price         *big.Int         `json:"price"`
	Volume        *big.Int         `json:"volume"`
	TradedAt      uint64           `json:"created_at"`
	TxHash        *helpers.Hash    `json:"tx_hash"`
}

// Save inserts Trade
func (trade *Trade) Save(store *store.DataStore) error {
	query := `INSERT INTO trades (
		buy_order_hash, sell_order_hash, token, base, price, volume, traded_at, tx_hash)
		VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), $8)`

	_, err := store.DB.Exec(
		query,
		trade.BuyOrderHash,
		trade.SellOrderHash,
		trade.Token,
		trade.Base,
		trade.Price.String(),
		trade.Volume.String(),
		trade.TradedAt,
		trade.TxHash,
	)

	return err
}
