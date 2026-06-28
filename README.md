# Jaga

**An investigational, phone-first tuberculosis triage prototype that combines five guided coughs with supported clinical inputs to help prioritize follow-up urgency.**

[Product Brief](.agent/product-brief.md) · [Requirements](.agent/product-requirements.md) · [Architecture](.agent/project-architecture.md) · [Data & Evaluation](.agent/data-evaluation-plan.md) · [Evidence](.agent/evidence-register.md) · [Design](.agent/design-guidelines.md) · [Agent Guide](AGENT.md)

## What Jaga is

Jaga is a research prototype documented for **symptomatic adults aged 18+**, matching the available CODA TB evidence base. A community health worker captures five guided coughs and supported clinical inputs. A model trained on AMD returns a calibrated research estimate and model-inspection artifacts.

The estimate may prioritize follow-up urgency, but it does not decide whether a symptomatic person receives testing. **Every symptomatic participant is directed to confirmatory evaluation. Jaga does not diagnose or rule out tuberculosis.**

_Jaga_ is Indonesian for “to watch over / to guard.”

## Why it matters

Tuberculosis remains the world's leading infectious-disease killer. WHO estimated **10.7 million** incident cases in 2024 and **8.3 million** notified diagnoses, leaving a gap of about **2.4 million people** caused by both underdiagnosis and underreporting. Indonesia accounted for approximately **10% of global incident cases**. Sources and permitted wording are maintained in the [evidence register](.agent/evidence-register.md).

Jaga explores whether cough acoustics plus routinely available clinical information can support accessible research into TB triage. It does not replace microbiological confirmation, clinical judgment, or an approved screening programme.

## MVP behavior

| Capability | MVP behavior |
|---|---|
| Guided capture | Record five coughs and reject unusable audio before inference |
| Clinical inputs | Collect only variables supported by the approved model contract |
| Research estimate (**Gema**) | The cough-plus-clinical core returns a calibrated probability and relative urgency band |
| Mandatory next step | Direct every symptomatic participant to confirmatory evaluation |
| Model inspection | Show a spectrogram, non-causal attention/saliency overlay, and supported contributing factors |
| Privacy | Process inputs transiently without request-body logging or patient-data persistence |
| `[Stretch]` CXR (**Prisma**) | Show a separate digital-CXR estimate with separate metrics; never fuse scores |

## Planned stack

| Layer | Planned technology |
|---|---|
| Frontend | Next.js PWA and Tailwind CSS; final frontend contract owned by Billy |
| Backend | FastAPI and Docker; architecture owned by Daffa and implemented by Zeddin |
| AI training | PyTorch on AMD ROCm / Instinct MI300X |
| Core model | Evidence-gated cough-plus-clinical model; final pipeline owned by Daffa |
| Optional generation | Fireworks API for richer copy only; deterministic bilingual referral remains the default |

The detailed contracts are intentionally assigned in the [architecture](.agent/project-architecture.md), [data and evaluation plan](.agent/data-evaluation-plan.md), and [implementation plan](.agent/implementation-plan.md). Product and medical-safety rules are already fixed and are not placeholders.

## Development status

- **29 June–5 July 2026:** architecture contracts, data verification, baseline model, frontend specification, scaffolding, and integration prototype.
- **6–9 July:** official hackathon MVP implementation and integration.
- **10 July:** evaluation, accessibility, failure-path testing, deployment, and demo recording.
- **11 July:** submission verification and buffer.

Application scaffolding begins 29 June 2026. The current commit contains planning documentation only, so there are no valid install or run commands yet. The public README must be updated with tested setup and usage commands as part of deployment ticket `BE-5`; submission is blocked until a clean checkout can run the documented commands.

## Repository structure

```text
jaga/
├── AGENT.md
├── README.md
├── LICENSE
└── .agent/
    ├── product-brief.md
    ├── product-requirements.md
    ├── project-architecture.md
    ├── data-evaluation-plan.md
    ├── evidence-register.md
    ├── design-guidelines.md
    ├── implementation-plan.md
    ├── context-dump.md
    ├── log.md
    └── plan-template.md
```

## Hackathon

Jaga targets the **Unicorn Track** of AMD Developer Hackathon ACT II. The official window is **6 July 2026, 15:00 UTC → 11 July 2026, 15:00 UTC**. Judging covers creativity and originality, completeness, meaningful use of AMD platforms, and product/market potential.

The submission must include a public repository with setup and usage instructions, a runnable application URL, containerized services, a cover image, video presentation, and slide presentation.

## Team

- **Daffa:** backend/AI architecture, data, model, and evaluation
- **Zeddin:** backend implementation, integration, containers, and deployment
- **Billy:** frontend/design architecture, accessibility, and final polish
- **Kei:** frontend implementation
- **Fransisco:** PM, evidence-to-pitch consistency, presentation, and video

## License and medical disclaimer

Released under the [MIT License](LICENSE).

Jaga is an investigational research prototype, not a diagnostic device, cleared medical device, or substitute for confirmatory testing and clinical judgment. Do not use it to make real patient-care decisions.
