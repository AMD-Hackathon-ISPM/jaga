package idgen

import (
	"crypto/rand"
	"encoding/hex"
)

// New returns a short random hex request id. Used to satisfy the contract's
// request_id field without pulling in a UUID dependency.
func New(prefix string) string {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		return prefix + "unknown"
	}
	return prefix + hex.EncodeToString(buf)
}
