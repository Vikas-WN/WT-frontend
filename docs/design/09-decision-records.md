# 09 — Architecture decision records

Each record states the decision, the context that forced it, the alternatives rejected, and the consequences we live
with. Most were made in response to a production problem (doc 07 IDs in brackets). Status is **Accepted** unless noted.

| ADR | Decision | Status |
| --- | --- | --- |
| 001 | Next.js BFF proxy with HttpOnly session cookies | Accepted |
| 002 | Share database tables with the legacy Java backend | Accepted (transitional) |
| 003 | A layered modular monolith, not services | Accepted |
| 004 | Transaction-scoped advisory locks for multi-row read-modify-write | Accepted |
| 005 | In-process scheduler with database leases | Accepted |
| 006 | Route authentication enforced by a test | Accepted |
| 007 | Leave as a ledger plus a monthly balance snapshot | Accepted |
| 008 | Side effects after commit, as tracked in-process tasks | Accepted |
| 009 | Stateless signed action tokens; preview on GET, decide on POST, one recipient | Accepted |
| 010 | Bounded transactions that fail fast as 503 | Accepted |
| 011 | Files in object storage with a database fallback | Accepted |
| 012 | Web client polls for notifications | Accepted (revisit) |
| 013 | Per-environment frontend configuration is read at run time | Accepted |
| 014 | One tree promoted develop → uat → prod | Accepted |
| 015 | Assistant via server-started sessions and read-only tools | Superseded — feature removed 5 Nov 2026 |

---

## ADR-001 — Next.js BFF proxy with HttpOnly session cookies

**Context.** The browser needs to call ~420 FastAPI routes. Tokens in `localStorage` are readable by any injected
script; calling FastAPI cross-origin needs CORS and exposes the API host. An early build used Next.js rewrites, which
are resolved at build time and baked `localhost` into the UAT image [INC-24].

**Decision.** The browser only talks to its own origin. A catch-all route handler (`/api/v1/[...path]`) forwards to
FastAPI at run time, turning the HttpOnly `accessToken` cookie into a `Bearer` header and propagating `x-request-id`.

**Alternatives.** Direct browser → API with tokens in JS storage (XSS steals sessions). Rewrites (build-time). A separate
gateway (another moving part for a single consumer).

**Consequences.** + No token in JS; one origin; one request id across both logs; misconfiguration fails loudly (503
`backend_unconfigured`). − Every call takes an extra hop; the proxy buffers bodies so it can't stream (ADR-012); the BFF
must drop hop-by-hop headers correctly.

## ADR-002 — Share database tables with the legacy Java backend

**Context.** WebTrak replaced a Java system module by module. Some tables (e.g. `monthly_submissions`) are still written
or read by it, and a big-bang data migration was not possible while both ran.

**Decision.** The FastAPI backend uses the existing tables and keeps their shapes (including JSON payload shapes) where
the Java side depends on them. New tables are FastAPI-owned.

**Alternatives.** Separate database with sync (two sources of truth); migrate everything first (blocks delivery).

**Consequences.** + Incremental delivery. − Schema changes on shared tables must stay backward compatible for a
release (doc 08 §7); some awkward legacy shapes persist. **Exit:** retire the Java writer per module, then normalise.

## ADR-003 — A layered modular monolith

**Context.** A small team, one product, strong transactional coupling (a leave approval touches requests, ledger,
balances, notifications in one transaction).

**Decision.** One FastAPI deployable with strict layers: routers → services → domain (pure) → repositories (doc 02 §1).
Modules are folders, not services.

**Alternatives.** Microservices per area (distributed transactions for what is today one `db.tx()`, more ops for no
scaling need).

**Consequences.** + One transaction per business action; simple deploys; pure domain rules are cheap to test. − The
service layer must resist becoming a god layer; boundaries are by convention, reviewed in code review.

## ADR-004 — Transaction-scoped advisory locks for multi-row read-modify-write

**Context.** A balance spans several monthly rows; overlap checks are "read, then insert"; allocation capacity sums
several rows. Concurrent approvals produced wrong balances [INC-10].

