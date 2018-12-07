package utils

import (
	"fmt"
	"io/ioutil"
	"strings"
	"syscall"

	// "crypto/ecdsa"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	// "github.com/ethereum/go-ethereum/common"
	"golang.org/x/crypto/ssh/terminal"
)

func DecryptPrivateKeyFromKeystoreWithPasswordFile(filePath string, passwordFilePath string) (*keystore.Key, error) {
	passwordFile, err := ioutil.ReadFile(passwordFilePath)
	if err != nil {
		return nil, err
	}

	password := strings.TrimSpace(string(passwordFile))

	return DecryptPrivateKeyFromKeystoreWithPassword(filePath, password)
}

func DecryptPrivateKeyFromKeystoreWithPassword(filePath string, passphrase string) (*keystore.Key, error) {
	keystoreFile, readErr := ioutil.ReadFile(filePath)

	if readErr != nil {
		return nil, readErr
	}

	key, decryptErr := keystore.DecryptKey(keystoreFile, passphrase)

	if decryptErr != nil {
		return nil, decryptErr
	}

	return key, nil
}

func DecryptPrivateKeyFromKeystore(filePath string) (*keystore.Key, error) {
	fmt.Print("Keystore Password: ")
	bytePassword, err := terminal.ReadPassword(int(syscall.Stdin))
	fmt.Println("")
	if err != nil {
		return nil, err
	}
	password := strings.TrimSpace(string(bytePassword))

	return DecryptPrivateKeyFromKeystoreWithPassword(filePath, password)
}
