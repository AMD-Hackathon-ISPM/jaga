package triage

import (
	"context"
	"encoding/json"
	"strings"

	"jaga/backend/go/internal/audioPreprocess"
	"jaga/backend/go/internal/ids"
	"jaga/backend/go/internal/llm"
)

const (
	modelVersion    = "gema-acoustic-xgb-v1"
	contractVersion = "triage-v1"
	schemaVersion   = "clinical-v1"
	cohort          = "coda-tb-solicited"
)

// Service orchestrates cough detection, the TB acoustic model, and Gemma.
type Service struct {
	models       *modelClients
	llmClient    *llm.Client
	coughMinimum float64
}

// NewService wires the model clients and the Gemma orchestrator.
func NewService(yamnetURL, xgbURL string, llmClient *llm.Client, coughMinimum float64) *Service {
	return &Service{
		models:       newModelClients(yamnetURL, xgbURL),
		llmClient:    llmClient,
		coughMinimum: coughMinimum,
	}
}

// Orchestrate runs the full acoustic triage pipeline and returns a gema result.
func (s *Service) Orchestrate(ctx context.Context, wav []byte, clinical Clinical) GemaResult {
	result := GemaResult{
		RequestID:       ids.New("gema"),
		Signal:          "gema",
		ContractVersion: contractVersion,
		SchemaVersion:   schemaVersion,
		Metadata: Metadata{
			ModelVersion:    modelVersion,
			ContractVersion: contractVersion,
			SchemaVersion:   schemaVersion,
			Cohort:          cohort,
			Limitations: []string{
				"Screening aid only; not a diagnostic test.",
				"Trained on solicited coughs; performance varies with recording conditions.",
				"A negative screen does not rule out TB. Confirmatory testing is required.",
			},
		},
	}

	processed := preprocessAudio(wav)

	cough, err := s.models.detectCough(ctx, processed)
	if err != nil {
		return s.finish(result, systemError("cough_service_unavailable"), nil, clinical, nil, nil)
	}

	if !cough.CoughDetected || cough.CoughScore < s.coughMinimum {
		quality := QualityAttempt{Index: 1, Quality: "retryable", ReasonCode: "cough_not_detected"}
		return s.finish(result, quality, nil, clinical, &cough, nil)
	}

	tb, err := s.models.predictTB(ctx, processed, demographicsOf(clinical))
	if err != nil {
		return s.finish(result, systemError("acoustic_model_unavailable"), nil, clinical, &cough, nil)
	}

	estimate := &Estimate{
		Probability:       tb.TBProbability,
		Band:              normalizeBand(tb.RiskBand),
		Calibrated:        true,
		CalibrationStatus: "acoustic-v1",
	}
	quality := QualityAttempt{Index: 1, Quality: "accepted"}
	return s.finish(result, quality, estimate, clinical, &cough, &tb)
}

func (s *Service) finish(result GemaResult, quality QualityAttempt, estimate *Estimate, clinical Clinical, cough *coughResult, tb *tbResult) GemaResult {
	result.Quality = []QualityAttempt{quality}
	result.Estimate = estimate
	result.MandatoryNextStep = s.guidance(quality, estimate, clinical, cough, tb)
	return result
}

// guidance asks Gemma for the next-step narrative, falling back to a
// deterministic recommendation when the LLM is unavailable.
func (s *Service) guidance(quality QualityAttempt, estimate *Estimate, clinical Clinical, cough *coughResult, tb *tbResult) string {
	if s.llmClient != nil && s.llmClient.Configured() && quality.Quality == "accepted" {
		signals := map[string]any{
			"coughDetected": cough != nil && cough.CoughDetected,
			"tbProbability": nil,
			"riskBand":      nil,
			"demographics":  demographicsOf(clinical),
			"symptoms":      symptomsOf(clinical),
		}
		if estimate != nil {
			signals["tbProbability"] = estimate.Probability
			signals["riskBand"] = estimate.Band
		}
		payload, _ := json.Marshal(signals)
		ctx := context.Background()
		reply, err := s.llmClient.Complete(ctx, llm.OrchestratorPrompt, []llm.Message{{Role: "user", Content: string(payload)}}, 0.2)
		if err == nil {
			if text := strings.TrimSpace(reply); text != "" {
				return text
			}
		}
	}
	return fallbackGuidance(quality, estimate)
}

func fallbackGuidance(quality QualityAttempt, estimate *Estimate) string {
	switch quality.Quality {
	case "retryable":
		return "The cough recording could not be reliably analyzed. Please record a clear, deliberate cough in a quiet space and try again."
	case "system_error":
		return "The screening service is temporarily unavailable. Please try again shortly."
	}
	if estimate != nil && (estimate.Band == "higher" || estimate.Band == "intermediate") {
		return "This acoustic screen suggests further evaluation is warranted. Refer the participant for confirmatory TB testing (a WHO-recommended rapid molecular test such as Xpert) and clinical assessment."
	}
	return "This acoustic screen did not raise a concern. Continue routine clinical judgment; if TB symptoms persist or worsen, proceed to confirmatory testing."
}

func systemError(reason string) QualityAttempt {
	return QualityAttempt{Index: 1, Quality: "system_error", ReasonCode: reason}
}

func preprocessAudio(wav []byte) []byte {
	audio, err := audioPreprocess.DecodeWAV(wav)
	if err != nil {
		return wav // forward as-is; the model services will surface a decode error
	}
	processed := audioPreprocess.Process(audio, audioPreprocess.DefaultOptions())
	return audioPreprocess.EncodeWAV(processed)
}

func demographicsOf(clinical Clinical) map[string]any {
	return map[string]any{
		"ageYears":   clinical.AgeYears,
		"sexAtBirth": clinical.SexAtBirth,
		"heightCm":   clinical.HeightCm,
		"weightKg":   clinical.WeightKg,
	}
}

func symptomsOf(clinical Clinical) map[string]any {
	return map[string]any{
		"coughDurationDays":     clinical.CoughDurationDays,
		"priorTb":               clinical.PriorTB,
		"hemoptysis":            clinical.Hemoptysis,
		"smokedLast7Days":       clinical.SmokedLast7Days,
		"feverLast30Days":       clinical.FeverLast30Days,
		"nightSweatsLast30Days": clinical.NightSweatsLast30Days,
		"weightLossLast30Days":  clinical.WeightLossLast30Days,
	}
}

func normalizeBand(band string) string {
	switch band {
	case "lower", "intermediate", "higher":
		return band
	default:
		return "intermediate"
	}
}
