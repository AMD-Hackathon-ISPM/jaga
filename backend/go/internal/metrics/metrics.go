// Package metrics persists NON-PATIENT operational telemetry only.
//
// PRD-08 INVARIANT: nothing in this package may receive or store request/
// response bodies, clinical field values, audio, images, or derived estimates.
// It records only how the service behaved (endpoint, method, status, latency).
package metrics

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	// queueSize bounds how many pending metric rows we buffer. Beyond this we
	// drop rather than accumulate unbounded work when Postgres is slow/down.
	queueSize = 1024
	// workerCount is the fixed number of goroutines draining the queue. Kept
	// at/under the pool's default MaxConns to avoid contention.
	workerCount   = 4
	insertTimeout = 3 * time.Second
	pingTimeout   = 5 * time.Second
)

type record struct {
	requestID  string
	endpoint   string
	method     string
	statusCode int
	latencyMs  int
}

// Recorder writes request_metrics rows through a bounded queue drained by a
// fixed worker pool, so a slow/unreachable database can never spawn unbounded
// goroutines or block the HTTP path. A nil pool makes every call a no-op.
type Recorder struct {
	pool   *pgxpool.Pool
	logger *log.Logger
	queue  chan record
	wg     sync.WaitGroup
}

// NewPool builds a connection pool from a DSN and verifies reachability with a
// Ping. Returns (nil, nil) when dsn is empty so the caller can run with metrics
// disabled; returns an error if Postgres is configured but unreachable.
func NewPool(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	if dsn == "" {
		return nil, nil
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	pingCtx, cancel := context.WithTimeout(ctx, pingTimeout)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

// NewRecorder returns a Recorder and starts its worker pool when a pool is
// present. Call Close on shutdown to drain and stop the workers.
func NewRecorder(pool *pgxpool.Pool, logger *log.Logger) *Recorder {
	r := &Recorder{pool: pool, logger: logger}
	if pool != nil {
		r.queue = make(chan record, queueSize)
		for i := 0; i < workerCount; i++ {
			r.wg.Add(1)
			go r.worker()
		}
	}
	return r
}

func (r *Recorder) worker() {
	defer r.wg.Done()
	for rec := range r.queue {
		r.insert(rec)
	}
}

func (r *Recorder) insert(rec record) {
	ctx, cancel := context.WithTimeout(context.Background(), insertTimeout)
	defer cancel()

	_, err := r.pool.Exec(ctx,
		`INSERT INTO request_metrics (request_id, endpoint, method, status_code, latency_ms)
		 VALUES ($1, $2, $3, $4, $5)`,
		nullableText(rec.requestID), rec.endpoint, rec.method, rec.statusCode, rec.latencyMs)
	if err != nil {
		r.logger.Printf("metrics record degraded: %v", err)
	}
}

// Record enqueues one operational metric without blocking the HTTP response.
// If the buffer is full (e.g. Postgres is slow or down) the metric is dropped
// rather than piling up goroutines. No-op when metrics are disabled.
func (r *Recorder) Record(endpoint, method, requestID string, statusCode, latencyMs int) {
	if r == nil || r.queue == nil {
		return
	}
	select {
	case r.queue <- record{requestID: requestID, endpoint: endpoint, method: method, statusCode: statusCode, latencyMs: latencyMs}:
	default:
		r.logger.Printf("metrics queue full; dropping metric for %s %s", method, endpoint)
	}
}

// Close stops accepting new metrics and waits for in-flight rows to be written.
func (r *Recorder) Close() {
	if r == nil || r.queue == nil {
		return
	}
	close(r.queue)
	r.wg.Wait()
}

func nullableText(s string) any {
	if s == "" {
		return nil
	}
	return s
}
