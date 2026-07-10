// Package triage is the acoustic-triage orchestrator (gema / triage-v1). It runs
// cough detection and the TB acoustic model, then asks Gemma for the next step.
package triage

import (
	"encoding/json"
	"io"
	"net/http"

	"jaga/backend/go/internal/response"
)

const maxUploadBytes = 32 << 20

type Handler struct {
	service *Service
}

func NewHandler(service *Service) Handler {
	return Handler{service: service}
}

// Submit handles POST /api/v1/triage (multipart: cough file + clinical JSON).
func (h Handler) Submit(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		response.WriteJSON(w, http.StatusBadRequest, ErrorBody{Status: "invalid", Message: "could not parse multipart form"})
		return
	}

	wav, err := readFile(r, "cough")
	if err != nil {
		response.WriteJSON(w, http.StatusBadRequest, ErrorBody{Status: "invalid", Message: "missing 'cough' audio file"})
		return
	}

	clinical, err := readClinical(r)
	if err != nil {
		response.WriteJSON(w, http.StatusBadRequest, ErrorBody{Status: "invalid", Message: "missing or invalid 'clinical' field"})
		return
	}

	result := h.service.Orchestrate(r.Context(), wav, clinical)
	response.WriteJSON(w, http.StatusOK, result)
}

func readFile(r *http.Request, field string) ([]byte, error) {
	file, _, err := r.FormFile(field)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	return io.ReadAll(file)
}

func readClinical(r *http.Request) (Clinical, error) {
	var clinical Clinical

	if file, _, err := r.FormFile("clinical"); err == nil {
		defer file.Close()
		raw, readErr := io.ReadAll(file)
		if readErr != nil {
			return clinical, readErr
		}
		return clinical, json.Unmarshal(raw, &clinical)
	}

	// Fall back to a plain form text field.
	raw := r.FormValue("clinical")
	if raw == "" {
		return clinical, io.EOF
	}
	return clinical, json.Unmarshal([]byte(raw), &clinical)
}
