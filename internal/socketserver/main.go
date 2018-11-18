package socketserver

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/ethereum/go-ethereum/common"

	"github.com/gorilla/mux"

	"github.com/gorilla/websocket"
)

var channelSize = 10000

// SocketServer struct
type SocketServer struct {
	server     *http.Server
	webappHost string
	hubs       map[string]*Hub

	// gethClient      *ethclient.Client
	// orderbookABI    *abi.ABI
	// ordermatcherABI *abi.ABI
	// networks        *utils.NetworksInfo
	// contracts       *utils.ContractsInfo
}

// // Initialize socket server instance
// func (socketServer *SocketServer) Initialize() {
// 	fmt.Printf("\nConnecting to %s...\n", socketServer.networks.Exchange.WebSocketProvider)
// 	exchangeClient, err := ethclient.Dial(socketServer.networks.Exchange.WebSocketProvider)
// 	if err != nil {
// 		log.Panic(err)
// 	}
// 	fmt.Printf("Decoding Orderbook contract ABI...\n")
// 	orderbookABI, err := abi.JSON(strings.NewReader(string(Orderbook.OrderbookABI)))
// 	if err != nil {
// 		log.Fatal(err)
// 	}
// 	fmt.Printf("Decoding Order Matcher contract ABI...\n")
// 	ordermatcherABI, err := abi.JSON(strings.NewReader(string(OrderMatchContract.OrderMatchContractABI)))
// 	if err != nil {
// 		log.Fatal(err)
// 	}

// 	socketServer.gethClient = exchangeClient
// 	socketServer.orderbookABI = &orderbookABI
// 	socketServer.ordermatcherABI = &ordermatcherABI

// 	fmt.Printf("\n")
// 	fmt.Printf("\n\nSocket server initialization successful :)\n\n")
// }

// Start starts websocket server
func (socketServer *SocketServer) Start() {

	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return r.Header.Get("Origin") == socketServer.webappHost
	}
	upgrader.EnableCompression = true

	router := mux.NewRouter()
	router.StrictSlash(true)
	router.HandleFunc("/ws/{token:0x[0-9A-Za-z]{40}}/{base:0x[0-9A-Za-z]{40}}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)

		header := w.Header()
		header.Set("Content-Security-Policy", fmt.Sprintf("content-src: '%s'", socketServer.webappHost))

		trimmedToken := strings.TrimPrefix(vars["token"], "0x")
		trimmedBase := strings.TrimPrefix(vars["base"], "0x")

		token := common.HexToAddress(trimmedToken)
		base := common.HexToAddress(trimmedBase)

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("CONN", err)
		}

		if bytes.Compare(token.Bytes(), base.Bytes()) >= 0 {
			_ = conn.WriteMessage(1, []byte("{\"error\":\"Invalid token pair\"}"))
			conn.Close()
			return
		}

		hub, ok := socketServer.hubs[trimmedToken+"/"+trimmedBase]

		if !ok {
			hub = newHub()
			socketServer.hubs[trimmedToken+"/"+trimmedBase] = hub
			go hub.run()
		}

		serveWs(hub, conn, w, r)
	})

	socketServer.server.Handler = router

	go func() {
		if err := socketServer.server.ListenAndServe(); err != nil {
			log.Panic(err)
		}
	}()
}

// Shutdown terminates the process and cleans up
func (socketServer *SocketServer) Shutdown() {
	socketServer.server.Shutdown(nil)
}

// func (socketServer *SocketServer) RunOnExchangeNetwork() {
// 	fmt.Printf("Trying to listen events on Exchange contract %s...\n", socketServer.contracts.Exchange.Address.Address.String())
// 	query := ethereum.FilterQuery{
// 		Addresses: []common.Address{
// 			socketServer.contracts.Orderbook.Address.Address,
// 			socketServer.contracts.OrderMatcher.Address.Address,
// 		},
// 		Topics: [][]common.Hash{
// 			{
// 				socketServer.contracts.Orderbook.Topics.PlaceBuyOrder.Hash,
// 				socketServer.contracts.Orderbook.Topics.PlaceSellOrder.Hash,
// 				socketServer.contracts.Orderbook.Topics.CancelOrder.Hash,
// 				socketServer.contracts.OrderMatcher.Topics.Trade.Hash,
// 				socketServer.contracts.OrderMatcher.Topics.OrderFilledVolumeUpdate.Hash,
// 			},
// 		},
// 	}
// 	logs := make(chan types.Log, channelSize)
// 	sub, err := socketServer.gethClient.SubscribeFilterLogs(context.Background(), query, logs)
// 	if err != nil {
// 		log.Panic(err)
// 	}

