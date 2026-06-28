package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"jaga/backend/go/internal/models"
	"jaga/backend/go/internal/validation"
)

type PatientHandler struct {
}

func NewPatientHandler() PatientHandler {
	return PatientHandler{}
}

func (h PatientHandler) Intake(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, models.PatientIntakeErrorResponse{
			Status: "invalid",
			Errors: []models.ValidationError{
				{
					Field:   "method",
					Message: "must use POST",
				},
			},
		})
		return
	}

	request, decodeErrors := decodePatientIntakeRequest(r)
	if len(decodeErrors) > 0 {
		writeJSON(w, http.StatusBadRequest, models.PatientIntakeErrorResponse{
			Status: "invalid",
			Errors: decodeErrors,
		})
		return
	}

	patient, validationErrors := validation.ValidatePatientIntake(request)
	if len(validationErrors) > 0 {
		writeJSON(w, http.StatusBadRequest, models.PatientIntakeErrorResponse{
			Status: "invalid",
			Errors: validationErrors,
		})
		return
	}

	writeJSON(w, http.StatusOK, models.PatientIntakeSuccessResponse{
		Status:  "validated",
		Patient: patient,
	})
}

func decodePatientIntakeRequest(r *http.Request) (models.PatientIntakeRequest, []models.ValidationError) {
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	var request models.PatientIntakeRequest
	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return models.PatientIntakeRequest{}, []models.ValidationError{
				{
					Field:   "body",
					Message: "is required",
				},
			}
		}
		return models.PatientIntakeRequest{}, []models.ValidationError{
			{
				Field:   "body",
				Message: "must be valid JSON",
			},
		}
	}

	var trailingToken struct{}
	if err := decoder.Decode(&trailingToken); !errors.Is(err, io.EOF) {
		return models.PatientIntakeRequest{}, []models.ValidationError{
			{
				Field:   "body",
				Message: "must contain a single JSON object",
			},
		}
	}

	return request, nil
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
