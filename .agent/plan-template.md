# Planning Template and Depth Standard

**Document type:** Reference template
**Audience:** Authors and reviewers of Jaga planning documents
**Status:** Active reference; not a product specification
**Owner:** Billy
**Updated:** 2026-06-28
**Canonical for:** Required document depth, evidence handling, owner blocks, and acceptance criteria
**Companion documents:** [`../AGENT.md`](../AGENT.md), [`evidence-register.md`](evidence-register.md), [`implementation-plan.md`](implementation-plan.md)

## How to read this document

Use this template when creating or materially revising a planning document. It sets a depth standard; it does not override Jaga's current scope or sources of truth. Omit a section only when it is demonstrably irrelevant, and state why in the document's “How to read” section.

## 1. Required metadata

Every canonical planning document begins with these bold-label fields, one per line (not a table):

```md
**Document type:** The document's function
**Audience:** Who uses it to make or implement decisions
**Status:** Draft, Owner input required, Approved, Active, or Historical
**Owner:** One accountable person
**Updated:** ISO date: `YYYY-MM-DD`
**Canonical for:** The decisions this document controls
**Companion documents:** Relative Markdown links
```

Follow the fields with `## How to read this document`, including precedence, unresolved owner input, and whether historical text appears.

## 2. Scope labels

Every requirement, feature, interface, and ticket must use one label:

- `[MVP]` — required for the official submission.
- `[V1]` — planned after the hackathon.
- `[Stretch]` — attempted only after the MVP definition of done is met.
- `[OUT]` — explicitly excluded.

Do not describe a `[Stretch]` or `[OUT]` capability as part of the MVP pitch, architecture, or acceptance criteria.

## 3. Evidence rules

1. Record every public factual claim in [`evidence-register.md`](evidence-register.md) before repeating it elsewhere.
2. Link to a primary source where one exists; record the publication date, access date, and the exact claim supported.
3. Distinguish published results from results reproduced by this project.
4. Distinguish controlled-access data from public downloads and document access conditions.
5. Do not use a market estimate, benchmark, clinical claim, or event requirement without a resolved evidence entry.
6. Private dataset observations and project model results require an owner block until the owner supplies a reproducible artifact.
7. If evidence changes, update the register first, then every dependent document in the same change.

## 4. Owner input contract

Use an owner block only when the decision depends on named expertise or unavailable private evidence. Never use generic placeholder text.

```md
> **OWNER INPUT REQUIRED — [Owner] — due YYYY-MM-DD**
>
>
> **Blocks:** [ticket, interface, or decision that cannot proceed]
>
>
> **Required output:** [specific schema, thresholds, artifact, state map, or decision]
>
>
> **Affected documents:** `path/to/document.md`, `path/to/other.md`
>
>
> **Completion rule:** [observable condition that closes the block]
```

For Jaga, backend, model, API/data-schema, evaluation, serving, security, and observability blocks belong to Daffa. Frontend architecture, screen/state maps, design tokens, responsive behavior, and motion blocks belong to Billy. PM schedule, submission completeness, and pitch-asset blocks belong to Fransisco.

## 5. Contradiction handling

Do not silently remove a meaningful historical decision. Preserve it in [`context-dump.md`](context-dump.md) and place this comment immediately after it:

```md
> **SUPERSEDED — current decision:** [replacement decision, reason, and link to the canonical document]
```

For contradictions between current documents:

1. stop implementation that depends on the conflict;
2. apply the source precedence in [`../AGENT.md`](../AGENT.md);
3. resolve product behavior and medical safety rather than leaving them as placeholders;
4. update all affected documents in one change; and
5. add a dated entry to [`log.md`](log.md).

## 6. Product brief structure

The brief must include:

