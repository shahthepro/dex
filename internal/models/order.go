package models

import (
	"bytes"
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

// Get scans the order by hash from database
func (order *Order) Get(store *store.DataStore) error {
	query := `SELECT order_hash, token, base, price, quantity, is_bid, trunc(extract(epoch from created_at::timestamp with time zone)), created_by, volume, volume_filled FROM orders WHERE order_hash=$1`

	row := store.DB.QueryRow(query, order.Hash)

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
	)

	return err
}

// Update order details
func (order *Order) Update(store *store.DataStore) error {
	query := `UPDATE orders SET volume_filled=$2, is_open=$3 WHERE order_hash=$1`

	if order.Volume.Cmp(&order.VolumeFilled.Int) == 0 {
		order.IsOpen = false
	}

	_, err := store.DB.Exec(
		query,
		order.Hash,
		order.VolumeFilled.String(),
		order.IsOpen,
	)

	return err
}

// StoreFilledVolume updates order's filled volume
func (order *Order) StoreFilledVolume(store *store.DataStore) error {
	query := `UPDATE orders SET volume_filled=$1 WHERE order_hash=$2`

	_, err := store.DB.Exec(
		query,
		order.VolumeFilled.String(),
		order.Hash,
	)

	return err
}

// Close updates order's filled volume
func (order *Order) Close(store *store.DataStore) error {
	query := `UPDATE orders SET is_open=$1 WHERE order_hash=$2`

	_, err := store.DB.Exec(
		query,
		false,
		order.Hash,
	)

	return err
}

// NewOrder returns new instance of Order struct
func NewOrder() *Order {
	return &Order{}
}

// GetOrders returns the list of orders
func GetOrders(store *store.DataStore, params map[string]interface{}) ([]Order, error) {
	var buffer bytes.Buffer

	if val, ok := params["token"]; ok {
		buffer.WriteString(fmt.Sprintf(` AND token='%s'`, val))
	}

	if val, ok := params["base"]; ok {
		buffer.WriteString(fmt.Sprintf(` AND base='%s'`, val))
	}

	if val, ok := params["side"]; ok {
		isBid := false
		if val == 0 {
			isBid = true
		}
		buffer.WriteString(fmt.Sprintf(` AND is_bid=%t`, isBid))
	}

	if val, ok := params["status"]; ok {
		isOpen := false
		if val == 0 {
			isOpen = true
		}
		buffer.WriteString(fmt.Sprintf(` AND is_open=%t`, isOpen))
	}

	query := fmt.Sprintf(`SELECT order_hash, token, base, price, quantity, is_bid, trunc(extract(epoch from created_at::timestamp with time zone)), created_by, volume, volume_filled FROM orders WHERE created_at <= to_timestamp($3)%s ORDER BY created_at DESC LIMIT $1 OFFSET $2`, buffer.String())
	rows, err := store.DB.Query(query, params["count"], params["start"], params["before"])

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
