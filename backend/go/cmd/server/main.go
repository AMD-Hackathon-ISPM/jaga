package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"jaga/backend/go/internal/config"
	transporthttp "jaga/backend/go/internal/http"
	"jaga/backend/go/internal/inference"
	"jaga/backend/go/internal/llm/featherless"
	"jaga/backend/go/internal/memory/cognee"
	"jaga/backend/go/internal/metrics"
)

func main() {
	cfg := config.Load()
	logger := log.Default()
	memoryService := cognee.NewService(cognee.LoadConfigFromEnv(), logger)

	featherlessClient := featherless.NewClient(cfg.Featherless.BaseURL, cfg.Featherless.APIKey, cfg.Featherless.Model, cfg.Featherless.Timeout)
	assistantService := featherless.NewService(featherlessClient, cfg.Featherless.Enabled(), logger)

	// Operational metrics are optional: if Postgres is not configured or cannot
	// be reached, the service still starts and simply records nothing.
	pool, err := metrics.NewPool(context.Background(), cfg.PostgresDSN)
	if err != nil {
		logger.Printf("metrics disabled: postgres pool init failed: %v", err)
		pool = nil
	}
	if pool != nil {
		defer pool.Close()
	}
	recorder := metrics.NewRecorder(pool, logger)
	defer recorder.Close()

	// Inference seam: no model is wired yet, so both signals resolve to the
	// Unavailable implementation (returns MODEL_UNAVAILABLE). Swap this for a
	// real proxy/queue implementation when a model ships.
	inferencer := inference.Unavailable{}

	// Timeouts are generous on purpose: uploads can reach tens of MB (triage
	// coughs) and the assistant proxy waits on an upstream LLM, so short read/
	// write caps would break legitimate requests. ReadHeaderTimeout is the key
	// slowloris defense; MaxBytesReader in the handlers bounds payload size.
	server := &http.Server{
		Addr:              cfg.Addr,
		Handler:           transporthttp.NewRouter(cfg, memoryService, assistantService, recorder, inferencer, inferencer),
		ReadHeaderTimeout: 15 * time.Second,
		ReadTimeout:       150 * time.Second,
		WriteTimeout:      150 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	log.Printf("starting go backend on %s (assistant_enabled=%t metrics_enabled=%t)", cfg.Addr, cfg.Featherless.Enabled(), pool != nil)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
