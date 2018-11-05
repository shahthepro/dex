package main

import (
	"fmt"
	"os"
	"os/signal"
	"strconv"

	"hameid.net/cdex/dex/internal/app"
)

func main() {
	port, err := strconv.ParseUint(os.Getenv("DEX_APP_LAYER_PORT"), 10, 64)
	if err != nil {
		fmt.Println("Cannot find `DEX_APP_LAYER_PORT` env variable. Starting on port 6454...")
		port = 6454
	}
	app := app.NewApp(
		uint(port),
		os.Getenv("CDEX_DB_CONNECTION_STRING"),
	)

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		for sig := range c {
			fmt.Printf("\nReceived signal %s", sig)
			app.Shutdown()
			os.Exit(0)
		}
	}()

	done := make(chan bool)

	app.Start()

	<-done
}
