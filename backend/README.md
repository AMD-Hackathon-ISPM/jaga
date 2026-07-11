# Jaga Backend

- `backend/backendHandlers` — Go API gateway: validation, pure-Go audio preprocessing, triage orchestration, and the Gemma assistant.
- `backend/modelServerandTraining/GemmaServer` — Rust model services (`yamnet` cough gate, `xgboost` TB probability) via ONNX Runtime, plus the committed ONNX models under `models/`.
- `backend/modelServerandTraining/GemmaTraining` — cough-model training notebook and data preparation.
- `backend/modelServerandTraining/PrismaServer` — Python digital-CXR worker: DenseNet121 (`app/models/local_clahe/checkpoints/best.pt`) with CLAHE preprocessing and quantum-kernel-SVM results.
- `backend/modelServerandTraining/PrismaTraining` — PyTorch-based TB chest X-ray research and experiment framework.
