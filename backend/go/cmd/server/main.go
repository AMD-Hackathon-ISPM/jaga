package main

import (
	"log"
	"net/http"

	"jaga/backend/go/internal/config"
	transporthttp "jaga/backend/go/internal/http"
	"jaga/backend/go/internal/memory/cognee"
)

func main() {
	cfg := config.Load()
	logger := log.Default()
	memoryService := cognee.NewService(cognee.LoadConfigFromEnv(), logger)
	server := &http.Server{
		Addr:    cfg.Addr,
		Handler: transporthttp.NewRouter(cfg, memoryService),
	}
	log.Printf("starting go backend on %s", cfg.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
