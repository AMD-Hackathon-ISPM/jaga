# Jaga · Change & Decision Log

**Document type:** Historical change ledger
**Audience:** All contributors
**Status:** Active
**Owner:** Billy
**Updated:** 2026-06-28
**Canonical for:** Chronology of significant documentation and product decisions
**Companion documents:** [`context-dump.md`](context-dump.md), [`../AGENT.md`](../AGENT.md)

## How to read this document

Entries are newest first. Older entries preserve what was decided at that time and may be superseded by later entries. Current decisions belong in [`context-dump.md`](context-dump.md) Section 16; rejected decisions belong in Section 17.

---

- 2026-06-28 — **Trellis-depth planning revision.** Made `AGENT.md` the sole entry point and removed the duplicate secondary agent entry; standardized document metadata, scope labels, source precedence, owner blocks, and contradiction comments; corrected CODA access/cohort/five-cough facts, WHO 2025 tiered profiles, event dates, criteria, containerization, and public-repository requirements; locked the research-only safety boundary and confirmatory evaluation for every symptomatic adult; separated Daffa/Zeddin backend-AI duties and Billy/Kei frontend duties; expanded the PRD, architecture, evaluation, design, and implementation board with contracts, states, acceptance criteria, fallbacks, and traceability. Preparation starts 29 June; the official sprint is 6–11 July. This entry supersedes earlier current-state claims about a validated core, public CODA, a universal 90/70 gate, offline/fused MVP behavior, and the retained secondary pointer. (Billy)
- 2026-06-27 — **Documentation & evidence overhaul.** Added `evidence-register.md` (single source of truth for facts), `data-evaluation-plan.md` (datasets/splits/leakage/model-gate/metrics), `implementation-plan.md` (5-day board + API contract). Upgraded `AGENT.md` into a task router with source precedence and kept a secondary agent entry point. Verified facts: **CODA is controlled-access (Daffa has it via ORCID)**; cohort = symptomatic adults 18+, guided coughs; **WHO 2025 screening TPPs** replace the old 90/70; **event window 6–11 Jul 2026**. Reframed as an **investigational research prototype** while keeping the product/market ambition. Set aside **quantum image processing** (no advantage, weakens AMD story). (Billy)
- 2026-06-27 — **Phase 13 honest revision** (after a hard technical review, facts verified): switched to **online cloud serving on AMD** (dropped offline/on-device claims, kept on-prem edge as roadmap); **cough+clinical = validated core, CXR optional/stretch** (no paired data → no fused metric); **honest metrics** (cough+clinical AUROC ~0.78–0.83 cited as *published CODA, not a Jaga result*; WHO 90/70 reframed as aspiration); corrected stats (WHO 2025 ~2.4M detection gap, CAD may replace radiologists, Swaasa parity); removed "confidence always rises"; fixed privacy wording; cut plan to ~5-day sprint; added MIT LICENSE; reconciled "Stack TBD"; fixed dangling plan-jaga.md ref. (Billy)
- 2026-06-27 — Reframed positioning **global-first** (TB high-burden belt worldwide) with Indonesia as the named beachhead/authenticity anchor, not the ceiling. Updated product-brief, README, pitch messages, and context-dump. (Billy)
- 2026-06-27 — Added governance layer: scope tags + Do-Not-Build in the PRD, Rules for Agents in `AGENT.md`, per-doc status headers, this log, and a maintenance ritual in the secondary agent entry file. (Billy)
- 2026-06-27 — Added README.md (Trellis-style) and AGENT.md entry point; removed stale `plan-medical.md`. (Billy)
- 2026-06-27 — Split the project plan into four spec docs: `product-brief.md`, `product-requirements.md`, `project-architecture.md`, `design-guidelines.md`. (Billy)
- 2026-06-27 — Added Fransisco to the team (PM, presentation, video). (Billy)
- 2026-06-27 — Validated business model (TB diagnostics market + Global Fund + Qure.ai comparable). (Billy)
- 2026-06-27 — **Locked name: Jaga** ("to watch over / guard"). (Billy)
- 2026-06-27 — **Locked idea: offline multimodal TB triage** (cough required + optional symptoms/X-ray → on-device verdict). Triage, not diagnosis. See `context-dump.md` §12, §14. (Billy)
