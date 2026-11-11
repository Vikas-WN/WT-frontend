# 10 — Load test (local, 11 Nov 2026)

How much read traffic one WebTrak backend handles, where it saturates, and what to change. Run on a developer
machine against synthetic data, so the numbers show the **shape** of the system (where the knee is and what causes
it) rather than exact UAT or production capacity. §7 lists everything that differs from production.

## 1. Summary

| Question | Answer |
| --- | --- |
| Did anything fail? | Not up to ~480 active users: 78,916 requests in the stress and worker runs all returned 200. The breaking-point run (§3b) found the limits |
| What is the breaking point? (1 process) | **Max ~90 req/s** at ~300 active users; **p95 > 1.5 s from 200–300 users**; **first errors at ~480**; **>1% errors at 800–900** (§3b) |
| Anything dangerous? | **Yes:** under overload, DB pool timeouts sign users out as "account inactive" (§3c, INC-32) |
| Where does one backend process saturate? | Between **100 and 150 concurrent users**: the process reaches 100% of one CPU core at ~65–80 req/s |
| What is slow at the limit? | The "open the app" burst: `/profile/balances` and `/profile` (p99 ≈ 2–3 s) when many people open WebTrak at the same moment |
| What fixes it? | Done (§6b): INC-32 fix, user loaded once per request, `uvicorn[standard]`, 4 workers → **whole-run p95 628 → 26 ms, 0 errors** at up to 200 active users |
| What doesn't it fix? | The simultaneous-open burst. Its p99 only improved from 3.2 s to 2.3 s, so it needs work on the two profile endpoints (§6) |

## 2. What was tested

**Journey** (`loadtest/webtrak.k6.js`, read-only GETs). Each virtual user:

1. *Opens the app*: 7 calls in sequence: `/profile`, `/profile/balances`, `/profile/preferences`,
   `/notifications?size=20`, `/announcements/unread-count`, `/celebrations`, `/trainings/my-learning-summary`.
2. Waits 2–5 s, then *browses* 2–4 pages with 1–5 s think time between them: announcements, company holidays,
   their leave requests for the year, notifications (50). HR users can also open `/whos-out` and
   `/leave-summary`.
3. Waits 3–10 s and repeats.

So one virtual user ≈ one person actively clicking around, about 0.4 requests per second. 150 virtual users is far
busier than 150 employees on a normal day; it resembles the 9:30 a.m. rush when everyone opens WebTrak.

**Data** (`loadtest/seed_loadtest_db.py` into a throwaway `webtrak_loadtest` database, schema at Alembic head
`20261105_01`):

| Table | Rows |
| --- | --- |
| users (295 employees + 5 HR) | 300 |
| user_requests (≈15 per person over the year; ~10% on leave this week) | 4,532 |
| notifications (60 per person) | 18,000 |
| leave_mappings (one per person per month) | 3,300 |
| announcements | 50 |
| company holiday calendar days | 15 |

**Environment**

| | Load test | Production |
| --- | --- | --- |
| Machine | Laptop, Intel i7-1185G7, 8 logical cores, 29 GB RAM; k6, backend and Postgres all on it | One VM per environment |
| Backend | uvicorn, **1 process** (as `docker-entrypoint.sh` runs it), then 4 workers for comparison | 1 process |
| Python | 3.14 (local venv) | 3.12 (`python:3.12-slim`) |
| Database | PostgreSQL 18.6 local, direct connection | PostgreSQL behind PgBouncer |
| DB pool per process | 5 + 5 overflow (defaults), 10 s pool timeout | same defaults unless overridden in `.env` |
| Path | k6 → FastAPI directly | Browser → TLS → Next.js BFF → FastAPI |
| Scheduler / SMTP | off / off | on / on |

## 3. Run 1: stress ramp, 1 worker

Profile `stress`: ramps 0 → 10 → 25 → 50 → 100 → 150 → 200 users over 17 minutes (each step ramps over its window).
Backend CPU, memory and Postgres connections were sampled every 5 s.

