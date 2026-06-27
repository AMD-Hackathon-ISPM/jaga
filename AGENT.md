# AGENT.md — Start Here

**Project: Jaga** — an AI-powered **tuberculosis triage** tool. A community health worker records a 10-second cough plus a few clinical details on a phone, and an AI model **trained on AMD** returns an explainable, calibrated TB-risk result in seconds — no X-ray machine, lab, or on-site radiologist required — to decide who needs a confirmatory test. Inference runs online on AMD. **Triage, not diagnosis.**

Built for the **AMD Developer Hackathon ACT II** (Unicorn track). Ships **11 July 2026**. Submissions are containerized; product models run on AMD-hosted OSS (ROCm) and Fireworks — not Anthropic/Claude (Claude is the coding assistant, not a product dependency).

## Read order (for any AI agent or new contributor)

1. **`.agent/context-dump.md`** — the full story and _why_ every decision was made. Start here.
2. **`.agent/product-brief.md`** — vision, market, business model, positioning.
3. **`.agent/product-requirements.md`** — users, scope, user journey, features, acceptance criteria, safety.
4. **`.agent/project-architecture.md`** — system design, models, datasets, pipeline, build ownership.
5. **`.agent/design-guidelines.md`** — brand, voice, color, components, the signature visual.

Supporting: **`.agent/plan-template.md`** is our documentation depth standard. `CLAUDE.md` holds working conventions.

## How to work here

- **Be data-driven.** Every problem claim is backed by a real, cited source. No invented stats.
- **Build something real and ours.** Triage-not-diagnosis is non-negotiable; a human stays in the loop.
- **The AMD hardware is load-bearing** — the model is trained/fine-tuned on the MI300X (ROCm) and served online on AMD.
- **Push back** on anything out of scope, unworkable, or unsafe.

## Scope discipline (read before adding anything)

Features in `product-requirements.md` are tagged **[MVP]** (build for 11 Jul), **[V1]** (document, don't build now), **[OUT]** (never). **If it isn't [MVP], don't build it now** — the MVP is the demo; anything beyond it is scope creep.

**Product invariants (non-negotiable):** triage-not-diagnosis · **validated core = cough + clinical** (CXR optional/stretch, never a fused metric) · **trained on AMD MI300X, served online on AMD** · **minimize + don't retain patient data** (no scraping) · **honest metrics** (no overclaiming vs CODA/WHO evidence) · ships by 11 Jul. A change that touches an invariant is out of scope unless explicitly re-decided and logged.

## Rules for agents & collaborators

1. **Read before writing** — `AGENT.md` → the relevant `.agent/` doc.
2. **Respect scope tags** — don't build `[V1]`/`[OUT]`; if a change touches an invariant, stop and flag it.
3. **Check the Set-Aside Ideas Index** (`context-dump.md` §15) before proposing something — it may already be ruled out.
4. **Log every decision** — record it in `context-dump.md` (Decisions §14, or Set-Aside §15 if rejected) and append a dated line to `.agent/log.md`.
5. **Cite real sources** for any factual/medical claim; no invented stats.
6. **Triage, not diagnosis** — never frame Jaga as diagnosing; the human stays in the loop.
7. **Keep docs in sync** — when you change a doc, bump its **Updated** date; "done" includes docs updated.

## Team

Daffa (AI/ML) · Zeddin (backend) · Kei (frontend) · Billy (frontend lead + design) · Fransisco (PM, presentation, video).

## Status

Idea + name **LOCKED** (Jaga). Build not yet started. Open items: confirm audio + CXR model backbones fit the MI300X + time budget; confirm CODA dataset access (Shenzhen/Montgomery as CXR backups). Once the stack lands, add build/test/lint commands to `CLAUDE.md`.
