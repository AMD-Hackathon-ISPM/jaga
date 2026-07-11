# AGENTS.md

Guidance for Codex in this repository. (Codex loads this file automatically.)

**Read [`AGENT.md`](AGENT.md) first** — it is the canonical entry point and document router. This file only points there and holds the maintenance ritual; it deliberately does not restate scope, constraints, or status, so it cannot drift from the source docs.

- **Facts / sources:** [`.agent/evidence-register.md`](.agent/evidence-register.md) is the single source of truth. No invented or unsourced stats.
- **Rationale / ruled-out ideas:** [`.agent/context-dump.md`](.agent/context-dump.md) (Decisions Index §16, rejected/Set-Aside §17). Don't re-propose ruled-out ideas.
- **Behavior & safety:** [`.agent/product-requirements.md`](.agent/product-requirements.md). **Triage, not diagnosis** — investigational research prototype.

## Keeping docs current (maintenance ritual — part of "done")

- Decision made/changed → update [`.agent/context-dump.md`](.agent/context-dump.md) (Decisions Index §16, or Set-Aside §17) **and** append a dated line to [`.agent/log.md`](.agent/log.md).
- New/changed fact → update [`.agent/evidence-register.md`](.agent/evidence-register.md).
- Scope changed → update the scope tags in [`.agent/product-requirements.md`](.agent/product-requirements.md).
- Edited any `.agent/` doc → bump its **Updated** date.
