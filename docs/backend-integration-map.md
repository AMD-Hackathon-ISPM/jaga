# Backend integration map

**Purpose:** Inventory of every UI surface and flow step that needs (or uses) backend integration, with concrete file paths on both sides.

**Last updated:** 2026-07-10

**Related contracts:**

- OpenAPI proposal: [`contracts/openapi/jaga-v1.yaml`](../contracts/openapi/jaga-v1.yaml)
- Frontend wire schemas: [`frontend/src/contracts/api.ts`](../frontend/src/contracts/api.ts)
- Architecture: [`.agent/project-architecture.md`](../.agent/project-architecture.md) §6

**Status legend**

| Symbol | Meaning |
|---|---|
| ✅ Live | Works against the Go API today |
| ⚠️ Wired, blocked | Frontend calls the API; backend returns `MODEL_UNAVAILABLE` or equivalent |
| 🔧 Fixture only | Dev default (`NEXT_PUBLIC_API_MODE=fixture`); synthetic responses |
| 🖥️ Client-only | No backend call; browser-only logic |
| 🚧 Not wired | Contract or service exists; UI does not use it yet |

---

## Turning on live mode

| Config | File | Role |
|---|---|---|
| `NEXT_PUBLIC_API_MODE=live` | [`frontend/src/lib/config.ts`](../frontend/src/lib/config.ts) | Use real HTTP instead of fixtures |
| `NEXT_PUBLIC_API_BASE_URL` | [`frontend/src/lib/config.ts`](../frontend/src/lib/config.ts) | Go API gateway base URL |

Default in development is `fixture`, so most flows appear to work without a real model.

Production rejects `fixture` mode (see `getIntegrationConfig` in config.ts).

---

## Shared integration layer

| Role | Files |
|---|---|
| API mode / base URL | [`frontend/src/lib/config.ts`](../frontend/src/lib/config.ts) |
| HTTP client (Axios) | [`frontend/src/lib/http.ts`](../frontend/src/lib/http.ts) |
| Request builders (multipart, assistant, CXR validation) | [`frontend/src/lib/integration.ts`](../frontend/src/lib/integration.ts) |
| Wire schemas (Zod) | [`frontend/src/contracts/api.ts`](../frontend/src/contracts/api.ts) |
| Synthetic fixtures | [`frontend/src/contracts/fixtures/`](../frontend/src/contracts/fixtures/) |
| OpenAPI contract (canonical proposal) | [`contracts/openapi/jaga-v1.yaml`](../contracts/openapi/jaga-v1.yaml) |
| Service barrel export | [`frontend/src/services/index.ts`](../frontend/src/services/index.ts) |
| Error mapping | [`frontend/src/services/api-error.ts`](../frontend/src/services/api-error.ts) |
| Integration tests | [`frontend/src/services/integration-services.test.ts`](../frontend/src/services/integration-services.test.ts), [`frontend/src/services/http-integration.test.ts`](../frontend/src/services/http-integration.test.ts), [`frontend/src/lib/integration.test.ts`](../frontend/src/lib/integration.test.ts) |

---

## 1. Gate — 🖥️ no backend

| What | Files |
|---|---|
| Route | [`frontend/src/app/page.tsx`](../frontend/src/app/page.tsx) |
| Screen | [`frontend/src/features/gate/gate-screen.tsx`](../frontend/src/features/gate/gate-screen.tsx) |
| Logic | [`frontend/src/features/gate/gate-utils.ts`](../frontend/src/features/gate/gate-utils.ts) |
| State | [`frontend/src/store/session.store.ts`](../frontend/src/store/session.store.ts) (`gateAcknowledgements`) |

No API needed. Eligibility and consent checkboxes are stored in the in-memory session store only.

---

## 2. Clinical form — ✅ `POST /api/v1/patient/intake`

