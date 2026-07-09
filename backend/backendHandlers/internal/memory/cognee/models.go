package cognee

type datasetResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	OwnerID   string `json:"owner_id"`
}

type datasetCreationRequest struct {
	Name string `json:"name"`
}

type datasetDataItem struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
	Extension       string `json:"extension"`
	MimeType        string `json:"mime_type"`
	RawDataLocation string `json:"raw_data_location"`
	DatasetID       string `json:"dataset_id"`
}

type recallRequest struct {
	SearchType   string   `json:"search_type"`
	Datasets     []string `json:"datasets,omitempty"`
	DatasetIDs   []string `json:"dataset_ids,omitempty"`
	Query        string   `json:"query"`
	SystemPrompt string   `json:"system_prompt,omitempty"`
	NodeName     []string `json:"node_name,omitempty"`
	TopK         int      `json:"top_k,omitempty"`
	OnlyContext  bool     `json:"only_context"`
	Verbose      bool     `json:"verbose"`
	Scope        string   `json:"scope,omitempty"`
}

type recallResponseItem struct {
	Time                string         `json:"time"`
	Question            string         `json:"question"`
	Context             string         `json:"context"`
	Answer              string         `json:"answer"`
	Source              string         `json:"source"`
	QAID                string         `json:"qa_id"`
	FeedbackText        string         `json:"feedback_text"`
	FeedbackScore       *int           `json:"feedback_score"`
	UsedGraphElementIDs map[string]any `json:"used_graph_element_ids"`
	MemifyMetadata      map[string]any `json:"memify_metadata"`
}
