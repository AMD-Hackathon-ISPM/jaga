package transporthttp

import (
	"net/http"
	"time"

	"jaga/backend/go/internal/idgen"
	"jaga/backend/go/internal/metrics"
)

// statusRecorder captures the response status code for metrics without
// touching the response body.
type statusRecorder struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (s *statusRecorder) WriteHeader(code int) {
	if !s.wroteHeader {
		s.status = code
		s.wroteHeader = true
	}
	s.ResponseWriter.WriteHeader(code)
}

func (s *statusRecorder) Write(b []byte) (int, error) {
	if !s.wroteHeader {
		s.status = http.StatusOK
		s.wroteHeader = true
	}
	return s.ResponseWriter.Write(b)
}

// withMetrics records non-patient operational telemetry for every request:
// route path, method, status, and latency. It deliberately never reads the
// request or response body (PRD-08).
func withMetrics(next http.Handler, recorder *metrics.Recorder) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		latencyMs := int(time.Since(start).Milliseconds())
		correlationID := idgen.New("req-")
		go recorder.Record(r.URL.Path, r.Method, correlationID, rec.status, latencyMs)
	})
}
