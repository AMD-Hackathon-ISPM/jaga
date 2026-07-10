// Package assistant serves the guidance chat (assistant-v1), backed by Gemma via
// the Fireworks chat API. Gemma decides whether to answer or safety-redirect.
package assistant

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"jaga/backend/go/internal/ids"
	"jaga/backend/go/internal/llm"
	"jaga/backend/go/internal/response"
)

const contractVersion = "assistant-v1"

// outputInstruction asks Gemma for a machine-parseable disposition + reply.
const outputInstruction = `

## Output format
Respond ONLY with a compact JSON object and nothing else:
{"disposition": "answer" | "safety_redirect", "reply": "<your reply in the user's locale>"}`

type Handler struct {
	client *llm.Client
}

func NewHandler(client *llm.Client) Handler {
	return Handler{client: client}
}

func (h Handler) Messages(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var request Request
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10)).Decode(&request); err != nil {
		response.WriteJSON(w, http.StatusBadRequest, ErrorBody{Status: "invalid", Message: "body must be a valid assistant request"})
		return
	}
	if len(request.Messages) == 0 {
		response.WriteJSON(w, http.StatusBadRequest, ErrorBody{Status: "invalid", Message: "messages must not be empty"})
		return
	}
	if !h.client.Configured() {
		response.WriteJSON(w, http.StatusServiceUnavailable, ErrorBody{Status: "unavailable", Message: "assistant is not configured (FIREWORKS_API_KEY missing)"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	systemPrompt := llm.AssistantPrompt + localeContext(request) + outputInstruction
	reply, err := h.client.Complete(ctx, systemPrompt, toLLMMessages(request.Messages), 0.3)
	if err != nil {
		response.WriteJSON(w, http.StatusBadGateway, ErrorBody{Status: "error", Message: "assistant is temporarily unavailable"})
		return
	}

	disposition, text := parseReply(reply)
	response.WriteJSON(w, http.StatusOK, Response{
		RequestID:       ids.New("asst"),
		Reply:           text,
		Disposition:     disposition,
		Provider:        "fireworks",
		Model:           h.client.Model(),
		ContractVersion: contractVersion,
	})
}

func localeContext(request Request) string {
	locale := request.Locale
	if locale == "" {
		locale = "en"
	}
	context := "\n\n## Session context\nLocale: " + locale + "\nScreen: " + request.Screen
	if request.FieldKey != nil {
		context += "\nField: " + *request.FieldKey
	}
	return context
}

func toLLMMessages(messages []Message) []llm.Message {
	out := make([]llm.Message, 0, len(messages))
	for _, message := range messages {
		out = append(out, llm.Message{Role: message.Role, Content: message.Content})
	}
	return out
}

type replyEnvelope struct {
	Disposition string `json:"disposition"`
	Reply       string `json:"reply"`
}

// parseReply extracts the disposition + reply from Gemma's JSON output, falling
// back to a plain answer if the model did not return valid JSON.
func parseReply(raw string) (string, string) {
	trimmed := strings.TrimSpace(raw)
	trimmed = strings.TrimPrefix(trimmed, "```json")
	trimmed = strings.TrimPrefix(trimmed, "```")
	trimmed = strings.TrimSuffix(trimmed, "```")
	trimmed = strings.TrimSpace(trimmed)

	var envelope replyEnvelope
	if err := json.Unmarshal([]byte(trimmed), &envelope); err == nil && envelope.Reply != "" {
		disposition := envelope.Disposition
		if disposition != "safety_redirect" {
			disposition = "answer"
		}
		return disposition, envelope.Reply
	}
	return "answer", raw
}
