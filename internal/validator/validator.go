package validator

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"hameid.net/cdex/dex/_abi/Exchange"
	"hameid.net/cdex/dex/_abi/HomeBridge"
	"hameid.net/cdex/dex/internal/utils"
)

type bridgeRef struct {
	client   *ethclient.Client
	instance *HomeBridge.HomeBridge
	abi      *abi.ABI
}

type exchangeRef struct {
	client   *ethclient.Client
	instance *Exchange.Exchange
	abi      *abi.ABI
}

// Validator struct
type Validator struct {
	networks   *NetworksInfo
	contracts  *ContractsInfo
	privateKey *ecdsa.PrivateKey
	publicKey  *ecdsa.PublicKey
	address    *common.Address
	bridge     *bridgeRef
	exchange   *exchangeRef
}

var channelSize = 10000

// Initialize reads and decodes ABIs to be used for communicating with chain
func (v *Validator) Initialize() {
	fmt.Printf("\nConnecting to %s...\n", v.networks.Bridge.WebSocketProvider)
	homeClient, err := ethclient.Dial(v.networks.Bridge.WebSocketProvider)
	if err != nil {
		log.Panic(err)
	}
	bridge, err := HomeBridge.NewHomeBridge(v.contracts.Bridge.Address.Address, homeClient)
	if err != nil {
		log.Panic(err)
	}
	fmt.Printf("Decoding Bridge contract ABI...\n")
	bridgeABI, err := abi.JSON(strings.NewReader(string(HomeBridge.HomeBridgeABI)))
	if err != nil {
		log.Fatal(err)
	}
	v.bridge.client = homeClient
	v.bridge.instance = bridge
	v.bridge.abi = &bridgeABI

	fmt.Printf("\nConnecting to %s...\n", v.networks.Exchange.WebSocketProvider)
	exchangeClient, err := ethclient.Dial(v.networks.Exchange.WebSocketProvider)
	if err != nil {
		log.Panic(err)
	}
	exchange, err := Exchange.NewExchange(v.contracts.Exchange.Address.Address, exchangeClient)
	if err != nil {
		log.Panic(err)
	}
	fmt.Printf("Decoding Exchange contract ABI...\n")
	exchangeABI, err := abi.JSON(strings.NewReader(string(Exchange.ExchangeABI)))
	if err != nil {
		log.Fatal(err)
	}
	v.exchange.client = exchangeClient
	v.exchange.instance = exchange
	v.exchange.abi = &exchangeABI

	fmt.Printf("\n\nValidator initialization successful :)\n\n")
}

// RunOnBridgeNetwork runs validator on the bridge network
func (v *Validator) RunOnBridgeNetwork() {
	fmt.Printf("Trying to listen events on Bridge contract %s...\n", v.contracts.Bridge.Address.Address.String())
	query := ethereum.FilterQuery{
		Addresses: []common.Address{v.contracts.Bridge.Address.Address},
		Topics:    [][]common.Hash{{v.contracts.Bridge.Topics.Deposit.Hash}},
	}

	logs := make(chan types.Log, channelSize)

	sub, err := v.bridge.client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Panic(err)
	}

	go func() {
	eventListenerLoop:
		for {
			select {
			case err := <-sub.Err():
				log.Fatal("Home Network Subcription Error:", err)

			case vLog := <-logs:
				// Unpack deposit event
				fmt.Println("Received `Deposit` event from Home Network")
				depositEvent := struct {
					Recipient common.Address
					Token     common.Address
					Value     *big.Int
				}{}
				err := v.bridge.abi.Unpack(&depositEvent, "Deposit", vLog.Data)
				if err != nil {
					log.Fatal("Unpack: ", err)
					continue eventListenerLoop
				}

				// Forward event to Foreign bridge
				nonce, err := v.exchange.client.PendingNonceAt(context.Background(), *v.address)
				if err != nil {
					log.Fatal(err)
					continue eventListenerLoop
				}

				// gasPrice, err := v.exchange.client.SuggestGasPrice(context.Background())
				// if err != nil {
				// 	log.Fatal(err)
				// 	continue eventListenerLoop
				// }

				auth := bind.NewKeyedTransactor(v.privateKey)

				auth.Nonce = big.NewInt(int64(nonce))
				auth.Value = big.NewInt(0)
				auth.GasLimit = uint64(500000)
				auth.GasPrice = big.NewInt(1) // gasPrice

				tx, err := v.exchange.instance.Deposit(auth, depositEvent.Recipient, depositEvent.Token, depositEvent.Value, vLog.TxHash)
				if err != nil {
					fmt.Println("Failed to forward transaction:", err)
				}

				fmt.Println("Transaction forwarded to foreign network:", tx.Hash().Hex())
				fmt.Println("--------------------")
			}
		}
	}()
}

