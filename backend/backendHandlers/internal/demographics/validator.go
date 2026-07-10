package demographics

import (
	"math"
	"strings"
)

func validate(request CreateRequest) (Demographics, []FieldError) {
	var errors []FieldError
	value := Demographics{}

	if request.AgeYears == nil {
		errors = append(errors, required("ageYears"))
	} else if *request.AgeYears < 18 || *request.AgeYears > 120 {
		errors = append(errors, invalid("ageYears", "must be between 18 and 120"))
	} else {
		value.AgeYears = *request.AgeYears
	}

	if request.SexAtBirth == nil {
		errors = append(errors, required("sexAtBirth"))
	} else {
		sexAtBirth := SexAtBirth(strings.ToLower(strings.TrimSpace(string(*request.SexAtBirth))))
		if sexAtBirth != SexAtBirthMale && sexAtBirth != SexAtBirthFemale {
			errors = append(errors, invalid("sexAtBirth", "must be male or female"))
		} else {
			value.SexAtBirth = sexAtBirth
		}
	}

	if request.HeightCm == nil {
		errors = append(errors, required("heightCm"))
	} else if !isFinite(*request.HeightCm) || *request.HeightCm < 40 || *request.HeightCm > 260 {
		errors = append(errors, invalid("heightCm", "must be between 40 and 260"))
	} else {
		value.HeightCm = *request.HeightCm
	}

	if request.WeightKg == nil {
		errors = append(errors, required("weightKg"))
	} else if !isFinite(*request.WeightKg) || *request.WeightKg < 1 || *request.WeightKg > 350 {
		errors = append(errors, invalid("weightKg", "must be between 1 and 350"))
	} else {
		value.WeightKg = *request.WeightKg
	}

	return value, errors
}

func required(field string) FieldError { return FieldError{Field: field, Message: "is required"} }

func invalid(field, message string) FieldError { return FieldError{Field: field, Message: message} }

func isFinite(value float64) bool { return !math.IsNaN(value) && !math.IsInf(value, 0) }
