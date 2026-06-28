# Jaga · Design Guidelines

**Document type:** Design guidelines
**Audience:** Frontend, design, product, QA, and reviewers
**Status:** Active · provisional visual direction; Billy inputs required
**Owner:** Billy
**Updated:** 2026-06-28
**Canonical for:** Frontend information architecture, visual system, interaction states, microcopy, localization, accessibility, responsive behavior, and motion
**Companion documents:** [`product-requirements.md`](product-requirements.md), [`project-architecture.md`](project-architecture.md), [`product-brief.md`](product-brief.md), [`implementation-plan.md`](implementation-plan.md)

## How to read this document

Sections labelled **Locked** are product and safety constraints and may not be redesigned away. Visible Billy blocks intentionally defer visual/frontend choices until 30 June. Kei implements only after the relevant block is replaced with a signed specification.

## 1. Provisional direction

Until Billy completes the redesign blocks, the active baseline is calm, trustworthy, clinical-but-warm, field-first, and Bahasa Indonesia-first. Use a light, high-contrast interface with restrained teal/green brand cues. This is a temporary implementation guardrail, not the final design system.

The experience should feel dependable under pressure rather than futuristic, playful, or diagnostic. Avoid medical-theatre effects, excessive glass/blur, alarmist risk visuals, and decorative motion.

## 2. Locked voice and safety language

- Plain, direct, respectful, and understandable to a non-specialist.
- Sentence case; no hype, emoji, celebratory result language, or exclamation marks.
- Say **research estimate**, **model-estimated risk**, **follow-up urgency**, and **confirmatory evaluation**.
- Never say diagnosis, negative, positive, healthy, cleared, TB detected, TB absent, safe, or no test needed.
- Every result band carries the same confirmatory-evaluation requirement.
- Call spectrograms and saliency/attention **model inspection**, never reasoning or a clinical explanation.
- State the cohort and limitations without hiding them behind a tooltip.

### 2.1 Locked result copy concepts

| Context | Required meaning |
|---|---|
| Prototype banner | Jaga is a research prototype and does not diagnose or rule out TB |
| Next step | This person should receive confirmatory TB evaluation regardless of the estimate |
| Lower band | Lower relative model estimate does not exclude TB |
| Higher band | Prioritize follow-up; this remains a research estimate, not a diagnosis |
| Inspection | Shows patterns used by the model; does not explain disease or clinical cause |
| Failure | No result was produced; retry or use the standard clinical pathway |

Billy owns the final paired Bahasa Indonesia/English strings in `UX-1`; meaning may not change.

## 3. Screen and state architecture

The MVP must cover eligibility/consent, supported clinical capture, five guided cough attempts, quality retry, review/submit, processing, result, limitations, language switching, errors, and reset.

> **OWNER INPUT REQUIRED — Billy — due 2026-06-30**
>
> **Blocks:** `UX-0`, `FE-0` through `FE-5`, and Kei's screen implementation
>
> **Required output:** provide the ordered screen map; navigation/back rules; progress behavior; state-machine diagram; reset/session-timeout behavior; language-switch behavior; loading/offline/retry/terminal-error states; safe demo mode; API state/error mapping; acceptance notes for each screen
>
> **Affected documents:** `design-guidelines.md`, frontend section of `project-architecture.md`, `implementation-plan.md`, PRD only if product behavior changes
>
> **Completion rule:** replace this block with the signed screen/state specification and append the decision to `log.md`

## 4. Color system

### 4.1 Locked semantic rules

- Color never communicates risk, validity, completion, or error alone.
- A lower research estimate must not appear as a green clearance state.
- Error, warning, and success colors must remain distinguishable under common color-vision deficiencies.
- Text and interactive controls meet WCAG 2.2 AA contrast.
- Spectrogram palettes must be perceptually ordered and have a text alternative.

> **OWNER INPUT REQUIRED — Billy — due 2026-06-30**
>
> **Blocks:** design-token implementation and visual QA
>
> **Required output:** define named tokens and exact values for canvas/surfaces/borders/text/brand/focus/info/warning/error/success; define risk-band presentation without clinical clearance semantics; define spectrogram palette; provide light/dark decision; document contrast results and prohibited combinations
>
> **Affected documents:** `design-guidelines.md`, frontend tokens, visual test checklist
>
> **Completion rule:** replace this block with token tables and contrast evidence before component styling begins

## 5. Typography and spacing

### 5.1 Locked constraints

- Use legible type at low-end Android rendering sizes.
- Body copy defaults to at least 16 CSS pixels.
- Numeric estimates show a clear label, unit/scale, and calibration status.
- Minimum touch target is 44×44 CSS pixels.
- Critical information remains readable at 320 CSS-pixel viewport width and 200% zoom.

> **OWNER INPUT REQUIRED — Billy — due 2026-06-30**
>
> **Blocks:** layout/component implementation and responsive QA
>
> **Required output:** define font families and loading strategy; type scale/line heights/weights; spacing and radius scales; content widths; breakpoints; safe-area behavior; density rules; numeric/tabular styles; 320px and desktop layout examples
>
> **Affected documents:** `design-guidelines.md`, frontend tokens and layout primitives
>
> **Completion rule:** replace this block with exact token tables and responsive rules before Kei styles feature screens

## 6. Component patterns

Required component families:

- primary, secondary, tertiary, and destructive buttons;
- form controls with label, hint, unit, required/optional, error, and disabled states;
- language switcher;
- step/progress indicator;
- microphone permission prompt and recorder;
- cough-attempt list with replay/replace/quality status;
- connectivity and inference progress;
- research estimate card and mandatory-next-step panel;
- model/version/limitations disclosure;
- spectrogram/inspection figure with accessible summary;
- inline error, page error, and retry affordance;
- reset confirmation.

