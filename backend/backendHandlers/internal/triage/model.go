package triage

// Clinical is the patient-intake payload (clinical-v1) sent with the cough.
type Clinical struct {
	AgeYears              int      `json:"age_years"`
	SexAtBirth            string   `json:"sex_at_birth"`
	HeightCm              float64  `json:"height_cm"`
	WeightKg              float64  `json:"weight_kg"`
	CoughDurationDays     int      `json:"cough_duration_days"`
	PriorTB               bool     `json:"prior_tb"`
	Hemoptysis            bool     `json:"hemoptysis"`
	HeartRateBpm          *int     `json:"heart_rate_bpm"`
	TemperatureC          *float64 `json:"temperature_c"`
	SmokedLast7Days       bool     `json:"smoked_last_7_days"`
	FeverLast30Days       bool     `json:"fever_last_30_days"`
	NightSweatsLast30Days bool     `json:"night_sweats_last_30_days"`
	WeightLossLast30Days  bool     `json:"weight_loss_last_30_days"`
}

// QualityAttempt describes whether the cough capture was usable.
type QualityAttempt struct {
	Index      int    `json:"index"`
	Quality    string `json:"quality"` // accepted | retryable | system_error
	ReasonCode string `json:"reason_code,omitempty"`
}

// Estimate is the calibrated TB probability and its risk band.
type Estimate struct {
	Probability       float64 `json:"probability"`
	Band              string  `json:"band"` // lower | intermediate | higher
	Calibrated        bool    `json:"calibrated"`
	CalibrationStatus string  `json:"calibration_status"`
}

// Metadata describes the model and cohort behind the result.
type Metadata struct {
	ModelVersion    string   `json:"model_version"`
	ContractVersion string   `json:"contract_version"`
	SchemaVersion   string   `json:"schema_version"`
	Cohort          string   `json:"cohort"`
	Limitations     []string `json:"limitations"`
}

// Inspection points at an optional spectrogram artifact.
type Inspection struct {
	URL       string `json:"url,omitempty"`
	Available bool   `json:"available"`
	Label     string `json:"label"`
}

// GemaResult is the triage-v1 response consumed by the frontend.
type GemaResult struct {
	RequestID         string           `json:"request_id"`
	Signal            string           `json:"signal"`
	ContractVersion   string           `json:"contract_version"`
	SchemaVersion     string           `json:"schema_version"`
	Quality           []QualityAttempt `json:"quality"`
	Estimate          *Estimate        `json:"estimate"`
	MandatoryNextStep string           `json:"mandatory_next_step"`
	Metadata          Metadata         `json:"metadata"`
	Inspection        *Inspection      `json:"inspection,omitempty"`
	DetectedCoughs    int              `json:"detected_coughs"`
}

// ErrorBody is a simple error envelope.
type ErrorBody struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
