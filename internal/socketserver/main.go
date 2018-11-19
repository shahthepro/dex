package socketserver

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-redis/redis"
	"hameid.net/cdex/dex/internal/store"

	"github.com/gorilla/mux"

	"github.com/gorilla/websocket"
)

var channelSize = 10000

// SocketServer struct
type SocketServer struct {
	server      *http.Server
	webappHost  string
	hubs        map[string]*Hub
	redisClient *redis.Client
}

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

		// trimmedToken := strings.TrimPrefix(vars["token"], "0x")
		// trimmedBase := strings.TrimPrefix(vars["base"], "0x")

		// token := common.HexToAddress(trimmedToken)
		// base := common.HexToAddress(trimmedBase)

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("CONN", err)
		}

		// if bytes.Compare(token.Bytes(), base.Bytes()) >= 0 {
		// 	_ = conn.WriteMessage(1, []byte("{\"error\":\"Invalid token pair\"}"))
		// 	conn.Close()
		// 	return
		// }

		// channelKey := token.Hex() + "/" + base.Hex()
		channelKey := strings.ToLower(vars["token"] + "/" + vars["base"])

		fmt.Println(channelKey)

		hub, ok := socketServer.hubs[channelKey]

		if !ok {
			pubsub := socketServer.redisClient.Subscribe(channelKey)
			// pubsub.Receive
			hub = newHub(pubsub.Channel())
			socketServer.hubs[channelKey] = hub
			go hub.run()
		}

		serveWsToConnection(hub, conn)
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
	socketServer.redisClient.ShutdownNoSave()
	socketServer.server.Shutdown(nil)
}

// NewSocketServer creates new instance of SocketServer
func NewSocketServer(port uint64, webappHost string, redisHostAddress string, redisPassword string) *SocketServer {
	return &SocketServer{
		server: &http.Server{
			Addr: fmt.Sprintf(":%d", port),
		},
		webappHost:  webappHost,
		hubs:        make(map[string]*Hub),
		redisClient: store.NewRedisClient(redisHostAddress, redisPassword),
	}
}
