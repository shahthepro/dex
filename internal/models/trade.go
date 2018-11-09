package models

import (
	"bytes"
	"fmt"
	"math/big"

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
	TradedAt      uint64            `json:"traded_at"`
	TxHash        *wrappers.Hash    `json:"tx_hash"`
}

// tradeJSONResp record
type tradeJSONResp struct {
	Open   *wrappers.BigInt `json:"open"`
	High   *wrappers.BigInt `json:"high"`
	Low    *wrappers.BigInt `json:"low"`
	Close  *wrappers.BigInt `json:"close"`
	Volume *wrappers.BigInt `json:"volume"`
	Date   *string          `json:"date"`
}

// Save inserts Trade
func (trade *Trade) Save(store *store.DataStore) error {
	query := `INSERT INTO trades (
		buy_order_hash, sell_order_hash, token, base, price, volume, traded_at, tx_hash)
		VALUES (LOWER($1), LOWER($2), LOWER($3), LOWER($4), $5, $6, to_timestamp($7), LOWER($8))`

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

// GetTrades returns the list of trades
func GetTrades(store *store.DataStore, params map[string]interface{}) ([]tradeJSONResp, error) {
	var buffer bytes.Buffer

	if val, ok := params["token"]; ok {
		buffer.WriteString(fmt.Sprintf(` AND token='%s'`, val))
	}

	if val, ok := params["base"]; ok {
		buffer.WriteString(fmt.Sprintf(` AND base='%s'`, val))
	}

	query := fmt.Sprintf(`
	SELECT time_bucket('1 minute', traded_at) AS timeinterval,
		first(price, traded_at) AS open,
		last(price, traded_at) AS close,
		max(price) AS high,
		min(price) AS low,
		sum(volume) AS volume
	  FROM trades
	  WHERE traded_at >= now() - interval '1 month'
	  %s
	  GROUP BY timeinterval
	  ORDER BY timeinterval DESC;
	`, buffer.String())
	// query := fmt.Sprintf(`SELECT order_hash, token, base, price, quantity, is_bid, trunc(extract(epoch from created_at::timestamp with time zone)), created_by, volume, volume_filled FROM orders WHERE created_at <= to_timestamp($3)%s ORDER BY created_at DESC LIMIT $1 OFFSET $2`, buffer.String())
	rows, err := store.DB.Query(query)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	trades := []tradeJSONResp{}

	for rows.Next() {
		var trade tradeJSONResp

		err := rows.Scan(
			&trade.Date,
			&trade.Open,
			&trade.Close,
			&trade.High,
			&trade.Low,
			&trade.Volume,
		)

		if err != nil {
			return nil, err
		}

		trades = append(trades, trade)
	}

	return trades, nil
}

func getLastTradedPrice(store *store.DataStore, token string, base string) (*wrappers.BigInt, error) {
	query := `select last(price, traded_at) from trades where token=LOWER($1) AND base=LOWER($2) group by traded_at order by traded_at desc limit 1;`

	rows, err := store.DB.Query(query, token, base)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	lastPrice := wrappers.WrapBigInt(big.NewInt(0))

	if rows.Next() {
		err := rows.Scan(&lastPrice)

		if err != nil {
			return nil, err
		}
	}

	return lastPrice, nil
}
