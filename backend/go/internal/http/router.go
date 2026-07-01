package transporthttp

import (
	"net/http"

	"jaga/backend/go/internal/config"
	patienthandlers "jaga/backend/go/internal/handlers"
	"jaga/backend/go/internal/llm/featherless"
	"jaga/backend/go/internal/memory"
	"jaga/backend/go/internal/metrics"
	"jaga/backend/go/internal/routes"
)

func NewRouter(cfg config.Config, memoryHealth memory.HealthChecker, assistant *featherless.Service, recorder *metrics.Recorder) http.Handler {
	serviceHandlers := NewHandlers(cfg, memoryHealth)
	patientHandler := patienthandlers.NewPatientHandler()
	assistantHandler := patienthandlers.NewAssistantHandler(assistant)
	signalHandler := patienthandlers.NewSignalHandler()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", serviceHandlers.Health)
	mux.HandleFunc("/healthz", serviceHandlers.Health)
	mux.HandleFunc("/api/v1/status", serviceHandlers.Status)
	mux.HandleFunc("/v1/status", serviceHandlers.Status)
	mux.HandleFunc("/internal/health/cognee", serviceHandlers.CogneeHealth)
	routes.RegisterPatientRoutes(mux, patientHandler)
	mux.HandleFunc("/api/v1/assistant/messages", assistantHandler.Messages)
	mux.HandleFunc("/api/v1/triage", signalHandler.Triage)
	mux.HandleFunc("/api/v1/cxr", signalHandler.Cxr)
	return withMetrics(mux, recorder)
}
