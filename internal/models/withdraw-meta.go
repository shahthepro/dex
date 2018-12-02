package models

import (
	"hameid.net/cdex/dex/internal/store"
	"hameid.net/cdex/dex/internal/wrappers"
)

const (
	WITHDRAW_STATUS_REQUESTED = 0
	WITHDRAW_STATUS_SIGNED    = 1
	WITHDRAW_STATUS_PROCESSED = 2
)

// WithdrawMeta record
type WithdrawMeta struct {
	Token     *wrappers.Address `json:"token"`
	Recipient *wrappers.Address `json:"recipient"`
	Amount    *wrappers.BigInt  `json:"amount"`
	TxHash    *wrappers.Hash    `json:"tx_hash"`
	Message   string            `json:"message_data"`
	Status    int               `json:"withdraw_status"`
}

// Save inserts WithdrawMeta
func (withdrawMeta *WithdrawMeta) Save(store *store.DataStore) error {
	query := `INSERT INTO withdraw_meta 
		(token, recipient, amount, tx_hash, message_data, withdraw_status)
		VALUES (LOWER($1), LOWER($2), $3, LOWER($4), $5, $6)`

	_, err := store.DB.Exec(
		query,
		withdrawMeta.Token,
		withdrawMeta.Recipient,
		withdrawMeta.Amount.String(),
		withdrawMeta.TxHash,
		withdrawMeta.Message,
		withdrawMeta.Status,
	)

	return err
}

// UpdateStatus updates status
func (withdrawMeta *WithdrawMeta) UpdateStatus(store *store.DataStore) error {
	query := `UPDATE withdraw_meta 
		SET withdraw_status=$2
		WHERE message_data=$1`

	_, err := store.DB.Exec(
		query,
		withdrawMeta.Message,
		withdrawMeta.Status,
	)

	return err
}

// Get returns withdraw meta
func (withdrawMeta *WithdrawMeta) Get(store *store.DataStore) error {
	row := store.DB.QueryRow(
		`SELECT token, recipient, amount, tx_hash, message_data, withdraw_status 
		FROM withdraw_meta 
		WHERE message_data=$1`, withdrawMeta.Message)

	err := row.Scan(
		&withdrawMeta.Token,
		&withdrawMeta.Recipient,
		&withdrawMeta.Amount,
		&withdrawMeta.TxHash,
		&withdrawMeta.Message,
		&withdrawMeta.Status,
	)

	return err
}

// GetUnprocessedWithdrawRequests returns open and signed withdraw requests
func GetUnprocessedWithdrawRequests(store *store.DataStore, address *wrappers.Address) ([]WithdrawMeta, error) {
	rows, err := store.DB.Query(
		`SELECT token, recipient, amount, tx_hash, message_data, withdraw_status 
		FROM withdraw_meta 
		WHERE recipient=LOWER($1) AND withdraw_status <= $2`, address.Hex(), WITHDRAW_STATUS_PROCESSED)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	requests := []WithdrawMeta{}

	for rows.Next() {
		var request WithdrawMeta

		err := rows.Scan(
			&request.Token,
			&request.Recipient,
			&request.Amount,
			&request.TxHash,
			&request.Message,
			&request.Status,
		)

		if err != nil {
			return nil, err
		}

		requests = append(requests, request)
	}

	return requests, nil
}

// NewWithdrawMeta creates new instance of withdraw sign
func NewWithdrawMeta() *WithdrawMeta {
	return &WithdrawMeta{}
}
