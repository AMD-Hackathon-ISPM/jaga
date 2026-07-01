package handlers

import (
	"net/http"

	"jaga/backend/go/internal/idgen"
	"jaga/backend/go/internal/models"
)

// SignalHandler serves the Gema (triage) and Prisma (cxr) endpoints. The
// underlying ML models are not built yet, so these return a contract-compliant
// MODEL_UNAVAILABLE error instead of a fabricated result — the flow is triage,
// not diagnosis, and results must never be invented. Swap the body for real
// inference (or a proxy to the Python worker) once a model ships.

type SignalHandler struct{}

func NewSignalHandler() SignalHandler { return SignalHandler{} }

func (h SignalHandler) Triage(w http.ResponseWriter, r *http.Request) {
	h.modelUnavailable(w, r, "gm-", "Gema triage model is not available yet.")
}

func (h SignalHandler) Cxr(w http.ResponseWriter, r *http.Request) {
	h.modelUnavailable(w, r, "px-", "Prisma CXR model is not available yet.")
}

func (h SignalHandler) modelUnavailable(w http.ResponseWriter, r *http.Request, prefix, message string) {
	requestID := idgen.New(prefix)
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, models.ApiError{
			Code: "VALIDATION_ERROR", Message: "must use POST", RequestID: requestID, Retryable: false,
		})
		return
	}
	discardBody(r)
	writeAPIError(w, http.StatusServiceUnavailable, models.ApiError{
		Code:      "MODEL_UNAVAILABLE",
		Message:   message,
		RequestID: requestID,
		Retryable: false,
	})
}
