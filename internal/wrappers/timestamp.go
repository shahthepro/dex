package wrappers

import (
	"database/sql/driver"
	"fmt"
	"time"
)

// Timestamp is a wrapper around float64 to be used with pq for timestampz
type Timestamp struct {
	t uint64
}

// Scan implements Scanner.Scan
func (timestamp *Timestamp) Scan(value interface{}) error {
	switch value.(type) {
	case int:
		timestamp.t = uint64(value.(int))
	case uint:
		timestamp.t = uint64(value.(uint))
	case uint64:
		timestamp.t = value.(uint64)
	case time.Time:
		timestamp.t = uint64((value.(time.Time)).Unix())
	}
	return nil
}

// Value implements driver.Valuer interface
func (timestamp *Timestamp) Value() (driver.Value, error) {
	return int64(timestamp.t), nil
}

// MarshalJSON marshals data
func (timestamp *Timestamp) MarshalJSON() ([]byte, error) {
	return []byte(fmt.Sprintf(`%d`, timestamp.t)), nil
}

// WrapTimestamp wraps uint64
func WrapTimestamp(timestamp uint64) *Timestamp {
	return &Timestamp{t: timestamp}
}

// CreateTimestamp create Timestamp instance from Time object
func CreateTimestamp(time *time.Time) *Timestamp {
	return &Timestamp{t: uint64(time.Unix())}
}
