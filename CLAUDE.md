# CLAUDE.md

Guidance for Claude Code when working in this repository. (Claude Code loads this file automatically.)

## What this is

**Jaga** — an AI-powered **tuberculosis triage** tool: a few guided coughs (~10s) + a short clinical form → an explainable, calibrated TB-risk estimate that prioritizes who needs a confirmatory test. Evidence-backed core = **cough + clinical**; chest X-ray is an optional/independent stretch. Model **trained on AMD MI300X (ROCm)**, served **online** on AMD. **Triage, not diagnosis** (investigational research prototype). Built for the **AMD Developer Hackathon ACT II** — Unicorn track. Window **6–11 July 2026** (~5-day sprint).

**Read `AGENT.md` first** — it's the entry point and document router. `.agent/evidence-register.md` is the single source of truth for facts; `.agent/context-dump.md` holds the rationale and the Set-Aside index (don't re-propose ruled-out ideas).

## How to work with Billy

- **Be data-driven.** Every problem/medical claim must trace to `.agent/evidence-register.md` with a real source. No invented or unsourced stats.
- **Be original and grounded** — MVP-able within the 5-day window.
- **Push back.** If something is out of scope, unworkable, unsafe, or weak, say so directly.

## Hard constraints / invariants

- **Triage, not diagnosis.** A human always stays in the loop; flagged cases go for confirmatory testing.
- **Evidence-backed core = cough + clinical.** CXR is optional/independent — never a fused metric (no paired data).
- **Trained on AMD MI300X (ROCm), served online on AMD.** Not offline/on-device (see context-dump Set-Aside). Product LLMs run on Fireworks / AMD-hosted OSS — not the Anthropic SDK or `claude-*` (Claude is the coding assistant, not a product dependency).
- **Minimize + don't retain patient data**; transient cloud inference; no scraping.
- **Honest metrics** — report real CODA numbers + limitations + subgroup performance vs the WHO 2025 screening TPP (as an aspiration). No overclaiming.
- **Containerized** for submission (confirm requirement against the event page).

## Keeping docs current (maintenance ritual — part of "done")

- Decision made/changed → update `.agent/context-dump.md` (Decisions §14, or Set-Aside §15) **and** append a dated line to `.agent/log.md`.
- New/changed fact → update `.agent/evidence-register.md`.
- Scope changed → update tags in `.agent/product-requirements.md`.
- Edited any `.agent/` doc → bump its **Updated** date.

## Status

Idea + name + scope LOCKED. CODA access secured (Daffa, via ORCID). Stack is **proposed in `.agent/project-architecture.md`** — confirm/lock as the build starts, then add real build/test/lint commands and a format-on-edit hook here. Ticket board: `.agent/implementation-plan.md`.