1. one-sentence product definition;
2. quantified, cited problem and affected population;
3. user, customer, buyer, and operator distinctions;
4. `[MVP]`, `[V1]`, `[Stretch]`, and `[OUT]` matrix;
5. research-to-product boundary;
6. alternatives and competition;
7. event-criterion mapping;
8. timed demo narrative; and
9. closing thesis.

Each section ends in a decision, boundary, or owner action.

## 7. Product requirement structure

Each requirement includes:

- stable requirement ID;
- scope label;
- actor and input;
- preconditions;
- behavior and validation;
- loading, success, empty, rejected, and failure states where applicable;
- safety and localization copy requirements;
- privacy and retention behavior;
- test fixtures; and
- measurable acceptance criteria.

Product requirements may not defer medical safety, cohort limits, eligibility, or user-facing risk meaning to implementation.

## 8. Architecture structure

The architecture must specify:

1. system boundary and trust boundary;
2. frontend, backend, model, and infrastructure responsibilities;
3. request, response, validation, quality-gate, error, privacy, and model-version contracts;
4. storage and deletion behavior;
5. security controls and threat assumptions;
6. observability and prohibited logging;
7. deployment and container topology;
8. planned repository structure;
9. dependency and failure behavior; and
10. named owner blocks for unresolved contracts.

Architecture diagrams support the text but do not replace contracts or acceptance criteria.

## 9. Design guide structure

The design guide must define:

1. screen sequence and frontend state machine;
2. design tokens and semantic color roles;
3. typography and spacing rules;
4. component variants and states;
5. responsive behavior;
6. accessibility behavior;
7. motion rules and reduced-motion alternatives;
8. localization and text-expansion rules;
9. safety microcopy; and
10. API-to-UI state mapping.

Visual direction is incomplete until every capture and result state has an implementation rule.

## 10. Implementation ticket structure

Every implementation ticket includes:

| Field | Requirement |
|---|---|
| ID | Stable domain prefix and number |
| Scope | `[MVP]`, `[V1]`, `[Stretch]`, or `[OUT]` |
| Owner | One accountable implementer |
| Dependencies | Ticket IDs or `None` |
| Affected interfaces | Requirements, routes, schemas, screens, or artifacts |
| Deliverable | Concrete output |
| Acceptance criteria | Observable pass/fail conditions |
| Fallback | Reduced behavior if the primary path fails |

Daily milestones must name the tickets that close that day. Merge order must follow contract dependencies and identify shared-file ownership.

## 11. Acceptance-criteria rules

Acceptance criteria must be observable and testable. Avoid “works,” “is polished,” “is accurate,” or “is accessible” without a measurable condition.

A complete criterion states:

- the starting state or fixture;
- the user or system action;
- the expected visible or machine-readable result;
- the failure behavior; and
- any performance, accessibility, safety, or retention constraint.

Example:

> Given a fixture with four accepted coughs, when the operator attempts submission, the client prevents the request, identifies the missing fifth cough, preserves the four accepted recordings, and exposes the error through visible text and an ARIA live region.

## 12. Traceability requirement

Every `[MVP]` feature must form this chain:

`Evidence or product decision → PRD requirement → architecture/interface → implementation ticket → acceptance criterion → verification result`

A document set is not development-ready if any link is missing or if one ticket implements behavior that has no approved requirement.

## 13. Review checklist

- [ ] Metadata and “How to read” section are present.
- [ ] Scope labels are explicit and consistent.
- [ ] Public claims resolve to the evidence register.
- [ ] Historical contradictions are marked `SUPERSEDED`.
- [ ] Every placeholder is a complete, named owner block.
- [ ] Product and medical safety decisions are resolved, not placeholders.
- [ ] Interfaces define success, rejection, and failure behavior.
- [ ] Tickets have owners, dependencies, affected interfaces, acceptance criteria, and fallbacks.
- [ ] Every MVP requirement has an end-to-end traceability chain.
- [ ] Timeline dates distinguish preparation from the official event.
- [ ] Local Markdown links resolve.
- [ ] `git diff --check` passes.
