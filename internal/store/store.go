package store

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

type DataStore struct {
	DB *sql.DB
}

func (store *DataStore) Initialize() {
	connectionString := os.Getenv("CDEX_DB_CONNECTION_STRING")

	fmt.Printf("Connecting to %s...\n", connectionString)

	var err error
	store.DB, err = sql.Open("postgres", connectionString)

	if err != nil {
		log.Fatal(err)
	}
}

func (store *DataStore) Close() {
	fmt.Println("Closing connection to database...")
	store.DB.Close()
}

func NewDataStore() *DataStore {
	return &DataStore{}
}
