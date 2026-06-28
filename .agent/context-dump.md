# Jaga · Full Context Dump

| Field | Value |
|---|---|
| Document type | Historical decision record |
| Audience | Contributors, reviewers, and future maintainers |
| Status | Historical; current revision and decisions are summarized in Sections 15–20 |
| Owner | Billy |
| Updated | 2026-06-28 |
| Canonical for | Product history, superseded ideas, and decision rationale |
| Companion documents | [`evidence-register.md`](evidence-register.md), [`product-brief.md`](product-brief.md), [`product-requirements.md`](product-requirements.md), [`project-architecture.md`](project-architecture.md), [`design-guidelines.md`](design-guidelines.md), [`implementation-plan.md`](implementation-plan.md) |

## How to read this document

Sections 1–14 preserve the project discussion as it happened. They are historical evidence, not the current implementation specification. A `SUPERSEDED` comment immediately follows any historical passage that contradicts the current plan. Section 15 records the evidence and implementation revision completed on 28 June 2026. For current behavior, follow the companion documents according to the precedence in [`../AGENT.md`](../AGENT.md).

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
14. [Phase 13 — Review and Honest Revision](#14-phase-13--review-and-honest-revision-2026-06-27)
15. [Phase 14 — Evidence and Implementation Revision](#15-phase-14--evidence-and-implementation-revision-2026-06-28)
16. [Decisions Index](#16-decisions-index)
17. [Set-Aside Ideas Index](#17-set-aside-ideas-index)
18. [Glossary of Concepts](#18-glossary-of-concepts)
19. [The Conceptual Through-Line](#19-the-conceptual-through-line)
20. [What This Document Is For](#20-what-this-document-is-for)

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

> **SUPERSEDED — current decision:** WHO's 2025 estimate implies an approximately 22% notification gap, not one third. CODA is controlled-access, not a public download. Jaga is an investigational research prototype and does not claim clinical validation. See [`evidence-register.md`](evidence-register.md).

---

## 11. Phase 10 — Designing the Experience

We worried at first that "just a cough" couldn't show much. It turns out a cough is *rich*: a mel-spectrogram with a saliency overlay, an embedding plot placing the case among healthy vs TB clusters, acoustic-feature readouts. And because public chest-X-ray data exists too, we went **multimodal** — cough plus an optional X-ray (with a Grad-CAM heatmap), fused into one risk score. The design principle that fell out: **X-ray where a clinic has the machine, a phone cough where it doesn't.** We mapped the full journey — demographics, optional symptoms, optional X-ray, a required 10-second cough — ending in an explainable result, with confidence rising as more inputs are added.

> **SUPERSEDED — current decision:** The MVP uses five solicited coughs plus supported clinical variables. CXR is isolated P2 stretch work because no paired cough/CXR cohort supports fusion. Attention and saliency views are non-causal inspection artifacts, not model reasoning. More inputs do not necessarily increase confidence.

---

## 12. Phase 11 — The Product and Its Name: Jaga

**The product:** a phone-first **TB triage** tool. A community health worker records a cough plus a few clinical details; an AI model **trained on AMD and served online** returns an explainable, calibrated TB-risk result in seconds — no X-ray machine, lab, or on-site radiologist — to decide who needs a confirmatory test. Chest X-ray is an optional/stretch signal. It's **triage, never diagnosis**: a human always stays in the loop and real cases go for confirmatory testing.

> **SUPERSEDED — current decision:** Every symptomatic adult in the intended workflow receives confirmatory evaluation. Jaga's research output may help prioritize urgency; it must never decide whether confirmatory evaluation happens.

**The name: Jaga** — Indonesian for *"to watch over / to guard."* It says the mission in one word: something that watches over your lungs and your community. We deliberately avoided "breath"-type names (they echo existing tools) in favor of something authentic to us and easy for anyone to say.

The full project plan lives in the four spec docs (`product-brief.md`, `product-requirements.md`, `project-architecture.md`, `design-guidelines.md`). The demo centers on the community-health-worker field-screening flow.

---

## 13. Phase 12 — Building Something That Can Last

We checked whether Jaga could be more than a weekend project — whether it could actually sustain itself and reach people at scale. It can: TB screening is a funded, global public-health effort (the Global Fund alone moves billions into TB), real companies in this space are venture- and foundation-backed, and there's an established path for tools like this to be adopted by national programs and NGOs. Our model — a free app for community health workers, a local AMD "edge" box for clinics, and program licensing — fits how this work actually gets funded, and the same pipeline can later extend to other respiratory diseases. We're being honest that this is an impact-driven, slower-moving market, not a viral consumer app — but it's one where the work genuinely matters.

> **SUPERSEDED — current decision:** The business model is a hypothesis, not a validated result. Offline and edge-appliance deployment are outside the MVP. The current plan uses transient cloud inference on AMD infrastructure.

---

## 14. Phase 13 — Review and Honest Revision (2026-06-27)

A hard technical review pressure-tested the plan as a skeptical, informed judge would. Most of it was valid (we verified the disputed facts), and we revised:
- **Deployment: online, not offline.** The original "fully offline / on-device, nothing leaves the device" story was incoherent alongside AMD-Cloud + FastAPI + Fireworks, and true on-device inference (incl. full HeAR, which is too large for phones) wasn't credible in a 5-day sprint. **Decision: serve inference online in the cloud on AMD; train on MI300X.** On-prem "edge" is a future roadmap, not the MVP.
- **Scope: cough + clinical core; CXR optional.** CODA (cough+clinical, same patients) and the CXR sets (different patients) share no paired data, so a *fused* validated metric is impossible. **Decision: cough+clinical is the evidence-backed research core; CXR is an independent optional/stretch signal; never claim a fused or clinically validated metric.**
- **Honest metrics.** Published CODA experiments report cough-only and cough+clinical performance ranges, but Jaga must report only results produced by its own reproducible evaluation. The old universal WHO ≥90%/≥70% benchmark was replaced by the 2025 tiered screening profiles. Report subject-level/site-held-out evaluation, calibration, subgroup metrics, and limitations.
- **Claim corrections.** "1/3 of cases missed" → WHO 2025: ~10.7M estimated vs 8.3M notified (~2.4M / ~22% gap). "Incumbents need a radiologist" is false — WHO permits AI-CAD to *replace* readers (6 products approved Jun 2025). "Cough on a phone" isn't a moat — Swaasa already does cough+clinical phone screening. A photographed X-ray ≠ a digital CXR.
- **"Confidence always rises with more input" removed** — a calibrated probability can go up or down; conflicting inputs can reduce certainty.
- **Privacy wording fixed** — from "no PHI / nothing leaves the device" to "minimize + don't retain patient data; transient cloud inference."
- **Logistics:** Unicorn track, its four criteria, the 6–11 July event window, containerization, and a public runnable repository are confirmed. Preparation and prototyping begin 29 June, before the official event.
- **Hygiene:** added an MIT `LICENSE`; reconciled the proposed stack; fixed the dangling `plan-jaga.md` reference.

What the review got wrong: it said the track/criteria were "TBA" — they're not; and its "2/10 dev readiness" judged a deliberately pre-build docs stage as if it were a codebase.

---

## 15. Phase 14 — Evidence and Implementation Revision (2026-06-28)

The team reviewed every Markdown plan against Trellis's `.agent` documentation depth and converted the repository from a concept outline into an implementation-ready documentation set. The revision:

- made [`../AGENT.md`](../AGENT.md) the sole entry point and removed the conflicting secondary agent pointer;
- resolved public evidence, CODA cohort/protocol details, WHO 2025 tiered screening profiles, and hackathon requirements in [`evidence-register.md`](evidence-register.md);
- separated the research prototype from any claim of a validated clinical product;
- required confirmatory evaluation for every symptomatic adult and limited risk output to urgency prioritization;
- established five solicited coughs as the capture protocol;
- documented Daffa's backend/AI architecture ownership, Zeddin's backend implementation ownership, Billy's frontend/design ownership, and Kei's capture/result implementation ownership;
- introduced explicit owner blocks for unresolved private-data, model, backend, API, frontend, and design decisions;
- split preparation from the official 6–11 July hackathon window; and
- added ticket-level dependencies, acceptance criteria, fallbacks, and PRD-to-ticket traceability.

This phase supersedes the current-state summaries written before 28 June. Earlier text remains above only as a historical record.

---

## 16. Decisions Index

| Decision | Reasoning |
|---|---|
| **Build an investigational research prototype for the Unicorn track** | The sprint can demonstrate a technically meaningful product without implying clinical validation or deployment readiness. |
| **Cough plus supported clinical variables is the [MVP] research core** | CODA pairs these inputs at participant level; CXR data is not paired and cannot support a fused evaluation. |
| **Use five solicited coughs** | This matches the documented CODA collection protocol and gives the quality gate a concrete contract. |
| **Every symptomatic adult receives confirmatory evaluation** | Jaga may prioritize urgency but must never determine who is denied confirmatory testing. |
| **CXR stays isolated [Stretch] work** | It may be demonstrated independently but cannot alter the MVP risk result or create a fused performance claim. |
| **Attention views are non-causal artifacts** | A saliency or attention visualization can support inspection but cannot be presented as the model's reasoning. |
| **Serve transient inference online on AMD** | It is coherent with hackathon infrastructure; offline and edge-appliance deployment remain outside the MVP. |
| **Use CODA under controlled access** | CODA is not a public download. Access, retention, and redistribution must follow its data-use terms. |
| **Apply WHO's 2025 tiered screening profiles** | The earlier universal 90% sensitivity/70% specificity shorthand is outdated and cannot be used as Jaga's single promotion gate. |
| **Prepare from 29 June; implement the official MVP from 6 July** | This preserves the distinction between pre-event contracts/prototypes and the official 6–11 July sprint. |
| **Make `AGENT.md` the sole repository entry point** | A single router removes conflicting instructions and establishes source precedence. |
| **Daffa architects backend and AI; Zeddin implements them** | This separates technical contract ownership from implementation responsibility. |
| **Billy leads frontend and design; Kei implements capture and result flows** | This gives the frontend a clear specification handoff and implementer. |
| **No live web scraping** | The project should depend on user input and stable, permitted data sources. |
| **Design is part of safety** | Clear hierarchy, accessible states, and precise copy prevent a research risk output from being mistaken for a diagnosis. |

---

## 17. Set-Aside Ideas Index

| Idea | Why it is set aside |
|---|---|
| **Sovereign/private assistant** | Its value was hard to demonstrate and it did not match the chosen health problem. |
| **Creator video or AI brand studio** | It was not a problem the team wanted to pursue and generation quality was risky in the window. |
| **Private second brain** | It was close to existing knowledge tools and less clearly needed. |
| **AI visual-guide browser extension** | The hardware would not be load-bearing. |
| **AI course generator, grading, and synthetic focus groups** | These are crowded categories without a distinct Jaga advantage. |
| **Car-damage assessment** | It lacked mission fit and a defensible need for AMD compute. |
| **Insurance-denial appeals** | It was humane but did not make the supplied hardware central. |
| **Diagnosis** | It is outside the evidence, safety, regulatory, and sprint boundaries. |
| **Offline or on-device MVP** | It conflicts with the selected AMD cloud architecture and the sprint's constraints. |
| **Local edge appliance** | It remains a future research direction, not a current commitment. |
| **Fused cough/CXR score** | No paired cohort supports training or evaluation of that fusion. |
| **Photographed X-ray film scoring** | A photograph is not equivalent to the digital CXR distribution used by candidate models. |
| **Universal WHO 90%/70% gate** | WHO's 2025 guidance defines tiered profiles instead of one universal benchmark. |
| **Rising confidence with more inputs** | Additional or conflicting evidence may raise or lower a calibrated probability and its uncertainty. |
| **Attention as model reasoning** | The visualization is not a causal explanation. |
| **Validated-product language** | Jaga has not completed prospective clinical validation, regulatory review, or deployment evaluation. |
| **Quantum image or audio processing** | It has no demonstrated advantage here, does not strengthen the AMD story, and creates schedule risk. |

---

## 18. Glossary of Concepts

**Jaga** — an investigational, phone-first TB risk-prioritization research prototype. It is not a diagnostic or clinically validated product.

**Triage research output** — a calibrated risk category and uncertainty statement that may prioritize urgency. It never determines whether a symptomatic adult receives confirmatory evaluation.

**Confirmatory evaluation** — the clinical pathway used to establish or exclude TB. Every symptomatic adult in the intended Jaga workflow is directed to it.

**Five-cough protocol** — five solicited cough recordings, individually checked before submission.

**Quality gate** — deterministic checks that accept or reject captured audio before model inference, with an actionable reason when rejected.

**CODA TB dataset** — a controlled-access dataset of 2,143 symptomatic adults, split into 1,105 training and 1,038 held-out participants, with five solicited coughs and paired clinical variables.

**Non-causal inspection artifact** — a spectrogram, saliency, attention, or embedding visualization that helps inspect a model but does not expose causal reasoning.

**WHO 2025 screening profiles** — tiered target product profiles for TB screening tests; they replace the old single 90%/70% shorthand.

**Transient cloud inference** — request data is processed by the service without intentional persistence beyond operationally necessary logs that exclude raw audio and clinical payloads.

**CHW** — community health worker; the MVP's primary operator persona.

**Owner input block** — a visible, dated contract for a decision that only its named owner can complete. Each block states what it blocks, its output, affected documents, and its completion rule.

---

## 19. The Conceptual Through-Line

> Jaga began with a requirement to make AI work visible, useful, evidence-backed, and meaningfully dependent on AMD compute. The team chose tuberculosis because the global burden is high and access to screening and confirmatory pathways remains uneven. The resulting MVP is intentionally narrow: a CHW records five solicited coughs and supported clinical variables; an AMD-hosted research pipeline applies quality checks and returns a calibrated risk-prioritization result with uncertainty and a clear confirmatory-evaluation instruction. Every symptomatic adult continues to confirmatory evaluation. Jaga is an investigational research prototype, not a diagnosis or validated clinical product. CXR fusion, offline deployment, causal explanation claims, and unsupported performance promises are outside the MVP.

---

## 20. What This Document Is For

1. Onboard contributors without replaying the full project discussion.
2. Preserve the reasoning behind current and rejected decisions.
3. Mark contradictions instead of silently rewriting project history.
4. Prevent superseded ideas from returning as current requirements.
5. Direct implementation work to the canonical companion documents.

Current implementation behavior is defined by [`product-requirements.md`](product-requirements.md), interfaces and boundaries by [`project-architecture.md`](project-architecture.md), model work by [`data-evaluation-plan.md`](data-evaluation-plan.md), frontend behavior by [`design-guidelines.md`](design-guidelines.md), evidence by [`evidence-register.md`](evidence-register.md), and execution by [`implementation-plan.md`](implementation-plan.md).