| Layer | Files |
|---|---|
| Route | [`frontend/src/app/clinical/page.tsx`](../frontend/src/app/clinical/page.tsx) |
| Screen wrapper | [`frontend/src/features/clinical/clinical-screen.tsx`](../frontend/src/features/clinical/clinical-screen.tsx) |
| Form UI + submit | [`frontend/src/features/clinical/clinical-form.tsx`](../frontend/src/features/clinical/clinical-form.tsx) |
| Client validation (Zod) | [`frontend/src/features/clinical/clinical-schema.ts`](../frontend/src/features/clinical/clinical-schema.ts) |
| Types | [`frontend/src/types/patient.ts`](../frontend/src/types/patient.ts) |
| Service (fixture/live) | [`frontend/src/services/patient.service.ts`](../frontend/src/services/patient.service.ts) |
| Session state | [`frontend/src/store/session.store.ts`](../frontend/src/store/session.store.ts) (`clinical`) |
| Tests | [`frontend/src/features/clinical/clinical-form.test.tsx`](../frontend/src/features/clinical/clinical-form.test.tsx) |
| **Go route** | [`backend/backendHandlers/internal/routes/patient.go`](../backend/backendHandlers/internal/routes/patient.go) |
| **Go handler** | [`backend/backendHandlers/internal/handlers/patient.go`](../backend/backendHandlers/internal/handlers/patient.go) |
| **Go validation** | [`backend/backendHandlers/internal/validation/patient.go`](../backend/backendHandlers/internal/validation/patient.go) |
| **Go models** | [`backend/backendHandlers/internal/models/patient.go`](../backend/backendHandlers/internal/models/patient.go) |

**Backend responsibility:** validate and normalize all 13 intake fields; return `{ status: "validated", patient }` or `400` with field errors.

**Status:** ✅ Live today.

---

## 3. Cough recording — 🖥️ client-only (uploaded later at triage)

| Layer | Files |
|---|---|
| Route | [`frontend/src/app/coughs/page.tsx`](../frontend/src/app/coughs/page.tsx) |
| Screen | [`frontend/src/features/coughs/coughs-screen.tsx`](../frontend/src/features/coughs/coughs-screen.tsx) |
| Recorder UI | [`frontend/src/features/coughs/cough-recorder.tsx`](../frontend/src/features/coughs/cough-recorder.tsx) |
| Record button | [`frontend/src/features/coughs/record-button.tsx`](../frontend/src/features/coughs/record-button.tsx) |
| Live waveform (while recording) | [`frontend/src/features/coughs/cough-waveform.tsx`](../frontend/src/features/coughs/cough-waveform.tsx) |
| Recording hook | [`frontend/src/hooks/use-cough-recorder.ts`](../frontend/src/hooks/use-cough-recorder.ts) |
| Heuristic cough detector | [`frontend/src/lib/cough-detector.ts`](../frontend/src/lib/cough-detector.ts) |
| Recording type / store | [`frontend/src/store/session.store.ts`](../frontend/src/store/session.store.ts) (`CoughRecording`, `coughRecording`) |
| Tests | [`frontend/src/hooks/use-cough-recorder.test.ts`](../frontend/src/hooks/use-cough-recorder.test.ts), [`frontend/src/features/coughs/cough-recorder.test.tsx`](../frontend/src/features/coughs/cough-recorder.test.tsx) |

**What is client-only:**

- Mic permission, WebM capture (≤90s), live waveform
- Heuristic cough-event detection (`coughEvents[]`)
- “Coughs detected” count shown on review

Audio is uploaded only when the user submits from the review screen via `POST /api/v1/triage`.

### Contract gap — blocks live triage E2E

| | File | Issue |
|---|---|---|
| Frontend sends | [`frontend/src/lib/integration.ts`](../frontend/src/lib/integration.ts) (`createTriageFormData`) | field `cough` × **1** file |
| Backend expects | [`backend/backendHandlers/internal/handlers/signals.go`](../backend/backendHandlers/internal/handlers/signals.go) (`Triage`) | field `coughs` × **5** files |
| OpenAPI | [`contracts/openapi/jaga-v1.yaml`](../contracts/openapi/jaga-v1.yaml) (`/api/v1/triage`) | `coughs` min/max 5 |
| Frontend Zod (response) | [`frontend/src/contracts/api.ts`](../frontend/src/contracts/api.ts) (`gemaResultSchema`) | `quality` array `.length(1)` |
| OpenAPI (response) | [`contracts/openapi/jaga-v1.yaml`](../contracts/openapi/jaga-v1.yaml) (`GemaResult`) | `quality` array min/max 5 |

