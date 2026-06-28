# Jaga · Full Context Dump

**Purpose:** A complete record of how Jaga was conceived — from first principles about what we wanted to build, through every idea we explored and discarded, to the product we committed to. This exists so anyone (future Claude instances, new teammates, your future self) can reconstruct not just *what* Jaga is but *why every decision was made the way it was*.

**Format:** Roughly chronological, organized by phase. Each phase shows the question we were wrestling with, the key insights, the decisions made, and what we set aside. Indices at the end give fast lookup.

---

## Table of Contents

1. [The Canvas: What We're Building Within](#1-the-canvas-what-were-building-within)
2. [Phase 1 — How We Want to Build](#2-phase-1--how-we-want-to-build)
3. [Phase 2 — What This Hardware Makes Possible](#3-phase-2--what-this-hardware-makes-possible)
4. [Phase 3 — Casting a Wide Net](#4-phase-3--casting-a-wide-net)
5. [Phase 4 — What Building ConsumerIQ Taught Us](#5-phase-4--what-building-consumeriq-taught-us)
6. [Phase 5 — A Craft Lesson: Kill the Fragile Dependency](#6-phase-5--a-craft-lesson-kill-the-fragile-dependency)
7. [Phase 6 — Exploring the Private Second Brain](#7-phase-6--exploring-the-private-second-brain)
8. [Phase 7 — Refusing to Build Me-Too](#8-phase-7--refusing-to-build-me-too)
9. [Phase 8 — Pulled Toward Real-World Impact](#9-phase-8--pulled-toward-real-world-impact)
10. [Phase 9 — Choosing the Problem Worth Building](#10-phase-9--choosing-the-problem-worth-building)
11. [Phase 10 — Designing the Experience](#11-phase-10--designing-the-experience)
12. [Phase 11 — The Product and Its Name: Jaga](#12-phase-11--the-product-and-its-name-jaga)
13. [Phase 12 — Building Something That Can Last](#13-phase-12--building-something-that-can-last)
14. [Phase 13 — Review & Honest Revision](#135-phase-13--review--honest-revision-2026-06-27)
15. [Decisions Index](#14-decisions-index)
15. [Set-Aside Ideas Index](#15-set-aside-ideas-index)
16. [Glossary of Concepts](#16-glossary-of-concepts)
17. [The Conceptual Through-Line](#17-the-conceptual-through-line)
18. [What This Document Is For](#18-what-this-document-is-for)

---

## 1. The Canvas: What We're Building Within

This is our entry for the **AMD Developer Hackathon ACT II** (lablab.ai). The theme is **AI Agents**, submissions must be **containerized**, and product models run on **AMD-hosted open-source models (ROCm)** and/or the **Fireworks API**. We're in the open **Unicorn track** — the one meant for building a real product, not running a benchmark.

We have ~two weeks and an **AMD Instinct MI300X** plus Fireworks credits to work with. The team: Daffa (backend + AI, our deepest engineer), Zeddin (backend + frontend), Kei (frontend), Billy (frontend lead + design), and Fransisco (PM, presentation, video). We're a design- and product-led group with one strong AI engineer.

What we actually care about: **building something genuinely useful, honest, and ours** — a project we'd be proud to keep working on after the deadline.

---

## 2. Phase 1 — How We Want to Build

Before any idea, we agreed on the kind of thing we wanted to make:

- **It should do something visible and real.** A tool earns its keep by producing tangible output a person can see and act on — not a slide-deck promise.
- **It should be grounded in real data.** Every problem we claim has to be backed by verifiable sources; no invented urgency.
- **It should be ours, not a clone.** We'd rather build something with a genuine angle than copy a trend.
- **The hardware should matter.** If the project would run identically on any cloud API, we haven't really used what we were given — we wanted an idea where the GPU is load-bearing.
- **Design is part of the substance.** Clarity and polish aren't decoration; they're how people trust and use a tool.

These became the lens for everything that followed.

---

## 3. Phase 2 — What This Hardware Makes Possible

We started from genuine curiosity: *what can you build with an MI300X that you couldn't easily build otherwise?* Verified specs:

- **MI300X: 192GB HBM3, 5,300 GB/s.** Enough to run a **70B-parameter model on a single GPU** with no model parallelism — something that normally needs a multi-GPU cluster. It can also hold several models co-resident (a full multimodal pipeline on one card) and fine-tune open models via PyTorch + ROCm. Containers come preloaded.
- **Fireworks FireFunction** gives reliable tool-calling for agent orchestration and a fast path when online.

The exciting implication: this hardware makes **training and serving capable AI** practical and affordable. (We initially leaned toward fully offline/on-device deployment; on review we chose online cloud serving on AMD instead — see Phase 13 and the Set-Aside Index.) That possibility shaped the kind of product we went looking for.

---

## 4. Phase 3 — Casting a Wide Net

We explored widely and honestly: a private "sovereign" assistant, a creator video-repurposing studio, an AI brand/design studio, a vertical tutor, a small-business voice agent, an accessibility co-pilot. Useful exercise — it surfaced a principle we kept: **the strongest ideas turn an input into something tangible within seconds.** Ideas whose value is invisible (e.g. "it's private") are hard to *show*, and a tool you can't show is a tool people can't feel. We kept hunting for input → visible result.

---

## 5. Phase 4 — What Building ConsumerIQ Taught Us

We have a track record to learn from: **ConsumerIQ**, our earlier project (a demand-validation engine; it reached the finals and won its track). Re-reading it told us who we are as a team:

- We're at our best with **clean, technically deep, decisive products** — messy input → a hybrid local+cloud AI pipeline → one clear, confident answer.
- **Running models locally on the GPU** was a real strength of that build, and the part we were proudest of.
- Our originality came from **architecture and execution**, not from a never-seen-before concept.

The takeaway wasn't "do what won" — it was "play to what we're genuinely good at and enjoy: clarity, depth, and a decisive result."

---

## 6. Phase 5 — A Craft Lesson: Kill the Fragile Dependency

ConsumerIQ leaned on live web scraping, which was unstable and slow — a constant source of pain and a risk every time we demoed it. Reflecting on that, we made a craft decision for the next build: **data should come from the user or a stable, bundled source — never live scraping.** It makes the product more robust and lets the AI itself be the star rather than the plumbing. (It also happens that this project doesn't need scraping at all.)

---

## 7. Phase 6 — Exploring the Private Second Brain

We spent real time on a **private, local, visual "second brain"** — capture notes/images/links, let on-device AI organize and connect them, for a specific profession (we looked at teachers, clinicians, and researchers, and wrote sourced problem statements for each). It's a beautiful space and it fit the local-on-AMD idea well.

We set it aside for an honest reason: it leaned close to existing knowledge tools, and we wanted to build something that felt more distinctly **ours** and more clearly **needed**. What carried forward was the *fully-local-on-AMD privacy* pattern and a high bar for documentation (captured in `plan-template.md`).

---

## 8. Phase 7 — Refusing to Build Me-Too

We pressure-tested several "underserved" niches and kept finding them already crowded in 2026 — special-ed tools, vet scribes, permit review, synthetic focus groups, AI grading. Rather than squeeze into a packed lane, we drew a line: **we won't ship a me-too product.** If almost every "AI does X" space is occupied, then what makes something worth building isn't a virgin market — it's a real, under-served *need*, a genuine angle, and execution we can stand behind. That clarified the search: find a problem that actually matters to people, where our approach is meaningfully different.

---

## 9. Phase 8 — Pulled Toward Real-World Impact

The conversation kept gravitating to high-impact medical AI — projects that detect disease and help people, not just optimize a workflow. We were honest about prior art (drug-discovery and brain-imaging AI are deep, well-trodden fields) and that was fine: we weren't looking to be first, we were looking to build something that *helps* and that we can actually execute. Health, with public datasets and clear human stakes, felt like the right kind of hard.

---

## 10. Phase 9 — Choosing the Problem Worth Building

We compared four concrete directions — car-damage assessment, a clinician knowledge brain, **TB screening**, and insurance-denial appeals — on what mattered to us: real human impact, a genuine need for the hardware, public data we could build on honestly, and a fit with our strengths.

**Tuberculosis screening won, clearly.** TB is the world's deadliest infectious disease and a third of cases are missed every year — a **global** crisis across the high-burden belt (India, Indonesia, Philippines, Pakistan, sub-Saharan Africa). We frame Jaga as a global tool and **start in Indonesia as our beachhead** — the world's #2 burden country and our home, so we build with real ground truth and authenticity before scaling out. The root cause is brutally practical everywhere: first-line screening needs X-ray machines, sputum labs, and radiologists that the hardest-hit communities simply don't have. A **cough is a free, instantly-available signal**, and a phone-first screen needs none of that equipment. Public datasets (cough with paired clinical data) let us build and validate it for real. *(See Phase 13 for the scientific/deployment corrections we made after a hard technical review.)*

---

## 11. Phase 10 — Designing the Experience

We worried at first that "just a cough" couldn't show much. It turns out a cough is *rich*: a mel-spectrogram with a saliency overlay, an embedding plot placing the case among healthy vs TB clusters, acoustic-feature readouts. And because public chest-X-ray data exists too, we went **multimodal** — cough plus an optional X-ray (with a Grad-CAM heatmap), fused into one risk score. The design principle that fell out: **X-ray where a clinic has the machine, a phone cough where it doesn't.** We mapped the full journey — demographics, optional symptoms, optional X-ray, a required 10-second cough — ending in an explainable result, with confidence rising as more inputs are added.

---

## 12. Phase 11 — The Product and Its Name: Jaga

**The product:** a phone-first **TB triage** tool. A community health worker records a cough plus a few clinical details; an AI model **trained on AMD and served online** returns an explainable, calibrated TB-risk result in seconds — no X-ray machine, lab, or on-site radiologist — to decide who needs a confirmatory test. Chest X-ray is an optional/stretch signal. It's **triage, never diagnosis**: a human always stays in the loop and real cases go for confirmatory testing.

**The name: Jaga** — Indonesian for *"to watch over / to guard."* It says the mission in one word: something that watches over your lungs and your community. We deliberately avoided "breath"-type names (they echo existing tools) in favor of something authentic to us and easy for anyone to say.

The full project plan lives in the four spec docs (`product-brief.md`, `product-requirements.md`, `project-architecture.md`, `design-guidelines.md`). The demo centers on the community-health-worker field-screening flow.

---

## 13. Phase 12 — Building Something That Can Last

We checked whether Jaga could be more than a weekend project — whether it could actually sustain itself and reach people at scale. It can: TB screening is a funded, global public-health effort (the Global Fund alone moves billions into TB), real companies in this space are venture- and foundation-backed, and there's an established path for tools like this to be adopted by national programs and NGOs. Our model — a free app for community health workers, a local AMD "edge" box for clinics, and program licensing — fits how this work actually gets funded, and the same pipeline can later extend to other respiratory diseases. We're being honest that this is an impact-driven, slower-moving market, not a viral consumer app — but it's one where the work genuinely matters.

---

## 13.5 Phase 13 — Review & Honest Revision (2026-06-27)

A hard technical review pressure-tested the plan as a skeptical, informed judge would. Most of it was valid (we verified the disputed facts), and we revised:
- **Deployment: online, not offline.** The original "fully offline / on-device, nothing leaves the device" story was incoherent alongside AMD-Cloud + FastAPI + Fireworks, and true on-device inference (incl. full HeAR, which is too large for phones) wasn't credible in a 5-day sprint. **Decision: serve inference online in the cloud on AMD; train on MI300X.** On-prem "edge" is a future roadmap, not the MVP.
- **Scope: cough + clinical core; CXR optional.** CODA (cough+clinical, same patients) and the CXR sets (different patients) share no paired data, so a *fused* validated metric is impossible. **Decision: cough+clinical is the validated core; CXR is an independent optional/stretch signal; never claim a fused metric.**
- **Honest metrics.** Real CODA results are cough-only AUROC ~0.69–0.74 and cough+clinical ~0.78–0.83 — not the 0.85–0.90 we'd written. WHO ≥90%/≥70% is an *aspiration*, not a promised result. Report subject-level/site-held-out eval, calibration, subgroup metrics, and limitations.
- **Claim corrections.** "1/3 of cases missed" → WHO 2025: ~10.7M estimated vs 8.3M notified (~2.4M / ~22% gap). "Incumbents need a radiologist" is false — WHO permits AI-CAD to *replace* readers (6 products approved Jun 2025). "Cough on a phone" isn't a moat — Swaasa already does cough+clinical phone screening. A photographed X-ray ≠ a digital CXR.
- **"Confidence always rises with more input" removed** — a calibrated probability can go up or down; conflicting inputs can reduce certainty.
- **Privacy wording fixed** — from "no PHI / nothing leaves the device" to "minimize + don't retain patient data; transient cloud inference."
- **Logistics:** Unicorn track + its criteria *are* confirmed (the reviewer conflated the prior AMD hackathon's four criteria); but the event likely runs as a **~5-day sprint ending 11 Jul** — our 10-day plan was cut to 5. Containerization to confirm.
- **Hygiene:** added an MIT `LICENSE`; reconciled "Stack TBD" (now "proposed in architecture"); fixed the dangling `plan-jaga.md` reference.

What the review got wrong: it said the track/criteria were "TBA" — they're not; and its "2/10 dev readiness" judged a deliberately pre-build docs stage as if it were a codebase.

---

## 14. Decisions Index

| Decision | Reasoning |
|---|---|
| **Build a real product (Unicorn track)** | We wanted to make something useful, not run a benchmark |
| **Tuberculosis early-screening triage** | Deadly, under-served, authentic (Indonesia = #2 burden); a phone-first cough+clinical screen reaches places that lack X-ray/lab/radiologist |
| **Cough + clinical as the core (X-ray optional)** | *(Revised in Phase 13 — originally a fused cough+X-ray+clinical model.)* No paired data to validate fusion; cough+clinical is the evidence-backed core, CXR is a separate optional signal |
| **Triage, NOT diagnosis** | Safety and integrity — a human stays in the loop; real cases go for confirmatory testing |
| **Online cloud serving on AMD (not offline/on-device)** | Honest + buildable in a short sprint; avoids the on-device/HeAR-size and incoherence problems flagged in review (Phase 13). On-prem "edge" is a future roadmap, not the MVP |
| **Train the model on the MI300X (ROCm); serve online** | Training on GPU is the real, defensible AMD usage; serving on AMD too |
| **Validated core = cough + clinical; CXR optional/stretch** | No paired cough+X-ray data exists, so a fused metric can't be validated; cough+clinical is the evidence-backed approach (CODA) |
| **Honest metrics (no overclaiming)** | Report real CODA numbers (cough+clinical AUROC ~0.78–0.83) with WHO 90/70 as an aspiration; a technical judge can dismantle inflated claims |
| **Name: Jaga** | "To watch over / guard" — says the mission, authentic to us, distinct from existing tools |
| **Global tool; beachhead = community health workers in Indonesia** | Market is the worldwide high-burden belt; we start in Indonesia (#2 burden, our home) for ground truth + authenticity, then expand |
| **Controlled-access CODA (Daffa has it via ORCID) + public CXR** | *(Corrected — CODA is NOT a public download; it's Synapse controlled-access.)* Honest, reproducible, no scraping; honor CODA data-use terms |
| **Keep `CLAUDE.md` as a thin pointer (not sole `AGENT.md`)** | A reviewer asked to delete it for a single entry point; we keep it because **Claude Code auto-loads `CLAUDE.md`** — removing it means the coding agent loses project conventions on load. `AGENT.md` remains canonical; `CLAUDE.md` points to it + holds the maintenance ritual, so no real duplication/drift |
| **No live web scraping** | A craft lesson from ConsumerIQ — robust products don't depend on fragile pipelines |
| **Clarity + decisive output as our signature** | It's what we're best at and what makes a tool trustworthy |
| **Design treated as substance** | Clear, polished UX is how people trust and adopt a health tool |

---

## 15. Set-Aside Ideas Index

Things we explored and chose not to build, with the honest reason:

| Idea | Why we set it aside |
|---|---|
| **Sovereign/private assistant (standalone)** | Its value is invisible — hard to show, hard to feel |
| **Creator video studio / AI brand studio** | Fun, but not a problem we cared deeply about; generation quality was risky in the window |
| **Private second brain (teacher/clinician/research)** | Too close to existing knowledge tools; we wanted something more distinctly ours and more clearly needed |
| **AI visual-guide browser extension** | The AI was lightweight — the hardware wouldn't really matter |
| **AI course generator** | The most over-built idea in the space; little room to do something new |
| **AI grading tool** | Crowded; class-analytics already widely exists |
| **Synthetic focus groups** | A mature, saturated category |
| **Car-damage / repair-cost AI** | Crowded; no real reason it needs this hardware; not a mission we cared about |
| **Insurance denial-appeals** | A strong, humane idea — but the model would just run in the cloud; the hardware wasn't essential |
| **Live web scraping** | Fragile and slow; a craft mistake we won't repeat |
| **Diagnosis (vs triage)** | Unsafe to claim and not the responsible thing to build |
| **Offline / on-device deployment (for MVP)** | *(Set aside in Phase 13.)* Incoherent with cloud/AMD/Fireworks; on-device models too large for cheap phones in a 5-day sprint. On-prem "edge" kept as a future roadmap only |
| **Fused cough+X-ray validated score** | No paired data exists to train/validate fusion; would be dismantled by a technical judge. CXR kept as an independent optional signal |
| **Scoring a photographed X-ray film** | Not equivalent to the digital CXR the models are trained/evaluated on |
| **Overstated metrics (0.85–0.90 cough; fused ≥90/70)** | Not supported by CODA evidence; replaced with honest ranges + WHO 2025 TPP as aspiration |
| **Quantum image processing / quantum ML for the X-ray (or cough)** | Research-stage with **no demonstrated advantage** over classical CNNs (classical TB-CXR ~94%); wouldn't use AMD ROCm (uses a quantum SDK/simulator → weakens the AMD criterion); reads as buzzword-padding against our honesty posture; needs heavy downsampling; a time sink in a 5-day sprint. Only conceivable as a clearly-labelled research sidebar (not the MVP). |

---

## 16. Glossary of Concepts

**Jaga** — the product. A phone-first AI tuberculosis triage tool (cough + clinical core; CXR optional), trained on AMD and served online. Indonesian for "to watch over / guard."
**Triage (not diagnosis)** — Jaga flags *who should get a confirmatory test* (e.g. GeneXpert/sputum); it never diagnoses. Core safety principle.
**Multimodal fusion** — combining cough audio + chest X-ray + demographics + symptoms into one calibrated risk score; confidence rises as optional inputs are added.
**The hero visual** — a mel-spectrogram with a saliency overlay (audio) and a Grad-CAM heatmap on the X-ray; the moment the AI's reasoning becomes visible.
**Online cloud serving** — Jaga's inference runs in the cloud on AMD (Dev Cloud, MI300X); the phone is a client. (Offline/on-prem "edge" is a set-aside future option, not the MVP.)
**Honest metrics** — we report real CODA numbers (cough+clinical AUROC ~0.78–0.83) with subgroup metrics + limitations; the WHO ≥90%/≥70% target is an aspiration, not a promised result. Never claim a fused cough+X-ray metric (no paired data).
**WHO TB-triage target** — ≥90% sensitivity / ≥70% specificity; our accuracy goalpost.
**CODA TB dataset** — public cough corpus (700k+ sounds, 2,143 people) for the cough model.
**Kaggle TB CXR / Shenzhen / Montgomery** — public chest-X-ray datasets for the imaging model.
**CHW** — community health worker; Jaga's primary user, doing active case-finding in the field.
**ConsumerIQ** — our prior project (finalist; won its track); taught us our strengths (clean, deep, decisive, local-GPU) and the no-scraping craft lesson.
**Plan template** — `plan-template.md`, the documentation depth standard we hold ourselves to.

---

## 17. The Conceptual Through-Line

> We set out to build something genuinely useful, honest, and ours — a tool where the AI does visible work, the claims are backed by real data, and the hardware actually matters. We explored widely (assistants, creator tools, vertical second brains, screening ideas) and kept refusing the me-too options, because a crowded space isn't worth our two weeks. What kept pulling us back was real-world impact, and one problem stood out as both meaningful and reachable: **tuberculosis** — the world's deadliest infectious disease, a third of cases missed every year across a high-burden belt spanning India, Indonesia, the Philippines, Pakistan, and sub-Saharan Africa. It's a **global** problem, and we start where we have ground truth and proximity — Indonesia, the world's #2 burden and our home — as the beachhead, then scale out. The reason cases are missed is painfully practical everywhere: screening needs labs and X-ray machines the hardest-hit communities don't have. A **cough is a free signal** and the AMD MI300X lets us train an accurate cough+clinical model — so we're building **Jaga**: cough into a phone, answer a few questions, get an explainable, calibrated TB-risk result in seconds, deciding who needs a confirmatory test. No X-ray machine, lab, or radiologist required. It plays to our strengths, it uses the hardware for real (we train on AMD), and it's something we'd be proud to keep building. *(After a hard technical review we corrected course — online serving, cough+clinical core, honest metrics; see Phase 13.)*

---

## 18. What This Document Is For

1. **Onboard new contributors** without replaying the whole session.
2. **Resolve ambiguity** by showing decisions *and* the reasoning behind them.
3. **Prevent us from circling back** to ideas we already explored and set aside.
4. **Ground AI agents** working in this repo.
5. **Preserve the mission and the "why"** once build details start to crowd out the strategy.

**Source-of-truth companions:** `product-brief.md`, `product-requirements.md`, `project-architecture.md`, and `design-guidelines.md` (the four spec docs), plus `plan-template.md` (our documentation standard). The Notion page "AMD Act II Hackathon" mirrors the plan for the team.
