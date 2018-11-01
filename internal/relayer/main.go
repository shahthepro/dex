package relayer

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"

	"hameid.net/cdex/dex/internal/store"

	"hameid.net/cdex/dex/internal/helpers"
	"hameid.net/cdex/dex/internal/models"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"hameid.net/cdex/dex/_abi/DEXChain"
	"hameid.net/cdex/dex/_abi/OrderMatchContract"
	"hameid.net/cdex/dex/_abi/Orderbook"
	"hameid.net/cdex/dex/internal/utils"
)

// type bridgeRef struct {
// 	client   *ethclient.Client
// 	instance *HomeBridge.HomeBridge
// 	abi      *abi.ABI
// }

type exchangeRef struct {
	client          *ethclient.Client
	exchangeABI     *abi.ABI
	orderbookABI    *abi.ABI
	ordermatcherABI *abi.ABI
}

// Relayer struct
type Relayer struct {
	networks  *utils.NetworksInfo
	contracts *utils.ContractsInfo
	// bridge    *bridgeRef
	exchange *exchangeRef
	store    *store.DataStore
}

var channelSize = 10000

// Initialize reads and decodes ABIs to be used for communicating with chain
func (r *Relayer) Initialize() {
	// fmt.Printf("\nConnecting to %s...\n", r.networks.Bridge.WebSocketProvider)
	// homeClient, err := ethclient.Dial(r.networks.Bridge.WebSocketProvider)
	// if err != nil {
	// 	log.Panic(err)
	// }
	// bridge, err := HomeBridge.NewHomeBridge(r.contracts.Bridge.Address.Address, homeClient)
	// if err != nil {
	// 	log.Panic(err)
	// }
	// fmt.Printf("Decoding Bridge contract ABI...\n")
	// bridgeABI, err := abi.JSON(strings.NewReader(string(HomeBridge.HomeBridgeABI)))
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// r.bridge.client = homeClient
	// r.bridge.instance = bridge
	// r.bridge.abi = &bridgeABI

	fmt.Printf("\nConnecting to %s...\n", r.networks.Exchange.WebSocketProvider)
	exchangeClient, err := ethclient.Dial(r.networks.Exchange.WebSocketProvider)
	if err != nil {
		log.Panic(err)
	}
	// exchange, err := DEXChain.NewDEXChain(r.contracts.Exchange.Address.Address, exchangeClient)
	// if err != nil {
	// 	log.Panic(err)
	// }
	fmt.Printf("Decoding Exchange contract ABI...\n")
	exchangeABI, err := abi.JSON(strings.NewReader(string(DEXChain.DEXChainABI)))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Decoding Orderbook contract ABI...\n")
	orderbookABI, err := abi.JSON(strings.NewReader(string(Orderbook.OrderbookABI)))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Decoding Order Matcher contract ABI...\n")
	ordermatcherABI, err := abi.JSON(strings.NewReader(string(OrderMatchContract.OrderMatchContractABI)))
	if err != nil {
		log.Fatal(err)
	}

	r.exchange.client = exchangeClient
	// r.exchange.exchangeInstance = exchange
	r.exchange.exchangeABI = &exchangeABI
	r.exchange.orderbookABI = &orderbookABI
	r.exchange.ordermatcherABI = &ordermatcherABI

	fmt.Printf("\n")
	r.store.Initialize()

	fmt.Printf("\n\nRelayer initialization successful :)\n\n")
}

// RunOnExchangeNetwork runs relayer on the exchange network
func (r *Relayer) RunOnExchangeNetwork() {
	fmt.Printf("Trying to listen events on Exchange contract %s...\n", r.contracts.Exchange.Address.Address.String())
	query := ethereum.FilterQuery{
		Addresses: []common.Address{
			r.contracts.Exchange.Address.Address,
			r.contracts.Orderbook.Address.Address,
			r.contracts.OrderMatcher.Address.Address,
		},
		Topics: [][]common.Hash{
			{
				r.contracts.Exchange.Topics.BalanceUpdate.Hash,
				r.contracts.Orderbook.Topics.PlaceOrder.Hash,
				r.contracts.Orderbook.Topics.CancelOrder.Hash,
				r.contracts.OrderMatcher.Topics.Trade.Hash,
			},
		},
	}
	logs := make(chan types.Log, channelSize)
	sub, err := r.exchange.client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Panic(err)
	}

	go func() {
		for {
			select {
			case err := <-sub.Err():
				log.Fatal("Foreign Network Subcription Error:", err)

			case vLog := <-logs:
				for _, topic := range vLog.Topics {
					switch topic {
					case r.contracts.Exchange.Topics.BalanceUpdate.Hash:
						r.balanceUpdateLogCallback(vLog)
					case r.contracts.Orderbook.Topics.PlaceOrder.Hash:
						r.placeOrderLogCallback(vLog)
					case r.contracts.Orderbook.Topics.CancelOrder.Hash:
						fmt.Println("\n\nCancelOrder")
					case r.contracts.OrderMatcher.Topics.Trade.Hash:
						r.tradeLogCallback(vLog)
						// fmt.Println("\n\nTrade")
					}
				}
			}
		}
	}()
}

