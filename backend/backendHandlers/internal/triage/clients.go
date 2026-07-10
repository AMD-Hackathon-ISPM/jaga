package triage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// modelClients calls the Rust model services (cough detection + TB probability).
type modelClients struct {
	httpClient *http.Client
	yamnetURL  string
	xgbURL     string
}

func newModelClients(yamnetURL, xgbURL string) *modelClients {
	return &modelClients{
		httpClient: &http.Client{Timeout: 60 * time.Second},
		yamnetURL:  yamnetURL,
		xgbURL:     xgbURL,
	}
}

type coughResult struct {
	CoughDetected bool    `json:"coughDetected"`
	CoughScore    float64 `json:"coughScore"`
}

type tbResult struct {
	TBProbability float64 `json:"tbProbability"`
	RiskBand      string  `json:"riskBand"`
}

// detectCough posts the WAV to the YAMNet service.
func (c *modelClients) detectCough(ctx context.Context, wav []byte) (coughResult, error) {
	body, contentType, err := audioForm(wav, nil)
	if err != nil {
		return coughResult{}, err
	}
	var result coughResult
	if err := c.postMultipart(ctx, c.yamnetURL+"/api/v1/cough/detect", body, contentType, &result); err != nil {
		return coughResult{}, err
	}
	return result, nil
}

// predictTB posts the WAV plus demographics to the XGBoost service.
func (c *modelClients) predictTB(ctx context.Context, wav []byte, demographics map[string]any) (tbResult, error) {
	demoJSON, err := json.Marshal(demographics)
	if err != nil {
		return tbResult{}, err
	}
	body, contentType, err := audioForm(wav, demoJSON)
	if err != nil {
		return tbResult{}, err
	}
	var result tbResult
	if err := c.postMultipart(ctx, c.xgbURL+"/api/v1/tb/predict", body, contentType, &result); err != nil {
		return tbResult{}, err
	}
	return result, nil
}

// audioForm builds a multipart body with an "audio" file and optional
// "demographics" JSON field.
func audioForm(wav []byte, demographicsJSON []byte) (*bytes.Buffer, string, error) {
	buffer := &bytes.Buffer{}
	writer := multipart.NewWriter(buffer)

	part, err := writer.CreateFormFile("audio", "cough.wav")
	if err != nil {
		return nil, "", err
	}
	if _, err := part.Write(wav); err != nil {
		return nil, "", err
	}
	if demographicsJSON != nil {
		if err := writer.WriteField("demographics", string(demographicsJSON)); err != nil {
			return nil, "", err
		}
	}
	if err := writer.Close(); err != nil {
		return nil, "", err
	}
	return buffer, writer.FormDataContentType(), nil
}

func (c *modelClients) postMultipart(ctx context.Context, url string, body *bytes.Buffer, contentType string, out any) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, url, body)
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", contentType)

	response, err := c.httpClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	raw, err := io.ReadAll(response.Body)
	if err != nil {
		return err
	}
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("%s returned %d: %s", url, response.StatusCode, string(raw))
	}
	return json.Unmarshal(raw, out)
}
