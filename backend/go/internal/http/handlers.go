package transporthttp

import (
	"encoding/json"
	"net/http"
	"time"

	"jaga/backend/go/internal/config"
)

type Handlers struct {
	config config.Config
}

func NewHandlers(cfg config.Config) Handlers {
	return Handlers{config: cfg}
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

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
