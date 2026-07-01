# Jaga Frontend — Developer Guide

Deep reference for working on `frontend`. The [README](README.md) is the overview; this file documents **how every part works, how to use it, and how to extend it**. Product/safety rules are canonical in [`../.agent/`](../.agent/) — this guide does not restate them, it points to them.

> **Golden invariants (do not break):** no patient input is ever persisted (no `localStorage`/`IndexedDB`/SW cache); live mode calls only the Go gateway contracts reviewed under `ARCH-1`; Gema (cough+clinical) and Prisma (CXR) results are never fused; a failure never shows a stale or fabricated estimate; mandatory safety/referral copy is deterministic and human-reviewed, never machine-translated.

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
| Styling | Tailwind CSS 4 + CSS custom properties (OKLCH tokens) |
| Components | shadcn/ui CLI with Radix/Nova preset `b85jYWWKi8` |
| Server state | TanStack Query mutations for intake, Gema, and Prisma |
| Client state | Zustand (in-memory, no `persist`) |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| HTTP | Axios behind fixture/live service factories |
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

Shadcn/ui is configured through `components.json` with Radix/Nova preset `b85jYWWKi8`. Its semantic variables map to Jaga's signed tokens. The five routed surfaces and shared layout use official APIs; Table, Dialog, and Modal remain unused legacy primitives. The application is light-only and has no theme provider.

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
├── services/               # status, patient, Gema, Prisma, assistant adapters
├── store/                  # in-memory session, Prisma, language, auth
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
- Submit mutations belong in **TanStack Query** (`lib/query-client.ts`), not in a store. Stores keep only transient inputs and the current session result.

---

## 6. Types & the Go-mirror discipline

`types/` is split by trust level:

- **`patient.ts` — SIGNED / live.** Mirrors `backend/go/internal/models/patient.go` exactly. Field names are **snake_case** because that is the wire contract (Go `json` tags). `PATIENT_BOUNDS` copies the numeric ranges from `backend/go/internal/validation/patient.go`. **If the Go validator changes, update this file and the Zod schema together.**
- **`triage.ts`, `cxr.ts` — frontend integration proposal.** Runtime Zod schemas and [`../contracts/openapi/jaga-v1.yaml`](../contracts/openapi/jaga-v1.yaml) define the backend handoff pending Daffa's `ARCH-1` sign-off.
- **`api.ts`** — health/status shapes (mirror the live Go handlers) + `ApiNotConnectedError`.
- **`common.ts`** — `Language`, `FlowStep`, `SubmitState`, `SessionMeta`.

Barrel: `import { … } from "@/types"`.

---

## 7. Forms (RHF + Zod)

Example and template: **the clinical form** (`features/clinical/`).

- **`clinical-schema.ts`** — Zod schema whose bounds **mirror the Go validator**. `ClinicalFormValues = z.infer<typeof clinicalSchema>`.
- **`clinical-form.tsx`** — RHF (`useForm` + `zodResolver`), `mode: "onBlur"`. Submit validates through `patientService`, maps backend field errors into RHF, stores normalized values, and advances the step.

Two patterns worth copying:

1. **Number inputs** use `register(name, { setValueAs })`. Required numbers map `"" → NaN` (so Zod rejects empty); optional vitals map `"" → null`.
2. **Radio / boolean inputs use `Controller` with shadcn `RadioGroup`.** Convert the selected string in `onValueChange` so RHF stores a real boolean before Zod runs:

   ```ts
   onValueChange={(value) => field.onChange(value === "true")}
   ```

   The schema remains `z.boolean({ required_error: "Select one." })`; unselected stays `undefined`, so required validation still works. `ClinicalFormValues` and its snake_case field names are unchanged.

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

- **`styles/tokens.css`** declares the OKLCH palette as CSS custom properties, ported verbatim from design-guidelines §4. **Change colors here, not in components.**
- **`tailwind.config.ts`** aliases those variables to Tailwind classes (`bg-brand`, `text-ink-muted`, `border-border-strong`, `bg-band-higher`, `max-w-flow`, radius `bar/control/frame`, etc.). Never hard-code hex in components — use the aliases.
- **`app/globals.css`** imports Tailwind 4 through the compatibility `@config` bridge, imports shadcn utilities, maps semantic variables to Jaga's palette, and sets base type/focus, reduced-motion, and recorder styles.
- Fonts: `app/layout.tsx` loads Figtree and EB Garamond with `next/font/google` as `--font-sans`/`--font-serif`, and self-hosts `public/fonts/IoskeleyMono-Regular.woff2` with `next/font/local` as `--font-mono`. Serif and heading tracking is `-0.03em`.

---

## 12. UI component catalog

`components/ui/` (barrel: `@/components/ui`). All token-styled, no business logic.

| Component | Notes |
|---|---|
| `Button` | variants `primary/secondary/tertiary/destructive/recorder`, `size md/lg` (≥44px), Radix `Slot` via `asChild`; compose `Spinner` for pending actions |
| `Card` + `CardHeader/Title/Description/Content/Footer` | raised surface composition |
| `Field` / `FieldSet` + `Input` / `RadioGroup` | clinical forms; invalid controls use `aria-invalid` |
| `ToggleGroup` | EN/ID navigation toggle |
| `Alert` / `Empty` | prototype/error feedback and empty guidance |
| `Skeleton` / `Spinner` | loading; prefer skeletons for content |
| `Badge` | variants `neutral/info/warning/error/success` |
| `Item` / `Accordion` | cough attempt rows and result limitations |
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

**Connect a backend implementation**
1. Review and sign `contracts/openapi/jaga-v1.yaml`; update runtime Zod schemas and fixtures in the same change if the contract moves.
2. Implement all public paths behind the Go gateway, including capability readiness and structured errors.
3. Put Fireworks/Featherless credentials, model selection, system prompts, and safety enforcement on the server.
4. Set `NEXT_PUBLIC_API_MODE=live` and `NEXT_PUBLIC_API_BASE_URL`; no component changes are required.
5. Run contract, type, lint, build, and browser flow checks before enabling a capability in production.

**Add a UI primitive:** from `frontend/`, run `npx shadcn@latest add <component> --dry-run`. For an existing file, follow with `npx shadcn@latest add <component> --diff <file>` and merge manually. For a new file, add it normally, review it against the signed tokens and ≥44 px target rule, then export it from the barrel. Never bulk-overwrite.

**Add a translated string:** add the key to `en.json` **and** `id.json`; read with `t("…")`.

---

## 17. Known gotchas & cleanups

- **RHF + radios:** Radix RadioGroup is controlled through RHF `Controller`; convert yes/no values in `onValueChange` before Zod validation (see §7).
- **`getUserMedia` secure context:** localhost or HTTPS only.
- **Duplicate language state:** `session.store.ts` also has a `language` field, but i18n reads from `language.store.ts` via `useLanguage()`. The session copy is currently unused for rendering — pick one source before this drifts (recommend: drop `language` from the session store and keep `language.store`).
- **`useSession()` returns the whole store** (no selector) → components using it re-render on any session change. For hot paths, subscribe with a selector (`useSessionStore(s => s.x)`) instead.
- **Shadcn updates are source merges** — use `--dry-run` and `--diff` per component, then preserve Jaga's token styling, 44 px targets, and public API.
- **Contract ownership** — the OpenAPI document is a frontend-ready handoff, not backend owner sign-off; reconcile changes under `ARCH-1` before live deployment.
