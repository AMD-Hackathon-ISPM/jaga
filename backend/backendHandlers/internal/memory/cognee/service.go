package cognee

import (
	"context"
	"errors"
	"fmt"
	"log"
	"regexp"
	"sort"
	"strings"
	"time"

	"jaga/backend/go/internal/memory"
)

var safeNamePattern = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

type Service struct {
	config Config
	client *Client
	logger *log.Logger
}

func NewService(config Config, logger *log.Logger) *Service {
	return &Service{
		config: config,
		client: NewClient(config),
		logger: logger,
	}
}

func (s *Service) StorePatientMemory(ctx context.Context, patientMemory memory.PatientMemory) error {
	if err := validatePatientMemory(patientMemory); err != nil {
		return err
	}
	if !s.config.Enabled() {
		s.logWarning("store skipped because Cognee is disabled")
		return nil
	}
	start := time.Now()
	dataset, err := s.client.EnsureDataset(ctx, s.config.Collection)
	if err != nil {
		s.logFailure("store", start, err)
		return s.handleOperationalError("store", err)
	}
	items, err := s.client.ListDatasetData(ctx, dataset.ID)
	if err != nil {
		s.logFailure("store", start, err)
		return s.handleOperationalError("store", err)
	}
	fileName := buildDocumentName(patientMemory.PatientID, patientMemory.VisitID)
	content := buildDocumentContent(patientMemory)
	nodeSets := buildNodeSets(patientMemory.PatientID, patientMemory.VisitID)
	if existing := findDataItemByName(items, fileName); existing != nil {
		err = s.client.Update(ctx, dataset.ID, existing.ID, fileName, content, nodeSets)
	} else {
		err = s.client.Remember(ctx, dataset.Name, fileName, content, nodeSets)
	}
	if err != nil {
		s.logFailure("store", start, err)
		return s.handleOperationalError("store", err)
	}
	s.logger.Printf("cognee store latency=%s patient_id=%s visit_id=%s", time.Since(start), patientMemory.PatientID, patientMemory.VisitID)
	return nil
}

func (s *Service) SearchPatientMemory(ctx context.Context, patientID string, query string) ([]memory.MemoryResult, error) {
	patientID = strings.TrimSpace(patientID)
	query = strings.TrimSpace(query)
	if patientID == "" {
		return nil, errors.New("patientID is required")
	}
	if query == "" {
		return nil, errors.New("query is required")
	}
	if !s.config.Enabled() {
		s.logWarning("search skipped because Cognee is disabled")
		return []memory.MemoryResult{}, nil
	}
	start := time.Now()
	results, err := s.client.Recall(ctx, recallRequest{
		SearchType:   "GRAPH_COMPLETION",
		Datasets:     []string{s.config.Collection},
		Query:        query,
		SystemPrompt: "Answer using only the stored patient memory. Keep the answer concise and grounded in the memory.",
		NodeName:     []string{buildPatientNode(patientID)},
		TopK:         5,
		OnlyContext:  false,
		Verbose:      false,
		Scope:        "graph",
	})
	if err != nil {
		s.logFailure("search", start, err)
		return []memory.MemoryResult{}, s.handleOperationalError("search", err)
	}
	mapped := make([]memory.MemoryResult, 0, len(results))
	for _, result := range results {
		mapped = append(mapped, memory.MemoryResult{
			PatientID: patientID,
			Content:   strings.TrimSpace(result.Context),
			Context:   strings.TrimSpace(result.Context),
			Answer:    strings.TrimSpace(result.Answer),
			Source:    strings.TrimSpace(result.Source),
			Metadata:  cloneMap(result.MemifyMetadata),
		})
	}
	s.logger.Printf("cognee search latency=%s patient_id=%s results=%d", time.Since(start), patientID, len(mapped))
	return mapped, nil
}

