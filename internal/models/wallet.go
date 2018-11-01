package models

import (
	"database/sql"

	"hameid.net/cdex/dex/internal/helpers"
	"hameid.net/cdex/dex/internal/store"
)

// Wallet record
type Wallet struct {
	Address       *helpers.Address `json:"wallet"`
	Token         *helpers.Address `json:"token"`
	Balance       *helpers.BigInt  `json:"balance"`
	EscrowBalance *helpers.BigInt  `json:"escrow"`
}

// Save upserts Wallet
func (wallet *Wallet) Save(store *store.DataStore) error {
	query := `INSERT INTO wallet_balances (
		wallet, token, balance, escrow)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (wallet, token) DO UPDATE
		SET balance = $5, escrow = $6`

	_, err := store.DB.Exec(
		query,
		wallet.Address,
		wallet.Token,
		wallet.Balance.String(),
		wallet.EscrowBalance.String(),
		wallet.Balance.String(),
		wallet.EscrowBalance.String(),
	)

	return err
}

// UpdateBalance updates balance
func (wallet *Wallet) UpdateBalance(store *store.DataStore) error {
	query := `INSERT INTO wallet_balances (
		wallet, token, balance, escrow)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (wallet, token) DO UPDATE
		SET balance = $5`

	_, err := store.DB.Exec(
		query,
		wallet.Address.Hex(),
		wallet.Token.Hex(),
		wallet.Balance.String(),
		wallet.EscrowBalance.String(),
		wallet.Balance.String(),
	)

	return err
}

// UpdateEscrowBalance updates escrow balance
func (wallet *Wallet) UpdateEscrowBalance(store *store.DataStore) error {
	query := `INSERT INTO wallet_balances (
		wallet, token, balance, escrow)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (wallet, token) DO UPDATE
		SET escrow = $5`

	_, err := store.DB.Exec(
		query,
		wallet.Address,
		wallet.Token,
		wallet.Balance,
		wallet.EscrowBalance,
		wallet.EscrowBalance,
	)

	return err
}

// GetBalance returns balance of wallet/token
func (wallet *Wallet) GetBalance(store *store.DataStore, user *helpers.Address, token *helpers.Address) error {
	row := store.DB.QueryRow(
		`SELECT balance, escrow FROM wallet_balances 
		WHERE wallet=$1 AND token=$2`, user.Hex(), token.Hex())

	err := row.Scan(
		&wallet.Balance,
		&wallet.EscrowBalance,
	)

	switch err {
	case sql.ErrNoRows:
	case nil:
		return nil
		// default:
		// 	return err
	}

	return err
}

// GetTokenBalancesForWallet returns all token balances for a given address, if any.
func GetTokenBalancesForWallet(store *store.DataStore, address *helpers.Address) ([]Wallet, error) {
	rows, err := store.DB.Query(
		`SELECT wallet, token, balance, escrow FROM wallet_balances 
		WHERE wallet=$1 AND (balance > 0 OR escrow > 0)`, address.Hex())

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	wallets := []Wallet{}

	for rows.Next() {
		var wallet Wallet

		err := rows.Scan(
			&wallet.Address,
			&wallet.Token,
			&wallet.Balance,
			&wallet.EscrowBalance,
		)

		if err != nil {
			return nil, err
		}

		wallets = append(wallets, wallet)
	}

	return wallets, nil
}
