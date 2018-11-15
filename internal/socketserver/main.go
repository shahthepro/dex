package socketserver

import (
	"fmt"
	"log"
	"net/http"

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

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	upgrader.CheckOrigin = func(r *http.Request) bool {
		// fmt.Println()
		return r.Header.Get("Origin") == socketServer.webappHost
	}

	upgrader.EnableCompression = true

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		header := w.Header()
		header.Set("Content-Security-Policy", fmt.Sprintf("content-src: '%s'", socketServer.webappHost))
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("CONN", err)
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
