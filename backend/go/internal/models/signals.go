package models

// Response types for the Gema (triage) and Prisma (cxr) signals, mirroring
// contracts/openapi/jaga-v1.yaml byte-for-byte. estimate is required but
// nullable in the contract, so it is a pointer with no omitempty (nil -> null).

type Estimate struct {
	Probability       float64 `json:"probability"`
	Band              string  `json:"band"` // lower | intermediate | higher
	Calibrated        bool    `json:"calibrated"`
	CalibrationStatus string  `json:"calibration_status"`
}

type Inspection struct {
	URL       string `json:"url,omitempty"`
	Available bool   `json:"available"`
	Label     string `json:"label"`
}

type QualityAttempt struct {
	Index      int    `json:"index"`
	Quality    string `json:"quality"` // accepted | retryable | system_error
	ReasonCode string `json:"reason_code,omitempty"`
}

type GemaMetadata struct {
	ModelVersion    string   `json:"model_version"`
	ContractVersion string   `json:"contract_version"`
	SchemaVersion   string   `json:"schema_version"`
	Cohort          string   `json:"cohort"`
	Limitations     []string `json:"limitations"`
}

type GemaResult struct {
	RequestID         string           `json:"request_id"`
	Signal            string           `json:"signal"`
	ContractVersion   string           `json:"contract_version"`
	SchemaVersion     string           `json:"schema_version"`
	Quality           []QualityAttempt `json:"quality"`
	Estimate          *Estimate        `json:"estimate"`
	MandatoryNextStep string           `json:"mandatory_next_step"`
	Metadata          GemaMetadata     `json:"metadata"`
	Inspection        *Inspection      `json:"inspection,omitempty"`
}

type CxrMetadata struct {
	ModelVersion    string   `json:"model_version"`
	ContractVersion string   `json:"contract_version"`
	Cohort          string   `json:"cohort"`
	Limitations     []string `json:"limitations"`
}

type CxrResult struct {
	RequestID         string      `json:"request_id"`
	Signal            string      `json:"signal"`
	ContractVersion   string      `json:"contract_version"`
	SchemaVersion     string      `json:"schema_version"`
	Estimate          *Estimate   `json:"estimate"`
	MandatoryNextStep string      `json:"mandatory_next_step"`
	Metadata          CxrMetadata `json:"metadata"`
	Inspection        *Inspection `json:"inspection,omitempty"`
}
