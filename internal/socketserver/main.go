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

// SocketServer struct
type SocketServer struct {
	server     *http.Server
	webappHost string
	hubs       map[string]*Hub
}

// Start starts websocket server
func (socketServer *SocketServer) Start() {

	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	upgrader.CheckOrigin = func(r *http.Request) bool {
		// fmt.Println()
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

		for {
			// Read message from browser
			msgType, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}

			// Print the message to the console
			fmt.Printf("%s sent: %s\n", conn.RemoteAddr(), string(msg))

			// Write message back to browser
			if err = conn.WriteMessage(msgType, msg); err != nil {
				return
			}
		}
	})

	// http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
	// 	header := w.Header()
	// 	header.Set("Content-Security-Policy", fmt.Sprintf("content-src: '%s'", socketServer.webappHost))
	// 	conn, err := upgrader.Upgrade(w, r, nil)
	// 	if err != nil {
	// 		log.Println("CONN", err)
	// 	}

	// 	for {
	// 		// Read message from browser
	// 		msgType, msg, err := conn.ReadMessage()
	// 		if err != nil {
	// 			return
	// 		}

	// 		// Print the message to the console
	// 		fmt.Printf("%s sent: %s\n", conn.RemoteAddr(), string(msg))

	// 		// Write message back to browser
	// 		if err = conn.WriteMessage(msgType, msg); err != nil {
	// 			return
	// 		}
	// 	}
	// })
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

// NewSocketServer creates new instance of SocketServer
func NewSocketServer(port uint64, webappHost string) *SocketServer {
	return &SocketServer{
		server: &http.Server{
			Addr: fmt.Sprintf(":%d", port),
		},
		webappHost: webappHost,
		hubs:       make(map[string]*Hub),
	}
}
