# AGENT.md — Jaga Project Router

**Document type:** Repository task router
**Audience:** All contributors and coding agents
**Status:** Active · submission week — end-to-end system built; hardening/reconciliation in progress
**Updated:** 2026-07-11
**Canonical for:** Repository navigation, source precedence, working rules, ownership, and current status
**Companion documents:** [`.agent/product-requirements.md`](.agent/product-requirements.md), [`.agent/project-architecture.md`](.agent/project-architecture.md), [`.agent/implementation-plan.md`](.agent/implementation-plan.md)

## How to read this document

Start here, choose the task row in Section 1, then follow the source precedence in Section 2. Owner blocks are intentional integration gates; do not infer the missing contract. Historical rationale belongs in `.agent/context-dump.md`, not here.

Jaga is a phone-first tuberculosis research prototype for **symptomatic adults aged 18+**. A community health worker records **one guided cough recording (up to 90 seconds, several natural coughs)** and supported clinical inputs; a model trained on AMD produces a calibrated research estimate used only to prioritize follow-up urgency. **Every symptomatic participant is directed to confirmatory evaluation regardless of score. Jaga does not diagnose or rule out tuberculosis.** *(The capture protocol changed from five discrete cough attempts to one guided recording on 2026-07-10 — see `.agent/log.md` and `project-architecture.md` §16.)*

Preparation and prototyping began **29 June 2026**. The AMD Developer Hackathon ACT II runs **6 July 2026, 15:00 UTC → 11 July 2026, 15:00 UTC** (**22:00 WIB**) — today, 2026-07-11, is submission day. The frontend, Go gateway, Rust model services (Gema), and Python Prisma worker are built and integrated end to end; see §8 for what remains.

## 1. Document router

| Need | Canonical document |
|---|---|
| Product, customer, positioning, pitch, and scope phases | [`.agent/product-brief.md`](.agent/product-brief.md) |
| User-visible behavior, feature requirements, safety, and acceptance criteria | [`.agent/product-requirements.md`](.agent/product-requirements.md) |
| System boundaries, planned interfaces, security, deployment, and ownership | [`.agent/project-architecture.md`](.agent/project-architecture.md) |
| Datasets, model selection, calibration, evaluation, and reporting | [`.agent/data-evaluation-plan.md`](.agent/data-evaluation-plan.md) |
| Verified external facts and citations | [`.agent/evidence-register.md`](.agent/evidence-register.md) |
| Frontend constraints, design direction, components, states, and motion | [`.agent/design-guidelines.md`](.agent/design-guidelines.md) |
| Tickets, dependencies, milestones, merge order, and fallbacks | [`.agent/implementation-plan.md`](.agent/implementation-plan.md) |
| Decision history and rejected ideas | [`.agent/context-dump.md`](.agent/context-dump.md) |
| Chronological documentation changes | [`.agent/log.md`](.agent/log.md) |
| Reusable planning standard | [`.agent/plan-template.md`](.agent/plan-template.md) |

**First read:** `AGENT.md` → the canonical document for the task. New contributors should read `product-brief.md`, then `product-requirements.md`, then their owned architecture or implementation section. Use `context-dump.md` only when the reasoning behind a decision matters.

## 2. Source precedence

Precedence is responsibility-specific rather than one global ordering:

1. `evidence-register.md` controls external facts and cited numbers.
2. `product-requirements.md` controls current product behavior, safety, and MVP scope.
3. `project-architecture.md` and `data-evaluation-plan.md` control implementation and evaluation after their owner-input blocks are completed.
4. `design-guidelines.md` controls frontend behavior and visual constraints after its owner-input blocks are completed.
5. `implementation-plan.md` controls sequence and ownership, but may not override the PRD or evidence.
6. `product-brief.md` and `README.md` summarize the canonical documents.
7. `context-dump.md` and `log.md` are historical and may contain explicitly marked superseded decisions.

When two current documents disagree, add a visible contradiction block, stop the affected implementation, and resolve the canonical source first.

## 3. Scope and safety rules

- **[MVP]** ships for 11 July 2026.
- **[V1]** is documented for post-hackathon work and is not built now.
- **[Stretch]** starts only after every P0 acceptance criterion passes.
- **[OUT]** must not be implemented.
- The MVP core is **cough + supported clinical inputs**. It is evidence-backed, not clinically validated for deployment.
- Chest X-ray (**Prisma**) is an isolated `[MVP]` signal with separate metrics, co-equal with the cough core (**Gema**) and built in parallel. Never fuse it with the cough score because no paired dataset supports that claim.
- Do not retain patient inputs, log request bodies, scrape patient information, or use real patient data in the demo.
- Model-attention and saliency artifacts show where a model focused; they are not causal explanations or clinical reasoning.
- All factual and medical claims must trace to `evidence-register.md`.

## 4. Visible owner-input blocks

Owner-input blocks are intentional handoffs, not generic placeholders. Every block must use this structure:

> **OWNER INPUT REQUIRED — Name — due YYYY-MM-DD**
>
> **Blocks:** the ticket or interface that cannot proceed
>
> **Required output:** the exact decisions or artifacts the owner must provide
>
> **Affected documents:** every canonical document that must be synchronized
>
> **Completion rule:** replace this block with the signed decision and update the affected documents and `log.md`

Allowed owners in the current revision:

