package relayer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/go-redis/redis"

	"hameid.net/cdex/dex/internal/store"
	"hameid.net/cdex/dex/internal/wrappers"

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

type bridgeRef struct {
	client   *ethclient.Client
	instance *HomeBridge.HomeBridge
	abi      *abi.ABI
}

type exchangeRef struct {
	client          *ethclient.Client
	exchangeABI     *abi.ABI
	orderbookABI    *abi.ABI
	ordermatcherABI *abi.ABI
}

// Relayer struct
type Relayer struct {
	networks    *utils.NetworksInfo
	contracts   *utils.ContractsInfo
	bridge      *bridgeRef
	exchange    *exchangeRef
	store       *store.DataStore
	redisClient *redis.Client
}

type redisChannelMessage struct {
	MessageType string      `json:"messageType"`
	Payload     interface{} `json:"messageContent"`
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
	r.exchange.exchangeABI = &exchangeABI
	r.exchange.orderbookABI = &orderbookABI
	r.exchange.ordermatcherABI = &ordermatcherABI

	fmt.Printf("\n")
	r.store.Initialize()

	fmt.Printf("\n\nRelayer initialization successful :)\n\n")
}

// RunOnBridgeNetwork runs relayer on the home network
func (r *Relayer) RunOnBridgeNetwork() {
	fmt.Printf("Trying to listen events on Bridge contract %s...\n", v.contracts.Bridge.Address.Address.String())
	query := ethereum.FilterQuery{
		Addresses: []common.Address{r.contracts.Bridge.Address.Address},
		Topics:    [][]common.Hash{{r.contracts.Bridge.Topics.Withdraw.Hash}},
	}

	logs := make(chan types.Log, channelSize)

	sub, err := v.bridge.client.SubscribeFilterLogs(context.Background(), query, logs)
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
				// Unpack withdraw event
				fmt.Println("Received `Withdraw` event from Home Network")
				withdrawEvent := struct {
					Recipient       common.Address
					Token           common.Address
					Value           *big.Int
					TransactionHash common.Hash
				}{}
				err := v.bridge.abi.Unpack(&withdrawEvent, "Withdraw", vLog.Data)
				if err != nil {
					log.Fatal("Unpack: ", err)
					continue eventListenerLoop
				}

				message := utils.SerializeWithdrawalMessage(withdrawEvent.Recipient, withdrawEvent.Token, withdrawEvent.Value, withdrawEvent.TransactionHash)

				_ = message

				fmt.Println("Withdraw processed:", tx.Hash().Hex())
				fmt.Println("--------------------")
			}
		}
	}()
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
				r.contracts.Orderbook.Topics.PlaceBuyOrder.Hash,
				r.contracts.Orderbook.Topics.PlaceSellOrder.Hash,
				r.contracts.Orderbook.Topics.CancelOrder.Hash,
				r.contracts.OrderMatcher.Topics.Trade.Hash,
				r.contracts.OrderMatcher.Topics.OrderFilledVolumeUpdate.Hash,
				r.contracts.Exchange.Topics.CollectedSignatures.Hash,
				r.contracts.Exchange.Topics.WithdrawSignatureSubmitted.Hash,
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
					case r.contracts.Orderbook.Topics.PlaceBuyOrder.Hash:
						r.placeOrderLogCallback(vLog, true)
					case r.contracts.Orderbook.Topics.PlaceSellOrder.Hash:
						r.placeOrderLogCallback(vLog, false)
					case r.contracts.Orderbook.Topics.CancelOrder.Hash:
						r.cancelOrderLogCallback(vLog)
					case r.contracts.OrderMatcher.Topics.Trade.Hash:
						r.tradeLogCallback(vLog)
					case r.contracts.OrderMatcher.Topics.OrderFilledVolumeUpdate.Hash:
						r.updateFilledVolumeLogCallback(vLog)
					case r.contracts.Exchange.Topics.WithdrawSignatureSubmitted.Hash:
						r.withdrawSignSubmittedCallback(vLog)
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
func NewRelayer(contractsFilePath, networksFilePath, connectionString, redisHostAddress, redisPassword string) *Relayer {
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
		store:       store.NewDataStore(connectionString),
		redisClient: store.NewRedisClient(redisHostAddress, redisPassword),
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
		Token:         wrappers.WrapAddress(&buEvent.Token),
		Address:       wrappers.WrapAddress(&buEvent.User),
		Balance:       wrappers.WrapBigInt(buEvent.Balance),
		EscrowBalance: wrappers.WrapBigInt(buEvent.Escrow),
	}
	err = wallet.Save(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
	}
	fmt.Printf("\n\nUpdated %s token balance of wallet %s\n", buEvent.Token.Hex(), buEvent.User.Hex())
}

