pub struct Config {
    pub addr: String,
    pub modelPath: String,
    pub classMapPath: String,
    pub coughThreshold: f32,
}

impl Config {
    pub fn fromEnv() -> Self {
        Config {
            addr: envOr("YAMNET_ADDR", "127.0.0.1:8081"),
            modelPath: envOr("YAMNET_MODEL_PATH", "../models/yamnet/yamnet.onnx"),
            classMapPath: envOr("YAMNET_CLASS_MAP_PATH", "../models/yamnet/yamnet_class_map.csv"),
            coughThreshold: envOr("COUGH_THRESHOLD", "0.5").parse().unwrap_or(0.5),
        }
    }
}

fn envOr(key: &str, fallback: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| fallback.to_string())
}
