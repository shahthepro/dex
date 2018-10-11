package store

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

// DataStore struct
type DataStore struct {
	DB               *sql.DB
	connectionString string
}

// Initialize tries to connect to DB server
func (store *DataStore) Initialize() {
	// connectionString := os.Getenv("CDEX_DB_CONNECTION_STRING")

	fmt.Printf("Connecting to %s...\n", store.connectionString)

	var err error
	store.DB, err = sql.Open("postgres", store.connectionString)

	if err != nil {
		log.Fatal(err)
	}
}

// Close terminates connection to DB server
func (store *DataStore) Close() {
	fmt.Println("Closing connection to database...")
	store.DB.Close()
}

// NewDataStore returns a new DataStore object
func NewDataStore(connectionString string) *DataStore {
	return &DataStore{
		connectionString: connectionString,
	}
}
