package assistant

// Message mirrors one chat turn from the frontend (assistant-v1 contract).
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Request is the assistant-v1 request body.
type Request struct {
	ContractVersion string    `json:"contract_version"`
	Locale          string    `json:"locale"`
	Screen          string    `json:"screen"`
	FieldKey        *string   `json:"field_key"`
	Messages        []Message `json:"messages"`
}

// Response is the assistant-v1 response body.
type Response struct {
	RequestID       string `json:"request_id"`
	Reply           string `json:"reply"`
	Disposition     string `json:"disposition"`
	Provider        string `json:"provider"`
	Model           string `json:"model"`
	ContractVersion string `json:"contract_version"`
}

// ErrorBody is a simple error envelope.
type ErrorBody struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
