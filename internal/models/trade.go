package models

import (
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
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

// UserTradeResponse record
type UserTradeResponse struct {
	OrderHash *wrappers.Hash   `json:"order_hash"`
	IsBuy     bool             `json:"is_buy_order"`
	Price     *wrappers.BigInt `json:"price"`
	Volume    *wrappers.BigInt `json:"volume"`
	TradedAt  *time.Time       `json:"traded_at"`
	TxHash    *wrappers.Hash   `json:"tx_hash"`
}

// TradeHistoryResponse record
type TradeHistoryResponse struct {
	Price     *wrappers.BigInt `json:"price"`
	Volume    *wrappers.BigInt `json:"volume"`
	Timestamp *time.Time       `json:"traded_at"`
}

// OHLCResponse record
type OHLCResponse struct {
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

// GetTradesOfUser returns the list of trades
func GetTradesOfUser(store *store.DataStore, token *common.Address, base *common.Address, user *common.Address) ([]UserTradeResponse, error) {

	query := `SELECT 
		recent_orders.order_hash as order_hash, recent_orders.is_bid as is_buy, 
		recent_trades.price, recent_trades.volume, 
		recent_trades.traded_at, 
		recent_trades.tx_hash
	FROM

		(SELECT order_hash, is_bid FROM orders 
			WHERE created_at > now() - interval '3 months'
			AND volume_filled > 0
			AND base=LOWER($1) AND token=LOWER($2) AND created_by=LOWER($3) 
			ORDER BY created_at DESC
			LIMIT 50) as recent_orders

	INNER JOIN 
		(SELECT buy_order_hash, sell_order_hash, price, volume, traded_at, tx_hash FROM trades 
			WHERE traded_at > now() - interval '1 month'
			AND base=LOWER($1) AND token=LOWER($2) 
			ORDER BY traded_at DESC
			LIMIT 50) as recent_trades

		ON recent_orders.order_hash IN (recent_trades.buy_order_hash, recent_trades.sell_order_hash) 
	`

	rows, err := store.DB.Query(query, base.Hex(), token.Hex(), user.Hex())

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	trades := []UserTradeResponse{}

	for rows.Next() {
		var trade UserTradeResponse

		err := rows.Scan(
			&trade.OrderHash,
			&trade.IsBuy,
			&trade.Price,
			&trade.Volume,
			&trade.TradedAt,
			&trade.TxHash,
		)

		if err != nil {
			return nil, err
		}

		trades = append(trades, trade)
	}

	return trades, nil
}

// GetOHLCData returns the list of trades
func GetOHLCData(store *store.DataStore, token *common.Address, base *common.Address) ([]OHLCResponse, error) {
	query := `
	SELECT time_bucket('5 minutes', traded_at) AS timeinterval,
		first(price, traded_at) AS open,
		last(price, traded_at) AS close,
		max(price) AS high,
		min(price) AS low,
		sum(volume) AS volume
	  FROM trades
	  WHERE traded_at >= now() - interval '1 month'
		AND token=LOWER($1)
		AND base=LOWER($2)
	  GROUP BY timeinterval
	  ORDER BY timeinterval DESC;
	`
	rows, err := store.DB.Query(query, token.Hex(), base.Hex())

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	trades := []OHLCResponse{}

	for rows.Next() {
		var trade OHLCResponse

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

// GetTradeHistory returns the list of P/V history of recent trades
func GetTradeHistory(store *store.DataStore, token *common.Address, base *common.Address) ([]TradeHistoryResponse, error) {
	query := `
	SELECT traded_at, price, volume FROM trades
	WHERE token=LOWER($1) AND base=LOWER($2)
	ORDER BY traded_at DESC
	LIMIT 20;
	`
	rows, err := store.DB.Query(query, token.Hex(), base.Hex())

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	trades := []TradeHistoryResponse{}

	for rows.Next() {
		var trade TradeHistoryResponse

		err := rows.Scan(
			&trade.Timestamp,
			&trade.Price,
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
