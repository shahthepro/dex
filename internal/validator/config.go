package validator

import (
	"encoding/json"
	"os"
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
		Address string `json:"address"`
		Topics  struct {
			Deposit  string `json:"Deposit"`
			Withdraw string `json:"Withdraw"`
		} `json:"topics"`
	} `json:"bridge"`
	Exchange struct {
		Address string `json:"address"`
		Topics  struct {
			Deposit                    string `json:"Deposit"`
			Withdraw                   string `json:"Withdraw"`
			Transfer                   string `json:"Transfer"`
			DepositConfirmation        string `json:"DepositConfirmation"`
			WithdrawSignatureSubmitted string `json:"WithdrawSignatureSubmitted"`
			CollectedSignatures        string `json:"CollectedSignatures"`
			PlaceOrder                 string `json:"PlaceOrder"`
			CancelOrder                string `json:"CancelOrder"`
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