**Decision.** Take `pg_advisory_xact_lock(hashtextextended('<namespace>:<id>', 0))` at the start of the transaction,
before reading. Namespaces are constants in `app/core/locks.py` (`LEAVE_BALANCE`, `COMP_OFF_CREDIT`, `USER_REQUESTS`,
`ALLOCATION_CAPACITY`). Bounded by `lock_timeout` (ADR-010).

**Alternatives.** `SELECT … FOR UPDATE` (can't lock rows that don't exist yet; easy to miss one row). `SERIALIZABLE`
isolation (retries everywhere). Session advisory locks (lost behind PgBouncer transaction pooling).

**Consequences.** + Only the same person's operations queue; released automatically at commit/rollback. − Every writer of
that data must take the lock; a forgotten lock is a silent race. The scheduler's accrual job takes it too.

## ADR-005 — In-process scheduler with database leases

**Context.** 25 jobs credit leave, end allocations and send reminders. The app may run as several replicas; each would
run every job.

**Decision.** APScheduler inside the backend; before each run, claim a row in `scheduler_job_leases` with an
`INSERT … ON CONFLICT … WHERE claimed_at < now() - lease` (doc 02 §4). Jobs are also idempotent per period [INC-13].

**Alternatives.** A separate worker container (still needs run-once). Redis/Celery beat (new infrastructure for a few
jobs a day). Session advisory lock (unsafe behind PgBouncer).

**Consequences.** + No new infrastructure; safe at N replicas. − Jobs share the API process's resources; a long job can
slow requests. Revisit if a job becomes heavy.

## ADR-006 — Route authentication enforced by a test

**Context.** Authorization is called inside handlers (`require_any_role`, `get_actor_email`), which is flexible but
means a forgotten call leaves a route open. A review found several [INC-07].

**Decision.** `tests/test_route_auth_coverage.py` walks every registered route and fails unless its handler reaches a
guard, or it is listed in `PUBLIC_ROUTES` with a reason.

**Alternatives.** Global auth middleware with an allow-list (fights per-route role logic and the public flows: OAuth,
exit survey, quick actions). Code review alone (already failed).

**Consequences.** + A new open route fails the test suite. − The walker relies on static analysis of call graphs;
unusual indirection may need a listing.

## ADR-007 — Leave as a ledger plus a monthly balance snapshot

**Context.** Balances were disputed, rules changed several times (joining month, carry-forward, encashment) and jobs
could be re-run [INC-11, INC-13, INC-19, INC-29].

**Decision.** `leave_mappings` holds each person's balance per month; `leave_transactions` records every movement
(ACCRUAL, RESERVE, DEDUCT, reversals) with its reason. Accrual rules are pure functions in
`app/domain/leave_accrual_policy.py` (doc 03).

**Alternatives.** A single mutable balance column (no audit trail, unfixable disputes). Event-sourcing only (every read
replays history).

**Consequences.** + Every number is explainable from rows; incidents were diagnosed by reading the ledger; idempotency
checks are "does this month's ACCRUAL row exist". − Two structures must stay consistent; all writes go through the
service under the lock.

## ADR-008 — Side effects after commit, as tracked in-process tasks

**Context.** Emails inside the request made leave submits slow and bug reports time out at ~36 s [INC-20, INC-21];
notifications published before commit announced requests that then rolled back; untracked `asyncio.create_task` calls
were garbage-collected and mail vanished [INC-04].

**Decision.** Write notification rows in the business transaction; after commit, publish and email via
`spawn_background_task`, which holds a reference and logs failures (doc 02 §6).

**Alternatives.** A message queue + worker (durable, but new infrastructure). An outbox table with a poller (durable,
more code).

**Consequences.** + Fast responses; nothing announced that didn't happen. − A process crash between commit and send
loses that email (the in-app notification row survives). If email delivery must be guaranteed, move to an outbox.

## ADR-009 — Stateless signed action tokens; preview on GET, decide on POST, one recipient