| Stage | Users | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms | Errors | Backend CPU avg / max | RSS MB | DB conns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0–1 min | → 10 | 188 | 3.1 | 16 | 31 | 35 | 40 | 0% | 3% / 12% | 209 | 2 |
| 1–4 min | → 25 | 1,679 | 9.3 | 17 | 34 | 63 | 131 | 0% | 13% / 33% | 215 | 5 |
| 4–7 min | → 50 | 3,609 | 20.1 | 17 | 35 | 54 | 113 | 0% | 24% / 47% | 223 | 5 |
| 7–10 min | → 100 | 7,264 | 40.4 | 18 | 53 | 89 | 204 | 0% | 50% / 81% | 229 | 5 |
| 10–13 min | → 150 | 11,790 | 65.5 | 31 | 148 | 248 | 596 | 0% | 78% / **101%** | 237 | **10** |
| 13–16 min | → 200 | 14,391 | 80.0 | **211** | **888** | **1,342** | 2,493 | 0% | **98%** / 101% | 257 | 10 |
| 16–17 min | → 0 | 3,048 | 50.8 | 103 | 1,055 | 1,616 | 2,374 | 0% | 64% / 101% | 257 | 10 |

Whole run: 41,969 requests, 0 failed, p50 36 ms, p95 628 ms, p99 1,154 ms, max 2.5 s. All k6 thresholds passed
(p95 < 1.5 s, errors < 1%).

**Reading it:**

- **Up to 100 users the system is flat:** p50 stays at 16–18 ms and p95 under 55 ms while throughput grows linearly
  (≈0.4 req/s per user).
- **The knee is between 100 and 150 users.** CPU hits 100% of one core and latency rises sharply. At 200 users the
  median is 12× worse than at 100.
- **The bottleneck is the single Python process, not the database.** One process can only use one core. The process
  reached 100% while the machine still had 7 idle cores and Postgres was answering quickly (the browse endpoints
  stayed fast, §5). The DB pool also hit its cap of 10 connections at the same moment. Requests queue for the event
  loop first and then for a connection, but no request waited the full 10 s pool timeout (there were no errors).
- **Memory is not a concern:** 209 → 257 MB across the whole run, with no growth once load stopped increasing.

## 3b. Run 3: breaking point, 1 worker

Profile `breakpoint`: +100 users every 2 minutes up to 1,000; k6 stops the run once more than 1% of all requests
have failed. Same single process and default pool (5 + 5 connections, 10 s pool timeout) as production.

| Stage | Users | Requests | Req/s | p50 | p95 | p99 | max | Errors | CPU | RSS MB | DB conns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0–2 min | → 100 | 3,522 | 29.4 | 18 ms | 48 ms | 79 ms | 0.1 s | 0% | 36% | 224 | 5 |
| 2–4 min | → 200 | 9,264 | 77.2 | 73 ms | 471 ms | 822 ms | 1.6 s | 0% | 81% → 101% | 246 | **10** |
| 4–6 min | → 300 | 10,871 | **90.6** | 659 ms | **2.5 s** | 3.8 s | 7.9 s | 0% | 100% | 269 | 10 |
| 6–8 min | → 400 | 10,247 | 85.4 | 1.8 s | 5.5 s | 7.6 s | 13.7 s | 0% | 100% | 293 | 10 |
| 8–10 min | → 500 | 9,739 | 81.2 | 2.9 s | 9.0 s | 13.0 s | 19.7 s | 0.01% | 100% | 313 | 10 |
| 10–12 min | → 600 | 8,864 | 73.9 | 4.5 s | 13.6 s | 18.4 s | 29.6 s | 0.18% | 100% | 338 | 10 |
| 12–14 min | → 700 | 8,965 | 74.7 | 5.7 s | 16.5 s | 22.5 s | 36.7 s | 0.71% | 100% | 355 | 10 |
| 14–16 min | → 800 | 10,193 | 84.9 | 5.9 s | 16.6 s | 22.6 s | 34.5 s | 0.76% | 100% | 371 | 10 |
| 16–18 min | → 900 | 9,785 | 81.5 | 7.3 s | 19.8 s | 27.3 s | 41.5 s | **2.39%** | 100% | 391 | 10 |
| 18–20 min | → 1,000 | 8,742 | 72.8 | 8.6 s | 23.6 s | 31.5 s | 53.9 s | **5.93%** | 100% | 410 | 10 |

