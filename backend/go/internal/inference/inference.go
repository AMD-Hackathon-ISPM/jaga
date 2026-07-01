// Package inference is the seam between the HTTP handlers and the actual ML
// models for the Gema (triage) and Prisma (cxr) signals.
//
// The handlers fully parse and validate every request against the contract,
// then call these interfaces. Today the only implementation is Unavailable,
// which returns ErrUnavailable so the handlers emit a contract-compliant
// MODEL_UNAVAILABLE response instead of fabricating a result.
//
// When a real model ships, implement TriageInferencer / CxrInferencer (e.g. an
// HTTP proxy to the Python worker, or a Redis job queue) and wire it in
// cmd/server/main.go. Nothing in the handlers or the HTTP contract needs to
// change — only the seam is swapped.
package inference

import (
	"context"
	"errors"
	"mime/multipart"

	"jaga/backend/go/internal/models"
)

// ErrUnavailable signals that no model is wired yet. Handlers translate it into
// a MODEL_UNAVAILABLE ApiError.
var ErrUnavailable = errors.New("inference model unavailable")

// TriageInput is the validated Gema payload: normalized clinical intake plus
// exactly five cough files (still as multipart headers so the implementation
// can stream them without buffering everything in memory).
type TriageInput struct {
	Clinical models.PatientIntake
	Coughs   []*multipart.FileHeader
}

// CxrInput is the validated Prisma payload: a single decoded-export image.
type CxrInput struct {
	Image *multipart.FileHeader
}

type TriageInferencer interface {
	Triage(ctx context.Context, in TriageInput) (models.GemaResult, error)
}

type CxrInferencer interface {
	Cxr(ctx context.Context, in CxrInput) (models.CxrResult, error)
}

// Unavailable is the default seam used until a real model/proxy exists. It
// implements both interfaces and always returns ErrUnavailable.
type Unavailable struct{}

func (Unavailable) Triage(context.Context, TriageInput) (models.GemaResult, error) {
	return models.GemaResult{}, ErrUnavailable
}

func (Unavailable) Cxr(context.Context, CxrInput) (models.CxrResult, error) {
	return models.CxrResult{}, ErrUnavailable
}
