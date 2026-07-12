# Jaga — Submission Sprint Plan

**Deadline:** Sunday 12 July 2026, 3:00 PM PT = **Monday 13 July, 05:00 WIB**.
Target: submit **Sunday evening WIB** — submissions are rate-limited, leave room for one failed attempt.

This file is self-contained context for any machine/agent picking up the work.
Status as of **Sat 11 July, ~23:00 WIB**: Phases B and C1 are DONE and pushed; what remains
needs the Windows PC (deployed stack), Zeddin (Fireworks), or the team (assets).

---

## Context (read first)

Jaga = investigational TB triage prototype, AMD Developer Hackathon ACT II, **Unicorn Track**
(submission = public repo + setup instructions + **runnable app URL** + video + slides + cover image).
Repo: `github.com/AMD-Hackathon-ISPM/jaga`. `main` and `deploy` both point at the same head
(`18885e6`); keep them in sync when pushing further work.
Canonical docs: `AGENT.md` → `.agent/*`. Safety rule: triage, not diagnosis — never weaken fail-closed paths.

**Shipped on 11 July (all pushed to `deploy` AND `main`):**

- READMEs rewritten against the as-built system; serving weights committed in-repo (clone-and-run);
  OpenAPI contract aligned to the single-recording protocol; `build.ps1` fixed (native PowerShell deploy works).
