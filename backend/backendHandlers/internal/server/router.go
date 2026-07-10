package server

import (
	"net/http"
	"os"
	"strings"

	"jaga/backend/go/internal/audioPreprocess"
	"jaga/backend/go/internal/demographics"
	"jaga/backend/go/internal/response"
)

func Address() string {
	if address := os.Getenv("JAGA_BACKEND_ADDR"); address != "" {
		return address
	}
	return ":8080"
}

func NewRouter() http.Handler {
	mux := http.NewServeMux()

	demographicsHandler := demographics.NewHandler()
	audioHandler := audioPreprocess.NewHandler()

	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("POST /api/v1/demographics", demographicsHandler.Create)
	mux.HandleFunc("POST /api/v1/audio/preprocess", audioHandler.Preprocess)

	return withCORS(mux)
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
