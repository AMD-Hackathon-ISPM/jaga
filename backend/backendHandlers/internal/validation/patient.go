package validation

import (
	"math"
	"strings"

	"jaga/backend/go/internal/models"
)

func ValidatePatientIntake(request models.PatientIntakeRequest) (models.PatientIntake, []models.ValidationError) {
	var errors []models.ValidationError
	patient := models.PatientIntake{}

	if request.AgeYears == nil {
		errors = appendValidationError(errors, "age_years", "is required")
	} else if *request.AgeYears < 0 || *request.AgeYears > 120 {
		errors = appendValidationError(errors, "age_years", "must be between 0 and 120")
	} else {
		patient.AgeYears = *request.AgeYears
	}

	if request.SexAtBirth == nil {
		errors = appendValidationError(errors, "sex_at_birth", "is required")
	} else {
		sexAtBirth := strings.ToLower(strings.TrimSpace(*request.SexAtBirth))
		if sexAtBirth != "male" && sexAtBirth != "female" {
			errors = appendValidationError(errors, "sex_at_birth", "must be one of: male, female")
		} else {
			patient.SexAtBirth = sexAtBirth
		}
	}

	if request.HeightCm == nil {
		errors = appendValidationError(errors, "height_cm", "is required")
	} else if !isFinite(*request.HeightCm) || *request.HeightCm < 40 || *request.HeightCm > 260 {
		errors = appendValidationError(errors, "height_cm", "must be between 40 and 260")
	} else {
		patient.HeightCm = *request.HeightCm
	}

	if request.WeightKg == nil {
		errors = appendValidationError(errors, "weight_kg", "is required")
	} else if !isFinite(*request.WeightKg) || *request.WeightKg < 1 || *request.WeightKg > 350 {
		errors = appendValidationError(errors, "weight_kg", "must be between 1 and 350")
	} else {
		patient.WeightKg = *request.WeightKg
	}

	if request.CoughDurationDays == nil {
		errors = appendValidationError(errors, "cough_duration_days", "is required")
	} else if *request.CoughDurationDays < 0 || *request.CoughDurationDays > 365 {
		errors = appendValidationError(errors, "cough_duration_days", "must be between 0 and 365")
	} else {
		patient.CoughDurationDays = *request.CoughDurationDays
	}

	if request.PriorTB == nil {
		errors = appendValidationError(errors, "prior_tb", "is required")
	} else {
		patient.PriorTB = *request.PriorTB
	}

	if request.Hemoptysis == nil {
		errors = appendValidationError(errors, "hemoptysis", "is required")
	} else {
		patient.Hemoptysis = *request.Hemoptysis
	}

	if request.HeartRateBPM != nil {
		if *request.HeartRateBPM < 20 || *request.HeartRateBPM > 250 {
			errors = appendValidationError(errors, "heart_rate_bpm", "must be between 20 and 250")
		} else {
			value := *request.HeartRateBPM
			patient.HeartRateBPM = &value
		}
	}

	if request.TemperatureC != nil {
		if !isFinite(*request.TemperatureC) || *request.TemperatureC < 30 || *request.TemperatureC > 45 {
			errors = appendValidationError(errors, "temperature_c", "must be between 30 and 45")
		} else {
			value := *request.TemperatureC
			patient.TemperatureC = &value
		}
	}

	if request.SmokedLast7Days == nil {
		errors = appendValidationError(errors, "smoked_last_7_days", "is required")
	} else {
		patient.SmokedLast7Days = *request.SmokedLast7Days
	}

	if request.FeverLast30Days == nil {
		errors = appendValidationError(errors, "fever_last_30_days", "is required")
	} else {
		patient.FeverLast30Days = *request.FeverLast30Days
	}

	if request.NightSweatsLast30Days == nil {
		errors = appendValidationError(errors, "night_sweats_last_30_days", "is required")
	} else {
		patient.NightSweatsLast30Days = *request.NightSweatsLast30Days
	}

	if request.WeightLossLast30Days == nil {
		errors = appendValidationError(errors, "weight_loss_last_30_days", "is required")
	} else {
		patient.WeightLossLast30Days = *request.WeightLossLast30Days
	}

	if len(errors) > 0 {
		return models.PatientIntake{}, errors
	}

	return patient, nil
}

func appendValidationError(errors []models.ValidationError, field string, message string) []models.ValidationError {
	return append(errors, models.ValidationError{
		Field:   field,
		Message: message,
	})
}

func isFinite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}
