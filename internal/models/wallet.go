package models

import (
	"database/sql"

	"hameid.net/cdex/dex/internal/store"
	"hameid.net/cdex/dex/internal/wrappers"
)

// Wallet record
type Wallet struct {
	Address       *wrappers.Address `json:"wallet"`
	Token         *wrappers.Address `json:"token"`
	Balance       *wrappers.BigInt  `json:"balance"`
	EscrowBalance *wrappers.BigInt  `json:"escrow"`
}

// Save upserts Wallet
func (wallet *Wallet) Save(store *store.DataStore) error {
	query := `INSERT INTO wallet_balances (
		wallet, token, balance, escrow)
		VALUES (LOWER($1), LOWER($2), $3, $4)
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
		VALUES (LOWER($1), LOWER($2), $3, $4)
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
		VALUES (LOWER($1), LOWER($2), $3, $4)
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
func (wallet *Wallet) GetBalance(store *store.DataStore) error {
	row := store.DB.QueryRow(
		`SELECT balance, escrow FROM wallet_balances 
		WHERE wallet=LOWER($1) AND token=LOWER($2)`, wallet.Address.Hex(), wallet.Token.Hex())

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
func GetTokenBalancesForWallet(store *store.DataStore, address *wrappers.Address) ([]Wallet, error) {
	rows, err := store.DB.Query(
		`SELECT wallet, token, balance, escrow FROM wallet_balances 
		WHERE wallet=LOWER($1) AND (balance > 0 OR escrow > 0)`, address.Hex())

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

// NewWallet creates new instance of address/wallet pair
func NewWallet(address *wrappers.Address, token *wrappers.Address) *Wallet {
	return &Wallet{
		Address: address,
		Token:   token,
	}
}
