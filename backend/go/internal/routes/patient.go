package routes

import (
	"net/http"

	"jaga/backend/go/internal/handlers"
)

func RegisterPatientRoutes(mux *http.ServeMux, patientHandler handlers.PatientHandler) {
	mux.HandleFunc("/api/v1/patient/intake", patientHandler.Intake)
}
