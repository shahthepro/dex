package main

import (
	"fmt"
	"os"
	"os/signal"

	"hameid.net/cdex/dex/internal/relayer"
)

func main() {
	app := relayer.NewRelayer(
		os.Getenv("DEX_VALIDATOR_CONTRACTS_FILE"),
		os.Getenv("DEX_VALIDATOR_NETWORKS_FILE"),
		os.Getenv("CDEX_DB_CONNECTION_STRING"),
		os.Getenv("CDEX_REDIS_HOST"),
		os.Getenv("CDEX_REDIS_PASSWORD"),
		os.Getenv("DEX_ORDER_MATCHER_KEYSTORE_FILE"),
		os.Getenv("DEX_ORDER_MATCHER_PASSWORD_FILE"),
	)

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		for sig := range c {
			fmt.Printf("\nReceived signal %s", sig)
			app.Quit()
			os.Exit(0)
		}
	}()

	app.Initialize()

	done := make(chan bool)

	app.RunOnBridgeNetwork()
	app.RunOnExchangeNetwork()

	<-done
}
