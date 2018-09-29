package main

import (
	"fmt"
	"log"

	"hameid.net/cdex/dex/internal/validator"
)

func main() {
	contractsInfo, err := validator.ReadContractsInfo("/home/shah/Projects/dex/src/hameid.net/cdex/dex/configs/contracts.g.json")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(err)
	nwInfo, err := validator.ReadNetworksInfo("/home/shah/Projects/dex/src/hameid.net/cdex/dex/configs/network.json")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(err)

	fmt.Println("Hello World!")
	fmt.Println(contractsInfo)
	fmt.Println(nwInfo)
}
