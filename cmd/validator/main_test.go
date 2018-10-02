package main

import (
	"os"
	"testing"

	"hameid.net/cdex/dex/internal/validator"
)

func TestMain(m *testing.M) {
	code := m.Run()

	os.Exit(code)
}

func TestConfigReader(t *testing.T) {
	contractsInfo, err := validator.ReadContractsInfo("/home/shah/Projects/dex/src/hameid.net/cdex/dex/configs/contracts.g.json")
	if err != nil {
		t.Error(err)
	}

	nwInfo, err := validator.ReadNetworksInfo("/home/shah/Projects/dex/src/hameid.net/cdex/dex/configs/network.json")
	if err != nil {
		t.Error(err)
	}

	t.Log(contractsInfo)
	t.Log(nwInfo)
}
