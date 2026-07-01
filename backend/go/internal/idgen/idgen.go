package idgen

import (
	"crypto/rand"
	"encoding/hex"
	"strconv"
	"sync/atomic"
)

// fallbackCounter guarantees unique ids if the system RNG ever fails.
var fallbackCounter atomic.Uint64

// New returns a short random hex request id. Used to satisfy the contract's
// request_id field without pulling in a UUID dependency. If crypto/rand fails
// (extremely rare) it falls back to a monotonic counter so ids stay unique
// across concurrent callers instead of colliding on a shared placeholder.
func New(prefix string) string {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		return prefix + "fallback-" + strconv.FormatUint(fallbackCounter.Add(1), 10)
	}
	return prefix + hex.EncodeToString(buf)
}
