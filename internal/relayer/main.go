package relayer

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"hameid.net/cdex/dex/_abi/Exchange"
	"hameid.net/cdex/dex/_abi/HomeBridge"
	"hameid.net/cdex/dex/internal/utils"
)

type bridgeRef struct {
	client   *ethclient.Client
	instance *HomeBridge.HomeBridge
	abi      *abi.ABI
}

type exchangeRef struct {
	client   *ethclient.Client
	instance *Exchange.Exchange
	abi      *abi.ABI
}

// Relayer struct
type Relayer struct {
	networks  *utils.NetworksInfo
	contracts *utils.ContractsInfo
	bridge    *bridgeRef
	exchange  *exchangeRef
}

var channelSize = 10000

// Initialize reads and decodes ABIs to be used for communicating with chain
func (r *Relayer) Initialize() {
	fmt.Printf("\nConnecting to %s...\n", r.networks.Bridge.WebSocketProvider)
	homeClient, err := ethclient.Dial(r.networks.Bridge.WebSocketProvider)
	if err != nil {
		log.Panic(err)
	}
	bridge, err := HomeBridge.NewHomeBridge(r.contracts.Bridge.Address.Address, homeClient)
	if err != nil {
		log.Panic(err)
	}
	fmt.Printf("Decoding Bridge contract ABI...\n")
	bridgeABI, err := abi.JSON(strings.NewReader(string(HomeBridge.HomeBridgeABI)))
	if err != nil {
		log.Fatal(err)
	}
	r.bridge.client = homeClient
	r.bridge.instance = bridge
	r.bridge.abi = &bridgeABI

	fmt.Printf("\nConnecting to %s...\n", r.networks.Exchange.WebSocketProvider)
	exchangeClient, err := ethclient.Dial(r.networks.Exchange.WebSocketProvider)
	if err != nil {
		log.Panic(err)
	}
	exchange, err := Exchange.NewExchange(r.contracts.Exchange.Address.Address, exchangeClient)
	if err != nil {
		log.Panic(err)
	}
	fmt.Printf("Decoding Exchange contract ABI...\n")
	exchangeABI, err := abi.JSON(strings.NewReader(string(Exchange.ExchangeABI)))
	if err != nil {
		log.Fatal(err)
	}
	r.exchange.client = exchangeClient
	r.exchange.instance = exchange
	r.exchange.abi = &exchangeABI

	fmt.Printf("\n\nRelayer initialization successful :)\n\n")
}

// RunOnBridgeNetwork runs relayer on the bridge network
func (r *Relayer) RunOnBridgeNetwork() {
	fmt.Printf("Trying to listen events on Bridge contract %s...\n", r.contracts.Bridge.Address.Address.String())
	query := ethereum.FilterQuery{
		Addresses: []common.Address{r.contracts.Bridge.Address.Address},
		Topics:    [][]common.Hash{{r.contracts.Bridge.Topics.Deposit.Hash}},
	}

	logs := make(chan types.Log, channelSize)

	sub, err := r.bridge.client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Panic(err)
	}

	go func() {
	eventListenerLoop:
		for {
			select {
			case err := <-sub.Err():
				log.Fatal("Home Network Subcription Error:", err)

			case vLog := <-logs:
				fmt.Println("--------------------")
				// Unpack deposit event
				fmt.Println("Received `Deposit` event from Home Network")
				depositEvent := struct {
					Recipient common.Address
					Token     common.Address
					Value     *big.Int
				}{}
				err := r.bridge.abi.Unpack(&depositEvent, "Deposit", vLog.Data)
				if err != nil {
					log.Fatal("Unpack: ", err)
					continue eventListenerLoop
				}
				// depositEvent.Recipient, depositEvent.Token, depositEvent.Value, vLog.TxHash

			}
		}
	}()
}

// RunOnExchangeNetwork runs relayer on the exchange network
func (r *Relayer) RunOnExchangeNetwork() {
	fmt.Printf("Trying to listen events on Exchange contract %s...\n", r.contracts.Exchange.Address.Address.String())
	query := ethereum.FilterQuery{
		Addresses: []common.Address{r.contracts.Exchange.Address.Address},
		Topics: [][]common.Hash{
			{
				r.contracts.Exchange.Topics.BalanceUpdate.Hash,
			},
		},
	}
	logs := make(chan types.Log, channelSize)
	sub, err := r.exchange.client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Panic(err)
	}

	go func() {
	eventListenerLoop:
		for {
			select {
			case err := <-sub.Err():
				log.Fatal("Foreign Network Subcription Error:", err)

			case vLog := <-logs:
				for _, topic := range vLog.Topics {
					switch topic {
					// case r.contracts.Exchange.Topics.Deposit.Hash:
					// 	fmt.Println("Deposit")

					// case r.contracts.Exchange.Topics.Withdraw.Hash:
					// 	fmt.Println("Withdraw")

					case r.contracts.Exchange.Topics.BalanceUpdate.Hash:
						buEvent := struct {
							Token   common.Address
							User    common.Address
							Balance *big.Int
							Escrow  *big.Int
						}{}
						err := r.exchange.abi.Unpack(&buEvent, "BalanceUpdate", vLog.Data)
						if err != nil {
							log.Fatal("Unpack: ", err)
							continue eventListenerLoop
						}
						fmt.Println(buEvent.Token.Hex(), buEvent.User.Hex(), buEvent.Balance.String(), buEvent.Escrow.String())
					}
				}
				// fmt.Println("--------------------")
				// fmt.Println("Received `Withdraw` event from Foreign Network")
				// withdrawEvent := struct {
				// 	Recipient common.Address
				// 	Token     common.Address
				// 	Value     *big.Int
				// }{}
				// err := r.exchange.abi.Unpack(&withdrawEvent, "Withdraw", vLog.Data)
				// if err != nil {
				// 	log.Fatal("Unpack: ", err)
				// 	continue eventListenerLoop
				// }

				// withdrawEvent.Recipient, withdrawEvent.Token, withdrawEvent.Value, vLog.TxHash
			}
		}
	}()
}

// Quit terminates relayer instance
func (r *Relayer) Quit() {
	fmt.Printf("\nCleaning up...\n")
	fmt.Printf("\nBye bye...\n")
}

// NewRelayer creates and populates a Relayer struct object
func NewRelayer(contractsFilePath, networksFilePath string) *Relayer {
	fmt.Printf("Starting relayer...\n")
	fmt.Printf("Reading config files...\n")
	fmt.Printf("Reading %s...\n", contractsFilePath)
	// Read config files
	contractsInfo, err := utils.ReadContractsInfo(contractsFilePath)
	if err != nil {
		log.Panic(err)
	}

	fmt.Printf("Reading %s...\n", networksFilePath)
	nwInfo, err := utils.ReadNetworksInfo(networksFilePath)
	if err != nil {
		log.Panic(err)
	}
	return &Relayer{
		networks:  nwInfo,
		contracts: contractsInfo,
		bridge: &bridgeRef{
			client:   nil,
			instance: nil,
			abi:      nil,
		},
		exchange: &exchangeRef{
			client:   nil,
			instance: nil,
			abi:      nil,
		},
	}
}
