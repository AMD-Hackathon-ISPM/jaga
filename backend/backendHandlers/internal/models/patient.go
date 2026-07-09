package models

type PatientIntake struct {
	AgeYears          int     `json:"age_years"`
	SexAtBirth        string  `json:"sex_at_birth"`
	HeightCm          float64 `json:"height_cm"`
	WeightKg          float64 `json:"weight_kg"`
	CoughDurationDays int     `json:"cough_duration_days"`
	PriorTB           bool    `json:"prior_tb"`
	//
	// PriorTBType is intentionally disabled for now.
	// We are waiting for the CODA dataset schema before enabling it.
	//
	// PriorTBType string `json:"prior_tb_type"`
	//
	Hemoptysis            bool     `json:"hemoptysis"`
	HeartRateBPM          *int     `json:"heart_rate_bpm"`
	TemperatureC          *float64 `json:"temperature_c"`
	SmokedLast7Days       bool     `json:"smoked_last_7_days"`
	FeverLast30Days       bool     `json:"fever_last_30_days"`
	NightSweatsLast30Days bool     `json:"night_sweats_last_30_days"`
	WeightLossLast30Days  bool     `json:"weight_loss_last_30_days"`
}

type PatientIntakeRequest struct {
	AgeYears              *int     `json:"age_years"`
	SexAtBirth            *string  `json:"sex_at_birth"`
	HeightCm              *float64 `json:"height_cm"`
	WeightKg              *float64 `json:"weight_kg"`
	CoughDurationDays     *int     `json:"cough_duration_days"`
	PriorTB               *bool    `json:"prior_tb"`
	Hemoptysis            *bool    `json:"hemoptysis"`
	HeartRateBPM          *int     `json:"heart_rate_bpm"`
	TemperatureC          *float64 `json:"temperature_c"`
	SmokedLast7Days       *bool    `json:"smoked_last_7_days"`
	FeverLast30Days       *bool    `json:"fever_last_30_days"`
	NightSweatsLast30Days *bool    `json:"night_sweats_last_30_days"`
	WeightLossLast30Days  *bool    `json:"weight_loss_last_30_days"`
}

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type PatientIntakeSuccessResponse struct {
	Status  string        `json:"status"`
	Patient PatientIntake `json:"patient"`
}

type PatientIntakeErrorResponse struct {
	Status string            `json:"status"`
	Errors []ValidationError `json:"errors"`
}
