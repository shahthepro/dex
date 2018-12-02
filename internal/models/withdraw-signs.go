package models

import (
	"hameid.net/cdex/dex/internal/store"
	"hameid.net/cdex/dex/internal/wrappers"
)

// WithdrawSign record
type WithdrawSign struct {
	TxHash    string              `json:"tx_hash"`
	Message   string              `json:"message_data"`
	Signature string              `json:"message_sign"`
	Signer    *wrappers.Address   `json:"signer"`
	SignedAt  *wrappers.Timestamp `json:"signed_at"`
}

// Save upserts WithdrawSign
func (withdrawSign *WithdrawSign) Save(store *store.DataStore) error {
	query := `INSERT INTO withdraw_signs 
		(message_data, message_sign, signer, signed_at, tx_hash)
		VALUES (LOWER($1), $2, LOWER($3), to_timestamp($4), LOWER($5))`

	_, err := store.DB.Exec(
		query,
		withdrawSign.Message,
		withdrawSign.Signature,
		withdrawSign.Signer,
		withdrawSign.SignedAt,
		withdrawSign.TxHash,
	)

	return err
}

// GetSignsOfWithdrawMessage returns signatures of authorities for the given message data
func GetSignsOfWithdrawMessage(store *store.DataStore, txHash *wrappers.Hash) ([]WithdrawSign, error) {
	rows, err := store.DB.Query(
		`SELECT tx_hash, message_data, message_sign, signer, signed_at 
		FROM withdraw_signs
		WHERE tx_hash=$1`, txHash)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	signs := []WithdrawSign{}

	for rows.Next() {
		var sign WithdrawSign

		err := rows.Scan(
			&sign.TxHash,
			&sign.Message,
			&sign.Signature,
			&sign.Signer,
			&sign.SignedAt,
		)

		if err != nil {
			return nil, err
		}

		signs = append(signs, sign)
	}

	return signs, nil
}

// NewWithdrawSign creates new instance of withdraw sign
func NewWithdrawSign() *WithdrawSign {
	return &WithdrawSign{}
}
