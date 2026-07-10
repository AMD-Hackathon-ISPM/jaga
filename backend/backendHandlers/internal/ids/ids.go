// Package ids generates short request identifiers for API responses.
package ids

import (
	"crypto/rand"
	"encoding/hex"
)

// New returns a random request id like "req_1a2b3c4d5e6f7081".
func New(prefix string) string {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return prefix + "_0000000000000000"
	}
	return prefix + "_" + hex.EncodeToString(buffer)
}
