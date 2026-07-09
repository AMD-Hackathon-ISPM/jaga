package featherless

import "errors"

var (
	// ErrDisabled is returned when the provider is not configured (no API key).
	ErrDisabled = errors.New("assistant provider is not configured")
	// ErrEmptyReply is returned when the provider responds with no usable text.
	ErrEmptyReply = errors.New("assistant provider returned an empty reply")
)