// Quit terminates relayer instance
func (r *Relayer) Quit() {
	fmt.Printf("\nCleaning up...\n")
	r.store.Close()
	fmt.Printf("\nBye bye...\n")
}

// NewRelayer creates and populates a Relayer struct object
func NewRelayer(contractsFilePath, networksFilePath, connectionString string) *Relayer {
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
		// bridge: &bridgeRef{
		// 	client:   nil,
		// 	instance: nil,
		// 	abi:      nil,
		// },
		exchange: &exchangeRef{
			client: nil,
			// exchangeInstance: nil,
			exchangeABI:     nil,
			orderbookABI:    nil,
			ordermatcherABI: nil,
		},
		store: store.NewDataStore(connectionString),
	}
}

func (r *Relayer) balanceUpdateLogCallback(vLog types.Log) {
	buEvent := struct {
		Token   common.Address
		User    common.Address
		Balance *big.Int
		Escrow  *big.Int
	}{}
	err := r.exchange.exchangeABI.Unpack(&buEvent, "BalanceUpdate", vLog.Data)
	if err != nil {
		log.Fatal("Unpack: ", err)
		return
	}
	wallet := models.Wallet{
		Token:         &helpers.Address{buEvent.Token},
		Address:       &helpers.Address{buEvent.User},
		Balance:       &helpers.BigInt{*buEvent.Balance},
		EscrowBalance: &helpers.BigInt{*buEvent.Escrow},
	}
	err = wallet.Save(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
	}
	fmt.Printf("\n\nUpdated %s token balance of wallet %s\n", buEvent.Token.Hex(), buEvent.User.Hex())
}

func (r *Relayer) placeOrderLogCallback(vLog types.Log) {
	placeOrderEvent := struct {
		OrderHash common.Hash
		Token     common.Address
		Base      common.Address
		Price     *big.Int
		Quantity  *big.Int
		IsBid     bool
		Owner     common.Address
		Timestamp *big.Int
	}{}
	err := r.exchange.orderbookABI.Unpack(&placeOrderEvent, "PlaceOrder", vLog.Data)
	if err != nil {
		log.Fatal("Unpack: ", err)
		return
	}
	order := models.Order{
		Hash:      &helpers.Hash{placeOrderEvent.OrderHash},
		Token:     &helpers.Address{placeOrderEvent.Token},
		Base:      &helpers.Address{placeOrderEvent.Base},
		Price:     &helpers.BigInt{*placeOrderEvent.Price},
		Quantity:  &helpers.BigInt{*placeOrderEvent.Quantity},
		IsBid:     placeOrderEvent.IsBid,
		CreatedBy: &helpers.Address{placeOrderEvent.Owner},
		CreatedAt: (*(placeOrderEvent.Timestamp)).Uint64(),
		Volume:    &helpers.BigInt{*big.NewInt(0).Mul(placeOrderEvent.Price, placeOrderEvent.Quantity)},
	}
	err = order.Save(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
	}
	fmt.Printf("\n\nReceived order at %s for pair %s/%s\n", placeOrderEvent.Timestamp.String(), placeOrderEvent.Token.Hex(), placeOrderEvent.Base.Hex())
}

func (r *Relayer) tradeLogCallback(vLog types.Log) {
	tradeEvent := struct {
		BuyOrderHash  common.Hash
		SellOrderHash common.Hash
		Volume        *big.Int
		Timestamp     *big.Int
	}{}
	err := r.exchange.ordermatcherABI.Unpack(&tradeEvent, "Trade", vLog.Data)
	if err != nil {
		log.Fatal("Unpack: ", err)
		return
	}
	sellOrder := &models.Order{
		Hash: &helpers.Hash{tradeEvent.SellOrderHash},
	}
	err = sellOrder.Get(r.store)
	if err != nil {
		log.Fatal("Cannot get sell order: ", err)
		return
	}

	trade := models.Trade{
		BuyOrderHash:  &helpers.Hash{tradeEvent.BuyOrderHash},
		SellOrderHash: &helpers.Hash{tradeEvent.SellOrderHash},
		Volume:        &helpers.BigInt{*tradeEvent.Volume},
		TradedAt:      (*(tradeEvent.Timestamp)).Uint64(),
		TxHash:        &helpers.Hash{vLog.TxHash},
		Token:         sellOrder.Token,
		Base:          sellOrder.Base,
		Price:         sellOrder.Price,
	}
	err = trade.Save(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
	}
	fmt.Printf("\n\nReceived order match for %s/%s\n", tradeEvent.BuyOrderHash.Hex(), tradeEvent.SellOrderHash.Hex())
}
