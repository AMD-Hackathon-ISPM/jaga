package llm

import _ "embed"

// OrchestratorPrompt is the omniprompt for the triage orchestrator (Gemma).
//
//go:embed prompts/orchestrator.md
var OrchestratorPrompt string

// AssistantPrompt is the system prompt for the guidance chat assistant (Gemma).
//
//go:embed prompts/assistant.md
var AssistantPrompt string
