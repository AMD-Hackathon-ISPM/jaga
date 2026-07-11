# Jaga Frontend

The Next.js PWA capture/result client for **Jaga**, an investigational TB *triage* research prototype. It is contract-first and can run against synthetic fixtures or the Go API gateway.

> **Deep developer reference:** [DEVELOPMENT.md](DEVELOPMENT.md) documents every directory, component, hook, store, and service — the cough recorder internals, the RHF/Zod forms (and the radio-boolean gotcha), i18n, design tokens, and step-by-step extension guides.

> Safety is product, not styling. Jaga **does not diagnose or rule out TB**. Every participant is directed to confirmatory evaluation regardless of the estimate. See [`../.agent/design-guidelines.md`](../.agent/design-guidelines.md) and [`../.agent/product-requirements.md`](../.agent/product-requirements.md) — those documents are canonical; this README does not restate their locked rules.

## Status

- **Fixture and live adapters.** `NEXT_PUBLIC_API_MODE=fixture|live` selects deterministic synthetic responses or the configured Go gateway. Production rejects fixture mode.
- **Backend handoff.** [`../contracts/openapi/jaga-v1.yaml`](../contracts/openapi/jaga-v1.yaml) pins the frontend integration proposal for status, intake, Gema, Prisma, assistant, and structured errors; backend owner sign-off remains required.
- **No backend or infra changes.** Provider credentials and model calls remain server-side.
- **Transient patient data.** Clinical values, the WebM cough recording, the CXR image, chat, and results remain in memory only.
- Dependencies installed and the dev server compiles. Run the commands below to start it.

## How this maps to the existing backend

| Backend reality | Frontend consequence |
|---|---|
| Go API validates clinical/demographic fields (`POST /api/v1/demographics`) | `types/patient.ts` mirrors the Go models; `features/clinical/clinical-schema.ts` (Zod) mirrors the Go validation bounds |
| Live triage, CXR, and assistant endpoints (`/api/v1/triage`, `/api/v1/cxr`, `/api/v1/assistant/messages`) | Zod schemas, synthetic fixtures, OpenAPI, and fixture/live adapters expose the same handoff; fixture mode still works offline |
| Single-session, in-memory, no accounts | Zustand session store with **no `persist`** (never localStorage/IndexedDB); auth is placeholder scaffolding only |
| Two co-equal, never-fused signals (Gema, Prisma) | Separate routes, stores, services, results, and request contracts |
| Fireworks/Featherless OpenAI-compatible model | Browser calls only `/api/v1/assistant/messages`; provider base URL, key, model, system prompt, and safety enforcement belong in Go |
| Signed design system (cream/serif, OKLCH tokens) | `styles/tokens.css` ports the tokens verbatim; `tailwind.config.ts` aliases them |

## Tech stack

React 19 · Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix/Nova preset `b85jYWWKi8`) · TanStack Query · Zustand · React Hook Form · Zod · Axios (configured, unused) · ESLint · Prettier.

**Intentional deviations from a generic dashboard scaffold** (this is a triage PWA, not a CRUD admin):

- **Shadcn uses Jaga's design system.** `components.json` configures the Radix/Nova source and CLI workflow. The routed flow uses official shadcn APIs, while semantic variables map to the signed Jaga palette and remain light-only.
- **No Dashboard/Reports/Monitoring/Admin pages.** The product flow is `gate → clinical → coughs → review → result`. Operator/auth pieces (`components/layout/navbar.tsx`, `sidebar.tsx`, `guards/`, `context/auth-context.tsx`, `store/auth.store.ts`) are placeholders for a *possible* future operator area and are **not** part of the public flow.
- **Folder name.** This lives in `frontend/` (renamed from `apps/web` on 2026-06-30); the role is described in [`../.agent/project-architecture.md`](../.agent/project-architecture.md) §11/§3.2.

## Folder structure

```text
frontend/
├── components.json             # shadcn/ui Radix/Nova config and aliases
├── public/
│   ├── manifest.webmanifest
│   └── fonts/                 # self-hosted Ioskeley Regular woff2
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
    │   ├── ui/                # shadcn actions, surfaces, forms, feedback,
    │   │                      #   list/disclosure primitives + legacy Table/Dialog
    │   ├── layout/            # Header, Footer, StepIndicator, LanguageSwitcher,
    │   │                      #   Navbar/Sidebar (operator scaffolding)
    │   └── common/            # ErrorBoundary, PrototypeBanner
    ├── hooks/                 # useSession, useLanguage, useMediaQuery
    ├── services/              # fixture/live status, patient, Gema, Prisma, assistant adapters
    ├── store/                 # in-memory session, Prisma, language, auth
    ├── context/               # AuthContext (placeholder)
    ├── guards/                # ProtectedRoute, GuestRoute (placeholder)
    ├── providers/             # AppProviders (QueryClient + Auth + ErrorBoundary)
    ├── lib/                   # http (axios, unused), query-client, config, utils
    ├── contracts/             # runtime schemas + clearly synthetic fixtures
    ├── types/                 # patient, triage, CXR, API, common
    ├── utils/                 # format helpers
    ├── styles/                # tokens.css (OKLCH design tokens)
    └── assets/
```

> Note on `pages/`: this is the **App Router**, so routes live in `src/app/`, not a `pages/` directory (a `pages/` folder would switch Next into the legacy Pages Router). The requested `pages/`, `features/`, and `layouts/` intents are served by `src/app/` + `src/features/` + `src/layouts/`.

## Getting started

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
npm test
npm run typecheck            # tsc --noEmit
npm run lint
npm run build
npx shadcn@latest info
```

For an existing primitive, run `npx shadcn@latest add <component> --dry-run`, then `npx shadcn@latest add <component> --diff <file>` and merge the upstream API into Jaga's token and 44 px contracts. Never bulk-overwrite the UI directory.

## Backend integration handoff

1. Backend owners review and sign [`../contracts/openapi/jaga-v1.yaml`](../contracts/openapi/jaga-v1.yaml), especially request limits, timeouts, quality errors, calibration metadata, and deterministic referral copy.
2. Implement the same paths behind the Go gateway. Fireworks or Featherless configuration stays server-side; the frontend never receives provider credentials.
3. Set `NEXT_PUBLIC_API_MODE=live` and `NEXT_PUBLIC_API_BASE_URL` in `.env.local`. Use same-origin routing by leaving the base URL empty.
4. Confirm `GET /api/v1/status` reports each capability ready with the matching contract version.
5. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`, then test the five-cough multipart request, CXR upload, and assistant safety redirects end to end.

## Constraints honored

No backend or infra changes · no provider keys in the browser · no auth or DB changes · no persistent patient data · Gema and Prisma remain independent.