Whole run: 90,192 requests, 910 failed (1.00%; k6 stopped at 19 m 52 s with ~990 users). Server-side: 566 × 503
(pool timeout) and 414 × 403 `account_inactive` (§3c); all 1,042 failures logged as
`QueuePool limit of size 5 overflow 5 reached, connection timed out, timeout 10.00`.

**The breaking points of one backend process:**

| Limit | Where | What users see |
| --- | --- | --- |
| **Maximum throughput** | **~90 requests/s**, reached at ~300 active users. Beyond that, throughput *falls* (73–85 req/s): more users only queue | — |
| **Latency SLO (p95 < 1.5 s)** | Crossed **between 200 and 300 active users** | Pages take 2–25 s to load |
| **First errors** | **~480 active users** (first failure at 9 m 39 s) | Occasional failed loads |
| **Error rate > 1%** | **Between 800 and 900 active users** (per stage); cumulative 1% at ~990 | Frequent failures **and sign-outs** (§3c) |

What breaks, in order: **CPU** (one core pinned from ~200 users), so requests queue in the event loop; then the
**DB pool** (all 10 connections busy from ~200 users), so requests wait for a connection; at ~480 users some waits exceed
the **10 s pool timeout** and fail. Memory grows with queued requests (224 → 410 MB) but never became a problem.

"Active user" here means someone clicking continuously (~0.4 req/s). An office where employees open WebTrak a few
times an hour generates a small fraction of that per person, so the practical headcount limit is far higher than these
numbers; the 9:30 rush is the case that approaches them.

## 3c. Bug found under overload: busy database → "Your account is inactive" sign-out

When the role middleware can't get a DB connection in time, `hydrate_request_actor_roles` (`app/api/access.py`, the
`except Exception` around the live user/roles lookup) **fails closed by marking the request `account_inactive`**,
and the guard returns **403 `account_inactive`**. The frontend treats that detail as a real deactivation
(`src/api/httpClient.ts` → `dispatchSessionLogout("inactive")`) and **signs the user out with "Your account is
inactive. Please contact HR."**

In the breaking-point run this happened **414 times** (42% of all failures). Failing closed is right — a lookup that
can't run must not fall back to trusting the token — but the *reason* is wrong: it is "server busy", not "inactive".

**Fix (proposed, not yet made):** in that `except`, distinguish infrastructure errors (pool timeout, connection error,
lock/statement timeout) from "user not found / not allowed" and raise a **503 "busy, try again"** for the former, which
the frontend already treats as transient. Add a test that a `TimeoutError` from the repository yields 503, not 403.
Recorded as doc 07 INC-32.

## 4. Run 2: 1 worker vs 4 workers at 150 users

Same journey, 150 users held for 4 minutes (`k6 run --vus 150 --duration 4m`), backend restarted between runs.
Server-side durations come from the backend's request log. They match k6's client-side numbers within a few ms.

| 150 users, 4 min | Requests | Req/s | p50 | p95 | p99 | max | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 worker, whole run (k6) | 17,992 | 67.9 | 87 ms | 720 ms | 2,194 ms | 7.7 s | 0 |
| 4 workers, whole run (k6) | 18,955 | 71.1 | 36 ms | 217 ms | 1,638 ms | 4.5 s | 0 |

All 150 users start at the same instant, so the first minute is a burst of 150 simultaneous "open the app"
sequences. Split by phase (server-side):

