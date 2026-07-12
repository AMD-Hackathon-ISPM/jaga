package triage

import (
	"errors"
	"testing"

	"jaga/backend/go/internal/audioPreprocess"
)

func TestStrongestCoughEvent(t *testing.T) {
	events := []coughEvent{
		{StartSec: 0.0, EndSec: 0.975, PeakScore: 0.6},
		{StartSec: 1.5, EndSec: 2.475, PeakScore: 0.91},
		{StartSec: 3.0, EndSec: 3.975, PeakScore: 0.7},
	}
	got := strongestCoughEvent(events)
	if got != events[1] {
		t.Fatalf("strongestCoughEvent() = %#v, want %#v", got, events[1])
	}
}

func TestDetectedCoughCountUsesEvents(t *testing.T) {
	cough := coughResult{EventCount: 99, Events: []coughEvent{{}, {}, {}}}
	if got := len(cough.Events); got != 3 {
		t.Fatalf("len(events) = %d, want 3", got)
	}
}

func TestCountSurvivesSpectrogramFailure(t *testing.T) {
	result := GemaResult{}
	cough := coughResult{Events: []coughEvent{{PeakScore: 0.8}}, EventCount: 1}
	addCoughEvidence(&result, cough, audioPreprocess.Audio{SampleRate: 16_000, Samples: []float64{0}}, true,
		func(audioPreprocess.Audio, float64, float64) (string, error) { return "", errors.New("jpeg failed") })
	if result.DetectedCoughs != 1 {
		t.Fatalf("DetectedCoughs = %d, want 1", result.DetectedCoughs)
	}
	if result.Inspection != nil {
		t.Fatal("inspection should remain nil after render failure")
	}
}
