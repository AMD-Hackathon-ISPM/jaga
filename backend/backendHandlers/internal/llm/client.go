// Package llm is a thin client for the Fireworks chat-completions API, used both
// by the triage orchestrator and the guidance assistant (both run Gemma).
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
	"time"
)

const defaultChatURL = "https://api.fireworks.ai/inference/v1/chat/completions"

// Gemma deployment on Fireworks used for orchestration and chat.
const defaultChatModel = "accounts/ezzeddinpratama04/deployments/od9nvbmy"

// Message is a single chat turn.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Client talks to the Fireworks chat-completions endpoint.
type Client struct {
	httpClient *http.Client
	apiURL     string
	apiKey     string
	model      string
	maxTokens  int
}

// Config holds the Fireworks chat settings.
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
		MaxTokens: 16384,
	}
}

// NewClient builds a chat client. It is safe for concurrent use.
func NewClient(config Config) *Client {
	if config.MaxTokens <= 0 {
		config.MaxTokens = 16384
	}
	return &Client{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		apiURL:     config.APIURL,
		apiKey:     config.APIKey,
		model:      config.Model,
		maxTokens:  config.MaxTokens,
	}
}

// Configured reports whether an API key is present.
func (c *Client) Configured() bool { return c.apiKey != "" }

// Model returns the configured model id (for response metadata).
func (c *Client) Model() string { return c.model }

type chatRequest struct {
	Model            string    `json:"model"`
	MaxTokens        int       `json:"max_tokens"`
	TopK             int       `json:"top_k"`
	Temperature      float64   `json:"temperature"`
	PresencePenalty  int       `json:"presence_penalty"`
	FrequencyPenalty int       `json:"frequency_penalty"`
	Messages         []Message `json:"messages"`
}

type chatResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// ErrNotConfigured is returned when no API key is set.
var ErrNotConfigured = errors.New("llm: FIREWORKS_API_KEY is not set")

// Complete sends a system prompt plus conversation turns and returns the reply.
func (c *Client) Complete(ctx context.Context, systemPrompt string, messages []Message, temperature float64) (string, error) {
	if !c.Configured() {
		return "", ErrNotConfigured
	}

	turns := make([]Message, 0, len(messages)+1)
	if systemPrompt != "" {
		turns = append(turns, Message{Role: "system", Content: systemPrompt})
	}
	turns = append(turns, messages...)

	payload, err := json.Marshal(chatRequest{
		Model:            c.model,
		MaxTokens:        c.maxTokens,
		TopK:             40,
		Temperature:      temperature,
		PresencePenalty:  0,
		FrequencyPenalty: 0,
		Messages:         turns,
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

	var decoded chatResponse
	if err := json.Unmarshal(body, &decoded); err != nil {
		return "", fmt.Errorf("llm: decoding response: %w", err)
	}
	if decoded.Error != nil {
		return "", fmt.Errorf("llm: Fireworks error: %s", decoded.Error.Message)
	}
	if len(decoded.Choices) == 0 {
		return "", errors.New("llm: Fireworks returned no choices")
	}
	return decoded.Choices[0].Message.Content, nil
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
