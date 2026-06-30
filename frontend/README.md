# Jaga Frontend

The Next.js PWA capture/result client for **Jaga**, an investigational TB *triage* research prototype. This folder is the **frontend foundation only**: placeholders, mock data, and architecture. It is not wired to any API.

> **Deep developer reference:** [DEVELOPMENT.md](DEVELOPMENT.md) documents every directory, component, hook, store, and service — the cough recorder internals, the RHF/Zod forms (and the radio-boolean gotcha), i18n, design tokens, and step-by-step extension guides.

> Safety is product, not styling. Jaga **does not diagnose or rule out TB**. Every participant is directed to confirmatory evaluation regardless of the estimate. See [`../.agent/design-guidelines.md`](../.agent/design-guidelines.md) and [`../.agent/product-requirements.md`](../.agent/product-requirements.md) — those documents are canonical; this README does not restate their locked rules.

## Status

- **No API calls.** Every service throws `Error("API not connected yet")`.
- **No endpoint URLs.** The triage (`POST /api/v1/triage`) and CXR (`POST /api/v1/cxr`) contracts are gated on Daffa's `ARCH-1` (see [`../.agent/project-architecture.md`](../.agent/project-architecture.md) §6). `lib/http.ts` (Axios) is configured but unused.
- **No backend or infra changes.**
- **Mock data only**, under `src/mocks/`.
- Dependencies installed and the dev server compiles. Run the commands below to start it.

## How this maps to the existing backend

| Backend reality | Frontend consequence |
|---|---|
| Go API, live `POST /api/v1/patient/intake` with exact field validation | `types/patient.ts` mirrors `models/patient.go`; `features/clinical/clinical-schema.ts` (Zod) mirrors `validation/patient.go` bounds |
| Triage/CXR contracts unsigned (`ARCH-1`) | `types/triage.ts` and `types/cxr.ts` are clearly marked **provisional**; services throw |
| Single-session, in-memory, no accounts | Zustand session store with **no `persist`** (never localStorage/IndexedDB); auth is placeholder scaffolding only |
| Two co-equal, never-fused signals (Gema, Prisma) | Triage and CXR types/services kept separate; never merged |
| Signed design system (cream/serif, OKLCH tokens) | `styles/tokens.css` ports the tokens verbatim; `tailwind.config.ts` aliases them |

## Tech stack

React 19 · Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui (Radix/Nova) · TanStack Query · Zustand · React Hook Form · Zod · Axios (configured, unused) · ESLint · Prettier.

**Intentional deviations from a generic dashboard scaffold** (this is a triage PWA, not a CRUD admin):

- **Shadcn uses Jaga's design system.** `components.json` configures the Radix/Nova source and CLI workflow. Its semantic variables map to the signed Jaga palette; existing primitives remain token-styled in `components/ui/` until intentionally migrated, and new primitives should be added through the shadcn CLI rather than recreated.
- **No Dashboard/Reports/Monitoring/Admin pages.** The product flow is `gate → clinical → coughs → review → result`. Operator/auth pieces (`components/layout/navbar.tsx`, `sidebar.tsx`, `guards/`, `context/auth-context.tsx`, `store/auth.store.ts`) are placeholders for a *possible* future operator area and are **not** part of the public flow.
- **Folder name.** This lives in `frontend/` (renamed from `apps/web` on 2026-06-30); the role is described in [`../.agent/project-architecture.md`](../.agent/project-architecture.md) §11/§3.2.

## Folder structure

```text
frontend/
├── components.json             # shadcn/ui Radix/Nova config and aliases
├── public/
│   ├── manifest.webmanifest
│   └── fonts/                 # self-hosted subset woff2 (to add)
└── src/
    ├── app/                   # App Router routes
    │   ├── layout.tsx         # providers, fonts, lang
    │   ├── globals.css        # imports tokens + Tailwind
    │   ├── page.tsx           # / (gate)
    │   ├── clinical/          # /clinical
    │   ├── coughs/            # /coughs
    │   ├── review/            # /review
    │   ├── result/            # /result
    │   ├── loading.tsx · error.tsx · not-found.tsx
    ├── layouts/               # FlowLayout (single-column shell)
    ├── features/              # feature-first screens
    │   ├── gate/ · clinical/ · coughs/ · review/ · result/
    ├── components/
    │   ├── ui/                # Button, Card, Input, Table, Dialog/Modal,
    │   │                      #   Skeleton, Spinner, Badge, EmptyState, ErrorState
    │   ├── layout/            # Header, Footer, StepIndicator, LanguageSwitcher,
    │   │                      #   Navbar/Sidebar (operator scaffolding)
    │   └── common/            # ErrorBoundary, PrototypeBanner
    ├── hooks/                 # useSession, useLanguage, useMediaQuery
    ├── services/              # auth/patient/triage/cxr/health — all throw
    ├── store/                 # Zustand: session, language, auth (mock)
    ├── context/               # AuthContext (placeholder)
    ├── guards/                # ProtectedRoute, GuestRoute (placeholder)
    ├── providers/             # AppProviders (QueryClient + Auth + ErrorBoundary)
    ├── lib/                   # http (axios, unused), query-client, config, utils
    ├── types/                 # patient (from Go), triage/cxr (provisional), api, common
    ├── mocks/                 # triage-result.mock.json, session.mock.json
    ├── utils/                 # format helpers
    ├── styles/                # tokens.css (OKLCH design tokens)
    └── assets/
```

> Note on `pages/`: this is the **App Router**, so routes live in `src/app/`, not a `pages/` directory (a `pages/` folder would switch Next into the legacy Pages Router). The requested `pages/`, `features/`, and `layouts/` intents are served by `src/app/` + `src/features/` + `src/layouts/`.

## Getting started

```bash
cd frontend
npm install
cp .env.example .env.local   # leave NEXT_PUBLIC_API_BASE_URL empty for now
npm run dev                  # http://localhost:3000
npm run typecheck            # tsc --noEmit
npm run lint
```

## How to add API integration later (after `ARCH-1` is signed)

Do this in one place, behind the existing seams — do not scatter URLs through components.

1. **Pin the contract.** Update `types/triage.ts` / `types/cxr.ts` to the signed schema (remove the "provisional" markers). Add the `schema_version` field the backend negotiates.
2. **Configure the client.** Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`; add the schema/version header and error normalization interceptors in `lib/http.ts`.
3. **Implement one service.** Replace the `throw new Error("API not connected yet")` body in the relevant `services/*.ts` with a real `http` call. Start with `patientService.submitIntake` (the only live endpoint today).
4. **Wire the mutation.** In `features/review/`, call the service through a TanStack Query `useMutation`; map API states/errors to UI per [`../.agent/design-guidelines.md`](../.agent/design-guidelines.md) §3.3.
5. **Drop the mock.** Swap `mocks/triage-result.mock.json` in `features/result/` for the live result. Keep the locked result hierarchy (§8) and the unconditional banner + next-step panel.
6. **Hold the safety line.** Never persist patient inputs; never fuse Gema and Prisma; never show a stale or uncalibrated estimate.

## Constraints honored

Never modified backend or infra · never connected APIs · never guessed endpoint URLs · no auth logic · no DB models · no backend logic duplicated · in-memory mock data only.