- **Retryable no-cough UX fixed:** a triage response with `quality: retryable` (server YAMNet found
  no cough) now stays on `/review` with a bilingual warning alert ("No cough detected in the
  recording") and a Record-again button, instead of navigating to a bare "Result unavailable".
  Covered by vitest (suite 86/86) and verified in-browser at desktop + 320 px.
- **LLM failures now logged:** `assistant/handler.go` and `triage/service.go` print the Fireworks
  error before falling back, so 502s are diagnosable via `docker service logs jaga_go-api`.

**Note:** the client-side cough counter during recording is a deliberate RMS energy heuristic
(labeled "illustrative" in the UI). A shout will still increment it; the server-side YAMNet gate
is the real check. Not a bug; do not "fix" during the sprint.

---

## BLOCKER — Fireworks deployments (Zeddin, do first)

Diagnosed 11 July with the real key (auth is fine; serverless models are NOT accessible on this
account, so an env-only model swap is not an option):

- [ ] **Chat deployment `accounts/ezzeddinpratama04/deployments/od9nvbmy`** — wakes from scale-to-zero
      but then every call fails with: _"As of transformers v4.44, default chat template is no longer
      allowed, so you must provide a chat template if the tokenizer does not define one."_
      → The deployed model has no chat template configured. Set a chat template on the deployment
      (or redeploy from a base/fine-tune that defines one), and set **min replicas ≥ 1** through judging
      so cold starts don't 502 the demo. Affects: assistant chat + Gemma-written next-step copy
      (triage still works — deterministic fallback).
- [ ] **Embeddings deployment `accounts/ezzeddinpratama04/deployments/txvxdq5w`** — returns
      _"not available"_: gone or stopped. → Redeploy/re-scale. **This blocks triage itself**
      (WavLM embedding for XGBoost); until fixed every triage returns system_error.

Verify both with:

```powershell
curl.exe -s https://api.fireworks.ai/inference/v1/chat/completions -H "Authorization: Bearer <KEY>" -H "Content-Type: application/json" -d '{\"model\":\"accounts/ezzeddinpratama04/deployments/od9nvbmy\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"max_tokens\":5}'
curl.exe -s https://api.fireworks.ai/inference/v1/embeddings -H "Authorization: Bearer <KEY>" -H "Content-Type: application/json" -d '{\"model\":\"accounts/ezzeddinpratama04/deployments/txvxdq5w\",\"input\":\"test\"}'
```

## Phase A — On the Windows PC (~1h, after the blocker)

- [ ] **A2. Real-cough end-to-end test.** `git pull`, rebuild (`infra\scripts\build.ps1`), redeploy
      (`infra\scripts\deploy.ps1`). Record an actual deliberate cough: expect YAMNet pass → XGBoost →
      probability % + risk band on the result screen. Also shout once: expect the new
      "No cough detected" alert on review with Record again. If YAMNet rejects a genuine cough,
      lower `COUGH_THRESHOLD` in `infra/.env` (default 0.5 → 0.4), redeploy, retest.
- [ ] **A3. PC's `infra/.env`: set `COGNEE_IMAGE=jaga/cognee:local`** (done on the Mac copy;
      each machine's .env is untracked, so repeat on the PC).
- [ ] **A4. Image sizes:** `docker images | Select-String jaga` — all under **10 GB**
      (watch `jaga/prisma-worker`: torch + pennylane).
- [ ] **A5. Prisma Grad-CAM inspection heatmap (no retraining required; do after A2/A3).**
      Serving-time Grad-CAM is implemented and shipped from the existing `local_clahe` DenseNet121
      checkpoint (no retraining), gated behind `PRISMA_GRADCAM` (default on, fail-open). Returns the
      correct safety label. Covered by 9 new pytest tests + 3 new vitest tests. Local API acceptance
      completed on Mac (health check, enabled overlay visually verified, disabled path verified,
      probability parity exact match with/without Grad-CAM). Remaining work is PC-side only:
  - [x] capture activations and gradients from the final convolutional layer during the existing
    inference pass; do not alter or retrain the checkpoint;
  - [x] normalize the activation map, resize it to the uploaded image, and produce a clearly labeled
    color overlay;
  - [x] keep processing in memory and return a PNG data URL (or another short-lived, non-persistent
    representation); never retain the uploaded CXR or generated heatmap on disk;
  - [x] honor `PRISMA_GRADCAM`: when disabled or generation fails, preserve successful classification
    and return `inspection.available: false` rather than failing the CXR request;
  - [x] when successful, return `inspection.available: true`, `inspection.url`, and the safety label
    "Model inspection; not a clinical explanation"; never describe the heatmap as lesion
    localization, causal reasoning, or diagnostic evidence;
  - [x] add focused model/API tests for enabled, disabled, and graceful-failure paths, plus frontend
    contract/rendering coverage for an available heatmap (9 pytest + 3 vitest);
  - [x] during Mac acceptance, found and fixed a bug where computing the CAM on the signed BatchNorm
    (`norm5`) output zeroed every activation map; switched to the post-ReLU activations the classifier
    head consumes, with a regression test added;
  - [ ] on the Windows PC: rebuild `jaga/prisma-worker`, redeploy/rotate that service, and verify
    `/health` still reports `artifacts_ready: true` and `quantum_available: true`;
  - [ ] live in-app acceptance test on the Windows PC: upload a synthetic/non-patient PNG or JPEG
    ≤10 MB, receive HTTP 200, confirm the probability/band are unchanged by Grad-CAM, and confirm
    the result screen renders the overlay with the inspection disclaimer.

  **Cut rule:** Grad-CAM is presentation/inspection polish, not a substitute for the classifier and
  not part of the Gema critical path. Drop A5 before delaying the Fireworks embeddings fix, fresh-
  clone rehearsal, runnable URL, video, slides, or submission.

## Phase B — Code fixes — DONE (11 July)

- [x] **B1. Retryable-UX fix** — implemented on the review screen per the signed flow
      (retryable → review, retry, no stale estimate), not the result screen as originally sketched.
- [x] **B2. LLM error log lines** — `go build`/`go vet` clean.
- [x] **B3. Committed and pushed** (`18885e6`).

## Phase C — Submission hygiene (Sunday daytime, ~2h)

- [x] **C1. `main` fast-forwarded to `deploy`** and pushed (both at `18885e6`).
      Re-sync after any further pushes: `git checkout main && git merge --ff-only deploy && git push`.
- [ ] **C2. Fresh-clone rehearsal (the real gate):** clean `git clone` into a new folder on the PC,
      follow `README.md` verbatim (native PowerShell path), zero improvisation. Fix any README gap it
      exposes, commit the fix.
- [ ] **C3. On the fresh clone:** real-cough test + one CXR upload (PNG/JPEG ≤ 10 MB) +
      one assistant chat message. All three green.

## Phase D — Submission assets (team, critical path)

- [ ] **D1. Runnable app URL** — required for Unicorn track; nothing is publicly hosted today.
      Biggest unowned item: decide host + owner NOW (any amd64 VM running the Swarm stack works;
      `NGINX_PUBLISHED_PORT` in `infra/.env`).
- [ ] **D2. Demo video** — show: clinical form → cough capture → live result with probability/band →
      the shout/no-cough retry state (it looks intentional now) → CXR/quantum panel.
- [ ] **D3. Slides + cover image** (Fransisco).
- [ ] **D4. Submit Sunday evening WIB.** Do not push to 4 AM Monday.

---

**Cut line if time collapses:** the Fireworks embeddings fix and D1 are non-negotiable
(no triage / no URL = no demo); D compresses otherwise; C2 is the last thing allowed to drop —
a broken fresh clone fails silently in judging.