Until aligned, live `POST /api/v1/triage` will 400 with “exactly five cough files are required.”

---

## 4. Review + Gema submit — ⚠️ `POST /api/v1/triage`

| Layer | Files |
|---|---|
| Route | [`frontend/src/app/review/page.tsx`](../frontend/src/app/review/page.tsx) |
| Submit UI + mutation | [`frontend/src/features/review/review-screen.tsx`](../frontend/src/features/review/review-screen.tsx) |
| Service (fixture/live) | [`frontend/src/services/triage.service.ts`](../frontend/src/services/triage.service.ts) |
| Multipart builder | [`frontend/src/lib/integration.ts`](../frontend/src/lib/integration.ts) (`createTriageFormData`) |
| Result types | [`frontend/src/types/triage.ts`](../frontend/src/types/triage.ts) |
| Submit state | [`frontend/src/store/session.store.ts`](../frontend/src/store/session.store.ts) (`submitState`, `setResult`) |
| Fixture response | [`frontend/src/contracts/fixtures/gema-result.json`](../frontend/src/contracts/fixtures/gema-result.json) |
| Legacy mock | [`frontend/src/mocks/triage-result.mock.json`](../frontend/src/mocks/triage-result.mock.json) |
| **Go route** | [`backend/backendHandlers/internal/http/router.go`](../backend/backendHandlers/internal/http/router.go) |
| **Go handler** | [`backend/backendHandlers/internal/handlers/signals.go`](../backend/backendHandlers/internal/handlers/signals.go) (`Triage`) |
| **Inference seam (stub)** | [`backend/backendHandlers/internal/inference/inference.go`](../backend/backendHandlers/internal/inference/inference.go) |
| **Response models** | [`backend/backendHandlers/internal/models/signals.go`](../backend/backendHandlers/internal/models/signals.go) (`GemaResult`) |
| **Server wiring** | [`backend/backendHandlers/cmd/server/main.go`](../backend/backendHandlers/cmd/server/main.go) |

**Backend must:**

- Accept multipart: `contract_version`, `schema_version`, `clinical` (JSON file), `coughs` (5× audio)
- Run quality gate before inference
- Return `GemaResult` or structured `ApiError`

**Status:** ⚠️ Frontend wired; Go validates request shape; inference seam returns `MODEL_UNAVAILABLE`.

### Error / quality handling gaps

| What | Contract location | Frontend gap |
|---|---|---|
| `COUGH_QUALITY_REJECTED` | [`frontend/src/contracts/api.ts`](../frontend/src/contracts/api.ts) | No handler in `review-screen.tsx` |
| Per-attempt `quality[]` | OpenAPI + `triage.service.ts` mapper | Mapped but never displayed |
| `attempt_errors` | [`frontend/src/contracts/api.ts`](../frontend/src/contracts/api.ts) | Unused |
| `MODEL_UNAVAILABLE` | `review-screen.tsx` + `api-error.ts` | ✅ Wired (`isModelUnavailable`) |

**Missing backend:** Gema Python inference worker (no server exists yet; only Prisma worker scaffold at [`backend/modelServerandTraining/PrismaServer/app/main.py`](../backend/modelServerandTraining/PrismaServer/app/main.py)).

---

## 5. Gema result — 🔧 displays `POST /api/v1/triage` response

