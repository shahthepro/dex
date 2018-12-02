package utils

import (
	"encoding/json"
	"os"

	"hameid.net/cdex/dex/internal/wrappers"
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
		Address wrappers.Address `json:"address"`
		Topics  struct {
			Deposit  wrappers.Hash `json:"Deposit"`
			Withdraw wrappers.Hash `json:"Withdraw"`
		} `json:"topics"`
	} `json:"bridge"`
	Exchange struct {
		Address wrappers.Address `json:"address"`
		Topics  struct {
			Deposit                    wrappers.Hash `json:"Deposit"`
			Withdraw                   wrappers.Hash `json:"Withdraw"`
			DepositConfirmation        wrappers.Hash `json:"DepositConfirmation"`
			WithdrawSignatureSubmitted wrappers.Hash `json:"WithdrawSignatureSubmitted"`
			BalanceUpdate              wrappers.Hash `json:"BalanceUpdate"`
			ReadyToWithdraw            wrappers.Hash `json:"ReadyToWithdraw"`
		} `json:"topics"`
	} `json:"exchange"`
	Orderbook struct {
		Address wrappers.Address `json:"address"`
		Topics  struct {
			// PlaceOrder  wrappers.Hash `json:"PlaceOrder"`
			PlaceBuyOrder  wrappers.Hash `json:"PlaceBuyOrder"`
			PlaceSellOrder wrappers.Hash `json:"PlaceSellOrder"`
			CancelOrder    wrappers.Hash `json:"CancelOrder"`
		} `json:"topics"`
	} `json:"orderbook"`
	OrderMatcher struct {
		Address wrappers.Address `json:"address"`
		Topics  struct {
			Trade                   wrappers.Hash `json:"Trade"`
			OrderFilledVolumeUpdate wrappers.Hash `json:"OrderFilledVolumeUpdate"`
		} `json:"topics"`
	} `json:"ordermatch"`
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
