# AGENT.md — Start Here

**Project: Jaga** — an AI-powered **tuberculosis triage** tool. A community health worker records a few guided coughs (~10s) plus a short clinical form on a phone, and a model **trained on AMD** returns an explainable, calibrated TB-risk estimate that prioritizes who needs a confirmatory test — no X-ray machine, lab, or on-site radiologist required. Inference runs online on AMD. **Triage, not diagnosis** (investigational research prototype). Evidence-backed core = **cough + clinical**; chest X-ray is an optional/independent stretch.

Built for the **AMD Developer Hackathon ACT II** — **Unicorn track** (judged on creativity, originality, product potential). Window **6–11 July 2026** (~5-day sprint; confirm exact UTC). Product models run on AMD (ROCm) + Fireworks — not Anthropic/Claude (Claude is the coding assistant, not a product dependency).

## Document router — read what fits your task
| You need to… | Read |
|---|---|
| Understand what Jaga is & why | `.agent/product-brief.md` |
| Build a feature / know exact requirements | `.agent/product-requirements.md` |
| Make a technical/ML decision or write code | `.agent/project-architecture.md` |
| Train / evaluate models, handle data | `.agent/data-evaluation-plan.md` |
| Check a factual or medical claim | `.agent/evidence-register.md` — **single source of truth for facts** |
| Know who does what, by when (5-day plan) | `.agent/implementation-plan.md` |
| Work on UI/UX | `.agent/design-guidelines.md` |
| Understand *why* a decision was made (or avoid a settled one) | `.agent/context-dump.md` (Decisions §14 · Set-Aside §15) |
| Documentation depth standard | `.agent/plan-template.md` |
| Working conventions / maintenance ritual | `CLAUDE.md` (Claude Code reads this automatically) |

**First time?** `product-brief.md` → `product-requirements.md` → `project-architecture.md`; use `context-dump.md` for rationale.

**Source precedence (if docs disagree):** `evidence-register.md` wins on facts → the four spec docs win on current spec → `context-dump.md` is *historical rationale only* (may contain superseded decisions, clearly marked). Fix drift when you find it.

## How to work here

- **Be data-driven.** Every problem claim is backed by a real, cited source. No invented stats.
- **Build something real and ours.** Triage-not-diagnosis is non-negotiable; a human stays in the loop.
- **The AMD hardware is load-bearing** — the model is trained/fine-tuned on the MI300X (ROCm) and served online on AMD.
- **Push back** on anything out of scope, unworkable, or unsafe.

## Scope discipline (read before adding anything)

Features in `product-requirements.md` are tagged **[MVP]** (build for 11 Jul), **[V1]** (document, don't build now), **[OUT]** (never). **If it isn't [MVP], don't build it now** — the MVP is the demo; anything beyond it is scope creep.

**Product invariants (non-negotiable):** triage-not-diagnosis · **evidence-backed core = cough + clinical** (CXR optional/stretch, never a fused metric) · **trained on AMD MI300X, served online on AMD** · **minimize + don't retain patient data** (no scraping) · **honest metrics** (no overclaiming vs CODA/WHO evidence) · ships by 11 Jul. A change that touches an invariant is out of scope unless explicitly re-decided and logged.

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

Idea + name + scope **LOCKED** (Jaga; online; cough+clinical core; CXR optional). **CODA access secured (Daffa, via ORCID).** Build not yet started. Open items: confirm CODA held-out split + guided-cough count; run the model-selection evidence gate; confirm exact event UTC boundary + containerization. Once the stack lands, add build/test/lint commands to `CLAUDE.md`. Full ticket board: `.agent/implementation-plan.md`.
