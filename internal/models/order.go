package models

import (
	"bytes"
	"errors"
	"fmt"

	"hameid.net/cdex/dex/internal/store"
	"hameid.net/cdex/dex/internal/wrappers"
)

// Order record
type Order struct {
	Hash         *wrappers.Hash      `json:"order_hash"`
	Token        *wrappers.Address   `json:"token"`
	Base         *wrappers.Address   `json:"base"`
	Price        *wrappers.BigInt    `json:"price"`
	Quantity     *wrappers.BigInt    `json:"quantity"`
	IsBid        bool                `json:"is_bid"`
	CreatedAt    *wrappers.Timestamp `json:"created_at"`
	CreatedBy    *wrappers.Address   `json:"created_by"`
	Volume       *wrappers.BigInt    `json:"volume"`
	VolumeFilled *wrappers.BigInt    `json:"volume_filled"`
	IsOpen       bool                `json:"is_open"`
}

type OrderbookResponseItem struct {
	Price        *wrappers.BigInt `json:"price"`
	Volume       *wrappers.BigInt `json:"volume"`
	VolumeFilled *wrappers.BigInt `json:"volume_filled"`
}

type OrderbookResponse struct {
	Bids      *[]OrderbookResponseItem `json:"bids"`
	Asks      *[]OrderbookResponseItem `json:"asks"`
	LastPrice *wrappers.BigInt         `json:"last_price"`
}

