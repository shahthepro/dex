package models

import (
	"hameid.net/cdex/dex/internal/store"
	"hameid.net/cdex/dex/internal/wrappers"
)

// Trade record
type Trade struct {
	BuyOrderHash  *wrappers.Hash    `json:"buy_order_hash"`
	SellOrderHash *wrappers.Hash    `json:"sell_order_hash"`
	Token         *wrappers.Address `json:"token"`
	Base          *wrappers.Address `json:"base"`
	Price         *wrappers.BigInt  `json:"price"`
	Volume        *wrappers.BigInt  `json:"volume"`
	TradedAt      uint64            `json:"created_at"`
	TxHash        *wrappers.Hash    `json:"tx_hash"`
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
