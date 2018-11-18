package store

import (
	"fmt"
	"log"

	"github.com/go-redis/redis"
)

// NewRedisClient creates and returns new instance of memory store
func NewRedisClient(storeAddr string, password string) *redis.Client {
	fmt.Printf("\nConnecting to redis at %s...\n", storeAddr)

	client := redis.NewClient(&redis.Options{
		Addr:     storeAddr,
		Password: password,
	})

	_, err := client.Ping().Result()

	if err != nil {
		log.Panic(err)
	}

	fmt.Printf("\nRedis connection established\n\n")

	return client
}
