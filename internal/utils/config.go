package utils

import (
	"encoding/json"
	"os"

	"hameid.net/cdex/dex/internal/helpers"
)

type NetworksInfo struct {
	Bridge struct {
		WebSocketProvider string `json:"wsProvider"`
	} `json:"bridge"`
	Exchange struct {
		WebSocketProvider string `json:"wsProvider"`
	} `json:"exchange"`
	// Authorities []string `json:"authorities"`
}

type ContractsInfo struct {
	Bridge struct {
		Address helpers.Address `json:"address"`
		Topics  struct {
			Deposit  helpers.Hash `json:"Deposit"`
			Withdraw helpers.Hash `json:"Withdraw"`
		} `json:"topics"`
	} `json:"bridge"`
	Exchange struct {
		Address helpers.Address `json:"address"`
		Topics  struct {
			Deposit                    helpers.Hash `json:"Deposit"`
			Withdraw                   helpers.Hash `json:"Withdraw"`
			Transfer                   helpers.Hash `json:"Transfer"`
			DepositConfirmation        helpers.Hash `json:"DepositConfirmation"`
			WithdrawSignatureSubmitted helpers.Hash `json:"WithdrawSignatureSubmitted"`
			CollectedSignatures        helpers.Hash `json:"CollectedSignatures"`
			PlaceOrder                 helpers.Hash `json:"PlaceOrder"`
			CancelOrder                helpers.Hash `json:"CancelOrder"`
		} `json:"topics"`
	} `json:"exchange"`
}

func ReadNetworksInfo(filePath string) (*NetworksInfo, error) {
	file, err := os.Open(filePath)

	if err != nil {
		return nil, err
	}

	defer file.Close()

	var nwInfo NetworksInfo
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&nwInfo)

	if err != nil {
		return nil, err
	}

	return &nwInfo, err
}

func ReadContractsInfo(filePath string) (*ContractsInfo, error) {
	file, err := os.Open(filePath)

	if err != nil {
		return nil, err
	}

	defer file.Close()

	var conf ContractsInfo
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&conf)

	if err != nil {
		return nil, err
	}

	return &conf, nil
}