| UI surface | Frontend files | Backend response field |
|---|---|---|
| Route | [`frontend/src/app/result/page.tsx`](../frontend/src/app/result/page.tsx) | — |
| Main screen | [`frontend/src/features/result/result-screen.tsx`](../frontend/src/features/result/result-screen.tsx) | all of `TriageResult` |
| Risk band headline | `result-screen.tsx` | `estimate.band` |
| Probability % chip | `result-screen.tsx` | `estimate.probability` |
| Risk track | [`frontend/src/features/result/risk-band-track.tsx`](../frontend/src/features/result/risk-band-track.tsx) | `estimate.band` |
| Mandatory next step | [`frontend/src/features/result/next-step-panel.tsx`](../frontend/src/features/result/next-step-panel.tsx) | `mandatory_next_step` |
| Technical details accordion | `result-screen.tsx` | `metadata.*`, `estimate.calibration_status` |
| Backend spectrogram (inspection) | [`frontend/src/features/result/spectrogram-figure.tsx`](../frontend/src/features/result/spectrogram-figure.tsx) | `inspection.url`, `inspection.available`, `inspection.label` |
| Image loader | [`frontend/src/features/result/figure-image.tsx`](../frontend/src/features/result/figure-image.tsx) | `inspection.url` |
| Result mapping | [`frontend/src/services/triage.service.ts`](../frontend/src/services/triage.service.ts) (`mapGemaResult`) | wire → `TriageResult` |
| Result state | [`frontend/src/store/session.store.ts`](../frontend/src/store/session.store.ts) (`result`) | — |
| Tests | [`frontend/src/features/result/result-screen.test.tsx`](../frontend/src/features/result/result-screen.test.tsx) | — |

**Status:** 🔧 Fixture only for model outputs; live submit returns `MODEL_UNAVAILABLE` before a result is stored.

### Waveform / “grad-cam” on cough result — 🖥️ client-only

| What | Files | Backend? |
|---|---|---|
| Waveform + heat glow at cough events | [`frontend/src/features/result/cough-focus-figure.tsx`](../frontend/src/features/result/cough-focus-figure.tsx) | **No** |
| Canvas math | [`frontend/src/features/result/cough-focus-utils.ts`](../frontend/src/features/result/cough-focus-utils.ts) | **No** |
| Tests | [`frontend/src/features/result/cough-focus-figure.test.tsx`](../frontend/src/features/result/cough-focus-figure.test.tsx), [`cough-focus-utils.test.ts`](../frontend/src/features/result/cough-focus-utils.test.ts) | — |

This is an illustrative client-side visualization from the local WebM + `coughEvents[]`. It is **not** true model Grad-CAM.

Real model inspection for cough audio = `inspection.url` from the triage response → `spectrogram-figure.tsx` (shown when there is no local `coughRecording`).

**Backend still needed for inspection:** Gema worker generates artifact; backend serves URL (e.g. MinIO / signed URL).

---

## 6. CXR upload — ⚠️ `POST /api/v1/cxr`

| Layer | Files |
|---|---|
| Route | [`frontend/src/app/cxr/page.tsx`](../frontend/src/app/cxr/page.tsx) |
| Upload UI + submit | [`frontend/src/features/cxr/cxr-screen.tsx`](../frontend/src/features/cxr/cxr-screen.tsx) |
| Dropzone | [`frontend/src/components/ui/dropzone.tsx`](../frontend/src/components/ui/dropzone.tsx) |
| Client file validation | [`frontend/src/lib/integration.ts`](../frontend/src/lib/integration.ts) (`validateCxrFile`, `CXR_MAX_BYTES`, `CXR_ACCEPT`) |
| Service | [`frontend/src/services/cxr.service.ts`](../frontend/src/services/cxr.service.ts) |
| Multipart builder | [`frontend/src/lib/integration.ts`](../frontend/src/lib/integration.ts) (`createCxrFormData`) |
| Types | [`frontend/src/types/cxr.ts`](../frontend/src/types/cxr.ts) |
| State | [`frontend/src/store/prisma.store.ts`](../frontend/src/store/prisma.store.ts) (`image`, `submitState`) |
| Fixture | [`frontend/src/contracts/fixtures/cxr-result.json`](../frontend/src/contracts/fixtures/cxr-result.json) |
| **Go handler** | [`backend/backendHandlers/internal/handlers/signals.go`](../backend/backendHandlers/internal/handlers/signals.go) (`Cxr`) |
| **Inference seam** | [`backend/backendHandlers/internal/inference/inference.go`](../backend/backendHandlers/internal/inference/inference.go) |
| **Response models** | [`backend/backendHandlers/internal/models/signals.go`](../backend/backendHandlers/internal/models/signals.go) (`CxrResult`) |