**Context.** Managers approve from email. Mail scanners pre-fetch links. A manager's link CC'd to the requester let
employees approve their own leave [INC-01].

**Decision.** HMAC-signed, expiring tokens naming the request and approver (`app/core/action_tokens.py`). GET only
previews; the decision is a POST that runs the normal approval as that approver. A credential-carrying email goes to
exactly one person; others get a plain informational copy.

**Alternatives.** Tokens stored in the database (revocable, but another table and cleanup). Approve-on-GET (scanners
approve things).

**Consequences.** + No storage; all approval rules still apply. − Can't revoke one token before expiry except by
rotating the key; the one-recipient rule must be kept by every future email.

## ADR-010 — Bounded transactions that fail fast as 503

**Context.** Requests hung under load behind locks or slow queries [INC-10].

**Decision.** `db.tx()` sets `lock_timeout`, `statement_timeout` and `idle_in_transaction_session_timeout` per
transaction; the error handler maps those SQLSTATEs to 503 "busy, try again" (`002c94d`).

**Consequences.** + No unbounded waits; users get a retryable answer. − A legitimately slow report must use its own
longer budget explicitly.

## ADR-011 — Files in object storage with a database fallback

**Context.** Profile photos were stored on the container disk and disappeared on every deploy [INC-27].

**Decision.** S3-compatible Linode Object Storage behind a `DocumentStore` and a circuit breaker; downloads go through an
access-checked endpoint; photos keep a database copy as fallback and move over automatically (`a503f24`).

**Consequences.** + Survives deploys; no public bucket URLs. − Another dependency with credentials; old `local://` files
need re-upload (the UI says so).

## ADR-012 — Web client polls for notifications

**Context.** The backend has an SSE stream, but the BFF buffers responses (ADR-001), so a stream can't pass through it.

**Decision.** The shell polls notifications every 2 min, badges/approvals every 30 s, and refreshes immediately after
any local write (`wt:data-changed`, cross-tab via `localStorage`).

**Consequences.** + Simple and robust through every proxy. − Up to 2 min latency for others' actions; steady request
load. **Revisit** with a streaming pass-through route if real-time matters.

## ADR-013 — Per-environment frontend configuration is read at run time

**Context.** One image is built and configured per VM. `next build` inlines `NEXT_PUBLIC_*` even in server routes, so
container values were ignored [INC-05, INC-24].

**Decision.** Anything that differs per environment is a server-side variable read at request time (computed name), and
reaches the browser via a server route if needed. `NEXT_PUBLIC_*` only for values identical everywhere.

**Consequences.** + Config changes need a restart, not a rebuild. − Developers must know the rule (doc 06 §5); a
verification step runs the build with run-time-only values.

## ADR-014 — One tree promoted develop → uat → prod

**Context.** Fixes left on develop never reached users; a stale local prod caused a rejected push.

**Decision.** Commit on develop; fast-forward uat; merge into prod; assert `git diff develop prod` is empty (doc 08 §2).

**Alternatives.** Cherry-picking per branch (drift, missed fixes). Trunk + tags (better, but needs CI and per-env deploy
automation we don't have yet).

**Consequences.** + All environments run the same code; prod's merge commits mark releases. − No way to hold one change
back from prod except reverting; feature flags are needed for anything not ready.

## ADR-015 — Assistant via server-started sessions and read-only tools (superseded)

**Context (Nov 2026).** An LLM assistant ("WebTrak assistant") on the Relay gateway needed the user's data.

**Decision then.** The backend started sessions with its own secret key (no key in the browser) and exposed nine
read-only tools that ran as the session's user through normal services, verified by an HMAC signature over the route
and body, failing closed without configuration (doc 05 §5).

**Status.** Removed from all branches on 5 Nov 2026. The gateway had no permanent hosting (a personal ngrok tunnel).
The decision is kept as the template if an assistant returns: server-started sessions, read-only tools through
services, signed calls, fail-closed configuration, and the route-auth test covering the tools route.