func (s *Service) SummarizePatientHistory(ctx context.Context, patientID string) (string, error) {
	patientID = strings.TrimSpace(patientID)
	if patientID == "" {
		return "", errors.New("patientID is required")
	}
	if !s.config.Enabled() {
		s.logWarning("summary skipped because Cognee is disabled")
		return "", nil
	}
	start := time.Now()
	results, err := s.client.Recall(ctx, recallRequest{
		SearchType:   "GRAPH_COMPLETION",
		Datasets:     []string{s.config.Collection},
		Query:        "Summarize previous tuberculosis-related visits for this patient.",
		SystemPrompt: "Summarize the patient's tuberculosis-related history in 3 to 5 concise sentences using only stored patient memory.",
		NodeName:     []string{buildPatientNode(patientID)},
		TopK:         5,
		OnlyContext:  false,
		Verbose:      false,
		Scope:        "graph",
	})
	if err != nil {
		s.logFailure("summary", start, err)
		return "", s.handleOperationalError("summary", err)
	}
	s.logger.Printf("cognee summary latency=%s patient_id=%s results=%d", time.Since(start), patientID, len(results))
	for _, result := range results {
		summary := strings.TrimSpace(result.Answer)
		if summary != "" {
			return summary, nil
		}
	}
	var contexts []string
	for _, result := range results {
		if context := strings.TrimSpace(result.Context); context != "" {
			contexts = append(contexts, context)
		}
	}
	return strings.Join(contexts, "\n\n"), nil
}

func (s *Service) CheckHealth(ctx context.Context) error {
	if !s.config.Enabled() {
		return errors.New("cognee is disabled")
	}
	return s.client.Health(ctx)
}

func (s *Service) handleOperationalError(operation string, err error) error {
	s.logWarning(fmt.Sprintf("%s degraded because Cognee is unavailable: %v", operation, err))
	return nil
}

func (s *Service) logFailure(operation string, start time.Time, err error) {
	s.logger.Printf("cognee %s failure latency=%s error=%v", operation, time.Since(start), err)
}

func (s *Service) logWarning(message string) {
	s.logger.Printf("cognee warning: %s", message)
}

func validatePatientMemory(patientMemory memory.PatientMemory) error {
	if strings.TrimSpace(patientMemory.PatientID) == "" {
		return errors.New("patientID is required")
	}
	if strings.TrimSpace(patientMemory.VisitID) == "" {
		return errors.New("visitID is required")
	}
	if patientMemory.Timestamp.IsZero() {
		return errors.New("timestamp is required")
	}
	return nil
}

func buildDocumentName(patientID string, visitID string) string {
	return fmt.Sprintf("patient_%s_visit_%s.txt", sanitizeName(patientID), sanitizeName(visitID))
}

func buildNodeSets(patientID string, visitID string) []string {
	return []string{
		buildPatientNode(patientID),
		"memory:patient",
		"visit:" + sanitizeName(visitID),
	}
}

func buildPatientNode(patientID string) string {
	return "patient:" + sanitizeName(patientID)
}

func sanitizeName(value string) string {
	cleaned := safeNamePattern.ReplaceAllString(strings.TrimSpace(value), "_")
	cleaned = strings.Trim(cleaned, "._-")
	if cleaned == "" {
		return "unknown"
	}
	return cleaned
}

func buildDocumentContent(patientMemory memory.PatientMemory) string {
	lines := []string{
		"Patient semantic memory",
		"Patient ID: " + patientMemory.PatientID,
		"Visit ID: " + patientMemory.VisitID,
		"Timestamp: " + patientMemory.Timestamp.UTC().Format(time.RFC3339),
		"Prediction: " + patientMemory.Prediction,
		fmt.Sprintf("Confidence: %.4f", patientMemory.Confidence),
		"Clinical summary: " + normalizeText(patientMemory.ClinicalSummary),
		"Retrieval summary: " + normalizeText(patientMemory.RetrievalSummary),
		"Quantum summary: " + normalizeText(patientMemory.QuantumSummary),
		"GradCAM summary: " + normalizeText(patientMemory.GradCAMSummary),
		"Recommendations: " + normalizeText(patientMemory.Recommendations),
	}
	metadataLines := renderMetadata(patientMemory.Metadata)
	if len(metadataLines) > 0 {
		lines = append(lines, "Metadata:")
		lines = append(lines, metadataLines...)
	}
	return strings.Join(lines, "\n")
}

func normalizeText(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "n/a"
	}
	return trimmed
}

func renderMetadata(metadata map[string]any) []string {
	if len(metadata) == 0 {
		return nil
	}
	keys := make([]string, 0, len(metadata))
	for key := range metadata {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	lines := make([]string, 0, len(keys))
	for _, key := range keys {
		lines = append(lines, fmt.Sprintf("%s: %v", key, metadata[key]))
	}
	return lines
}

func findDataItemByName(items []datasetDataItem, name string) *datasetDataItem {
	for index := range items {
		if items[index].Name == name {
			return &items[index]
		}
	}
	return nil
}

func cloneMap(source map[string]any) map[string]any {
	if len(source) == 0 {
		return nil
	}
	cloned := make(map[string]any, len(source))
	for key, value := range source {
		cloned[key] = value
	}
	return cloned
}