**Backend must:**

- Accept multipart: `contract_version`, `schema_version`, `source_type=digital_export`, `image`
- Validate PNG/JPEG, size ≤ 10 MiB
- Run Prisma inference (separate signal; never fused with Gema)
- Return `CxrResult` or structured `ApiError`

**Status:** ⚠️ Frontend wired; inference returns `MODEL_UNAVAILABLE`.

---

## 7. CXR result — 🔧 displays `POST /api/v1/cxr` response

| UI surface | Frontend files | Backend response field |
|---|---|---|
| Route | [`frontend/src/app/cxr/result/page.tsx`](../frontend/src/app/cxr/result/page.tsx) |
| Main screen | [`frontend/src/features/cxr/cxr-result-screen.tsx`](../frontend/src/features/cxr/cxr-result-screen.tsx) | all of `CxrResult` |
| Risk band + % | `cxr-result-screen.tsx` | `estimate.band`, `estimate.probability` |
| Risk track | [`frontend/src/features/result/risk-band-track.tsx`](../frontend/src/features/result/risk-band-track.tsx) | `estimate.band` |
| Mandatory next step | [`frontend/src/features/result/next-step-panel.tsx`](../frontend/src/features/result/next-step-panel.tsx) | `mandatory_next_step` |
| Uploaded CXR thumbnail | `cxr-result-screen.tsx` + `prisma.store.ts` | local `File` (not re-fetched) |
| **Grad-CAM heatmap** | `cxr-result-screen.tsx` → `figure-image.tsx` | `inspection.url` → `gradcamUrl` in `cxr.service.ts` |
| Technical metadata | `cxr-result-screen.tsx` | `metadata.*`, `estimate.calibration_status` |
| Result mapping | [`frontend/src/services/cxr.service.ts`](../frontend/src/services/cxr.service.ts) (`mapCxrResult`) | wire → `CxrResult` |
| State | [`frontend/src/store/prisma.store.ts`](../frontend/src/store/prisma.store.ts) (`result`, `image`) |
| Tests | [`frontend/src/features/cxr/cxr-result-screen.test.tsx`](../frontend/src/features/cxr/cxr-result-screen.test.tsx) | — |

**Status:** 🔧 Fixture has `inspection.available: false`; no Grad-CAM URL served yet.

**Backend still needed:**

- Prisma inference endpoint on Python worker (today: health/status only in [`PrismaServer/app/main.py`](../backend/modelServerandTraining/PrismaServer/app/main.py))
- Grad-CAM image generation + URL hosting
- Go `CxrInferencer` proxy implementation

---

## 8. Guidance assistant — ✅ `POST /api/v1/assistant/messages`

| Layer | Files |
|---|---|
| Route | [`frontend/src/app/chat/page.tsx`](../frontend/src/app/chat/page.tsx) |
| Chat UI | [`frontend/src/features/chat/chat-screen.tsx`](../frontend/src/features/chat/chat-screen.tsx) |
| Floating launcher | [`frontend/src/features/chat/assistant-launcher.tsx`](../frontend/src/features/chat/assistant-launcher.tsx) |
| Hook + API call | [`frontend/src/features/chat/use-assistant-chat.ts`](../frontend/src/features/chat/use-assistant-chat.ts) |
| Message components | [`frontend/src/features/chat/chat-message.tsx`](../frontend/src/features/chat/chat-message.tsx), [`chat-markdown.tsx`](../frontend/src/features/chat/chat-markdown.tsx) |
| Request builder | [`frontend/src/lib/integration.ts`](../frontend/src/lib/integration.ts) (`createAssistantRequest`) |
| Service | [`frontend/src/services/assistant.service.ts`](../frontend/src/services/assistant.service.ts) |
| Fixture | [`frontend/src/contracts/fixtures/assistant.json`](../frontend/src/contracts/fixtures/assistant.json) |
| Tests | [`frontend/src/features/chat/use-assistant-chat.test.ts`](../frontend/src/features/chat/use-assistant-chat.test.ts) |
| **Go route** | [`backend/backendHandlers/internal/http/router.go`](../backend/backendHandlers/internal/http/router.go) |
| **Go handler** | [`backend/backendHandlers/internal/handlers/assistant.go`](../backend/backendHandlers/internal/handlers/assistant.go) |
| **LLM proxy** | [`backend/backendHandlers/internal/llm/featherless/service.go`](../backend/backendHandlers/internal/llm/featherless/service.go), [`client.go`](../backend/backendHandlers/internal/llm/featherless/client.go) |

