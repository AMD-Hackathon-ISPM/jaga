package cognee

import (
	"os"
	"strings"
	"time"
)

type Config struct {
	ServiceEnabled bool
	APIKey         string
	BaseURL        string
	Collection     string
	Timeout        time.Duration
}

func LoadConfigFromEnv() Config {
	return Config{
		ServiceEnabled: getBoolEnv("COGNEE_ENABLED", true),
		APIKey:         strings.TrimSpace(os.Getenv("COGNEE_API_KEY")),
		BaseURL:        strings.TrimRight(getEnv("COGNEE_BASE_URL", "http://cognee:8000"), "/"),
		Collection:     getEnv("COGNEE_COLLECTION", "jaga"),
		Timeout:        getDurationEnv("COGNEE_TIMEOUT", 30*time.Second),
	}
}

func (c Config) Enabled() bool {
	return c.ServiceEnabled && c.BaseURL != ""
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getBoolEnv(key string, fallback bool) bool {
	value := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	if value == "" {
		return fallback
	}
	switch value {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
}
