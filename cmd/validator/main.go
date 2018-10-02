package main

import (
	"os"

	"hameid.net/cdex/dex/internal/validator"
)

func main() {
	app := validator.NewValidator(
		os.Getenv("DEX_VALIDATOR_CONTRACTS_FILE"),
		os.Getenv("DEX_VALIDATOR_NETWORKS_FILE"),
		os.Getenv("DEX_VALIDATOR_KEYSTORE_FILE"),
		os.Getenv("DEX_VALIDATOR_PASSWORD_FILE"),
	)

	app.Initialize()

	done := make(chan bool)

	app.RunOnBridgeNetwork()
	app.RunOnExchangeNetwork()

	<-done
}
