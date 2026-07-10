package server

import (
	"net/http"
	"os"
	"strconv"
	"strings"

	"jaga/backend/go/internal/assistant"
	"jaga/backend/go/internal/audioPreprocess"
	"jaga/backend/go/internal/cxr"
	"jaga/backend/go/internal/demographics"
	"jaga/backend/go/internal/llm"
	"jaga/backend/go/internal/response"
	"jaga/backend/go/internal/triage"
)

func Address() string {
	if address := os.Getenv("JAGA_BACKEND_ADDR"); address != "" {
		return address
	}
	return ":8080"
}

func NewRouter() http.Handler {
	mux := http.NewServeMux()

	llmClient := llm.NewClient(llm.ConfigFromEnv())

	demographicsHandler := demographics.NewHandler()
	audioHandler := audioPreprocess.NewHandler()
	assistantHandler := assistant.NewHandler(llmClient)
	cxrHandler := cxr.NewHandler(envOr("PRISMA_URL", "http://127.0.0.1:8000"))
	triageHandler := triage.NewHandler(triage.NewService(
		envOr("YAMNET_URL", "http://127.0.0.1:8081"),
		envOr("XGB_URL", "http://127.0.0.1:8082"),
		llmClient,
		coughMinimum(),
	))

	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("POST /api/v1/demographics", demographicsHandler.Create)
	mux.HandleFunc("POST /api/v1/audio/preprocess", audioHandler.Preprocess)
	mux.HandleFunc("POST /api/v1/triage", triageHandler.Submit)
	mux.HandleFunc("POST /api/v1/assistant/messages", assistantHandler.Messages)
	mux.HandleFunc("POST /api/v1/cxr", cxrHandler.Analyze)

	return withCORS(mux)
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func coughMinimum() float64 {
	if value, err := strconv.ParseFloat(os.Getenv("COUGH_MINIMUM"), 64); err == nil {
		return value
	}
	return 0.25
}

func health(w http.ResponseWriter, _ *http.Request) {
	response.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && originAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Max-Age", "600")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func originAllowed(origin string) bool {
	allowList := os.Getenv("JAGA_ALLOWED_ORIGINS")
	if allowList == "" {
		return strings.Contains(origin, "localhost") || strings.Contains(origin, "127.0.0.1")
	}
	for _, allowed := range strings.Split(allowList, ",") {
		if strings.TrimSpace(allowed) == origin {
			return true
		}
	}
	return false
}