// RunOnExchangeNetwork runs validator on the exchange network
func (v *Validator) RunOnExchangeNetwork() {
	fmt.Printf("Trying to listen events on Exchange contract %s...\n", v.contracts.Exchange.Address.Address.String())
	query := ethereum.FilterQuery{
		Addresses: []common.Address{v.contracts.Exchange.Address.Address},
		Topics:    [][]common.Hash{{v.contracts.Exchange.Topics.Withdraw.Hash}},
	}
	logs := make(chan types.Log, channelSize)
	sub, err := v.exchange.client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Panic(err)
	}

	go func() {
	eventListenerLoop:
		for {
			select {
			case err := <-sub.Err():
				log.Fatal("Foreign Network Subcription Error:", err)

			case vLog := <-logs:
				fmt.Println("Received `Withdraw` event from Foreign Network")
				// if vLog.Topics[0].Hex() != withdrawEventTopic.Hex() {
				// 	fmt.Println(vLog.Topics[0].Hex())
				// 	fmt.Println("Not a withdraw event")
				// 	fmt.Println("--------------------")
				// 	continue eventListenerLoop
				// }
				withdrawEvent := struct {
					Recipient common.Address
					Token     common.Address
					Value     *big.Int
				}{}
				err := v.exchange.abi.Unpack(&withdrawEvent, "Withdraw", vLog.Data)
				if err != nil {
					log.Fatal("Unpack: ", err)
					continue eventListenerLoop
				}

				serializedMessage, err := utils.SerializeWithdrawalMessage(withdrawEvent.Recipient, withdrawEvent.Token, withdrawEvent.Value, vLog.TxHash)
				if err != nil {
					log.Fatal("Cannot serialize message: ", err)
					continue eventListenerLoop
				}

				signature, err := utils.SignMessageWithPrivateKey(serializedMessage, v.privateKey)
				if err != nil {
					log.Fatal("Cannot sign message: ", err)
					continue eventListenerLoop
				}

				fmt.Println("Message Hash", common.Bytes2Hex(signature.Hash))

				// Forward event to Foreign bridge
				nonce, err := v.exchange.client.PendingNonceAt(context.Background(), *v.address)
				if err != nil {
					log.Fatal(err)
					continue eventListenerLoop
				}

				gasPrice, err := v.exchange.client.SuggestGasPrice(context.Background())
				if err != nil {
					log.Fatal(err)
					continue eventListenerLoop
				}

				auth := bind.NewKeyedTransactor(v.privateKey)

				auth.Nonce = big.NewInt(int64(nonce))
				auth.Value = big.NewInt(0)
				auth.GasLimit = uint64(500000)
				auth.GasPrice = gasPrice

				tx, err := v.exchange.instance.SubmitSignature(auth, signature.Raw[:65], serializedMessage)
				if err != nil {
					fmt.Println("Failed to sign & forward transaction:", err)
				}

				fmt.Println("Transaction signed and forwarded to foreign network:", tx.Hash().Hex())
				fmt.Println("--------------------")
			}
		}
	}()
}

// Quit terminates validator instance
func (v *Validator) Quit() {
	fmt.Printf("\nCleaning up...\n")
	fmt.Printf("\nBye bye...\n")
}

// NewValidator creates and populates a Vaidator struct object
func NewValidator(contractsFilePath, networksFilePath, keystoreFilePath, passwordFilePath string) *Validator {
	fmt.Printf("Starting validator...\n")
	fmt.Printf("Reading config files...\n")
	fmt.Printf("Reading %s...\n", contractsFilePath)
	// Read config files
	contractsInfo, err := ReadContractsInfo(contractsFilePath)
	if err != nil {
		log.Panic(err)
	}

	fmt.Printf("Reading %s...\n", networksFilePath)
	nwInfo, err := ReadNetworksInfo(networksFilePath)
	if err != nil {
		log.Panic(err)
	}

	fmt.Printf("Decrypting keystore %s...\n", keystoreFilePath)
	// Decrypt keystore
	accountKey, err := utils.DecryptPrivateKeyFromKeystoreWithPasswordFile(keystoreFilePath, passwordFilePath)
	if err != nil {
		log.Panic(err)
	}

	privateKey := accountKey.PrivateKey
	publicKey := privateKey.Public()

	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("error casting public key to ECDSA")
	}

	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	fmt.Printf("Validator account address: %s\n\n", fromAddress.String())

	return &Validator{
		networks:   nwInfo,
		contracts:  contractsInfo,
		privateKey: privateKey,
		publicKey:  publicKeyECDSA,
		address:    &fromAddress,
		bridge: &bridgeRef{
			client:   nil,
			instance: nil,
			abi:      nil,
		},
		exchange: &exchangeRef{
			client:   nil,
			instance: nil,
			abi:      nil,
		},
	}
}
