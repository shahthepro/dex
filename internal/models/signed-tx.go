package models

import (
	"hameid.net/cdex/dex/internal/store"
	"hameid.net/cdex/dex/internal/wrappers"
)

// SignedTx record
type SignedTx struct {
	Token     *wrappers.Address   `json:"token"`
	Recipient *wrappers.Address   `json:"recipient"`
	Amount    *wrappers.BigInt    `json:"amount"`
	TxHash    *wrappers.Hash      `json:"tx_hash"`
	TxType    int                 `json:"tx_type"`
	Signer    *wrappers.Address   `json:"signer"`
	SignedAt  *wrappers.Timestamp `json:"signed_at"`
}

// SignedTxResponse record
type SignedTxResponse struct {
	Token        *wrappers.Address   `json:"token"`
	Recipient    *wrappers.Address   `json:"recipient"`
	Amount       *wrappers.BigInt    `json:"amount"`
	TxHash       *wrappers.Hash      `json:"tx_hash"`
	TxType       int                 `json:"tx_type"`
	SignCount    int                 `json:"sign_count"`
	LastSignedAt *wrappers.Timestamp `json:"last_signed_at"`
}

// Save upserts SignedTx
func (tx *SignedTx) Save(store *store.DataStore) error {
	query := `INSERT INTO signed_txs 
		(token, recipient, amount, tx_hash, tx_type, signer, signed_at)
		VALUES (LOWER($1), LOWER($2), $3, LOWER($4), $5, LOWER($6), to_timestamp($7))`

	_, err := store.DB.Exec(
		query,
		tx.Token,
		tx.Recipient,
		tx.Amount,
		tx.TxHash,
		tx.TxType,
		tx.Signer,
		tx.SignedAt,
	)

	return err
}

// GetRecentSignedTxs returns recent token txs for a given address, if any.
func GetRecentSignedTxs(store *store.DataStore, address *wrappers.Address) ([]SignedTxResponse, error) {
	rows, err := store.DB.Query(
		`SELECT 
			token, recipient, amount, tx_hash, tx_type, COUNT(signer), last(signed_at) as last_signed_at 
		FROM signed_txs
		WHERE 
			signed_at <= now() - interval '14 days' AND 
			recipient=LOWER($1) 
		GROUP BY tx_hash ORDER BY signed_at DESC`, address.Hex())

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	txs := []SignedTxResponse{}

	for rows.Next() {
		var tx SignedTxResponse

		err := rows.Scan(
			&tx.Recipient,
			&tx.Token,
			&tx.TxHash,
			&tx.TxType,
			&tx.SignCount,
			&tx.LastSignedAt,
		)

		if err != nil {
			return nil, err
		}

		txs = append(txs, tx)
	}

	return txs, nil
}

// NewSignedDepositTx creates new instance of signed deposit transaction
func NewSignedDepositTx() *SignedTx {
	return &SignedTx{
		TxType: 0,
	}
}

// NewSignedWithdrawTx creates new instance of signed withdraw transaction
func NewSignedWithdrawTx() *SignedTx {
	return &SignedTx{
		TxType: 1,
	}
}
