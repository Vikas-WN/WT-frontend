# WebTrak — Design documents

As of 11 Nov 2026. These documents describe how WebTrak is built and **why**, and record the production problems
that shaped it. They sit next to `docs/ARCHITECTURE.md` (the one-page overview, last updated 24 Sep 2026) and go
deeper: component designs, the low-level patterns the code relies on, and the incidents behind them.

The same folder lives at `docs/design/` in both repositories (`webtrak1.0` and `WT-frontend`). Update both together,
the same way as `docs/ARCHITECTURE.md`.

## Who these are for

| Reader | Start with |
| --- | --- |
| New engineer joining the team | 01 → 02 → 06, then the domain doc for the area you'll work on |
| Reviewer of a change | 02 (patterns you're expected to reuse) and 07 (mistakes not to repeat) |
| On-call / whoever deploys | 08, then 07 |
| Someone proposing a structural change | 09 (decisions already made and the reasons) |
| Anyone sizing servers or chasing slowness | 10 (measured capacity and the bottleneck) |

## The documents

| # | Document | What it covers |
| --- | --- | --- |
| 01 | [System architecture](01-system-architecture.md) | Context, containers, deployment topology, environments, request lifecycle, trust boundaries, quality attributes |
| 02 | [Backend low-level design](02-backend-lld.md) | Layering and every recurring pattern: unit of work, advisory locks, job leases, circuit breaker, after-commit side effects, signed tokens, rate limiting, fail-closed config, guard tests |
| 03 | [Time off: leave, WFH, comp-off](03-time-off-lld.md) | The leave ledger, accrual and year-end rules, the request state machine, manager routing, reversal, conflicts, email quick actions |
| 04 | [Workforce: people, allocations, compliance](04-workforce-lld.md) | Employee lifecycle, the allocation capacity model and talent pool, history views, compliance nudges |
| 05 | [Integrations and background work](05-integrations-lld.md) | Notifications and email, the scheduler and its 25 jobs, WK Business sync, object storage, observability, and the retired Relay assistant |
| 06 | [Frontend low-level design](06-frontend-lld.md) | BFF proxy, auth client, data layer, navigation model, runtime configuration, design system, release notes |
| 07 | [Production incident log](07-production-incidents.md) | 31 production issues (INC-01…INC-31) plus two found in load testing (INC-32, INC-33) in 7 classes: symptom, root cause, fix, and the guard that now prevents a repeat |
| 08 | [Operations runbook](08-operations-runbook.md) | Branch flow, deploying, UAT access, migrations, configuration, verifying a release, incident checklist |
| 09 | [Architecture decision records](09-decision-records.md) | The decisions behind the design, with the alternatives that were rejected |
| 10 | [Load test](10-load-test.md) | Local k6 stress test (Nov 2026): where one backend process saturates, 1 vs 4 workers, per-endpoint latency, recommendations |

## Conventions used in these documents

- **File references** are relative to the repository root, e.g. `app/core/locks.py` (backend) or
  `src/lib/serverApi.ts` (frontend).
- **Commit references** are short hashes from the repository the change lives in.
- **Diagrams** are Mermaid; GitHub and most editors render them.
- **"Production"** includes UAT when a problem was found there first; doc 07 says which environment.
- Statements about behaviour are from the code at the date above. If you change a mechanism described here, update
  the document in the same pull request.

## Key numbers (11 Nov 2026)

| | Backend (`webtrak1.0`) | Frontend (`WT-frontend`) |
| --- | --- | --- |
| Stack | FastAPI, SQLAlchemy 2 async (asyncpg), Pydantic 2, Alembic, APScheduler, httpx | Next.js 16 (App Router), React 19, TanStack Query 5, Tailwind 4, TypeScript strict |
| Size | 58 routers / 421 routes, 78 services, 51 domain modules, 70 models, 122 migrations | 52 dashboard modules, 100 hooks, 480-line endpoint registry |
| Tests | 213 pytest files (~1,680 tests), plus `scripts/e2e_*` checks against a real Postgres; k6 load test in `loadtest/` (doc 10) | Node test runner unit tests (`scripts/tests`, ~175), an e2e "What's new" run in real Chrome |
| History | 597 commits since 29 Apr 2026, 108 of them fixes | 834 commits since 29 Apr 2026, 175 of them fixes |
