# Jaga — Backend Architecture

Four zones, two independent AI pathways that are **never fused**. Solid arrows are the live internal request flow; dashed arrows are external API calls or evaluation metadata.

```mermaid
flowchart TB
    subgraph Z1["Zone 1 — Gateway & Infrastructure"]
        direction LR
        NGINX["NGINX Gateway<br/>reverse proxy, request routing"] --> SWARM["Docker Swarm<br/>orchestration, health checks,<br/>rolling updates"] --> GO["Go API Gateway<br/>validation, preprocessing,<br/>orchestration"]
    end

    subgraph Z2["Zone 2 — Audio Preprocessing Pipeline"]
        direction LR
        REC(["One guided<br/>cough recording"]) --> DSP["Go DSP — Stage 1<br/>WAV decode · DC-offset removal ·<br/>80 Hz high-pass · silence trim ·<br/>peak normalization<br/><i>backendHandlers/internal/audioPreprocess/dsp.go</i>"]
        DSP --> RS["Rust jagaAudio — Stage 2<br/>WAV decode · mono downmix ·<br/>16 kHz linear resampling<br/><i>GemmaServer/rust/jagaAudio</i>"]
    end

    subgraph Z3["Zone 3 — Independent AI Inference Pathways"]
        subgraph PRISMA["A: Prisma (digital CXR)"]
            DN["DenseNet121 + CLAHE<br/>local Python inference<br/>separate CXR estimate +<br/>optional Grad-CAM heatmap"]
            QK["Quantum research evaluation<br/>PCA-4 DenseNet embeddings ·<br/>4-qubit PennyLane quantum-kernel SVM<br/>98.3% acc · 1.00 ROC-AUC<br/><i>not live inference</i>"]
        end
        subgraph GEMA["B: Gema (cough + clinical)"]
            YAM["YAMNet (local Rust ONNX)<br/>detects cough events, applies the<br/>recording-quality gate, extracts the<br/>cough segment (start/end)"]
            WAV["WavLM Large (local, on-device)<br/>dynamic-int8 ONNX embeddings ·<br/>no external embedding call"]
            XGB["XGBoost classifier<br/>WavLM embedding + supported<br/>clinical inputs (CODA<br/>controlled-access dataset)"]
            EST(["Separate Gema<br/>research estimate"])
            YAM -->|accepted cough| WAV --> XGB --> EST
        end
        subgraph GEMMA["C: Gemma (guidance layer)"]
            CHAT["Guidance & assistant<br/>Fireworks or Featherless ·<br/>bounded next-step wording +<br/>educational chat"]
            GUARD["LLM never calculates or<br/>changes model estimates"]
        end
        RESULT["Research result + required next step<br/>Gema and Prisma estimates remain separate ·<br/>confirmatory evaluation remains essential"]
        DN -.->|CXR estimate<br/>metadata only| RESULT
        EST -.->|Gema estimate<br/>metadata only| RESULT
        RESULT <-.-> CHAT
    end

    subgraph Z4["Zone 4 — External Providers & Deployed Services"]
        EXT["External model provider<br/>Fireworks or Featherless:<br/>Gemma guidance chat only"]
        DATA["PostgreSQL · Redis · MinIO<br/>deployed infrastructure; not on the<br/>current public inference request path"]
    end

    GO --> DSP
    RS -->|accepted cough recording| YAM
    CHAT -.-> EXT
```

Notes:

- **Privacy:** public demo inputs are processed transiently and are not retained.
- **Efficiency:** the YAMNet gate passes only the detected cough segment to WavLM, and WavLM runs fully as a local int8 ONNX model in Rust — no external embedding call. Fireworks/Featherless is used only for the Gemma guidance chat.
- **Safety:** the LLM writes guidance copy around the model output; probabilities always come from the classical models. Every LLM failure path falls back to deterministic bilingual copy.
- **Training:** both models were trained on AMD Instinct MI300X (AMD Developer Cloud, ROCm PyTorch) — see the README's "AMD & approved compute usage" section.
