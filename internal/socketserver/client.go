package socketserver

import "golang.org/x/net/websocket"

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

// NewClient creates and returns new instance of Client
func NewClient() *Client {
	return &Client{
		send: make(chan []byte),
	}
}
