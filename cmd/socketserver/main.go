package main

import (
	"fmt"
	"os"
	"os/signal"
	"strconv"

	"hameid.net/cdex/dex/internal/socketserver"
)

func main() {
	port, err := strconv.ParseUint(os.Getenv("DEX_WS_LAYER_PORT"), 10, 64)
	if err != nil {
		fmt.Println("Cannot find `DEX_WS_LAYER_PORT` env variable.\n\nStarting on port 7424...")
		port = 7424
	}

	socketServer := socketserver.NewSocketServer(
		port,
		os.Getenv("CDEX_WEBAPP_HOST"),
		os.Getenv("CDEX_REDIS_HOST"),
		os.Getenv("CDEX_REDIS_PASSWORD"),
	)

	// socketServer.Initialize()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		for sig := range c {
			fmt.Printf("\nReceived signal %s\n", sig)
			socketServer.Shutdown()
			os.Exit(0)
		}
	}()

	done := make(chan bool)

	socketServer.Start()

	<-done
}
