package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"jaga/backend/go/internal/idgen"
	"jaga/backend/go/internal/llm/featherless"
	"jaga/backend/go/internal/models"
)

// AssistantHandler proxies scoped guidance requests to the provider. Provider
// credentials never leave the server.
type AssistantHandler struct {
	assistant *featherless.Service
}

func NewAssistantHandler(assistant *featherless.Service) AssistantHandler {
	return AssistantHandler{assistant: assistant}
}

func (h AssistantHandler) Messages(w http.ResponseWriter, r *http.Request) {
	requestID := idgen.New("asst-")

	if r.Method != http.MethodPost {
		writeAPIError(w, http.StatusMethodNotAllowed, models.ApiError{
			Code: "VALIDATION_ERROR", Message: "must use POST", RequestID: requestID, Retryable: false,
		})
		return
	}

	req, apiErr := decodeAssistantRequest(r, requestID)
	if apiErr != nil {
		writeAPIError(w, http.StatusBadRequest, *apiErr)
		return
	}

	messages := make([]featherless.Message, 0, len(req.Messages))
	for _, m := range req.Messages {
		messages = append(messages, featherless.Message{Role: m.Role, Content: m.Content})
	}

	reply, disposition, err := h.assistant.Guidance(r.Context(), req.Locale, messages)
	if err != nil {
		// Provider unavailable or failed: contract-compliant, non-retryable when
		// unconfigured so the frontend shows a stable "unavailable" state.
		writeAPIError(w, http.StatusServiceUnavailable, models.ApiError{
			Code:      "MODEL_UNAVAILABLE",
			Message:   "The guidance assistant is temporarily unavailable.",
			RequestID: requestID,
			Retryable: !errors.Is(err, featherless.ErrDisabled),
		})
		return
	}

	writeJSON(w, http.StatusOK, models.AssistantResponse{
		RequestID:       requestID,
		Reply:           reply,
		Disposition:     disposition,
		Provider:        featherless.ProviderName,
		Model:           h.assistant.Model(),
		ContractVersion: "assistant-v1",
	})
}

func decodeAssistantRequest(r *http.Request, requestID string) (models.AssistantRequest, *models.ApiError) {
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	var req models.AssistantRequest
	if err := decoder.Decode(&req); err != nil {
		return req, &models.ApiError{
			Code: "VALIDATION_ERROR", Message: "request body must be valid JSON", RequestID: requestID, Retryable: false,
		}
	}

	if req.ContractVersion != "assistant-v1" {
		return req, &models.ApiError{
			Code: "CONTRACT_MISMATCH", Message: "contract_version must be assistant-v1", RequestID: requestID, Retryable: false,
		}
	}
	if req.Locale != "en" && req.Locale != "id" {
		return req, &models.ApiError{
			Code: "VALIDATION_ERROR", Message: "locale must be en or id", RequestID: requestID, Retryable: false,
		}
	}
	if !isValidScreen(req.Screen) {
		return req, &models.ApiError{
			Code: "VALIDATION_ERROR", Message: "screen is not recognized", RequestID: requestID, Retryable: false,
		}
	}
	if len(req.Messages) < 1 || len(req.Messages) > 8 {
		return req, &models.ApiError{
			Code: "VALIDATION_ERROR", Message: "messages must contain between 1 and 8 items", RequestID: requestID, Retryable: false,
		}
	}
	for _, m := range req.Messages {
		if m.Role != "user" && m.Role != "assistant" {
			return req, &models.ApiError{
				Code: "VALIDATION_ERROR", Message: "message role must be user or assistant", RequestID: requestID, Retryable: false,
			}
		}
		content := strings.TrimSpace(m.Content)
		if content == "" || len(m.Content) > 500 {
			return req, &models.ApiError{
				Code: "VALIDATION_ERROR", Message: "message content must be 1 to 500 characters", RequestID: requestID, Retryable: false,
			}
		}
	}
	return req, nil
}

func isValidScreen(screen string) bool {
	switch screen {
	case "gate", "clinical", "coughs", "review", "result", "cxr", "cxr_result":
		return true
	default:
		return false
	}
}

func writeAPIError(w http.ResponseWriter, status int, payload models.ApiError) {
	writeJSON(w, status, payload)
}

// discardBody drains and closes a request body so connections can be reused.
func discardBody(r *http.Request) {
	if r.Body != nil {
		_, _ = io.Copy(io.Discard, io.LimitReader(r.Body, 1<<20))
		r.Body.Close()
	}
}
