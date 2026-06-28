package transporthttp

import (
	"net/http"

	"jaga/backend/go/internal/config"
)

func NewRouter(cfg config.Config) http.Handler {
	handlers := NewHandlers(cfg)
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", handlers.Health)
	mux.HandleFunc("/v1/status", handlers.Status)
	return mux
}
