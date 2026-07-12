pub struct Config {
    pub addr: String,
    pub xgbModelPath: String,
    pub wavlmModelPath: String,
    pub localEmbedTimeoutSecs: u64,
    pub goBackendUrl: String,
    pub defaultCountry: String,
}

impl Config {
    pub fn fromEnv() -> Self {
        Config {
            addr: envOr("XGB_ADDR", "127.0.0.1:8082"),
            xgbModelPath: envOr(
                "XGB_MODEL_PATH",
                "../models/xgboostAndDemoPreprocessor/tb_xgb_demo.onnx",
            ),
            wavlmModelPath: envOr("WAVLM_MODEL_PATH", "../models/wavlm/wavlm_large_int8.onnx"),
            localEmbedTimeoutSecs: envOr("LOCAL_EMBED_TIMEOUT_SECS", "15").parse().unwrap_or(15),
            goBackendUrl: envOr("GO_BACKEND_URL", "http://127.0.0.1:8080"),
            defaultCountry: envOr("DEFAULT_COUNTRY", "PH"),
        }
    }
}

fn envOr(key: &str, fallback: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| fallback.to_string())
}
