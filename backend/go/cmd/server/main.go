package main

import (
	"log"
	"net/http"

	"jaga/backend/go/internal/config"
	transporthttp "jaga/backend/go/internal/http"
)

func main() {
	cfg := config.Load()
	server := &http.Server{
		Addr:    cfg.Addr,
		Handler: transporthttp.NewRouter(cfg),
	}
	log.Printf("starting go backend on %s", cfg.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