func (r *Relayer) placeOrderLogCallback(vLog types.Log, isBid bool) {
	placeOrderEvent := struct {
		OrderHash common.Hash
		Token     common.Address
		Base      common.Address
		Price     *big.Int
		Quantity  *big.Int
		// IsBid     bool
		Owner     common.Address
		Timestamp *big.Int
	}{}
	eventName := "PlaceBuyOrder"
	if !isBid {
		eventName = "PlaceSellOrder"
	}
	err := r.exchange.orderbookABI.Unpack(&placeOrderEvent, eventName, vLog.Data)
	if err != nil {
		log.Fatal("Unpack: ", err)
		return
	}
	order := models.Order{
		Hash:      wrappers.WrapHash(&placeOrderEvent.OrderHash),
		Token:     wrappers.WrapAddress(&placeOrderEvent.Token),
		Base:      wrappers.WrapAddress(&placeOrderEvent.Base),
		Price:     wrappers.WrapBigInt(placeOrderEvent.Price),
		Quantity:  wrappers.WrapBigInt(placeOrderEvent.Quantity),
		IsBid:     isBid, // placeOrderEvent.IsBid.Cmp(big.NewInt(1)) == 0,
		CreatedBy: wrappers.WrapAddress(&placeOrderEvent.Owner),
		CreatedAt: wrappers.WrapTimestamp((*(placeOrderEvent.Timestamp)).Uint64()),
		Volume:    wrappers.WrapBigInt(big.NewInt(0).Mul(placeOrderEvent.Price, placeOrderEvent.Quantity)),
		IsOpen:    true,
	}
	err = order.Save(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
	}

	channelKey := strings.ToLower(order.Token.Hex() + "/" + order.Base.Hex())
	pubCache := &redisChannelMessage{
		MessageType: "NEW_ORDER",
		Payload:     order,
	}
	marshalledResp, err := json.Marshal(pubCache)
	if err != nil {
		fmt.Println("MARSHAL:", err)
	}
	r.redisClient.Publish(channelKey, marshalledResp)

	fmt.Printf("\n\nReceived order at %s for pair %s/%s\n", placeOrderEvent.Timestamp.String(), placeOrderEvent.Token.Hex(), placeOrderEvent.Base.Hex())
}

func (r *Relayer) cancelOrderLogCallback(vLog types.Log) {
	cancelOrderEvent := struct {
		OrderHash common.Hash
	}{}
	err := r.exchange.orderbookABI.Unpack(&cancelOrderEvent, "CancelOrder", vLog.Data)
	if err != nil {
		log.Fatal("Unpack: ", err)
		return
	}
	order := &models.Order{
		Hash: wrappers.WrapHash(&cancelOrderEvent.OrderHash),
	}

	err = order.Close(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
		return
	}

	err = order.Get(r.store)
	if err != nil {
		log.Fatal("Cannot get order: ", err)
		return
	}

	channelKey := strings.ToLower(order.Token.Hex() + "/" + order.Base.Hex())
	pubCache := &redisChannelMessage{
		MessageType: "CANCEL_ORDER",
		Payload:     order,
	}
	marshalledResp, err := json.Marshal(pubCache)
	if err != nil {
		fmt.Println("MARSHAL:", err)
	}
	r.redisClient.Publish(channelKey, marshalledResp)

	fmt.Printf("\n\nOrder cancelled/filled %s\n", cancelOrderEvent.OrderHash.Hex())
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
		Hash: wrappers.WrapHash(&tradeEvent.SellOrderHash),
	}
	err = sellOrder.Get(r.store)
	if err != nil {
		log.Fatal("Cannot get sell order: ", err)
		return
	}

	// buyOrder := &models.Order{
	// 	Hash: wrappers.WrapHash(&tradeEvent.BuyOrderHash),
	// }
	// err = buyOrder.Get(r.store)
	// if err != nil {
	// 	log.Fatal("Cannot get buy order: ", err)
	// 	return
	// }

	trade := models.Trade{
		BuyOrderHash:  wrappers.WrapHash(&tradeEvent.BuyOrderHash),
		SellOrderHash: wrappers.WrapHash(&tradeEvent.SellOrderHash),
		Volume:        wrappers.WrapBigInt(tradeEvent.Volume),
		TradedAt:      (*(tradeEvent.Timestamp)).Uint64(),
		TxHash:        wrappers.WrapHash(&vLog.TxHash),
		Token:         sellOrder.Token,
		Base:          sellOrder.Base,
		Price:         sellOrder.Price,
	}
	err = trade.Save(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
	}

	channelKey := strings.ToLower(trade.Token.Hex() + "/" + trade.Base.Hex())
	pubCache := &redisChannelMessage{
		MessageType: "TRADE",
		Payload:     trade,
	}
	marshalledResp, err := json.Marshal(pubCache)
	if err != nil {
		fmt.Println("MARSHAL:", err)
	}
	r.redisClient.Publish(channelKey, marshalledResp)

	fmt.Printf("\n\nReceived order match for %s/%s\n", tradeEvent.BuyOrderHash.Hex(), tradeEvent.SellOrderHash.Hex())
}

func (r *Relayer) updateFilledVolumeLogCallback(vLog types.Log) {
	updateFilledVolumeEvent := struct {
		OrderHash common.Hash
		Volume    *big.Int
	}{}
	err := r.exchange.ordermatcherABI.Unpack(&updateFilledVolumeEvent, "OrderFilledVolumeUpdate", vLog.Data)
	if err != nil {
		log.Fatal("Unpack: ", err)
		return
	}
	order := &models.Order{
		Hash: wrappers.WrapHash(&updateFilledVolumeEvent.OrderHash),
	}
	order.Get(r.store)
	order.VolumeFilled = wrappers.WrapBigInt(updateFilledVolumeEvent.Volume)

	err = order.Update(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
		return
	}

	channelKey := strings.ToLower(order.Token.Hex() + "/" + order.Base.Hex())
	pubCache := &redisChannelMessage{
		MessageType: "ORDER_FILL",
		Payload:     order,
	}
	marshalledResp, err := json.Marshal(pubCache)
	if err != nil {
		fmt.Println("MARSHAL:", err)
	}
	r.redisClient.Publish(channelKey, marshalledResp)

	fmt.Printf("\n\nUpdate filled volume of order %s to %s\n", updateFilledVolumeEvent.OrderHash.Hex(), updateFilledVolumeEvent.Volume.String())
}

func (r *Relayer) withdrawSignSubmittedCallback(vLog types.Log) {
	_ = vLog
	// r.exchange.exchangeABI.Methods.
}
