package main

import (
	"log"
	"net/http"
	"time"

	"jaga/backend/go/internal/server"
)

func main() {
	httpServer := &http.Server{
		Addr:              server.Address(),
		Handler:           server.NewRouter(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("jaga backend listening on %s", httpServer.Addr)
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
