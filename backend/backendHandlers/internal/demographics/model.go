package demographics

type SexAtBirth string

const (
	SexAtBirthMale   SexAtBirth = "male"
	SexAtBirthFemale SexAtBirth = "female"
)

type CreateRequest struct {
	AgeYears   *int        `json:"ageYears"`
	SexAtBirth *SexAtBirth `json:"sexAtBirth"`
	HeightCm   *float64    `json:"heightCm"`
	WeightKg   *float64    `json:"weightKg"`
}

type Demographics struct {
	AgeYears   int        `json:"ageYears"`
	SexAtBirth SexAtBirth `json:"sexAtBirth"`
	HeightCm   float64    `json:"heightCm"`
	WeightKg   float64    `json:"weightKg"`
}

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Status string       `json:"status"`
	Errors []FieldError `json:"errors"`
}

type CreateResponse struct {
	Status       string       `json:"status"`
	Demographics Demographics `json:"demographics"`
}