// 	go func() {
// 		for {
// 			select {
// 			case err := <-sub.Err():
// 				log.Fatal("Foreign Network Subcription Error:", err)

// 			case vLog := <-logs:
// 				for _, topic := range vLog.Topics {
// 					switch topic {
// 					// case socketServer.contracts.Orderbook.Topics.PlaceBuyOrder.Hash:
// 					// 	socketServer.placeOrderLogCallback(vLog, true)
// 					// case socketServer.contracts.Orderbook.Topics.PlaceSellOrder.Hash:
// 					// 	socketServer.placeOrderLogCallback(vLog, false)
// 					// case socketServer.contracts.Orderbook.Topics.CancelOrder.Hash:
// 					// 	socketServer.cancelOrderLogCallback(vLog)
// 					// case socketServer.contracts.OrderMatcher.Topics.Trade.Hash:
// 					// 	socketServer.tradeLogCallback(vLog)
// 					// case socketServer.contracts.OrderMatcher.Topics.OrderFilledVolumeUpdate.Hash:
// 					// 	socketServer.updateFilledVolumeLogCallback(vLog)
// 					}
// 				}
// 			}
// 		}
// 	}()
// }

// NewSocketServer creates new instance of SocketServer
func NewSocketServer(port uint64, webappHost string, contractsFilePath string, networksFilePath string) *SocketServer {

	// fmt.Printf("Starting socket server...\n")
	// fmt.Printf("Reading config files...\n")
	// fmt.Printf("Reading %s...\n", contractsFilePath)

	// // Read config files
	// contractsInfo, err := utils.ReadContractsInfo(contractsFilePath)
	// if err != nil {
	// 	log.Panic(err)
	// }

	// fmt.Printf("Reading %s...\n", networksFilePath)
	// nwInfo, err := utils.ReadNetworksInfo(networksFilePath)
	// if err != nil {
	// 	log.Panic(err)
	// }

	return &SocketServer{
		server: &http.Server{
			Addr: fmt.Sprintf(":%d", port),
		},
		webappHost: webappHost,
		hubs:       make(map[string]*Hub),
		// networks:   nwInfo,
		// contracts:  contractsInfo,
	}
}

// func (socketServer *SocketServer) placeOrderLogCallback(vLog types.Log, isBid bool) {
// 	placeOrderEvent := struct {
// 		OrderHash common.Hash
// 		Token     common.Address
// 		Base      common.Address
// 		Price     *big.Int
// 		Quantity  *big.Int
// 		Owner     common.Address
// 		Timestamp *big.Int
// 	}{}
// 	eventName := "PlaceBuyOrder"
// 	if !isBid {
// 		eventName = "PlaceSellOrder"
// 	}
// 	err := socketServer.orderbookABI.Unpack(&placeOrderEvent, eventName, vLog.Data)
// 	if err != nil {
// 		log.Fatal("Unpack: ", err)
// 		return
// 	}
// 	order := models.Order{
// 		Hash:      wrappers.WrapHash(&placeOrderEvent.OrderHash),
// 		Token:     wrappers.WrapAddress(&placeOrderEvent.Token),
// 		Base:      wrappers.WrapAddress(&placeOrderEvent.Base),
// 		Price:     wrappers.WrapBigInt(placeOrderEvent.Price),
// 		Quantity:  wrappers.WrapBigInt(placeOrderEvent.Quantity),
// 		IsBid:     isBid,
// 		CreatedBy: wrappers.WrapAddress(&placeOrderEvent.Owner),
// 		CreatedAt: wrappers.WrapTimestamp((*(placeOrderEvent.Timestamp)).Uint64()),
// 		Volume:    wrappers.WrapBigInt(big.NewInt(0).Mul(placeOrderEvent.Price, placeOrderEvent.Quantity)),
// 	}

// 	fmt.Printf("\n\nReceived order at %s for pair %s/%s\n", placeOrderEvent.Timestamp.String(), placeOrderEvent.Token.Hex(), placeOrderEvent.Base.Hex())
// }
