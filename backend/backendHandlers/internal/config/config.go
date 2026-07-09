package config

import (
	"os"
	"strings"
	"time"
)

type Config struct {
	Addr              string
	PythonProjectRoot string
	PostgresDSN       string
	Featherless       FeatherlessConfig
}

// FeatherlessConfig holds the OpenAI-compatible provider settings used by the
// server-side assistant proxy. Credentials never reach the browser.
type FeatherlessConfig struct {
	BaseURL string
	APIKey  string
	Model   string
	Timeout time.Duration
}

// Enabled reports whether the assistant can call the provider. Without an API
// key the assistant degrades to a contract-compliant MODEL_UNAVAILABLE error.
func (f FeatherlessConfig) Enabled() bool {
	return f.APIKey != "" && f.APIKey != "change-me" && f.BaseURL != ""
}

func Load() Config {
	return Config{
		Addr:              getEnv("JAGA_BACKEND_ADDR", ":8080"),
		PythonProjectRoot: getEnv("JAGA_PYTHON_PROJECT_ROOT", "../python/PrismaServer"),
		PostgresDSN:       strings.TrimSpace(os.Getenv("JAGA_BACKEND_POSTGRES_DSN")),
		Featherless: FeatherlessConfig{
			BaseURL: strings.TrimRight(getEnv("JAGA_BACKEND_FEATHERLESS_URL", "https://api.featherless.ai/v1"), "/"),
			APIKey:  strings.TrimSpace(os.Getenv("JAGA_BACKEND_FEATHERLESS_API_KEY")),
			Model:   getEnv("JAGA_BACKEND_FEATHERLESS_MODEL", "zai-org/GLM-5.2"),
			Timeout: 20 * time.Second,
		},
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
