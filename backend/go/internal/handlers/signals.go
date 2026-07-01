package handlers

import (
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"

	"jaga/backend/go/internal/idgen"
	"jaga/backend/go/internal/inference"
	"jaga/backend/go/internal/models"
	"jaga/backend/go/internal/validation"
)

const (
	// Contract: CXR image maximum is 10485760 bytes.
	maxCxrImageBytes = 10 * 1024 * 1024
	// Total upload caps (image/audio + multipart overhead). Bodies larger than
	// this are rejected by MaxBytesReader before buffering.
	maxCxrUploadBytes    = maxCxrImageBytes + 2*1024*1024
	maxTriageUploadBytes = 60 * 1024 * 1024
	// In-memory parse budget; the remainder spills to temp files.
	multipartMemoryBytes = 8 * 1024 * 1024
)

// SignalHandler serves the Gema (triage) and Prisma (cxr) endpoints. It fully
// validates each request against the contract, then delegates to the inference
// seam. Results are never fabricated; when no model is wired the seam returns
// ErrUnavailable and we respond MODEL_UNAVAILABLE.
type SignalHandler struct {
	triage inference.TriageInferencer
	cxr    inference.CxrInferencer
}

func NewSignalHandler(triage inference.TriageInferencer, cxr inference.CxrInferencer) SignalHandler {
	return SignalHandler{triage: triage, cxr: cxr}
}

func (h SignalHandler) Triage(w http.ResponseWriter, r *http.Request) {
	requestID := idgen.New("gm-")
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, apiError("VALIDATION_ERROR", "must use POST", requestID, false))
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxTriageUploadBytes)
	if err := r.ParseMultipartForm(multipartMemoryBytes); err != nil {
		writeAPIError(w, http.StatusBadRequest, apiError("VALIDATION_ERROR", "request must be valid multipart/form-data within size limits", requestID, false))
		return
	}
	if r.FormValue("contract_version") != "triage-v1" {
		writeAPIError(w, http.StatusBadRequest, apiError("CONTRACT_MISMATCH", "contract_version must be triage-v1", requestID, false))
		return
	}
	if r.FormValue("schema_version") != "clinical-v1" {
		writeAPIError(w, http.StatusBadRequest, apiError("CONTRACT_MISMATCH", "schema_version must be clinical-v1", requestID, false))
		return
	}

	clinicalFiles := r.MultipartForm.File["clinical"]
	if len(clinicalFiles) == 0 {
		writeAPIError(w, http.StatusBadRequest, apiError("VALIDATION_ERROR", "clinical file is required", requestID, false))
		return
	}
	intake, apiErr := parseClinicalFile(clinicalFiles[0], requestID)
	if apiErr != nil {
		writeAPIError(w, http.StatusBadRequest, *apiErr)
		return
	}

	coughs := r.MultipartForm.File["coughs"]
	if len(coughs) != 5 {
		writeAPIError(w, http.StatusBadRequest, apiError("VALIDATION_ERROR", "exactly five cough files are required", requestID, false))
		return
	}

	result, err := h.triage.Triage(r.Context(), inference.TriageInput{Clinical: intake, Coughs: coughs})
	if err != nil {
		writeSignalInferenceError(w, err, requestID, "Gema triage model is not available yet.")
		return
	}
	result.RequestID = requestID
	writeJSON(w, http.StatusOK, result)
}

func (h SignalHandler) Cxr(w http.ResponseWriter, r *http.Request) {
	requestID := idgen.New("px-")
	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, apiError("VALIDATION_ERROR", "must use POST", requestID, false))
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxCxrUploadBytes)
	if err := r.ParseMultipartForm(multipartMemoryBytes); err != nil {
		writeAPIError(w, http.StatusBadRequest, apiError("VALIDATION_ERROR", "request must be valid multipart/form-data within size limits", requestID, false))
		return
	}
	if r.FormValue("contract_version") != "cxr-v1" {
		writeAPIError(w, http.StatusBadRequest, apiError("CONTRACT_MISMATCH", "contract_version must be cxr-v1", requestID, false))
		return
	}
	if r.FormValue("schema_version") != "cxr-image-v1" {
		writeAPIError(w, http.StatusBadRequest, apiError("CONTRACT_MISMATCH", "schema_version must be cxr-image-v1", requestID, false))
		return
	}
	if r.FormValue("source_type") != "digital_export" {
		writeAPIError(w, http.StatusBadRequest, apiError("INVALID_CXR_SOURCE", "source_type must be digital_export", requestID, false))
		return
	}

	imageFiles := r.MultipartForm.File["image"]
	if len(imageFiles) == 0 {
		writeAPIError(w, http.StatusBadRequest, apiError("VALIDATION_ERROR", "image file is required", requestID, false))
		return
	}
	image := imageFiles[0]
	if image.Size > maxCxrImageBytes {
		writeAPIError(w, http.StatusRequestEntityTooLarge, apiError("PAYLOAD_TOO_LARGE", "image exceeds the 10485760 byte limit", requestID, false))
		return
	}
	if ct := image.Header.Get("Content-Type"); ct != "image/png" && ct != "image/jpeg" {
		writeAPIError(w, http.StatusUnsupportedMediaType, apiError("UNSUPPORTED_MEDIA_TYPE", "image must be image/png or image/jpeg", requestID, false))
		return
	}

	result, err := h.cxr.Cxr(r.Context(), inference.CxrInput{Image: image})
	if err != nil {
		writeSignalInferenceError(w, err, requestID, "Prisma CXR model is not available yet.")
		return
	}
	result.RequestID = requestID
	writeJSON(w, http.StatusOK, result)
}

// parseClinicalFile reads the uploaded clinical JSON and runs the same
// validation as the intake endpoint, returning a contract-compliant error.
func parseClinicalFile(header *multipart.FileHeader, requestID string) (models.PatientIntake, *models.ApiError) {
	file, err := header.Open()
	if err != nil {
		e := apiError("VALIDATION_ERROR", "clinical file could not be read", requestID, false)
		return models.PatientIntake{}, &e
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	var request models.PatientIntakeRequest
	if err := decoder.Decode(&request); err != nil {
		e := apiError("VALIDATION_ERROR", "clinical file must be a valid PatientIntake JSON object", requestID, false)
		return models.PatientIntake{}, &e
	}

	patient, validationErrors := validation.ValidatePatientIntake(request)
	if len(validationErrors) > 0 {
		e := apiError("VALIDATION_ERROR", "clinical inputs are invalid", requestID, false)
		e.FieldErrors = validationErrors
		return models.PatientIntake{}, &e
	}
	return patient, nil
}

// writeSignalInferenceError maps a seam error to a contract-compliant response:
// ErrUnavailable -> MODEL_UNAVAILABLE (503, non-retryable); anything else is a
// transient upstream failure (502, retryable).
func writeSignalInferenceError(w http.ResponseWriter, err error, requestID, unavailableMessage string) {
	if errors.Is(err, inference.ErrUnavailable) {
		writeAPIError(w, http.StatusServiceUnavailable, apiError("MODEL_UNAVAILABLE", unavailableMessage, requestID, false))
		return
	}
	writeAPIError(w, http.StatusBadGateway, apiError("UPSTREAM_TIMEOUT", "inference upstream failed", requestID, true))
}

func apiError(code, message, requestID string, retryable bool) models.ApiError {
	return models.ApiError{Code: code, Message: message, RequestID: requestID, Retryable: retryable}
}
