package socketserver

import (
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait = 5 * time.Second
	pongWait  = 2 * time.Second
)

// Hub is a collection of clients of similar interests
type Hub struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan []byte
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	done       chan bool
}

// Run hub
func (hub *Hub) Run() {
	for {
		select {
		case client := <-hub.register:
			hub.clients[client] = true
		case client := <-hub.register:
			delete(hub.clients, client)
		case message := <-hub.broadcast:
			for client := range hub.clients {
				go hub.sendMessageToClient(client, &message)
			}
		}
	}
}

func (hub *Hub) sendMessageToClient(client *websocket.Conn, message *[]byte) {
	client.SetWriteDeadline(time.Now().Add(writeWait))

	writer, err := client.NextWriter(websocket.TextMessage)
	if err != nil {
		hub.unregister <- client
		return
	}

	if _, err := writer.Write(*message); err != nil {
		hub.unregister <- client
	}
}

// NewHub creates and returns new instance of hub
func NewHub() *Hub {
	return &Hub{
		clients:    map[*websocket.Conn]bool{},
		broadcast:  make(chan []byte),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}
}
