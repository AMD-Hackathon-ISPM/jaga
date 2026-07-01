// Package metrics persists NON-PATIENT operational telemetry only.
//
// PRD-08 INVARIANT: nothing in this package may receive or store request/
// response bodies, clinical field values, audio, images, or derived estimates.
// It records only how the service behaved (endpoint, method, status, latency).
package metrics

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Recorder writes request_metrics rows. A nil pool makes every call a no-op so
// the service runs unchanged when Postgres is not configured or unreachable.
type Recorder struct {
	pool   *pgxpool.Pool
	logger *log.Logger
}

func NewRecorder(pool *pgxpool.Pool, logger *log.Logger) *Recorder {
	return &Recorder{pool: pool, logger: logger}
}

// NewPool builds a connection pool from a DSN. Returns (nil, nil) when dsn is
// empty so the caller can run with metrics disabled.
func NewPool(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	if dsn == "" {
		return nil, nil
	}
	return pgxpool.New(ctx, dsn)
}

// Record inserts one operational metric row. It is safe to call from a
// goroutine and never blocks the HTTP response. Failures degrade to a log line.
func (r *Recorder) Record(endpoint, method, requestID string, statusCode, latencyMs int) {
	if r == nil || r.pool == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_, err := r.pool.Exec(ctx,
		`INSERT INTO request_metrics (request_id, endpoint, method, status_code, latency_ms)
		 VALUES ($1, $2, $3, $4, $5)`,
		nullableText(requestID), endpoint, method, statusCode, latencyMs)
	if err != nil {
		r.logger.Printf("metrics record degraded: %v", err)
	}
}

func nullableText(s string) any {
	if s == "" {
		return nil
	}
	return s
}
