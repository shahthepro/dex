package socketserver

import "github.com/gorilla/websocket"

// Hub is a collection of clients of similar interests
type Hub struct {
	clients    []*websocket.Conn
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

// NewHub creates and returns new instance of hub
func NewHub() *Hub {
	return &Hub{
		clients:    []*websocket.Conn{},
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}
