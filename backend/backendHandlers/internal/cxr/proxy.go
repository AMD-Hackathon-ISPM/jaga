// Package cxr proxies chest X-ray requests (cxr-v1) to the Python Prisma server,
// which runs the DenseNet121 classifier and the quantum-kernel path.
package cxr

import (
	"io"
	"net/http"
	"time"

	"jaga/backend/go/internal/response"
)

type Handler struct {
	httpClient *http.Client
	prismaURL  string
}

func NewHandler(prismaURL string) Handler {
	return Handler{
		httpClient: &http.Client{Timeout: 120 * time.Second},
		prismaURL:  prismaURL,
	}
}

// Analyze forwards POST /api/v1/cxr to the Prisma server and relays its response.
func (h Handler) Analyze(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	upstream, err := http.NewRequestWithContext(r.Context(), http.MethodPost, h.prismaURL+"/api/v1/cxr", r.Body)
	if err != nil {
		response.WriteJSON(w, http.StatusBadGateway, map[string]string{"status": "error", "message": "could not build CXR request"})
		return
	}
	upstream.Header.Set("Content-Type", r.Header.Get("Content-Type"))

	resp, err := h.httpClient.Do(upstream)
	if err != nil {
		response.WriteJSON(w, http.StatusBadGateway, map[string]string{"status": "error", "message": "CXR service is temporarily unavailable"})
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}
