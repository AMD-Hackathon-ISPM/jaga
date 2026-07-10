package demographics

import (
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"

	"jaga/backend/go/internal/response"
)

const maxRequestBytes = 16 << 10

type Handler struct{}

func NewHandler() Handler { return Handler{} }

func (Handler) Create(w http.ResponseWriter, r *http.Request) {
	contentType, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if contentType != "" && contentType != "application/json" {
		response.WriteJSON(w, http.StatusUnsupportedMediaType, ErrorResponse{Status: "invalid", Errors: []FieldError{invalid("contentType", "must be application/json")}})
		return
	}

	request, decodeErrors := decodeRequest(w, r)
	if len(decodeErrors) > 0 {
		response.WriteJSON(w, http.StatusBadRequest, ErrorResponse{Status: "invalid", Errors: decodeErrors})
		return
	}

	demographics, validationErrors := validate(request)
	if len(validationErrors) > 0 {
		response.WriteJSON(w, http.StatusBadRequest, ErrorResponse{Status: "invalid", Errors: validationErrors})
		return
	}

	response.WriteJSON(w, http.StatusOK, CreateResponse{Status: "validated", Demographics: demographics})
}

func decodeRequest(w http.ResponseWriter, r *http.Request) (CreateRequest, []FieldError) {
	defer r.Body.Close()
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBytes))
	decoder.DisallowUnknownFields()

	var request CreateRequest
	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return CreateRequest{}, []FieldError{required("body")}
		}
		return CreateRequest{}, []FieldError{invalid("body", "must be a valid demographics JSON object")}
	}

	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return CreateRequest{}, []FieldError{invalid("body", "must contain one JSON object")}
	}
	return request, nil
}
