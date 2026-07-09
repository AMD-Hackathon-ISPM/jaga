package models

// Contract types mirroring contracts/openapi/jaga-v1.yaml. Keep JSON tags and
// enum values byte-for-byte identical to the signed contract; the frontend
// validates every response with Zod schemas generated from the same file.

// Capability reports whether a single signal/feature is ready to serve.
type Capability struct {
	Ready           bool   `json:"ready"`
	ContractVersion string `json:"contract_version"`
}

// ServiceStatus is returned by GET /api/v1/status.
type ServiceStatus struct {
	Service           string              `json:"service"`
	PythonProjectRoot string              `json:"python_project_root,omitempty"`
	Ready             bool                `json:"ready"`
	Capabilities      ServiceCapabilities `json:"capabilities"`
}

type ServiceCapabilities struct {
	PatientIntake Capability `json:"patient_intake"`
	Gema          Capability `json:"gema"`
	Prisma        Capability `json:"prisma"`
	Assistant     Capability `json:"assistant"`
}

// ApiError is the structured integration error (components.schemas.ApiError).
// code must be one of the contract's enum values.
type ApiError struct {
	Code          string            `json:"code"`
	Message       string            `json:"message"`
	RequestID     string            `json:"request_id"`
	Retryable     bool              `json:"retryable"`
	FieldErrors   []ValidationError `json:"field_errors,omitempty"`
	AttemptErrors []AttemptError    `json:"attempt_errors,omitempty"`
}

type AttemptError struct {
	Index      int    `json:"index"`
	ReasonCode string `json:"reason_code"`
}

// Assistant request/response (components.schemas.AssistantRequest/Response).
type AssistantMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AssistantRequest struct {
	ContractVersion string             `json:"contract_version"`
	Locale          string             `json:"locale"`
	Screen          string             `json:"screen"`
	FieldKey        string             `json:"field_key,omitempty"`
	Messages        []AssistantMessage `json:"messages"`
}

type AssistantResponse struct {
	RequestID       string `json:"request_id"`
	Reply           string `json:"reply"`
	Disposition     string `json:"disposition"`
	Provider        string `json:"provider"`
	Model           string `json:"model"`
	ContractVersion string `json:"contract_version"`
}
