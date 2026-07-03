package featherless

import (
	"context"
	"log"
	"regexp"
	"strings"
)

// systemPrompt locks the assistant to scoped guidance. It must never diagnose,
// interpret an individual result, or recommend treatment (product-requirements
// PRD-10; the flow is triage, not diagnosis).
const systemPrompt = `You are a scoped guidance assistant for the Jaga tuberculosis SCREENING prototype.
STRICT RULES:
- This is triage, NOT diagnosis. Never state or imply whether the person has or does not have TB.
- Never interpret an individual risk score/result, and never recommend medication or treatment.
- Only help the user understand the form, the capture steps, and the general referral guidance.
- Always reinforce that every participant needs confirmatory clinical evaluation.
- Keep replies under 120 words, in the requested language.`

// safetyPattern mirrors the frontend fixture guard so live behaviour matches
// the offline demo: diagnosis/treatment/result-interpretation questions are
// redirected rather than answered. Bilingual (English + Bahasa Indonesia) so
// that ID phrasings ("apakah saya kena TB", "positif", "obat") are caught by
// the deterministic guard, not only by the model prompt.
var safetyPattern = regexp.MustCompile(`(?i)\b(diagnos|do i have|positive|negative|treat|medicine|medication|drug|cure|my (risk|result)|apakah (saya|aku)|kena tb|terkena tb|positif|negatif|obat|sembuh|hasil saya)\b`)

const (
	DispositionAnswer   = "answer"
	DispositionRedirect = "safety_redirect"
	ProviderName        = "featherless"

	safeRedirectEN = "I cannot diagnose TB, interpret an individual risk result, or recommend treatment. Please continue with the standard clinical pathway and confirmatory evaluation."
	safeRedirectID = "Saya tidak dapat mendiagnosis TB, menafsirkan hasil risiko individual, atau merekomendasikan pengobatan. Silakan lanjutkan jalur klinis standar dan evaluasi konfirmasi."
)

type Service struct {
	client  *Client
	enabled bool
	logger  *log.Logger
}

func NewService(client *Client, enabled bool, logger *log.Logger) *Service {
	return &Service{client: client, enabled: enabled, logger: logger}
}

func (s *Service) Enabled() bool { return s.enabled }

func (s *Service) Model() string {
	if s.client == nil {
		return ""
	}
	return s.client.Model()
}

// Guidance returns the reply text, disposition, and an error. When the last
// user message trips the safety pattern it returns a deterministic redirect
// without calling the provider. Any provider failure is returned as an error so
// the caller can emit a contract-compliant MODEL_UNAVAILABLE response.
func (s *Service) Guidance(ctx context.Context, locale string, messages []Message) (string, string, error) {
	last := ""
	for i := len(messages) - 1; i >= 0; i-- {
		if messages[i].Role == "user" {
			last = messages[i].Content
			break
		}
	}
	if safetyPattern.MatchString(last) {
		return safeRedirect(locale), DispositionRedirect, nil
	}
	if !s.enabled || s.client == nil {
		return "", "", ErrDisabled
	}

	chat := make([]Message, 0, len(messages)+1)
	chat = append(chat, Message{Role: "system", Content: systemPrompt + "\nRespond in language: " + locale})
	chat = append(chat, messages...)

	reply, err := s.client.Chat(ctx, chat)
	if err != nil {
		s.logger.Printf("assistant degraded: %v", err)
		return "", "", err
	}
	reply = strings.TrimSpace(reply)
	if reply == "" {
		return "", "", ErrEmptyReply
	}
	return reply, DispositionAnswer, nil
}

func safeRedirect(locale string) string {
	if strings.EqualFold(locale, "id") {
		return safeRedirectID
	}
	return safeRedirectEN
}
