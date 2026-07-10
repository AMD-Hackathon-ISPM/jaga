pub struct Config {
    pub addr: String,
    pub xgbModelPath: String,
    pub goBackendUrl: String,
    pub fireworksUrl: String,
    pub fireworksApiKey: String,
    pub fireworksModel: String,
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
            goBackendUrl: envOr("GO_BACKEND_URL", "http://127.0.0.1:8080"),
            fireworksUrl: envOr(
                "FIREWORKS_EMBEDDING_URL",
                "https://api.fireworks.ai/inference/v1/embeddings",
            ),
            fireworksApiKey: envOr("FIREWORKS_API_KEY", ""),
            fireworksModel: envOr(
                "FIREWORKS_MODEL",
                "accounts/ezzeddinpratama04/deployments/txvxdq5w",
            ),
            defaultCountry: envOr("DEFAULT_COUNTRY", "PH"),
        }
    }
}

fn envOr(key: &str, fallback: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| fallback.to_string())
}
