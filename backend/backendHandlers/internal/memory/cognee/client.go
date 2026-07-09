package cognee

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
)

type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewClient(config Config) *Client {
	return &Client{
		baseURL: config.BaseURL,
		apiKey:  config.APIKey,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

func (c *Client) Health(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/health", nil)
	if err != nil {
		return err
	}
	resp, err := c.do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		return newHTTPError(resp)
	}
	return nil
}

func (c *Client) EnsureDataset(ctx context.Context, name string) (datasetResponse, error) {
	var response datasetResponse
	body, err := json.Marshal(datasetCreationRequest{Name: name})
	if err != nil {
		return response, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/v1/datasets", bytes.NewReader(body))
	if err != nil {
		return response, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.do(req)
	if err != nil {
		return response, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		return response, newHTTPError(resp)
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return response, err
	}
	return response, nil
}

func (c *Client) ListDatasetData(ctx context.Context, datasetID string) ([]datasetDataItem, error) {
	endpoint := c.baseURL + path.Join("/api/v1/datasets", datasetID, "data")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		return nil, newHTTPError(resp)
	}
	var items []datasetDataItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, err
	}
	return items, nil
}

func (c *Client) Remember(ctx context.Context, datasetName string, fileName string, content string, nodeSets []string) error {
	formBody, contentType, err := buildMemoryMultipart(fileName, content, map[string]string{
		"datasetName":       datasetName,
		"dataset_name":      datasetName,
		"run_in_background": "false",
	})
	if err != nil {
		return err
	}
	for _, nodeSet := range nodeSets {
		formBody.fields = append(formBody.fields, formField{Name: "node_set", Value: nodeSet})
	}
	body, contentType, err := formBody.encode(contentType)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/v1/remember", body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", contentType)
	resp, err := c.do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		return newHTTPError(resp)
	}
	return nil
}

func (c *Client) Update(ctx context.Context, datasetID string, dataID string, fileName string, content string, nodeSets []string) error {
	formBody, contentType, err := buildMemoryMultipart(fileName, content, nil)
	if err != nil {
		return err
	}
	for _, nodeSet := range nodeSets {
		formBody.fields = append(formBody.fields, formField{Name: "node_set", Value: nodeSet})
	}
	body, contentType, err := formBody.encode(contentType)
	if err != nil {
		return err
	}
	endpoint, err := url.Parse(c.baseURL + "/api/v1/update")
	if err != nil {
		return err
	}
	query := endpoint.Query()
	query.Set("dataset_id", datasetID)
	query.Set("datasetId", datasetID)
	query.Set("data_id", dataID)
	query.Set("dataId", dataID)
	endpoint.RawQuery = query.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, endpoint.String(), body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", contentType)
	resp, err := c.do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		return newHTTPError(resp)
	}
	return nil
}

func (c *Client) Recall(ctx context.Context, requestBody recallRequest) ([]recallResponseItem, error) {
	payload := map[string]any{
		"searchType":   requestBody.SearchType,
		"search_type":  requestBody.SearchType,
		"query":        requestBody.Query,
		"onlyContext":  requestBody.OnlyContext,
		"only_context": requestBody.OnlyContext,
		"verbose":      requestBody.Verbose,
	}
	if len(requestBody.Datasets) > 0 {
		payload["datasets"] = requestBody.Datasets
	}
	if len(requestBody.DatasetIDs) > 0 {
		payload["datasetIds"] = requestBody.DatasetIDs
		payload["dataset_ids"] = requestBody.DatasetIDs
	}
	if requestBody.SystemPrompt != "" {
		payload["systemPrompt"] = requestBody.SystemPrompt
		payload["system_prompt"] = requestBody.SystemPrompt
	}
	if len(requestBody.NodeName) > 0 {
		payload["nodeName"] = requestBody.NodeName
		payload["node_name"] = requestBody.NodeName
	}
	if requestBody.TopK > 0 {
		payload["topK"] = requestBody.TopK
		payload["top_k"] = requestBody.TopK
	}
	if requestBody.Scope != "" {
		payload["scope"] = requestBody.Scope
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/v1/recall", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		return nil, newHTTPError(resp)
	}
	var response []recallResponseItem
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}
	return response, nil
}

func (c *Client) do(req *http.Request) (*http.Response, error) {
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
		req.Header.Set("X-Api-Key", c.apiKey)
	}
	return c.httpClient.Do(req)
}

type formField struct {
	Name  string
	Value string
}

type multipartBody struct {
	fileName string
	content  string
	fields   []formField
}

func buildMemoryMultipart(fileName string, content string, fields map[string]string) (multipartBody, string, error) {
	body := multipartBody{
		fileName: fileName,
		content:  content,
	}
	for key, value := range fields {
		body.fields = append(body.fields, formField{Name: key, Value: value})
	}
	return body, "", nil
}

func (b multipartBody) encode(_ string) (io.Reader, string, error) {
	buffer := &bytes.Buffer{}
	writer := multipart.NewWriter(buffer)
	dataWriter, err := writer.CreateFormFile("data", b.fileName)
	if err != nil {
		return nil, "", err
	}
	if _, err := io.WriteString(dataWriter, b.content); err != nil {
		return nil, "", err
	}
	for _, field := range b.fields {
		if err := writer.WriteField(field.Name, field.Value); err != nil {
			return nil, "", err
		}
	}
	if err := writer.Close(); err != nil {
		return nil, "", err
	}
	return buffer, writer.FormDataContentType(), nil
}

func newHTTPError(resp *http.Response) error {
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if len(body) == 0 {
		return fmt.Errorf("cognee request failed with status %d", resp.StatusCode)
	}
	return fmt.Errorf("cognee request failed with status %d: %s", resp.StatusCode, string(body))
}