- **Daffa · originally due 2026-06-29:** backend/AI architecture, data schemas, inference contract, model pipeline, evaluation gates, serving, security, and observability. **Status:** superseded by shipped code rather than a formally signed contract document — see `project-architecture.md` §14–§16 for what the `backend-train` build actually implements, and its remaining open blocks for what is still genuinely undecided (calibration rigor, participant-grouped evaluation, security/observability profile).
- **Billy · due 2026-06-30:** frontend architecture, screen/state map, API-to-UI mapping, design system, responsive behavior, accessibility, and motion. **Status:** signed and implemented; see `design-guidelines.md`.

Do not use unowned `TODO`, `TBD`, ellipses, or vague instructions such as “handle errors.”

## 5. Contradiction blocks

Use this only when two still-valid owner decisions conflict:

> **CONTRADICTION — BLOCKS IMPLEMENTATION**
>
> **Conflict:** the two incompatible statements
>
> **Canonical documents affected:** paths
>
> **Owner / due:** one accountable resolver and date
>
> **Resolution rule:** implementation resumes only after all affected documents agree

Known factual errors should be corrected directly rather than preserved as contradiction blocks.

## 6. Team boundaries

- **Daffa — backend/AI architect:** owns architecture, model and data decisions, evaluation design, and technical contracts.
- **Zeddin — backend implementer:** builds the Go API + Python (Prisma) worker service, integration, containerization, and deployment from Daffa's approved contracts.
- **Billy — frontend/design lead:** owns frontend architecture, UX, design system, accessibility, and final polish.
- **Kei — frontend implementer:** builds capture and result flows from Billy's approved specification.
- **Fransisco — PM/submission:** owns schedule, evidence-to-pitch consistency, slides, video, and submission completeness.

No developer implements a blocked interface before its owner-input block is completed.

## 7. Working rules

1. Read this router and the canonical document before editing.
2. Keep diffs minimal and do not change unrelated files.
3. Respect `[MVP]`, `[V1]`, `[Stretch]`, and `[OUT]` labels.
4. Record changed decisions in `context-dump.md` and add a dated entry to `log.md`.
5. Update `evidence-register.md` before repeating a changed factual claim elsewhere.
6. Update a document's `Updated` date whenever its current specification changes.
7. A task is complete only when its acceptance criteria and documentation synchronization checks pass.

## 8. Current status and first tasks

Idea, name, research framing, cohort boundary, online AMD serving, and two co-equal `[MVP]` signals — cough-plus-clinical (Gema) and isolated digital-CXR (Prisma), never fused — are locked. CODA is controlled-access and Daffa has access; dataset redistribution is prohibited.

**As of 2026-07-11 (submission day), the full loop is built and integrated**, not just scaffolded: the Next.js frontend (gate → clinical → coughs → review → result, plus a separate CXR upload/result path) talks to a Go gateway (`backend/backendHandlers`) that runs audio preprocessing, calls two Rust ONNX services (YAMNet cough gate + XGBoost TB-probability model, `backend/modelServerandTraining/GemmaServer/rust`) for the Gema result, calls Gemma (Fireworks) for the mandatory-next-step copy and the guidance assistant, and proxies to a Python Prisma worker (`backend/modelServerandTraining/PrismaServer`) for the independent CXR result — which also highlights a PennyLane quantum-kernel-SVM evaluation. All of this deploys as a Docker Swarm stack (`infra/`). See `project-architecture.md` §14–§16 for the as-built detail and `log.md` for the dated build history.

**What is not yet true**, despite the pipeline running end to end:

- The rigorous evaluation protocol in `data-evaluation-plan.md` (participant-grouped splits, leave-one-country-out, fitted calibration curves, run manifests, reproducibility artifacts) was not carried out for the shipped Gema model; risk bands are fixed cutoffs (0.33 / 0.66) on the XGBoost output, not a fitted calibration artifact. Treat any Gema probability as an uncalibrated research prototype output until that gap is closed.
- `contracts/openapi/jaga-v1.yaml` still specifies 5 cough files for `POST /api/v1/triage`; the actual Go handler and frontend both use exactly one `cough` file. This is a live contradiction — see `project-architecture.md` §16.
- The Cognee semantic-memory layer described in earlier revisions of this doc set is not wired into `backend/backendHandlers` yet, even though `infra/cognee` exists in the deployment stack.

- **Daffa:** reconcile the remaining owner blocks in [`.agent/project-architecture.md`](.agent/project-architecture.md) and [`.agent/data-evaluation-plan.md`](.agent/data-evaluation-plan.md) against the shipped model (calibration, participant-grouped evaluation, security/observability profile) — these are the genuine gaps, not the whole pipeline.
- **Zeddin:** resolve the 5-file vs. 1-file cough contract mismatch in `contracts/openapi/jaga-v1.yaml` and close the remaining `project-architecture.md` §16 open items before submission.
- **Billy:** owner blocks in [`.agent/design-guidelines.md`](.agent/design-guidelines.md) are signed and implemented; remaining work is the final EN/ID string review and any last accessibility polish.
- **Kei:** frontend routes (`gate`, `clinical`, `coughs`, `review`, `result`, `cxr`, `cxr/result`, `chat`) are implemented; remaining work is bug-fixing against the live backend rather than fixture adapters.
- **Fransisco:** validate the milestone and submission checklist in [`.agent/implementation-plan.md`](.agent/implementation-plan.md) against the event page and confirm the public deployment URL, video, and slides are ready before 11 July 15:00 UTC.
