# Jaga Frontend — Developer Guide

Deep reference for working on `frontend`. The [README](README.md) is the overview; this file documents **how every part works, how to use it, and how to extend it**. Product/safety rules are canonical in [`../.agent/`](../.agent/) — this guide does not restate them, it points to them.

> **Golden invariants (do not break):** no patient input is ever persisted (no `localStorage`/`IndexedDB`/SW cache); services never call a real endpoint until `ARCH-1` is signed; Gema (cough+clinical) and Prisma (CXR) results are never fused; a failure never shows a stale or fabricated estimate; mandatory safety/referral copy is deterministic and human-reviewed, never machine-translated.

---

## Table of contents

1. [Stack & commands](#1-stack--commands)
2. [Mental model: the capture flow](#2-mental-model-the-capture-flow)
3. [Directory map](#3-directory-map)
4. [Routing & layout](#4-routing--layout)
5. [State management](#5-state-management)
6. [Types & the Go-mirror discipline](#6-types--the-go-mirror-discipline)
7. [Forms (RHF + Zod)](#7-forms-rhf--zod)
8. [The cough recorder (Web Audio + canvas)](#8-the-cough-recorder-web-audio--canvas)
9. [Services layer](#9-services-layer)
10. [Internationalization (EN/ID)](#10-internationalization-enid)
11. [Design tokens & styling](#11-design-tokens--styling)
12. [UI component catalog](#12-ui-component-catalog)
13. [Auth scaffolding](#13-auth-scaffolding)
14. [Error & loading strategy](#14-error--loading-strategy)
15. [Accessibility](#15-accessibility)
16. [How to extend](#16-how-to-extend)
17. [Known gotchas & cleanups](#17-known-gotchas--cleanups)

---

## 1. Stack & commands

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + CSS custom properties (OKLCH tokens) |
| Components | shadcn/ui CLI with the Radix/Nova configuration |
| Server state | TanStack Query (one future triage mutation) |
| Client state | Zustand (in-memory, no `persist`) |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| HTTP | Axios — **configured but unused** |
| Lint/format | ESLint (`next/core-web-vitals` + `next/typescript`), Prettier |

```bash
cd frontend
npm install
cp .env.example .env.local      # keep NEXT_PUBLIC_API_BASE_URL empty for now
npm run dev                     # http://localhost:3000
npm run typecheck               # tsc --noEmit  (CI gate)
npm run lint
npm run build                   # production build smoke test
```

Path alias: `@/*` → `src/*` (see `tsconfig.json`).

Shadcn/ui is configured through `components.json` with the Radix/Nova source. Its semantic variables map to Jaga's signed tokens; existing primitives remain in place until intentionally migrated. Use the shadcn CLI for new primitives, then adapt them to the existing component API and token contract without importing a generic theme.

---

## 2. Mental model: the capture flow

Jaga is **one single-session, in-memory flow**, not a multi-page app with accounts. The logical steps are fixed (design-guidelines §3); routes are a convenience over them:

```
gate (/) → clinical (/clinical) → coughs (/coughs) → review (/review) → [submit] → result (/result)
                                                                              │
                            retryable_error → back to review (no stale estimate)
                            terminal_error  → error screen (no estimate)
        reset / session-timeout → clears form, audio, result, request-id
```

Everything the user enters lives in memory (Zustand + React state) and is wiped on reset/timeout/success-ack. There is no dashboard, no list views, no persistence.

---

## 3. Directory map

```
src/
├── app/                    # App Router: routes + layout + globals.css + loading/error/not-found
├── layouts/                # FlowLayout — the single shared shell (header, stepper, footer)
├── features/               # feature-first screens (the real work lives here)
│   ├── gate/ clinical/ coughs/ review/ result/
├── components/
│   ├── ui/                 # token-styled primitives (Button, Card, Input, …)
│   ├── layout/             # Header, Footer, StepIndicator, LanguageSwitcher, Navbar/Sidebar*
│   └── common/             # ErrorBoundary, PrototypeBanner
├── hooks/                  # useSession, useLanguage, useT, useMediaQuery, useCoughRecorder
├── services/               # auth/patient/triage/cxr/health — all throw until ARCH-1
├── store/                  # Zustand: session, language, auth (mock)
├── context/                # AuthContext (wraps mock auth store)
├── guards/                 # ProtectedRoute, GuestRoute (placeholder)
├── providers/              # AppProviders (QueryClient + Auth + ErrorBoundary)
├── lib/                    # cn(), config, http (axios), query-client
├── types/                  # patient (from Go), triage/cxr (provisional), api, common
├── locales/                # en.json, id.json, messages.ts
├── mocks/                  # triage-result.mock.json, session.mock.json
├── utils/                  # format helpers
├── styles/                 # tokens.css (OKLCH design tokens)
└── assets/
```

`*` Navbar/Sidebar are operator-area scaffolding, **not** part of the public flow.

**Convention:** a `features/<x>/<x>-screen.tsx` is the screen composition; the matching `app/<x>/page.tsx` is a thin wrapper that drops it into `FlowLayout`. Keep route files thin; put logic in `features/`.

---

## 4. Routing & layout

- **`app/layout.tsx`** — root. Sets `<html lang="en">` (default English), mounts `AppProviders`, declares metadata/viewport (zoom allowed to 5× for a11y), links the PWA manifest.
- **`app/<step>/page.tsx`** — one per step, each renders `<FlowLayout step="…"><XScreen/></FlowLayout>`.
- **`layouts/flow-layout.tsx`** — the only layout. Single column capped at `max-w-flow` (32rem) on the cream canvas, with `Header` + `StepIndicator` + `Footer`. The flow deliberately never becomes a multi-column dashboard.
- **`app/loading.tsx` / `error.tsx` / `not-found.tsx`** — route-level UX (skeletons / neutral error / 404).

To add a step: see §16.

---

## 5. State management

Three Zustand stores, all **in-memory, no `persist`**:

| Store | File | Purpose | Read via |
|---|---|---|---|
| Session | `store/session.store.ts` | step, clinical values, cough attempt statuses, submit state, result, requestId | `useSession()` |
| Language | `store/language.store.ts` | active `Language` (`en`/`id`) + `toggle()` | `useLanguage()` |
| Auth (mock) | `store/auth.store.ts` | placeholder operator session | `useAuth()` / guards |

Key points:

- **`session.store.ts`** exposes `setStep`, `setClinical` (merges), `setSubmitState`, `setResult`, and `reset()`. `reset()` restores the initial state and a fresh 5-element `coughs` array — call it on reset, success acknowledgement, and session timeout (PRD-08).
- **No global library was strictly required** (design §3.2 says a `useReducer` step machine is acceptable). Zustand is used because it is requested and keeps the in-memory model in one place; the absence of `persist` is what preserves the no-storage safety rule.
- The future submit mutation belongs in **TanStack Query** (`lib/query-client.ts`), not in a store. Keep server state (the triage call) and client state (form/audio) separate.

---

## 6. Types & the Go-mirror discipline

`types/` is split by trust level:

- **`patient.ts` — SIGNED / live.** Mirrors `backend/go/internal/models/patient.go` exactly. Field names are **snake_case** because that is the wire contract (Go `json` tags). `PATIENT_BOUNDS` copies the numeric ranges from `backend/go/internal/validation/patient.go`. **If the Go validator changes, update this file and the Zod schema together.**
- **`triage.ts`, `cxr.ts` — PROVISIONAL.** The `POST /api/v1/triage` and `POST /api/v1/cxr` contracts are unsigned (Daffa `ARCH-1`). These shapes are inferred only so the UI compiles against mocks. Do not treat any field as final; do not invent URLs around them.
- **`api.ts`** — health/status shapes (mirror the live Go handlers) + `ApiNotConnectedError`.
- **`common.ts`** — `Language`, `FlowStep`, `SubmitState`, `SessionMeta`.

Barrel: `import { … } from "@/types"`.

---

## 7. Forms (RHF + Zod)

Example and template: **the clinical form** (`features/clinical/`).

- **`clinical-schema.ts`** — Zod schema whose bounds **mirror the Go validator**. `ClinicalFormValues = z.infer<typeof clinicalSchema>`.
- **`clinical-form.tsx`** — RHF (`useForm` + `zodResolver`), `mode: "onBlur"`. Submit writes to the session store and advances the step. **No API call.** Field labels are English inline for now and move to the locale bundle once `UX-1` signs paired strings.

Two patterns worth copying:

1. **Number inputs** use `register(name, { setValueAs })`. Required numbers map `"" → NaN` (so Zod rejects empty); optional vitals map `"" → null`.
2. **Radio / boolean inputs DO NOT use `setValueAs`.** React Hook Form **ignores `setValueAs` for radio and checkbox inputs** (it only applies to text/number). Coerce in the schema instead:

   ```ts
   const radioBoolean = z.preprocess(
     (v) => (v === "true" ? true : v === "false" ? false : v),
     z.boolean({ required_error: "Select one." }),
   );
   ```

   This was a real bug: yes/no radios submitted the string `"true"`, which failed `z.boolean()` and blocked the form even after selecting an answer. Keep radios as plain `register(name)` and let the schema coerce. Unselected stays `undefined` so "required" still works.

**When adding a clinical field:** add it to the Go model + validator (backend owner), then mirror it in `types/patient.ts`, `clinical-schema.ts`, and render it in `clinical-form.tsx`. Keep the bounds identical across all three.

---

## 8. The cough recorder (Web Audio + canvas)

Files: `hooks/use-cough-recorder.ts`, `features/coughs/cough-waveform.tsx`, `features/coughs/record-button.tsx`, `features/coughs/cough-recorder.tsx`, plus the `.record-orb` CSS in `app/globals.css`.

### Audio graph — `useCoughRecorder()`

- Returns `{ state, start, stop, analyserRef }`. `state`: `idle | requesting | recording | denied | error`.
- `start()` calls `getUserMedia({ audio: true })` → `AudioContext` → `MediaStreamSource` → `AnalyserNode` (`fftSize: 1024`). **Mic permission is requested only on `start()`** (design §3.4), i.e. when the user taps the orb.
- `stop()` stops all tracks, closes the context, nulls the refs. The same cleanup runs on unmount.
- `NotAllowedError` → `denied`; anything else → `error`.
- **Nothing is recorded to disk or uploaded.** The graph is live-analysis only; there is no `MediaRecorder`/Blob yet. When the triage contract is signed, capture the encoded audio here and hand it to `triageService` — do not persist it.

### Visualization — `CoughWaveform`

- A `<canvas>` styled `h-28 w-full`. The parent in `cough-recorder.tsx` uses **`-mx-4`** to cancel the `FlowLayout` column padding so the waveform is **full-bleed (no box)**.
- A `requestAnimationFrame` loop reads `analyser.getByteTimeDomainData`, computes RMS per frame, pushes it into a history ring, and draws rounded bars scrolling **right → left** (iOS Voice-Memos style). Canvas is sized by `devicePixelRatio` for crispness and re-sized on window resize.
- Bar color is read from the `--brand` CSS variable (falls back to `#024F46`).
- **Reduced motion:** if `prefers-reduced-motion: reduce`, it renders a single centered **level-meter** bar instead of the scrolling animation (design §7.2).

### Record orb — `RecordButton` + `.record-orb`

- Round 88px button with a radial brand gradient, a glow (`box-shadow`), a **breathing scale** animation idle, and a stronger **pulse ring** while recording (ChatGPT-voice style). Mic icon idle, stop icon while recording.
- All animation lives in `.record-orb` / `@keyframes` in `globals.css`. The global `prefers-reduced-motion` rule disables the animation automatically — the orb stays usable and on-brand without motion.
- `aria-pressed` reflects recording; the status line under it is an `aria-live="polite"` region.

> **Serving note:** `getUserMedia` requires a secure context — works on `localhost` (dev) and HTTPS only. It will silently fail on a plain-HTTP non-localhost host.

---

## 9. Services layer

`services/*.ts` are the single seam to the backend. **Every function currently throws `Error("API not connected yet")`** and contains **no endpoint URL**.

| Service | Future endpoint | Notes |
|---|---|---|
| `patientService.submitIntake` | `POST /api/v1/patient/intake` (live today) | validate/normalize, no persistence |
| `triageService.submitTriage` | `POST /api/v1/triage` (Gema, unsigned) | multipart: clinical + 5 audio |
| `cxrService.submitCxr` | `POST /api/v1/cxr` (Prisma, unsigned) | separate; never fused |
| `healthService.*` | `GET /health`, `/api/v1/status` | readiness checks |
| `authService.*` | n/a | placeholder; MVP has no accounts |

`lib/http.ts` is a preconfigured Axios instance (timeout, JSON accept) with **no real `baseURL`**. When wiring the API, set `NEXT_PUBLIC_API_BASE_URL`, add interceptors there, and switch one service from `throw` to a real call. See §16.

---

## 10. Internationalization (EN/ID)

- **Bundles:** `locales/en.json` (source-of-truth shape) and `locales/id.json` (same keys). Versioned via `_meta.version`.
- **Access:** `useT()` (`hooks/use-t.ts`) returns a `t("dot.path.key")` reader over the active language; falls back to the key if missing. Example: `t("result.band.higher")`.
- **Active language** comes from `language.store` via `useLanguage()`; the `LanguageSwitcher` toggles it without losing step or values.
- **Safety strings are intentionally English in `id.json`**, prefixed `PENDING UX-1`. Mandatory safety/referral copy (`prototype.banner`, `result.band.*`, `result.nextStep`) must be human-reviewed by `UX-1` and **never machine-translated**. Trivial UI words (`common.*`) are translated. A production build should fail on a missing/unreviewed mandatory key rather than render a raw key.

**To add a string:** add the key to both `en.json` and `id.json`, then read it with `t("…")`. Keep the two files structurally identical.

---

## 11. Design tokens & styling

- **`styles/tokens.css`** declares the OKLCH palette + font-role variables as CSS custom properties, ported verbatim from design-guidelines §4. **Change colors here, not in components.**
- **`tailwind.config.ts`** aliases those variables to Tailwind classes (`bg-brand`, `text-ink-muted`, `border-border-strong`, `bg-band-higher`, `max-w-flow`, radius `bar/control/frame`, etc.). Never hard-code hex in components — use the aliases.
- **`app/globals.css`** imports tokens and shadcn CSS utilities, maps shadcn semantic variables to Jaga's palette, applies the Tailwind layers, and sets the base body type/focus ring, reduced-motion rule, and `.record-orb` component styles.
- Fonts: self-hosted woff2 go in `public/fonts/` (EB Garamond serif, Figtree sans, Ioskeley mono) and wire to `--font-serif/sans/mono` via `next/font/local` or `@font-face`. Not committed yet — `font-serif/sans/mono` fall back to system fonts until then.

---

## 12. UI component catalog

`components/ui/` (barrel: `@/components/ui`). All token-styled, no business logic.

| Component | Notes |
|---|---|
| `Button` | variants `primary/secondary/tertiary/destructive`, `size md/lg` (≥44px), `loading`, `asChild` (clones a single child, e.g. `<Link>`) |
| `Card` + `CardHeader/Title/Body` | raised surface panel |
| `Input` | sunken well, `invalid` state, forwards ref |
| `Skeleton` / `Spinner` | loading; prefer skeletons for content |
| `Badge` | tones `neutral/info/warning/error/success` |
| `Table` + `THead/TBody/TR/TH/TD` | review summaries |
| `Dialog` / `Modal` | native `<dialog>` (`Modal` is an alias); used for reset confirmation |
| `EmptyState` | teaches the step, not "nothing here" |
| `ErrorState` | `role="alert"`, optional retry; never shows an estimate |

`components/layout/`: `Header`, `Footer`, `StepIndicator` (stepper with `aria-current`), `LanguageSwitcher` (pill toggle), `Navbar`/`Sidebar` (operator scaffolding). `components/common/`: `ErrorBoundary` (class component), `PrototypeBanner` (the locked research-prototype warning).

---

## 13. Auth scaffolding

**The public triage flow has no auth.** These exist only for a possible future operator/demo area and are wired to a mock store:

- `store/auth.store.ts` — mock user + `mockSignIn/mockSignOut`. No tokens parsed.
- `context/auth-context.tsx` — `AuthProvider` + `useAuth()`.
- `guards/protected-route.tsx`, `guards/guest-route.tsx` — render children based on `isAuthenticated`. No redirects.

Do not put the capture flow behind these. If real auth is ever needed, replace the mock store with a real session source and add redirects in the guards.

---

## 14. Error & loading strategy

- **Route loading:** `app/loading.tsx` (skeletons).
- **Route errors:** `app/error.tsx` (Next segment boundary) — neutral copy, retry, **never an estimate**.
- **App errors:** `components/common/error-boundary.tsx` wraps the tree in `AppProviders`.
- **Inline errors:** `ErrorState` (`role="alert"`).
- **Failure policy (design §12):** any failure (quality, timeout, contract mismatch, missing calibration) yields **no estimate**; retryable errors return to Review without a stale result; terminal errors show a technical screen. Encode these as `SubmitState` transitions when the API is wired.

---

## 15. Accessibility

- Body copy floor 16px; zoom allowed to 5×; targets ≥44px.
- Visible focus ring (2px + 1px offset) globally.
- `prefers-reduced-motion` disables animations (orb, transitions) and switches the waveform to a static level meter.
- Status/errors use `aria-live` / `role="alert"`; the stepper uses `aria-current`; the language toggle names its target language.
- Color is never the only signal (risk band is named in words; statuses carry text + icon).

---

## 16. How to extend

**Add a flow step**
1. `features/<step>/<step>-screen.tsx` (+ sub-components).
2. `app/<step>/page.tsx` → `<FlowLayout step="<step>"><XScreen/></FlowLayout>`.
3. Add the step to `FlowStep` (`types/common.ts`) and to `STEPS` in `components/layout/step-indicator.tsx`.

**Add a clinical field**
Backend owner adds it to the Go model + validator → mirror in `types/patient.ts` (+ `PATIENT_BOUNDS`) → add to `clinical-schema.ts` → render in `clinical-form.tsx`. Keep bounds identical in all three.

**Wire the API (after `ARCH-1` is signed)**
1. Pin the contract in `types/triage.ts` / `cxr.ts` (remove "provisional"); add `schema_version`.
2. Set `NEXT_PUBLIC_API_BASE_URL`; add version header + error-normalization interceptors in `lib/http.ts`.
3. Replace the `throw` in one `services/*.ts` with a real `http` call (start with `patientService.submitIntake` — the only live endpoint).
4. In `features/review/`, call it via a TanStack Query `useMutation`; map states/errors per design §3.3 into `SubmitState`.
5. Swap `mocks/triage-result.mock.json` in `features/result/` for the live result; keep the locked hierarchy and the unconditional banner + next-step panel.

**Add a UI primitive:** run `npx shadcn@latest add <component>` from `frontend/`, review the generated file against the signed token and accessibility rules, preserve any existing public API, and export it from the barrel when needed.

**Add a translated string:** add the key to `en.json` **and** `id.json`; read with `t("…")`.

---

## 17. Known gotchas & cleanups

- **RHF + radios:** never use `setValueAs` on radio/checkbox — coerce in Zod (see §7).
- **`getUserMedia` secure context:** localhost or HTTPS only.
- **Duplicate language state:** `session.store.ts` also has a `language` field, but i18n reads from `language.store.ts` via `useLanguage()`. The session copy is currently unused for rendering — pick one source before this drifts (recommend: drop `language` from the session store and keep `language.store`).
- **`useSession()` returns the whole store** (no selector) → components using it re-render on any session change. For hot paths, subscribe with a selector (`useSessionStore(s => s.x)`) instead.
- **Existing primitives predate shadcn initialization** — do not bulk-overwrite them. Use `npx shadcn@latest add <component> --dry-run` and `--diff` before updating a component, then preserve Jaga's token styling and current public API.
- **Fonts not yet self-hosted** — falls back to system fonts until woff2 files land in `public/fonts/`.
- **Provisional triage/cxr types** — anything importing them is compiling against a guess; re-verify after `ARCH-1`.
