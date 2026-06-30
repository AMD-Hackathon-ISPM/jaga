# Jaga · Design Guidelines

**Document type:** Design guidelines
**Audience:** Frontend, design, product, QA, and reviewers
**Status:** Active · signed visual direction (Billy, 2026-06-28). Implementable.
**Canonical for:** Frontend information architecture, visual system, interaction states, microcopy, localization, accessibility, responsive behavior, and motion
**Companion documents:** [`product-requirements.md`](product-requirements.md), [`project-architecture.md`](project-architecture.md), [`product-brief.md`](product-brief.md), [`implementation-plan.md`](implementation-plan.md)

## How to read this document

Sections labelled **Locked** are product and safety constraints and may not be redesigned away. The remaining sections were previously deferred to Billy owner-input blocks; they are now **signed** (2026-06-28) and Kei may implement against them. Exact API error codes and the final clinical field set still depend on Daffa's `ARCH-1` contract (due 2026-06-29) and the `UX-1` string contract; where a spec maps to those, it is marked **(pin on ARCH-1 / UX-1)** and uses placeholders until they sign. Kei may propose changes, but any change to behavior, safety, state, or contract must be accepted here before implementation.

## 1. Design direction

Jaga should feel **warm, calm, considered, and trustworthy** — closer to a well-made reading or note-taking tool ([mymind](https://mymind.com), [Wisprflow](https://wisprflow.ai)) than to a clinical dashboard or a "medical AI" product. Warm cream surfaces, a serif voice for headings and the result, generous space, and quiet, purposeful motion. The community health worker should feel guided and unhurried, and the participant should never feel alarmed or falsely reassured.

**Guiding principle — constraints are a budget, not a ceiling.** Low-end Android, intermittent network, and the accessibility floors (§9) define a *performance budget* and a *legibility floor*. They do **not** cap ambition or require a plain UI. The interface is fully expressive — warm cream, the serif voice, Ioskeley numerics, the live cough waveform, a real result reveal — *within* that budget (§5 performance budget). Reduced-motion and the 320 px layout are **graceful degradations of an already-beautiful default**, never a downgrade path.

**Avoid:** medical-theatre effects; glass/blur as decoration; alarmist or "scanning" risk visuals; decorative motion that conveys no state; the generic industrial-dashboard look; gradient text; over-rounded cards. The cream palette here is a deliberate, committed choice carried by the serif + Ioskeley pairing — not an accidental warm-tinted near-white.

## 2. Locked voice and safety language

- Plain, direct, respectful, and understandable to a non-specialist.
- Sentence case; no hype, emoji, celebratory result language, or exclamation marks.
- No em dashes in UI copy; use periods, colons, or parentheses (an AI-cadence tell, and it keeps safety strings plain).
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

The MVP covers eligibility/consent, supported clinical capture, five guided cough attempts, quality retry, review/submit, processing, result, limitations, language switching, errors, and reset. It is a **single-session, step-based flow** inside the Next.js PWA; all patient state is in memory only (PRD-08).

### 3.1 Screen map (ordered)

| # | Step (route) | Purpose | PRD |
|---|---|---|---|
| 0 | **Gate** (`/`) | Language, research-prototype framing, eligibility + consent acknowledgements | PRD-01 |
| 1 | **Clinical** (`/clinical`) | Supported clinical/demographic fields from the signed contract | PRD-02 |
| 2 | **Coughs** (`/coughs`) | Five guided attempts, sub-step `1/5…5/5`, in-context mic permission, per-attempt quality + retry | PRD-03/04 |
| 3 | **Review** (`/review`) | Summary of clinical inputs + five accepted coughs; single submit action | PRD-05 |
| 4 | **Processing** (overlay on Review) | `preparing → uploading → processing`; duplicate-submit guard | PRD-05 |
| 5 | **Result** (`/result`) | Locked result hierarchy (§8) + spectrogram/inspection | PRD-06 |
| 6 | **Limitations** (section within Result) | Model version, cohort, calibration status, limitations | PRD-06 |
| — | **Error / Reset** (overlay, any step) | Retryable + terminal errors; reset confirmation | PRD-05/08 |
| — | **Demo mode** (operator drawer) | Synthetic fixtures, success/failure paths, reset | PRD-11 |

Routes are a convenience; the **logical steps are fixed**. A back/refresh that would drop in-memory state is guarded by the reset confirmation.

### 3.2 State machine

```text
        ┌─────────────────────────── language switch (orthogonal) ───────────────────────────┐
        │  preserves current step + entered values; default = English; toggle = Bahasa ID     │
        ▼                                                                                      │
   [gate] ──acknowledge all──▶ [clinical] ──valid──▶ [coughs] ──5 accepted──▶ [review] ──submit──▶ [submitting]
     ▲  blocked: missing ack     ▲  back            ▲  per-attempt:               ▲  back            │
     │                           │                  │  record→review→            │                  ├─ preparing
     │                           │                  │  quality(accepted|         │                  ├─ uploading
     │                           │                  │  retryable|system_error)   │                  └─ processing
     │                           │                  │  retry targets one attempt │                       │
     │                           │                  └────────────────────────────┘            success ──▶ [result] ─▶ [limitations]
     │                           │                                                             retryable_error ─▶ [review] (retry, no stale estimate)
     │                           │                                                             terminal_error  ─▶ [error] (technical, no estimate)
     └──────────────── reset / session-timeout (clears form, audio, result, request-id) ◀──────────────────┘
```

- **Navigation/back:** back is allowed gate↔clinical↔coughs↔review and preserves entered values; forward past an incomplete step is blocked. Leaving `result` requires the reset confirmation. Browser back maps to step-back and is guarded.
- **Reset / session-timeout:** an idle timeout (default 15 min — **pin on ARCH-2**) shows a warning, then resets. Reset, success acknowledgement, and timeout each clear form, audio, result, and request-id state (PRD-08).
- **Language switch:** available on every step, never loses step or values (PRD-07/PRD-11). Default English; one-tap Bahasa Indonesia.
- **Offline / slow network:** before submit, local state is preserved and retry is offered; the UI never claims a queued secure upload (PRD-05). Progress never claims secure completion before server acknowledgement.

### 3.3 API state / error mapping **(pin on ARCH-1)**

The exact codes come from Daffa's `POST /api/v1/triage` contract; map to UI behavior as below.

| API state / code class | UI behavior |
|---|---|
| `preparing` / `uploading` / `processing` | Processing overlay with stage label; submit disabled; cancel returns to Review without losing state |
| `accepted` quality | Mark attempt accepted (success token, check + text); advance counter |
| `retryable` quality (+ reason code) | Inline error on the affected attempt only; show the matched reason-code guidance (PRD-04); other accepted coughs preserved |
| `system_error` quality | Page-level error; no estimate; retry |
| `success` result | Render Result (§8) |
| `retryable_error` (timeout/unavailable) | Return to Review; offer retry; never show a stale estimate |
| `terminal_error` (contract/version mismatch) | Terminal technical error screen; no estimate; do not coerce payload |
| missing model/calibration metadata | Unavailable-result error; withhold probability (PRD-06) |

### 3.4 Per-screen acceptance notes

- **Gate:** cannot reach Clinical without all acknowledgements; acknowledgements never preselected; copy never implies clearance/diagnosis.
- **Clinical:** renders only signed-contract fields; preserves values on field error; FE+BE share `schema_version`.
- **Coughs:** submit unavailable until five attempts captured and the quality gate accepts the contract minimum; no fixed "10-second" claim; mic permission requested only when capture begins.
- **Review:** shows exactly what will be sent; single submit; duplicate-submit prevented while active.
- **Result:** renders the locked hierarchy (§8); inspection can be hidden without changing the next step; an error never leaves a stale estimate visible.

## 4. Color system

### 4.1 Locked semantic rules

- Color never communicates risk, validity, completion, or error alone.
- A lower research estimate must not appear as a green clearance state.
- Error, warning, and success colors must remain distinguishable under common color-vision deficiencies.
- Text and interactive controls meet WCAG 2.2 AA contrast.
- Spectrogram palettes must be perceptually ordered and have a text alternative.

### 4.2 Theme decision

**Light only for MVP.** Field use under variable ambient light, screenshot-safe demo, and trust favor a single high-contrast light theme. Dark mode is `[V1]`.

### 4.3 Tokens (OKLCH)

Cream + deep-green palette (hex where the value is fixed, OKLCH where designed). Verified against WCAG 2.2 (computed sRGB → contrast; ratios in §4.6, reproducible via [`../design/contrast.mjs`](../design/contrast.mjs)).

| Token | Value | Role |
|---|---|---|
| `--canvas` | `#FFFFEB` | Page background (pale warm cream) |
| `--surface` | `#FFFFF7` | Cards, raised panels |
| `--surface-sunken` | `#F4F4DC` | Input wells, inset areas |
| `--border-subtle` | `#E8E8D0` | Decorative dividers (redundant, sub-3:1 allowed) |
| `--border-strong` | `oklch(0.62 0.020 95)` | **Essential** control/input/track outlines (≥3:1) |
| `--ink` | `#1A1A1A` | Primary body text (near-black) |
| `--ink-muted` | `oklch(0.49 0.018 95)` | Secondary text, labels, **placeholders** |
| `--brand` | `#024F46` | Deep pine green: links, accents, button fill (white text), focus base, success |
| `--focus` | `oklch(0.50 0.090 165)` | Focus ring (2 px + 1 px offset) |
| `--info` / `--info-surface` | `oklch(0.45 0.095 245)` / `oklch(0.95 0.030 240)` | Info text / tint |
| `--warning` / `--warning-surface` | `oklch(0.45 0.085 70)` / `oklch(0.95 0.040 85)` | Warning text / tint |
| `--error` / `--error-surface` | `oklch(0.47 0.155 28)` / `oklch(0.95 0.045 25)` | Error text / tint |
| `--error-strong` | `#B3261E` | Destructive button fill (white text) |
| `--success` | `#024F46` | Process completion (= the deep green), **not** clinical clearance |

`--success` reuses `--brand` and is reserved for **process** completion (a captured/accepted attempt), never for a risk band or "all clear" meaning. The deep green carries **actions only** and never appears on a risk band, so a lower estimate cannot read as clearance.

### 4.4 Risk-band presentation (Lower / Intermediate / Higher)

Bands use a dedicated **non-green, non-traffic-light** ramp, monotonic in lightness (so they remain distinguishable in grayscale / under color-vision deficiency), always reinforced by the **text label** and **position in a 3-segment outlined track** — color is never the sole signal.

| Band | OKLCH | Notes |
|---|---|---|
| Lower | `oklch(0.78 0.035 78)` | Light taupe. Identified by label + position + `--border-strong` track outline; fill is reinforcement only (exempt from the 3:1 fill rule). |
| Intermediate | `oklch(0.65 0.110 58)` | Ochre (3.30:1 graphical on canvas). |
| Higher | `oklch(0.49 0.140 36)` | Deep brick (6.61:1 graphical). Not red, not an alarm. |

The band is rendered as a quiet 3-segment track inside a card with the band **named in words** ("Lower / Intermediate / Higher model-estimated risk"), never as a large saturated fill or a warning siren. Lower carries **no** green, checkmark, or reassurance.

### 4.5 Spectrogram / inspection palette

Perceptually-ordered sequential map (monotonic lightness, warm, cohesive with the risk ramp), **never** a rainbow/jet map. Always paired with axis labels (Ioskeley) and a **text/data alternative** (§9); labelled "model inspection; not a clinical explanation."

```text
low energy  oklch(0.97 0.020 100)
            oklch(0.82 0.080 80)
            oklch(0.66 0.120 55)
            oklch(0.50 0.140 36)
high energy oklch(0.32 0.090 32)
```

### 4.6 Contrast evidence (WCAG 2.2)

Computed from the values above (reproducible via [`../design/contrast.mjs`](../design/contrast.mjs)). Body text ≥4.5:1, large/UI ≥3:1, placeholders ≥4.5:1.

| Pair | Ratio | Requirement |
|---|---|---|
| `ink` / `canvas` | 17.2 | body ✓ |
| `ink` / `surface` | 17.3 | body ✓ |
| `ink-muted` / `canvas` (incl. placeholder) | 6.18 | body/placeholder ✓ |
| `brand` / `canvas` (link/button text) | 9.39 | body ✓ |
| `white` / `brand` (button) | 9.50 | body ✓ |
| `white` / `error-strong` | 6.54 | body ✓ |
| `warning` / `warning-surface` | 6.55 | body ✓ |
| `error` / `error-surface` | 6.11 | body ✓ |
| `info` / `info-surface` | 6.40 | body ✓ |
| `border-strong` / `canvas` | 3.59 | non-text ✓ |
| `focus` / `canvas` | 5.66 | non-text ✓ |
| risk Intermediate / canvas | 3.30 | graphical ✓ |
| risk Higher / canvas | 6.61 | graphical ✓ |

**Prohibited combinations:** `ink-muted` on `--surface-sunken` for long body copy at <16 px; any text on a risk-band fill (labels sit on `--surface`); green on a risk/“result” surface; `--border-subtle` as the sole boundary of an essential control; placeholder text lighter than `--ink-muted`.

## 5. Typography and spacing

### 5.1 Locked constraints

- Use legible type at low-end Android rendering sizes.
- Body copy defaults to at least 16 CSS pixels.
- Numeric estimates show a clear label, unit/scale, and calibration status.
- Minimum touch target is 44×44 CSS pixels.
- Critical information remains readable at 320 CSS-pixel viewport width and 200% zoom.
- Supported browser floor is Chrome and Android WebView 111 or newer.

### 5.2 Font families (3 roles, contrast-axis pairing)

| Role | Family | Used for |
|---|---|---|
| **Display serif** | **EB Garamond** (OFL); fallback `ui-serif, Georgia, serif` | Screen titles, the band-name headline on the result. The warm "voice", used sparingly. |
| **Body / UI sans** | **Figtree** (OFL); fallback `ui-sans-serif, system-ui, sans-serif` | Forms, labels, buttons, instructions, errors, prose. The workhorse. |
| **Numerics mono** | **Ioskeley Mono** ([ahatem/IoskeleyMono](https://github.com/ahatem/IoskeleyMono), OFL 1.1), ligatures-off "NL" build; fallback `ui-monospace, "SF Mono", monospace` | Every number, unit, vital, percentage, the calibrated estimate, spectrogram axes, model/contract version, request id. Monospace = inherently tabular. |

Three families on a clean contrast axis (serif + humanist sans + geometric mono); none is a near-duplicate of another. Serif is a **voice**, not the system body — this keeps long Bahasa strings legible at 16 px on low-end Android.

### 5.3 Loading strategy (performance budget)

- Figtree and EB Garamond are delivered through `next/font/google` as build-time assets and exposed as `--font-sans` and `--font-serif`. This supersedes the earlier full-self-host requirement for those two families.
- Self-host only the Ioskeley Regular woff2 used for numerics through `next/font/local` as `--font-mono`; do not ship its full 10-weight × 3-width family.
- All three use `font-display: swap`; `next/font` handles preload and asset delivery.
- Always declare the system fallbacks above so first paint is legible before webfonts load.

### 5.4 Type scale (fixed rem, product register)

App screens use a **fixed rem** scale (not fluid) — consistent DPI, no shrink-in-sidebar surprises. The result headline is the one brand moment and may use a modest `clamp()`.

| Step | Size / line-height | Weight · family |
|---|---|---|
| Display (result band name) | `clamp(1.5rem, 1.3rem + 1vw, 2rem)` / 1.1 | 600 · serif, letter-spacing -0.03em |
| H1 (screen title) | `1.5rem` / 1.2 | 600 · serif |
| H2 (section) | `1.25rem` / 1.3 | 600 · serif |
| H3 / lead | `1.125rem` / 1.4 | 600 · sans |
| Body | `1rem` (16 px floor) / 1.55 | 400 · sans |
| Body-strong / label | `1rem` / 1.5 | 600 · sans |
| Small / hint | `0.875rem` / 1.45 | 400 · sans (only for non-critical hints; never below 16 px for safety/required copy) |
| Numeric (vitals, units) | `1rem`–`1.125rem` | 500 · Ioskeley, `font-variant-numeric: tabular-nums` |
| Estimate (result) | `1.05rem` inline, secondary to the band name and next step (**never hero-scale**) | 500 · Ioskeley, tabular |

Cap prose at 65–75 ch. `text-wrap: balance` on h1–h3; `text-wrap: pretty` on prose.

### 5.5 Spacing, radius, layout

- **Spacing scale (4 px base):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Vary it for rhythm; don't space everything equally.
- **Radius (one scale, no exceptions):** 8 px for controls, inputs, cards, panels, banners; 4 px for thin bars (the risk-track segments); 16 px for a device/phone frame only; pill (`9999px`) only for the language toggle and tags. No other radii. Match-and-refuse over-rounding.
- **Content widths:** single-column form/flow max `32rem` (512 px), centered, comfortable side padding (16 px mobile / 24 px+ desktop). Prose 65–75 ch.
- **Breakpoints:** 320 px floor (everything works), `sm` 480, `md` 768, `lg` 1024. Mobile-first; responsive behavior is structural, not fluid type.
- **Safe area:** respect `env(safe-area-inset-*)` for the sticky progress/footer on phones.
- **Density:** one primary action per step; generous touch spacing (≥44 px targets, ≥8 px between adjacent targets).
- **Shadows:** at most one soft, low shadow on raised cards (`0 1px 2px` + `0 4px 12px` at very low alpha). Never pair a 1 px border with a ≥16 px-blur shadow on the same element.

### 5.6 Layout examples

- **320 px (low-end Android):** single column; sticky top step indicator; one field/control group per row; the cough waveform fills width with side gutters; result headline wraps to ≤3 lines; the 3-segment risk track stacks above the named band.
- **Desktop:** the same single column centered at 512 px on `--canvas` with comfortable vertical rhythm; the flow does **not** become a multi-column dashboard. Optional right-aligned demo-mode drawer for the operator.

## 6. Component patterns

Required component families and their specs. Reuse the patterns already proven in [`../components/ClinicalCaptureForm.jsx`](../components/ClinicalCaptureForm.jsx) — 44 px targets, visible focus ring, radiogroup booleans, focusable error summary, bilingual `T` table, in-memory state — **re-skinned to the §4/§5 tokens**. Every interactive component defines all of: default, hover, focus, active, disabled, loading, error.

The routed flow uses official shadcn APIs from preset `b85jYWWKi8`: Button for actions and the recorder; Card/CardContent for surfaces; Field/FieldSet/Input/RadioGroup for clinical inputs; ToggleGroup for language; Alert/Empty/Badge/Skeleton/Spinner for feedback; Item for cough attempts; and Accordion for limitations. Shadcn semantic variables map to §4 tokens, and the application remains light-only without a theme provider.

| Family | Anatomy / variants | Key states & rules |
|---|---|---|
| **Buttons** | primary (brand fill, white), secondary (surface + border-strong), tertiary (text + brand), destructive (error-strong fill), recorder (record orb) | ≥44 px; focus ring `--focus`; disabled = reduced contrast + `aria-disabled`; loading composes `Spinner` + label with the action locked; one primary per step |
| **Form controls** | label + optional unit + required/optional marker + hint + input/radio/boolean + error | `--surface-sunken` well, `--border-strong` outline; error = `--error` text + `--error-surface` + `aria-invalid` + `aria-describedby`; preserve value on error; numeric inputs use Ioskeley + `inputMode` |
| **Language switcher** | pill toggle EN ⇄ ID | default EN; one tap; preserves step + values; `aria-label` states target language |
| **Step / progress indicator** | top stepper (Eligibility · Clinical · Coughs · Result) + cough sub-counter `n/5` | current step `aria-current`; numeric counter in Ioskeley; never blocks reading the step content |
| **Mic permission + recorder** | in-context permission card → recorder with live waveform (§7) | permission requested only at capture; denied → how-to-enable + retry; unsupported device → compatibility block |
| **Cough-attempt list** | 5 rows: index, status (recording/accepted/retryable), replay, replace | retryable error targets one row; accepted rows preserved; status has icon **and** text |
| **Connectivity / inference progress** | stage label (`preparing/uploading/processing`) + determinate-where-known bar | never claims secure completion before ack; cancel returns to Review |
| **Research-estimate card** | prototype banner → estimate (Ioskeley) + named band (§4.4) → mandatory next step → metadata | follows the locked order (§8); estimate shown only if calibrated; calibration status labelled |
| **Mandatory-next-step panel** | always-visible confirmatory-evaluation instruction | identical across all bands; never visually de-emphasized for Lower |
| **Model / version / limitations disclosure** | expandable section, open by default on Result | model + contract version + cohort + calibration + limitations in plain language; versions in Ioskeley |
| **Spectrogram / inspection figure** | figure + caption + accessible summary + "model inspection" label | perceptual palette (§4.5); text/data alternative; can be hidden without changing the next step |
| **Inline / page error + retry** | inline (field) and page (screen) variants + retry action | error summary is focusable (`tabIndex -1`, `role="alert"`); errors persist until resolved; summarized at submit |
| **Reset confirmation** | dialog: explains state will clear, confirm/cancel | uses native `<dialog>`/popover (escape stacking context); clears all local state on confirm |

- **Loading** uses **skeletons**, not centered spinners in content.
- **Empty/first-run** states teach the step (what to do, why), not "nothing here."
- **z-index scale (semantic):** base 0 · dropdown 100 · sticky 200 · backdrop 300 · modal 400 · toast 500 · tooltip 600. No arbitrary 999.
- **Reusable vs screen-specific:** buttons, form controls, language switcher, step indicator, error patterns, disclosure, reset dialog are reusable; recorder/waveform, attempt list, estimate card, next-step panel, spectrogram figure are screen-specific.

## 7. Guided cough interaction

### 7.1 Locked behavior

- One cough attempt at a time; progress 1/5 through 5/5.
- Microphone permission is requested in context.
- Each attempt can be replayed or replaced.
- Quality errors target the affected attempt and preserve other accepted attempts.
- The UI does not claim that phone capture reproduces CODA's clinic setup.
- Recording motion is functional and has a reduced-motion alternative.

### 7.2 Recorder + visualizer (signed)

- **Layout:** centered, full-width-with-gutters recorder on `--canvas`. Above it: the `n/5` counter (Ioskeley) and a one-line positioning guide. Below it: a single large record/stop control (≥44 px, brand) and, after capture, replay + replace.
- **Live waveform (the signature moment):** a **`<canvas>`** waveform that, during recording, scrolls **right → left** — new samples enter at the right and flow left, like iOS Voice Memos. Drive it from the analyser's time/RMS data, **downsampled** to a fixed bar count; draw with `requestAnimationFrame`, transform/opacity only, one canvas, no per-bar DOM. This is GPU-cheap and fits the performance budget (§5.3).
- **Color:** bars in `--brand` on `--surface`; the centered "now" edge slightly emphasized. No glow, no neon, no medical-scan aesthetic.
- **Per-attempt flow:** idle → recording (waveform live) → captured (waveform freezes to a static summary) → review (replay/replace) → on continue, run the quality gate → `accepted` advances the counter; `retryable` shows the reason-code guidance on **this** attempt only and preserves the others.
- **Reduced motion (`prefers-reduced-motion: reduce`):** replace the scrolling waveform with a **static level meter + numeric RMS readout** (Ioskeley) that updates without horizontal animation; capture/accept transitions are instant.
- **Text alternative:** the waveform/level has an accessible name and a live-region status ("Recording… input level adequate" / "captured, 1 of 5") so it is usable without sight; the captured summary exposes a short textual description.
- Never claim the phone reproduces CODA's controlled clinic capture.

## 8. Result reveal

### 8.1 Locked hierarchy

1. Research-prototype warning.
2. Model-estimated probability/band only when valid.
3. Mandatory confirmatory-evaluation next step.
4. Limitations and model/evaluation metadata.
5. Optional model-inspection visual.

The result reveal may be the signature motion moment, but motion cannot delay or obscure the next step. Lower bands must not celebrate. The inspection overlay must be labelled non-causal.

### 8.2 Result layout + motion (signed)

- **Layout (single column, 512 px):** prototype banner (always first, `--warning-surface`, calm) → the **band name as the serif headline** ("Higher model-estimated risk") with the calibrated estimate as a **small inline Ioskeley line beneath** (value + calibration status + model version; **never hero-scale**, so the number cannot out-rank the next step) → the named 3-segment risk track (§4.4) → the **mandatory next-step panel as the visually dominant block** (full-width, heaviest weight, serif sub-heading, ink body, equal prominence for every band) → the open-by-default limitations/metadata disclosure → the optional spectrogram/inspection figure last. The eye must land on the next-step panel, not the estimate.
- **Motion:** **one** reveal — the headline + estimate fade/translate up (`ease-out-quart`, ~360 ms). The **banner and next-step panel render immediately and unconditionally** (not gated behind the animation), so the safety content is never hidden if the transition is skipped, paused on a background tab, or rendered headless. Everything else uses 150–250 ms state transitions. Lower band uses the **same** calm reveal — no green, no checkmark, no celebratory motion.
- **Reduced motion:** crossfade or instant; no translate.
- **Screenshot-safe static state:** the fully-revealed layout is the default DOM; with motion disabled the result is complete and legible in a single still frame (for the demo recording).
- **Failure:** if calibration/metadata is missing, withhold the probability and show the unavailable-result error; the next-step panel and limitations still show.

## 9. Accessibility and field constraints

- Keyboard-operable flow with visible focus (`--focus`, 2 px ring + 1 px offset).
- Programmatic labels, descriptions, errors, progress, and status announcements.
- Text alternatives for waveform, spectrogram, and inspection visual.
- No automatic focus changes that disorient screen-reader users (the error summary is the one deliberate, announced focus move).
- Reduced motion replaces animation with immediate state changes.
- Errors remain until resolved and are summarized at submission.
- Slow-network progress never claims secure completion before server acknowledgement.
- Large touch targets, concise copy, and one primary action per step.
- Test on a small low-end Android viewport and one desktop viewport, plus 200% zoom and 320 px width.

## 10. Localization

- **English is the default field language; Bahasa Indonesia is always available via a one-tap toggle.** Both are complete, reviewed, and equivalent. Bahasa is featured in the result/limitations moment to keep the Indonesia-context story. *(This reflects the 2026-06-28 change to PRD-07; the earlier "Bahasa default" is superseded.)*
- Strings are keyed and versioned; no text is hard-coded inside visual assets.
- **Size every layout for the longer of the two languages** (Indonesian generally runs longer) so safety meaning is never truncated.
- Dates, times, decimals, percentages, and units are locale-aware.
- Mandatory safety and referral copy is deterministic, human-reviewed, and never supplied by Fireworks at runtime.
- A missing mandatory translation fails the frontend test/build contract rather than displaying a raw key.

## 11. Redesign brief (reference)

The brief used to produce this system, preserved for future revisions:

```text
Design Jaga's frontend design system and MVP flow while preserving every locked rule in
.agent/product-requirements.md and .agent/design-guidelines.md.

Product context:
- Investigational TB triage research prototype for symptomatic adults 18+.
- Five guided cough attempts plus model-supported clinical inputs.
- Every participant receives confirmatory-evaluation guidance regardless of score.
- English default, Bahasa Indonesia complete via toggle.
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

Do not alter product behavior, safety wording, cohort scope, model semantics, API fields, or
privacy constraints. Flag any requested design that conflicts with a locked requirement.
```

## 12. Design completion checklist

- [x] Billy owner-input blocks replaced with signed specifications (2026-06-28).
- [x] Screen map covers PRD-01 through PRD-08 and PRD-11 through PRD-12.
- [x] Tokens have exact OKLCH values and computed contrast evidence (§4.6).
- [x] Components include all interaction, error, loading, and accessibility states (§6).
- [x] Result copy and visuals cannot imply diagnosis or clearance (§8, §2).
- [x] Five-cough quality retry is fully specified (§7).
- [x] Responsive behavior is defined for 320 px mobile and desktop (§5.6).
- [x] Reduced motion and text alternatives are defined (§7.2, §8.2, §9).
- [ ] Bahasa Indonesia and English string tables reviewed — **pending `UX-1`**.
- [ ] API state/error codes pinned — **pending Daffa `ARCH-1` (2026-06-29)**; mapping placeholder in §3.3.
- [x] Kei can implement layout, state, component, and motion behavior without invention (string + API specifics excepted above).