**Status:** ✅ Wired. Works when Featherless env is configured in Go. Provider credentials never reach the browser.

**Gap:** `field_key` is in the contract ([`api.ts`](../frontend/src/contracts/api.ts)) but [`use-assistant-chat.ts`](../frontend/src/features/chat/use-assistant-chat.ts) never sends it (per-field help not wired).

---

## 9. Health / readiness — 🚧 service only, no UI

| Layer | Files |
|---|---|
| Service | [`frontend/src/services/health.service.ts`](../frontend/src/services/health.service.ts) |
| `GET /healthz` | `checkHealth()` |
| `GET /api/v1/status` | `checkReadiness()` |
| Fixture | [`frontend/src/contracts/fixtures/status.json`](../frontend/src/contracts/fixtures/status.json) |
| **Go health** | [`backend/backendHandlers/internal/http/handlers.go`](../backend/backendHandlers/internal/http/handlers.go) (`Health`) |
| **Go status** | [`backend/backendHandlers/internal/http/handlers.go`](../backend/backendHandlers/internal/http/handlers.go) (`Status`) |
| **Status models** | [`backend/backendHandlers/internal/models/api.go`](../backend/backendHandlers/internal/models/api.go) (`ServiceStatus`) |
| **Prisma worker status** | [`backend/modelServerandTraining/PrismaServer/app/main.py`](../backend/modelServerandTraining/PrismaServer/app/main.py) |

`/api/v1/status` currently reports (honestly):

- `patient_intake`: ready
- `gema`: not ready
- `prisma`: not ready
- `assistant`: ready if Featherless configured

**Suggested UI hook:** startup gate in [`frontend/src/layouts/flow-layout.tsx`](../frontend/src/layouts/flow-layout.tsx) to disable submit before users hit `MODEL_UNAVAILABLE`.

---

## 10. Auth — 🚧 placeholder, no backend

| Files |
|---|
| [`frontend/src/services/auth.service.ts`](../frontend/src/services/auth.service.ts) |
| [`frontend/src/context/auth-context.tsx`](../frontend/src/context/auth-context.tsx) |
| [`frontend/src/store/auth.store.ts`](../frontend/src/store/auth.store.ts) |
| [`frontend/src/guards/protected-route.tsx`](../frontend/src/guards/protected-route.tsx) |
| [`frontend/src/guards/guest-route.tsx`](../frontend/src/guards/guest-route.tsx) |

MVP is single-session with no accounts. All auth functions throw “API not connected yet.”

---

## Endpoint quick reference

