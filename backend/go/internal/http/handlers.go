package transporthttp

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"jaga/backend/go/internal/config"
	"jaga/backend/go/internal/memory"
)

type Handlers struct {
	config       config.Config
	memoryHealth memory.HealthChecker
}

func NewHandlers(cfg config.Config, memoryHealth memory.HealthChecker) Handlers {
	return Handlers{
		config:       cfg,
		memoryHealth: memoryHealth,
	}
}

func (h Handlers) Health(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]any{
		"status":    "ok",
		"timestamp": time.Now().UTC(),
	})
}

func (h Handlers) Status(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]any{
		"service":             "jaga-backend",
		"python_project_root": h.config.PythonProjectRoot,
		"ready":               true,
	})
}

func (h Handlers) CogneeHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]any{
			"status": "unhealthy",
			"error":  "method not allowed",
		})
		return
	}
	if h.memoryHealth == nil {
		respondJSON(w, http.StatusServiceUnavailable, map[string]any{
			"status": "unhealthy",
		})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	if err := h.memoryHealth.CheckHealth(ctx); err != nil {
		respondJSON(w, http.StatusServiceUnavailable, map[string]any{
			"status": "unhealthy",
		})
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{
		"status": "healthy",
	})
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