| Phase | Workers | Requests | p50 | p95 | p99 | max | Requests ≥ 1 s |
| --- | --- | --- | --- | --- | --- | --- | --- |
| First minute (burst) | 1 | 5,187 | 161 ms | 1,923 ms | 3,208 ms | 7.7 s | 680 |
| First minute (burst) | 4 | 3,747 | 20 ms | 1,581 ms | 2,343 ms | 4.5 s | 369 |
| Steady state (minutes 2–4) | 1 | 12,805 | 65 ms | 247 ms | 396 ms | 921 ms | **0** |
| Steady state (minutes 2–4) | 4 | 15,208 | **15 ms** | **39 ms** | **68 ms** | **161 ms** | **0** |

With 4 workers, total CPU across them averaged ~1 core (max ~4 cores during the burst), so there was headroom left.
Throughput is about the same in both runs because a closed-loop test with think time is limited by the number of users,
not the server; the difference is how long each user waits.

**Every request over 1 second happened in the first minute.** None did after it, in either configuration.

## 5. Per endpoint (4 workers, whole run, server-side)

| Endpoint | Requests | p50 | p95 | p99 | max |
| --- | --- | --- | --- | --- | --- |
| `/profile/balances` | 1,914 | 24 | 1,213 | 2,462 | 4,457 |
| `/profile` | 1,914 | 17 | 1,218 | 2,222 | 3,166 |
| `/celebrations` | 1,914 | 28 | 448 | 1,427 | 2,486 |
| `/announcements/unread-count` | 1,914 | 11 | 386 | 1,339 | 2,540 |
| `/notifications` (20 and 50) | 3,305 | 14 | 65 | 1,172 | 2,037 |
| `/trainings/my-learning-summary` | 1,914 | 9 | 249 | 975 | 1,796 |
| `/profile/preferences` | 1,914 | 11 | 265 | 860 | 2,140 |
| `/whos-out` (HR) | 32 | 25 | 56 | 78 | 78 |
| `/announcements` | 1,293 | 12 | 30 | 63 | 147 |
| `/userRequest/get/{from}/{to}/LEAVE` | 1,424 | 15 | 36 | 62 | 253 |
| `/holiday-calendars/company` | 1,385 | 10 | 25 | 45 | 107 |
| `/leave-summary` (HR) | 32 | 12 | 23 | 24 | 24 |