// Save inserts Order
func (order *Order) Save(store *store.DataStore) error {
	query := `INSERT INTO orders (
		order_hash, token, base, price, quantity, is_bid, created_at, created_by, volume)
		VALUES (LOWER($1), LOWER($2), LOWER($3), $4, $5, $6, to_timestamp($7), LOWER($8), $9)`

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

// Get scans the order by hash from database
func (order *Order) Get(store *store.DataStore) error {
	query := `SELECT order_hash, token, base, price, quantity, is_bid, trunc(extract(epoch from created_at::timestamp with time zone)), created_by, volume, volume_filled, is_open FROM orders WHERE order_hash=LOWER($1)`

	row := store.DB.QueryRow(query, order.Hash.Hex())

	err := row.Scan(
		&order.Hash,
		&order.Token,
		&order.Base,
		&order.Price,
		&order.Quantity,
		&order.IsBid,
		&order.CreatedAt,
		&order.CreatedBy,
		&order.Volume,
		&order.VolumeFilled,
		&order.IsOpen,
	)

	return err
}

// Update order details
func (order *Order) Update(store *store.DataStore) error {
	query := `UPDATE orders SET volume_filled=$1, is_open=$2 WHERE order_hash=LOWER($3)`

	if order.Volume.Cmp(order.VolumeFilled) == 0 {
		order.IsOpen = false
	}

	_, err := store.DB.Exec(
		query,
		order.VolumeFilled.String(),
		order.IsOpen,
		order.Hash.Hex(),
	)

	return err
}

// StoreFilledVolume updates order's filled volume
func (order *Order) StoreFilledVolume(store *store.DataStore) error {
	query := `UPDATE orders SET volume_filled=$1 WHERE order_hash=LOWER($2)`

	_, err := store.DB.Exec(
		query,
		order.VolumeFilled.String(),
		order.Hash.Hex(),
	)

	return err
}

// Close updates order's filled volume
func (order *Order) Close(store *store.DataStore) error {
	query := `UPDATE orders SET is_open=$1 WHERE order_hash=LOWER($2)`

	_, err := store.DB.Exec(
		query,
		false,
		order.Hash.Hex(),
	)

	return err
}

// NewOrder returns new instance of Order struct
func NewOrder() *Order {
	return &Order{}
}

func buildWhereConstraintFromParams(params *map[string]interface{}) string {
	var buffer bytes.Buffer

	if val, ok := (*params)["token"]; ok {
		buffer.WriteString(fmt.Sprintf(` AND token=LOWER('%s')`, val))
	}

	if val, ok := (*params)["base"]; ok {
		buffer.WriteString(fmt.Sprintf(` AND base=LOWER('%s')`, val))
	}

	if val, ok := (*params)["creator"]; ok {
		buffer.WriteString(fmt.Sprintf(` AND created_by=LOWER('%s')`, val))
	}

	if val, ok := (*params)["side"]; ok {
		isBid := false
		if val == 0 {
			isBid = true
		}
		buffer.WriteString(fmt.Sprintf(` AND is_bid=%t`, isBid))
	}

	if val, ok := (*params)["status"]; ok {
		isOpen := false
		if val == 0 {
			isOpen = true
		}
		buffer.WriteString(fmt.Sprintf(` AND is_open=%t`, isOpen))
	}

	return buffer.String()
}

// GetOrders returns the list of orders
func GetOrders(store *store.DataStore, params *map[string]interface{}) ([]Order, error) {
	constraints := buildWhereConstraintFromParams(params)
	query := fmt.Sprintf(`SELECT order_hash, token, base, price, quantity, is_bid, trunc(extract(epoch from created_at::timestamp with time zone)), created_by, volume, volume_filled FROM orders WHERE created_at <= to_timestamp($3)%s ORDER BY created_at DESC LIMIT $1 OFFSET $2`, constraints)
	rows, err := store.DB.Query(query, (*params)["count"], (*params)["start"], (*params)["before"])

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	orders := []Order{}

	for rows.Next() {
		var order Order

		err := rows.Scan(
			&order.Hash,
			&order.Token,
			&order.Base,
			&order.Price,
			&order.Quantity,
			&order.IsBid,
			&order.CreatedAt,
			&order.CreatedBy,
			&order.Volume,
			&order.VolumeFilled,
		)

		if err != nil {
			return nil, err
		}

		orders = append(orders, order)
	}

	return orders, nil
}

func executeOrderbookQuery(store *store.DataStore, query string, token string, base string) (*[]OrderbookResponseItem, error) {
	rows, err := store.DB.Query(query, token, base)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	orders := []OrderbookResponseItem{}

	for rows.Next() {
		var order OrderbookResponseItem

		err := rows.Scan(
			&order.Price,
			&order.Volume,
			&order.VolumeFilled,
		)

		if err != nil {
			return nil, err
		}

		orders = append(orders, order)
	}

	return &orders, nil
}

// GetOrderbook returns the list of buy and sell orders
func GetOrderbook(store *store.DataStore, params *map[string]interface{}) (*OrderbookResponse, error) {

	token, ok := (*params)["token"].(string)
	if !ok {
		return nil, errors.New("`token` parameter is required")
	}

	base, ok := (*params)["base"].(string)
	if !ok {
		return nil, errors.New("`base` parameter is required")
	}

	buyOrdersQuery := fmt.Sprintf(`SELECT price, sum(volume), sum(volume_filled) FROM orders 
		WHERE created_at > now() - interval '14 days' AND is_open=TRUE AND is_bid=TRUE AND token=LOWER($1) AND base=LOWER($2)
		GROUP BY price ORDER BY price DESC LIMIT 20`)

	buyOrders, err := executeOrderbookQuery(store, buyOrdersQuery, token, base)
	if err != nil {
		return nil, err
	}

	sellOrdersQuery := fmt.Sprintf(`SELECT price, sum(volume), sum(volume_filled) FROM orders 
		WHERE created_at > now() - interval '14 days' AND is_open=TRUE AND is_bid=FALSE AND token=LOWER($1) AND base=LOWER($2)
		GROUP BY price ORDER BY price ASC LIMIT 20`)

	sellOrders, err := executeOrderbookQuery(store, sellOrdersQuery, token, base)
	if err != nil {
		return nil, err
	}

	lastPrice, err := getLastTradedPrice(store, token, base)
	if err != nil {
		return nil, err
	}

	OrderbookResponse := &OrderbookResponse{
		Bids:      buyOrders,
		Asks:      sellOrders,
		LastPrice: lastPrice,
	}

	return OrderbookResponse, nil
}