| Endpoint | Frontend service | Frontend consumer | Backend handler |
|---|---|---|---|
| `POST /api/v1/patient/intake` | [`patient.service.ts`](../frontend/src/services/patient.service.ts) | [`clinical-form.tsx`](../frontend/src/features/clinical/clinical-form.tsx) | [`handlers/patient.go`](../backend/backendHandlers/internal/handlers/patient.go) |
| `POST /api/v1/triage` | [`triage.service.ts`](../frontend/src/services/triage.service.ts) | [`review-screen.tsx`](../frontend/src/features/review/review-screen.tsx) → [`result-screen.tsx`](../frontend/src/features/result/result-screen.tsx) | [`handlers/signals.go`](../backend/backendHandlers/internal/handlers/signals.go) → [`inference/inference.go`](../backend/backendHandlers/internal/inference/inference.go) |
| `POST /api/v1/cxr` | [`cxr.service.ts`](../frontend/src/services/cxr.service.ts) | [`cxr-screen.tsx`](../frontend/src/features/cxr/cxr-screen.tsx) → [`cxr-result-screen.tsx`](../frontend/src/features/cxr/cxr-result-screen.tsx) | [`handlers/signals.go`](../backend/backendHandlers/internal/handlers/signals.go) → [`inference/inference.go`](../backend/backendHandlers/internal/inference/inference.go) |
| `POST /api/v1/assistant/messages` | [`assistant.service.ts`](../frontend/src/services/assistant.service.ts) | [`use-assistant-chat.ts`](../frontend/src/features/chat/use-assistant-chat.ts) | [`handlers/assistant.go`](../backend/backendHandlers/internal/handlers/assistant.go) |
| `GET /api/v1/status` | [`health.service.ts`](../frontend/src/services/health.service.ts) | *(none yet)* | [`http/handlers.go`](../backend/backendHandlers/internal/http/handlers.go) |
| `GET /healthz` | [`health.service.ts`](../frontend/src/services/health.service.ts) | *(none yet)* | [`http/handlers.go`](../backend/backendHandlers/internal/http/handlers.go) |

---

## Summary matrix

| Area | Endpoint | Frontend wired? | Backend inference? | Notes |
|---|---|---|---|---|
| Clinical form | `POST /api/v1/patient/intake` | Yes | Yes (validate only) | ✅ Done |
| Cough capture | — | N/A | N/A | 🖥️ Client-only; **5 vs 1 cough contract gap** |
| Gema triage submit | `POST /api/v1/triage` | Yes | No | ⚠️ `MODEL_UNAVAILABLE` |
| Result %, band, next step | triage response | Yes | No | 🔧 Fixture |
| Cough waveform heatmap | — | N/A | N/A | 🖥️ Client prototype |
| Gema spectrogram | `inspection.url` | Yes (fallback UI) | No URL served | Needs artifact hosting |
| CXR upload | `POST /api/v1/cxr` | Yes | No | ⚠️ `MODEL_UNAVAILABLE` |
| CXR Grad-CAM | `inspection.url` | Yes | No URL served | Needs Grad-CAM + hosting |
| Assistant chat | `POST /api/v1/assistant/messages` | Yes | Partial (LLM proxy) | ✅ With Featherless env |
| Readiness | `GET /api/v1/status` | Service only | Partial | 🚧 Not in UI |
| Auth | — | Placeholder | None | Out of MVP scope |

---

## Contract gaps to resolve before live E2E

1. **5 cough files vs 1** — OpenAPI + Go require `coughs[5]`; frontend sends `cough` × 1; frontend Zod expects `quality.length(1)` but OpenAPI expects 5.
2. **Quality-rejection UX** — `COUGH_QUALITY_REJECTED` + per-attempt `quality[]` / `attempt_errors` are in the contract but not handled in coughs/review UI.
3. **Inspection URLs** — Gema (`inspection.url` spectrogram) and Prisma (`inspection.url` Grad-CAM) need workers to generate images and a way to serve them.
4. **Gema worker** — No Python inference server exists yet (only Prisma worker scaffold).
5. **Readiness gate** — `healthService` exists but no screen calls it before submit.

---

## i18n vs backend-owned copy

**Localized (static bundles):**

- [`frontend/src/locales/en.json`](../frontend/src/locales/en.json)
- [`frontend/src/locales/id.json`](../frontend/src/locales/id.json)
- Reader: [`frontend/src/hooks/use-t.ts`](../frontend/src/hooks/use-t.ts)

**Rendered as-is from backend (not i18n):**

- `mandatory_next_step`
- `metadata.limitations[]`
- `estimate.calibration_status`

Band labels use frontend i18n keys (`result.band.*`) keyed off `estimate.band` from the API.
