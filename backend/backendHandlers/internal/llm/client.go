// Package llm is a thin client for the Fireworks text-completions API, used both
// by the triage orchestrator and the guidance assistant (both run Gemma).
//
// It targets the /completions endpoint (not /chat/completions) and applies
// Gemma's chat template itself. The deployed Gemma tokenizer has no chat
// template, so /chat/completions rejects requests ("default chat template is no
// longer allowed"); formatting the prompt here avoids that entirely.
package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const defaultChatURL = "https://api.fireworks.ai/inference/v1/chat/completions"

// Gemma deployment on Fireworks used for orchestration and chat.
const defaultChatModel = "accounts/ezzeddinpratama04/deployments/od9nvbmy"

// Gemma turn delimiters.
const (
	turnStart = "<start_of_turn>"
	turnEnd   = "<end_of_turn>"
)

// Message is a single chat turn.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Client talks to the Fireworks completions endpoint.
type Client struct {
	httpClient *http.Client
	apiURL     string
	apiKey     string
	model      string
	maxTokens  int
}

// Config holds the Fireworks completion settings.
type Config struct {
	APIURL    string
	APIKey    string
	Model     string
	MaxTokens int
}

// ConfigFromEnv reads Fireworks settings from the environment.
func ConfigFromEnv() Config {
	return Config{
		APIURL:    envOr("FIREWORKS_CHAT_URL", defaultChatURL),
		APIKey:    os.Getenv("FIREWORKS_API_KEY"),
		Model:     envOr("FIREWORKS_CHAT_MODEL", defaultChatModel),
		MaxTokens: 2048,
	}
}

// NewClient builds a completion client. It is safe for concurrent use. A
// /chat/completions URL is rewritten to /completions.
func NewClient(config Config) *Client {
	if config.MaxTokens <= 0 {
		config.MaxTokens = 2048
	}
	url := config.APIURL
	if strings.Contains(url, "/chat/completions") {
		url = strings.Replace(url, "/chat/completions", "/completions", 1)
	}
	return &Client{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		apiURL:     url,
		apiKey:     config.APIKey,
		model:      config.Model,
		maxTokens:  config.MaxTokens,
	}
}

// Configured reports whether an API key is present.
func (c *Client) Configured() bool { return c.apiKey != "" }

// Model returns the configured model id (for response metadata).
func (c *Client) Model() string { return c.model }

type completionRequest struct {
	Model       string   `json:"model"`
	Prompt      string   `json:"prompt"`
	MaxTokens   int      `json:"max_tokens"`
	Temperature float64  `json:"temperature"`
	TopK        int      `json:"top_k"`
	Stop        []string `json:"stop"`
}

type completionResponse struct {
	Choices []struct {
		Text string `json:"text"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// ErrNotConfigured is returned when no API key is set.
var ErrNotConfigured = errors.New("llm: FIREWORKS_API_KEY is not set")

// Complete formats the system prompt plus conversation as a Gemma prompt, sends
// it to the completions endpoint, and returns the model's reply.
func (c *Client) Complete(ctx context.Context, systemPrompt string, messages []Message, temperature float64) (string, error) {
	if !c.Configured() {
		return "", ErrNotConfigured
	}

	payload, err := json.Marshal(completionRequest{
		Model:       c.model,
		Prompt:      buildGemmaPrompt(systemPrompt, messages),
		MaxTokens:   c.maxTokens,
		Temperature: temperature,
		TopK:        40,
		Stop:        []string{turnEnd},
	})
	if err != nil {
		return "", fmt.Errorf("llm: encoding request: %w", err)
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, c.apiURL, bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("llm: building request: %w", err)
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+c.apiKey)

	response, err := c.httpClient.Do(request)
	if err != nil {
		return "", fmt.Errorf("llm: calling Fireworks: %w", err)
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", fmt.Errorf("llm: reading response: %w", err)
	}
	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("llm: Fireworks returned %d: %s", response.StatusCode, string(body))
	}

	var decoded completionResponse
	if err := json.Unmarshal(body, &decoded); err != nil {
		return "", fmt.Errorf("llm: decoding response: %w", err)
	}
	if decoded.Error != nil {
		return "", fmt.Errorf("llm: Fireworks error: %s", decoded.Error.Message)
	}
	if len(decoded.Choices) == 0 {
		return "", errors.New("llm: Fireworks returned no choices")
	}

	reply := decoded.Choices[0].Text
	reply = strings.TrimSuffix(strings.TrimSpace(reply), turnEnd)
	return strings.TrimSpace(reply), nil
}

// buildGemmaPrompt renders the conversation with Gemma's chat template. Gemma has
// no system role, so the system prompt is folded into the first user turn. The
// assistant role maps to "model", and the prompt ends open for the model turn.
func buildGemmaPrompt(systemPrompt string, messages []Message) string {
	var builder strings.Builder
	systemInjected := false

	for _, message := range messages {
		role := "user"
		if message.Role == "assistant" || message.Role == "model" {
			role = "model"
		}

		content := message.Content
		if role == "user" && !systemInjected && systemPrompt != "" {
			content = systemPrompt + "\n\n" + content
			systemInjected = true
		}

		builder.WriteString(turnStart)
		builder.WriteString(role)
		builder.WriteString("\n")
		builder.WriteString(content)
		builder.WriteString(turnEnd)
		builder.WriteString("\n")
	}

	prompt := builder.String()
	// No user turn carried the system prompt (e.g. a model-only history): add it.
	if !systemInjected && systemPrompt != "" {
		prompt = turnStart + "user\n" + systemPrompt + turnEnd + "\n" + prompt
	}
	return prompt + turnStart + "model\n"
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
