# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

WebTrak frontend: Next.js 16 (App Router, Turbopack dev), React 19, TypeScript strict, Tailwind v4, shadcn (on `@base-ui/react`, not Radix), TanStack Query 5. Acts as a BFF in front of the FastAPI backend in the sibling repo `../webtrak1.0`.

## Commands (pnpm only)
- `pnpm dev` — dev server on :3000
- `pnpm build` — production build (only step that currently type-checks)
- `pnpm lint` — ESLint flat config (0 errors; ~80 `react-hooks/set-state-in-effect` warnings are known and tolerated, see `eslint.config.mjs`)
- Typecheck: `pnpm exec tsc --noEmit`
- No test framework. Verify changes with typecheck + lint + build, and by running the app.

## Architecture
- **Routing:** `src/app/(protected)/layout.tsx` wraps `dashboard/*` and `guide` (provides `QueryClientProvider`). Public: `login`, `exit-survey/[token]`, `api-docs`, `integrations-api`.
- **Page pattern:** route `page.tsx` files are thin and render a lazy client registered in `src/components/dashboard/lazyPages.tsx` (next/dynamic) → `src/components/dashboard/{module}/{Module}PageClient.tsx`.
- **Layers** (see `src/ARCHITECTURE.md`): `src/api/` (`httpClient.ts`, `endpoints.ts` endpoint registry, `error.ts` `ApiError`) → `src/services/` (API calls only; `hrms.service.ts` is the big one) → `src/hooks/{feature}/` (TanStack Query hooks) → `src/components/{feature}/`. Shared app UI in `components/dashboard/ui` (DataTable, PageHero, WtLoader, forms); shadcn primitives in `components/ui`. Also `src/utils/`, `src/constants/` (routes, `dashboardNavigation`, `uiCopy`, `sessionPolicy`), `src/types/`, `src/lib/` (auth, `serverApi`, toast, `cn`, S3), `src/context/` (Auth, UserPreferences).
- **Aliases:** `@/*` → `./src/*`; `@/config/*` → root `./config/*`.
- **API / BFF:** the browser calls same-origin `/api/v1/*`; `src/app/api/v1/[...path]/route.ts` proxies to server-side `API_BASE_URL` via `src/lib/serverApi.ts`. In prod the client base URL is always `""`; in dev `NEXT_PUBLIC_API_BASE_URL` may point at FastAPI (`http://localhost:8080`). `apiClient` (fetch, `credentials: "include"`) does a single-flight silent refresh on 401 and retries (`src/lib/auth.ts`); 30s default timeout (`timeoutMs: 0` for uploads). Responses are `{ message, data }`.
- BFF-owned routes: `api/v1/google-signin`, `auth/google/callback`, `auth/refresh`, `auth/logout`, `auth/activity`, `holiday-calendar-storage/[year]` (Linode S3), `api/files/[...path]`.
- **Auth:** Google OAuth; tokens are HttpOnly cookies. `middleware.ts` is a UX guard only (redirects to `/login` without session cookies, preserves deep links via `?redirect=` + `postLoginRedirect` cookie). Backend enforces roles (401 → refresh, 403 → wrong role); sidebar is role-filtered in `constants/dashboardNavigation.ts`. Never trust the unsigned `roles` cookie.

## Coding rules (from `rules.md`, marked strict)
- Split large components into small ones; put logic in hooks. Components are presentational, ≤200 lines, no API calls / business logic / data transformation, no inline JS in JSX.
- Never use `any`; type all API requests/responses in `src/types`.
- No hardcoded strings in components — labels, URLs, query keys, enums go in `src/constants`. Query keys must come from constants.
- TanStack Query for server state: queries for GET, mutations for writes. Don't store API data in `useState`; no fetching in `useEffect`; justify any `useState`/`useEffect` with a comment.
- Services contain only API calls; no `console.log`.
- Always show loading and error states; never show raw errors to users. Prefer switch/maps over long if/else chains.
- Refactors must not change behavior.
- `rules.md` was written for a Vite/Zustand/Axios/react-router stack — those parts don't apply. Real equivalents: TanStack Query + Context, fetch `HttpClient`, App Router, `WtLoader`/`SectionLoading`, `ConfirmDialog`, `global-error.tsx`. Styling is Tailwind + `cn()` (separate `.css` files are rare).
- Existing code is mixed (PascalCase feature files, inline query keys). The `referral/` module is the reference for the rules-compliant structure (kebab-case folders, `hooks/use-*.ts`, `*.constants.ts`).

## Gotchas
- Dates: API uses `dd/mm/yyyy` and `dd/mm/yyyy HH:MM:SS` both ways — always convert with `src/utils/apiDate.ts` (`toApiDate`, `fromApiDate`, `apiDateToInputValue`, `inputValueToApiDate`). Business timezone is Asia/Kolkata. See `DATE_API_CONTRACT.md`.
- Don't add `/api/v1` rewrites in `next.config.ts` (build-time destinations bake localhost into the Docker image); the runtime proxy route handles it. Config uses `output: "standalone"` and 50mb body limits for uploads.
- `api_contract.md` is the endpoint-by-endpoint backend contract.
- `docs/ARCHITECTURE.md` is mirrored in `../webtrak1.0/docs/` — update both. README is a slightly older copy of it.
- Some files are huge (`UploadsPageClient.tsx` ~2.8k lines, `hrms.service.ts` ~2.5k); refactor by extraction following `src/ARCHITECTURE.md`'s incremental cleanup guide.
- **"What's new" dialog:** to announce a deployment, add an entry at the TOP of `src/constants/releaseNotes.ts` (new `id` = `YYYY-MM-DD-NN`, plain-language highlights) — each user then sees it once, and never again. No entry, no dialog. `?whatsNew=preview` shows the latest one without marking it seen. Tests: `pnpm test:unit` (rules + a guard on the notes file) and `pnpm test:e2e:whats-new` (real Chrome, real app, mock API; screenshots in `scripts/e2e/out/`).
- `scripts/*.mjs` and `replace_skills_form.py` are one-off codemods, not part of any workflow. `migration/` holds CSV data-migration templates.