The split is clean: every endpoint in the *open the app* sequence has a long tail, and every *browse* endpoint stays
under 260 ms. The tail comes from the burst, not from slow queries in the browse pages. `/profile/balances` and
`/profile` are the slowest of the open sequence. From reading the code, balances makes several sequential queries per
call (user lookup, the balance snapshot, the year summary, and the previous year's mapping). They were not profiled
query by query in this run.

## 6. Recommendations

| # | Change | Evidence | Trade-off / what to check first |
| --- | --- | --- | --- |
| 1 | **Run 2–4 uvicorn workers per backend** (`--workers N` in `docker-entrypoint.sh`, N ≈ VM cores, max 4 to start) | Steady p95 247 → 39 ms at 150 users; 1 process saturates one core at ~65–80 req/s | See "What multiple workers changes" below. Not changed yet: it is a production change and needs the checks below first |
| 2 | **Make the open-the-app path cheaper**: profile `/profile/balances` and `/profile` (query count, N+1), and have the shell fetch them once instead of per page | They carry the p99 tail in every run | Measure first (`EXPLAIN ANALYZE`, query count per request) |
| 3 | **Re-run on UAT through the BFF** with UAT test accounts | This run skipped TLS, the BFF hop, PgBouncer and real data volume | Makes UAT slow while it runs; announce it |
| 4 | Keep `loadtest/` current: run the smoke profile after any API rename | The script had a dead route and a role mistake (§8) | — |

**What multiple workers changes** (each worker is a separate process with its own memory):

| Component | Effect with N workers | OK? |
| --- | --- | --- |
| Scheduler (APScheduler in process) | Every worker fires every job. **Database job leases** (`scheduler_job_leases`, ADR-005) make exactly one run it | Yes, this is what leases are for. Confirm in the log that each job runs once |
| DB connections | Pool is per process: 4 workers × (5 + 5) = up to 40 connections | Check against PgBouncer/Postgres limits. The settings comment warns about a ~15-connection cap on Supabase session pooling; lower `DB_POOL_SIZE` if that applies |
| Email rate limiter (`EmailRateLimiter`, in memory) | Each worker counts separately, so HR resend limits become up to N× looser | Acceptable short term; move to the database if it matters |
| SSE notification stream (in-memory queues) | A publish in one worker doesn't reach subscribers on another | The web app polls instead of using SSE (ADR-012), so no user impact today |
| Circuit breakers | Each worker trips its own breaker | Fine: same behaviour, N× the probes |
| Memory | ~230–260 MB per worker | 4 workers ≈ 1 GB |
| Migrations at start-up | Each worker would try to run them | The Alembic advisory lock serialises them, and the entrypoint already migrates before uvicorn starts. Setting `RUN_MIGRATIONS_ON_STARTUP=false` with workers avoids redundant work |

## 6a. Where the time goes (profiling, single request, no load)

Measured in-process with `loadtest/query_profile.py` and direct timing (median of repeated calls, same synthetic data):

| Endpoint | Total | Time in SQL | SQL statements | Pool checkouts / transactions | JWT decodes |
| --- | --- | --- | --- | --- | --- |
| `/livez` (no auth, no DB) | 0.95 ms | — | 0 | 0 | 0 |
| `/announcements/unread-count` | 7.6 ms | 1.4 ms | 4 | 4 | 4 |
| `/profile` | 11.5 ms | 2.4 ms | 10 | 7 | 4 |
| `/profile/balances` | 18.1 ms | 5.2 ms | 14 | **11** | 4 |

| Cost | Measured |
| --- | --- |
| New session per statement (`db.session()`) | 0.65 ms |
| New `db.tx()` per statement (adds the `set_config` guard) | 0.85 ms |
| Statement on an already-open session | 0.19 ms |
| One JWT decode | 0.04 ms |
| Metrics middleware route-table scan (`_route_template`) | < 1 ms, within run-to-run noise (cProfile overstated it at ~2.4 ms) |

**Findings**

1. **The database is not the bottleneck.** SQL is 20–30% of request time. No query is slow at this data size, so index
   work would not move these numbers.
2. **Each statement opens its own session.** Repositories open a session per call unless a `client=` is passed, and
   `pool_pre_ping=True` adds a `SELECT 1` to every checkout. So one statement costs about 4 round trips (ping, BEGIN,
   statement, ROLLBACK) instead of 1. Locally that is ~0.45 ms of overhead per statement. Over a real network to
   PgBouncer each round trip costs more, so production pays more than this test shows.
3. **The signed-in user is loaded 2–3 times per request** (role middleware, auth guard, then the service), plus roles
   1–2 times. That is 2–4 extra checkouts on *every* authenticated route, not just these.
4. **The rest is CPU in Python** (FastAPI/Pydantic validation and serialization, SQLAlchemy ORM row processing, three
   `BaseHTTPMiddleware` layers). One process can only use one core, which is why workers help so much (§4).

**Optimisation plan, in order of value per effort**

| # | Change | Expected gain | Effort / risk |
| --- | --- | --- | --- |
| 0 | Return 503, not 403 `account_inactive`, when the role lookup fails for infrastructure reasons (§3c) | Stops false sign-outs under load | Small; one `except` + a test |
| 1 | 2–4 uvicorn workers (§6) | **Measured:** steady p95 247 → 39 ms at 150 users | Config only; do the checks in §6 first |
| 2 | Load the actor once: the role middleware already fetches the user and roles; keep them on `request.state` and have `require_any_role` / `_require_email` / services reuse them | 2–4 fewer checkouts on every authenticated request (≈1–2.5 ms locally each request, more in prod) | Small, central change; must keep "live DB status/roles win" semantics |
| 3 | One session per request on the hot read paths: pass `client=` through `EmployeeBalanceService` and the profile service so their 7–11 statements share one connection | `/profile/balances` 11 → 1–2 checkouts; est. −5 ms locally (≈−30%) | Medium; follows the existing `client=` repository pattern (doc 02 §2) |
| 4 | Revisit `pool_pre_ping=True`: with `pool_recycle=300` and fewer checkouts it matters less; alternatively keep it and rely on #2–3 | 1 round trip per checkout | Low gain once #2–3 land; dropping it means a stale connection surfaces as one failed request |
| 5 | Only if the 9:30 burst still hurts after 1–4: a single "open the app" call (profile + balances + preferences + unread counts) and checking that Home doesn't refetch them on every focus/navigation | Fewer round trips per page open | Larger: new API contract and frontend change |

**Not worth doing now:** query/index tuning (SQL is fast here), JWT caching (0.04 ms), and replacing the metrics
route scan (< 1 ms). Re-measure after #1–3 before going further.

## 6b. After the fixes: target p95 < 40 ms met

Target: the same **stress profile** (ramp to 200 active users over 17 min), **p95 < 40 ms over the whole run, 0 errors**.

Changes (develop, Nov 2026):

| # | Change | Where |
| --- | --- | --- |
| A | INC-32: a busy/unreachable database during the actor lookup returns **503 "busy, try again"**, never 403 `account_inactive` (still fail-closed: token roles are never trusted) | `app/api/access.py`, `tests/test_actor_lookup_unavailable.py` |
| B | Load the signed-in user + roles **once**, on one connection (`UserRepository.get_login_state`); GET/HEAD requests reuse them instead of querying again | `app/core/request_actor_cache.py`, `app/repositories/user_repository.py`, `app/middleware/actor_roles.py`, `tests/test_request_actor_cache.py` |
| C | `uvicorn[standard]` (uvloop + httptools) | `requirements.txt` |
| D | Configurable workers: `UVICORN_WORKERS` (default **1**; migrations at start-up turned off when > 1) | `docker-entrypoint.sh`, `.env.example` |

**Found on the way — plain `uvicorn --workers` adds ~40 ms to every keep-alive response.** With `--workers`, uvicorn
binds the listening socket itself (`socket.socket(family=AF_INET)`, protocol 0), and asyncio only sets `TCP_NODELAY` on
accepted sockets whose protocol is `IPPROTO_TCP`. So Nagle stays on and, with the client's delayed ACK, every response on
a reused connection waited ~40 ms (measured: first request 6.5 ms, every later one 46–55 ms; 1 worker: 5.5 ms). The BFF
reuses connections, so enabling workers alone would have made production *slower*. uvloop sets `TCP_NODELAY` itself:
after C, reused-connection requests took 5–7 ms. Recorded as doc 07 INC-33.

Connections per request after B (`loadtest/query_profile.py`):

| Endpoint | Before | After |
| --- | --- | --- |
| Most endpoints (unread-count, notifications, announcements, preferences, learning, holidays, my requests) | 4 | **2** |
| `/celebrations` | 5 | 3 |
| `/profile` | 7 | 5 |
| `/profile/balances` | 11 | 9 |

**Result — stress profile, 4 workers, A–D (44,988 requests, 0 errors):**

| Stage | Users | Req/s | p50 | p95 | p99 | max | CPU (all workers) | DB conns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0–1 min | → 10 | 3.1 | 15 ms | 37 ms | 76 ms | 143 ms | 4% | 4 |
| 1–4 min | → 25 | 9.3 | 14 ms | 33 ms | 52 ms | 101 ms | 11% | 8 |
| 4–7 min | → 50 | 20.4 | 12 ms | 26 ms | 40 ms | 80 ms | 20% | 9 |
| 7–10 min | → 100 | 40.2 | 11 ms | 26 ms | 41 ms | 129 ms | 42% | 11 |
| 10–13 min | → 150 | 66.9 | 11 ms | 26 ms | 39 ms | 141 ms | 68% | 15 |
| 13–16 min | → 200 | 93.6 | 11 ms | **27 ms** | 43 ms | 165 ms | 91% (of 4 cores) | 16 |

| Whole run | Before (1 worker, no fixes) | After (4 workers, A–D) |
| --- | --- | --- |
| p50 | 36 ms | **11 ms** |
| **p95** | **628 ms** | **26.3 ms** ✅ |
| p99 | 1,154 ms | 41.8 ms |
| max | 2,493 ms | 165 ms |
| p95 at 200 users | 888 ms | 27 ms |
| Errors | 0 | 0 |

Slowest endpoints at p95 are now `/celebrations` and `/whos-out` (39 ms) and `/profile/balances` (35 ms).

**How much comes from workers vs the code changes?** Same 1-worker test as §4 (150 users held 4 min), with A–C only:

| 150 users held 4 min | 1 worker, before | 1 worker, A–C | 4 workers, no fixes (§4) |
| --- | --- | --- | --- |
| Steady state p50 / p95 / p99 | 65 / 247 / 396 ms | **15 / 64 / 116 ms** | 15 / 39 / 68 ms |
| First-minute burst p95 / p99 | 1,923 / 3,208 ms | 1,588 / 3,458 ms | 1,581 / 2,343 ms |

The code and library changes alone make one process ~4× faster at p95, but **only workers remove the CPU queue** that
causes the burst tail. Meeting the 40 ms target in production therefore needs `UVICORN_WORKERS` > 1.

**Rolling it out:**

1. Deploy A–D as is: `UVICORN_WORKERS` defaults to 1, so behaviour only changes by A–C (all improvements).
2. Per environment, check the DB budget: `UVICORN_WORKERS × (DB_POOL_SIZE + DB_MAX_OVERFLOW)` must fit PgBouncer/Postgres
   (this test peaked at 16 connections with 4 workers; the budget is 40). Then set `UVICORN_WORKERS=2`–`4` and recreate
   the backend (`docker compose up -d webtrak-backend`).
3. Verify: one `[scheduler] job=… STARTING` per job run in the logs (leases), and re-run the smoke profile against the
   environment.

**Still open:** `/profile/balances` uses 9 connections and `/profile` 5. One session per request on those two would
cut them further; not needed for this target, worth doing before traffic grows.

## 7. Limits of this test

- **Same machine for load generator, app and database.** k6 competes for CPU with the backend; real users don't.
- **No BFF, TLS or network.** Real requests add the Next.js proxy hop and network latency on top of these figures.
- **Synthetic, modest data.** 300 people, 18k notifications. Real UAT/prod tables are larger in places (timelogs,
  allocations, history), which matters for list endpoints.
- **Read-only.** No approvals, submissions or uploads. Write paths take advisory locks and send mail after commit; they
  need their own test with test accounts on UAT.
- **Python 3.14 locally vs 3.12 in the image.** Interpreter performance differs somewhat between versions.
- **Single short runs.** Each configuration was run once; differences under ~10% are noise.

## 8. Problems found while setting up the test

| Problem | Cause | Fix |
| --- | --- | --- |
| `/profile/balances/monthly` returned 404 | The k6 script referenced a route that no longer exists | Replaced with the calls the current Home and sidebar make |
| `/whos-out` returned 403 for most users | The script sent employees to an approver-only view (correct backend behaviour) | Org-wide views only for tokens marked `"hr": true` |
| The smoke run passed but stress failed at ~8 users | Smoke uses the first token only, which was an HR user | Documented in `loadtest/README.md`: make sure the first token is an ordinary employee |
| `/profile` returned 500 for every seeded user | Seed emails used `.invalid`, which the profile response's email validation rejects | Seed uses `loadtest.example.com` |
| `/holiday-calendars/company` returned 404 | No `COMPANY` calendar in a fresh database | Seed creates one |
| Copying the local dev DB couldn't be migrated | Old dev DB had drifted (mixed table owners, missing `users.user_type`) | Fresh empty DB via the app's empty-database bootstrap (`alembic upgrade head` creates the ORM schema and stamps head) |

## 9. Reproduce

Commands are in `loadtest/README.md`. Raw outputs from this run (k6 CSV and summaries, resource samples, backend logs)
were kept outside the repository; numbers above are copied from them.
