package relayer

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"

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
				// r.contracts.Orderbook.Topics.PlaceOrder.Hash,
				r.contracts.Orderbook.Topics.PlaceBuyOrder.Hash,
				r.contracts.Orderbook.Topics.PlaceSellOrder.Hash,
				r.contracts.Orderbook.Topics.CancelOrder.Hash,
				r.contracts.OrderMatcher.Topics.Trade.Hash,
				r.contracts.OrderMatcher.Topics.OrderFilledVolumeUpdate.Hash,
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
	}
	err = order.Save(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
	}
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

	fmt.Println(order.Hash.Hex(), order.VolumeFilled, order.Volume, order.IsOpen)

	err = order.Update(r.store)
	if err != nil {
		log.Fatal("Commit: ", err)
		return
	}

	fmt.Printf("\n\nUpdate filled volume of order %s to %s\n", updateFilledVolumeEvent.OrderHash.Hex(), updateFilledVolumeEvent.Volume.String())
}
