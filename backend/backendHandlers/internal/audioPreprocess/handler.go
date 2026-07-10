package audioPreprocess

import (
	"errors"
	"io"
	"net/http"
	"strings"

	"jaga/backend/go/internal/response"
)

const maxUploadBytes = 32 << 20

type Handler struct {
	options Options
}

func NewHandler() Handler {
	return Handler{options: DefaultOptions()}
}

type errorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func (h Handler) Preprocess(w http.ResponseWriter, r *http.Request) {
	raw, err := readAudioBody(w, r)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, errTooLarge) {
			status = http.StatusRequestEntityTooLarge
		}
		response.WriteJSON(w, status, errorResponse{Status: "invalid", Message: err.Error()})
		return
	}

	audio, err := DecodeWAV(raw)
	if err != nil {
		response.WriteJSON(w, http.StatusBadRequest, errorResponse{Status: "invalid", Message: err.Error()})
		return
	}

	processed := Process(audio, h.options)
	out := EncodeWAV(processed)

	w.Header().Set("Content-Type", "audio/wav")
	w.Header().Set("Content-Disposition", `attachment; filename="preprocessed.wav"`)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(out)
}

var (
	errEmptyBody = errors.New("audio: request body is empty")
	errTooLarge  = errors.New("audio: recording exceeds the size limit")
	errNoField   = errors.New("audio: multipart form is missing the 'audio' file field")
)

func readAudioBody(w http.ResponseWriter, r *http.Request) ([]byte, error) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)

	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		return readMultipart(r)
	}

	raw, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, sizeError(err)
	}
	if len(raw) == 0 {
		return nil, errEmptyBody
	}
	return raw, nil
}

func readMultipart(r *http.Request) ([]byte, error) {
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		return nil, sizeError(err)
	}
	file, _, err := r.FormFile("audio")
	if err != nil {
		return nil, errNoField
	}
	defer file.Close()

	raw, err := io.ReadAll(file)
	if err != nil {
		return nil, sizeError(err)
	}
	if len(raw) == 0 {
		return nil, errEmptyBody
	}
	return raw, nil
}

func sizeError(err error) error {
	var maxErr *http.MaxBytesError
	if errors.As(err, &maxErr) {
		return errTooLarge
	}
	return err
}