> **OWNER INPUT REQUIRED — Billy — due 2026-06-30**
>
> **Blocks:** `FE-1` through `FE-5` and component QA
>
> **Required output:** define component anatomy, variants, dimensions, focus/hover/pressed/disabled/loading/error states, copy limits, icon rules, ARIA behavior, and API mapping for every component family; identify reusable versus screen-specific components
>
> **Affected documents:** `design-guidelines.md`, frontend architecture, `implementation-plan.md`
>
> **Completion rule:** replace this block with component specifications before Kei completes feature UI

## 7. Guided cough interaction

### 7.1 Locked behavior

- One cough attempt at a time; progress 1/5 through 5/5.
- Microphone permission is requested in context.
- Each attempt can be replayed or replaced.
- Quality errors target the affected attempt and preserve other accepted attempts.
- The UI does not claim that phone capture reproduces CODA's clinic setup.
- Recording motion is functional and has a reduced-motion alternative.

Billy specifies the final recorder layout and animation in the screen/component blocks. Daffa defines quality reason codes and technical limits.

## 8. Result reveal

### 8.1 Locked hierarchy

1. Research-prototype warning.
2. Model-estimated probability/band only when valid.
3. Mandatory confirmatory-evaluation next step.
4. Limitations and model/evaluation metadata.
5. Optional model-inspection visual.

The result reveal may be the signature motion moment, but motion cannot delay or obscure the next step. Lower bands must not celebrate. The inspection overlay must be labelled non-causal.

> **OWNER INPUT REQUIRED — Billy — due 2026-06-30**
>
> **Blocks:** `FE-5`, demo choreography, and motion QA
>
> **Required output:** define result layout across widths; band visual treatment; next-step prominence; metadata/limitations disclosure; inspection figure; entry/exit durations and easing; loading-to-result transition; reduced-motion behavior; screenshot-safe static state
>
> **Affected documents:** `design-guidelines.md`, frontend architecture, demo section of `implementation-plan.md`
>
> **Completion rule:** replace this block with the signed result and motion specification before result implementation is accepted

## 9. Accessibility and field constraints

- Keyboard-operable flow with visible focus.
- Programmatic labels, descriptions, errors, progress, and status announcements.
- Text alternatives for waveform, spectrogram, and inspection visual.
- No automatic focus changes that disorient screen-reader users.
- Reduced motion replaces animation with immediate state changes.
- Errors remain until resolved and are summarized at submission.
- Slow-network progress never claims secure completion before server acknowledgement.
- Large touch targets, concise copy, and one primary action per step.
- Test on a small low-end Android viewport and one desktop viewport.

## 10. Localization

- Bahasa Indonesia is default; English is complete and equivalent.
- Strings are keyed and versioned; no text is hard-coded inside visual assets.
- Layout supports longer translated labels without truncating safety meaning.
- Dates, times, decimals, percentages, and units are locale-aware.
- Mandatory safety and referral copy is deterministic, human-reviewed, and never supplied by Fireworks.

> **OWNER INPUT REQUIRED — Billy — due 2026-06-30**
>
> **Blocks:** `UX-1`, all frontend acceptance, and demo recording
>
> **Required output:** provide the complete Bahasa Indonesia/English string table for eligibility, clinical capture, permissions, quality reasons, submission, results, limitations, errors, referral, reset, and synthetic-demo labels; record reviewer and review date
>
> **Affected documents:** `design-guidelines.md`, frontend locale files, `implementation-plan.md`
>
> **Completion rule:** replace this block with the reviewed string contract; no mandatory copy may be machine-generated at runtime

## 11. Redesign prompt for Billy

Use this prompt when completing the owner blocks:

```text
Redesign Jaga's frontend design system and MVP flow while preserving every locked rule in .agent/product-requirements.md and .agent/design-guidelines.md.

Product context:
- Investigational TB triage research prototype for symptomatic adults 18+.
- Five guided cough attempts plus model-supported clinical inputs.
- Every participant receives confirmatory-evaluation guidance regardless of score.
- Bahasa Indonesia default, English complete.
- Low-end Android and intermittent-network use.

Provide:
1. Screen map and state machine, including every failure/retry/reset state.
2. Exact design tokens: color, typography, spacing, radius, shadow, breakpoints, and motion.
3. Component anatomy and all interaction/accessibility states.
4. Mobile and desktop layouts for capture and result screens.
5. Result-risk treatment that never communicates clinical clearance.
6. Spectrogram/model-inspection treatment labelled non-causal.
7. Reduced-motion, keyboard, screen-reader, contrast, 320px, and localization rules.
8. A concise implementation checklist for Kei.

Do not alter product behavior, safety wording, cohort scope, model semantics, API fields, or privacy constraints. Flag any requested design that conflicts with a locked requirement.
```

## 12. Design completion checklist

- [ ] All Billy owner-input blocks are replaced with signed specifications.
- [ ] Screen map covers PRD-01 through PRD-08 and PRD-11 through PRD-12.
- [ ] Tokens have exact values and contrast evidence.
- [ ] Components include all interaction, error, loading, and accessibility states.
- [ ] Result copy and visuals cannot imply diagnosis or clearance.
- [ ] Five-cough quality retry is fully specified.
- [ ] Bahasa Indonesia and English string tables are reviewed.
- [ ] Responsive behavior is defined for 320px mobile and desktop.
- [ ] Reduced motion and text alternatives are defined.
- [ ] Kei can implement without inventing layout, state, copy, or component behavior.
