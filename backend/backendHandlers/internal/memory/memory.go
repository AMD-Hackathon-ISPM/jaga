package memory

import (
	"context"
	"time"
)

type PatientMemory struct {
	PatientID        string
	VisitID          string
	Timestamp        time.Time
	Prediction       string
	Confidence       float64
	RetrievalSummary string
	QuantumSummary   string
	GradCAMSummary   string
	ClinicalSummary  string
	Recommendations  string
	Metadata         map[string]any
}

type MemoryResult struct {
	PatientID string
	VisitID   string
	Content   string
	Context   string
	Answer    string
	Source    string
	Metadata  map[string]any
}

type MemoryService interface {
	StorePatientMemory(ctx context.Context, patientMemory PatientMemory) error
	SearchPatientMemory(ctx context.Context, patientID string, query string) ([]MemoryResult, error)
	SummarizePatientHistory(ctx context.Context, patientID string) (string, error)
}

type HealthChecker interface {
	CheckHealth(ctx context.Context) error
}
