package config

import "os"

type Config struct {
	Addr              string
	PythonProjectRoot string
}

func Load() Config {
	return Config{
		Addr:              getEnv("JAGA_BACKEND_ADDR", ":8080"),
		PythonProjectRoot: getEnv("JAGA_PYTHON_PROJECT_ROOT", "../python/project"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
