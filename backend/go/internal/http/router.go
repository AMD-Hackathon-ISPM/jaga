package transporthttp

import (
	"net/http"

	"jaga/backend/go/internal/config"
	patienthandlers "jaga/backend/go/internal/handlers"
	"jaga/backend/go/internal/memory"
	"jaga/backend/go/internal/routes"
)

func NewRouter(cfg config.Config, memoryHealth memory.HealthChecker) http.Handler {
	serviceHandlers := NewHandlers(cfg, memoryHealth)
	patientHandler := patienthandlers.NewPatientHandler()
	mux := http.NewServeMux()
	mux.HandleFunc("/health", serviceHandlers.Health)
	mux.HandleFunc("/healthz", serviceHandlers.Health)
	mux.HandleFunc("/api/v1/status", serviceHandlers.Status)
	mux.HandleFunc("/v1/status", serviceHandlers.Status)
	mux.HandleFunc("/internal/health/cognee", serviceHandlers.CogneeHealth)
	routes.RegisterPatientRoutes(mux, patientHandler)
	return mux
}
