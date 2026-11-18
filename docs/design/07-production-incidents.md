# 07 — Production incident log

Real problems found in UAT or production between April and November 2026, grouped by failure class. Each entry gives the
symptom users saw, the root cause, the fix (commit), and the guard that now stops a repeat. The classes matter more
than the individual bugs: most new bugs are a new instance of an old class.

## Class A — Silent failures ("it looked like it worked")

| ID | Symptom | Root cause | Fix | Guard |
| --- | --- | --- | --- | --- |
| INC-02 | UAT employees never received any email; in-app notifications worked | Non-prod SMTP redirect sent every mail to two dev inboxes; nothing logged it | Redirect disabled for UAT by config; loud warning logged when redirect or missing SMTP drops mail | Warning on every redirected/dropped mail (doc 02 §8) |
| INC-03 | Comp-off usage requests "submitted and assigned" but no manager could act | Manager picked without an approver role was silently dropped from routing while their email stayed on the row | Explicit 400 instead of a silent drop | Test in `test_comp_off_usage.py` |
| INC-04 | SMTP sends vanished intermittently while in-app notices arrived | `asyncio.create_task` without a held reference; the task was garbage-collected | `spawn_background_task` holds references and logs failures | doc 02 §6 |
| INC-05 | Relay assistant "unavailable" on UAT although its env vars were set | Next.js inlined `NEXT_PUBLIC_*` at build time, even in a server route | Read env through a computed name at request time (`0ace51e`) | Rule in doc 06 §5; verified by running the standalone build with runtime-only values |
| INC-06 | WK Business project changes never reached WebTrak | Sync path never applied updates | Sync fixed; any WK failure now serves the last local copy behind a breaker | Circuit breaker + stale fallback |

## Class B — Security and access

| ID | Symptom | Root cause | Fix | Guard |
| --- | --- | --- | --- | --- |
| INC-01 | Employee received a "Review & decide" email for their own leave and could approve it | The manager's signed link (a credential) was in an email CC'd to the requester, secondary managers and HR | Manager email sent uncopied; one plain informational copy for everyone else (`6fd45f8`) | Tests assert a link-carrying email is never CC'd; doc 02 §7 rule |
| INC-07 | Several routes reachable without a session (found in full review) | Auth is called inside handlers; a forgotten call leaves the route open | Gaps closed (`fix: close auth gaps…`) | `tests/test_route_auth_coverage.py` walks every route |
| INC-08 | Signing in or out on one device ended sessions everywhere | All refresh tokens revoked on login/logout | Per-device sessions (`8e09b68`) | `scripts/e2e_sessions_check.py` |
| INC-09 | Refresh storms and random sign-outs | "No session" returned 403; network blip during refresh treated as logout | 401 for no session; refresh single-flight and tolerant of transient errors | Documented status contract (doc 01 §4) |
| INC-32 | (Found in load testing, Nov 2026, not yet seen by users) Under overload, active employees signed out with "Your account is inactive" | Role lookup failing on a DB pool timeout is handled as "inactive" (fail closed) and returns 403 `account_inactive`, which the frontend treats as deactivation | Infrastructure errors (pool timeout, driver/connection errors) → 503 "busy, try again"; still fail closed | `tests/test_actor_lookup_unavailable.py` (fails on the old code); doc 10 §3c |
| INC-33 | (Found in load testing, Nov 2026) With `uvicorn --workers`, every response on a reused connection took ~40 ms longer | uvicorn binds the worker socket with protocol 0, so asyncio never sets `TCP_NODELAY`; Nagle + delayed ACK | `uvicorn[standard]` (uvloop sets `TCP_NODELAY`) | Measured before enabling workers anywhere; doc 10 §6b |

## Class C — Concurrency and data integrity

| ID | Symptom | Root cause | Fix | Guard |
| --- | --- | --- | --- | --- |
| INC-10 | Occasional wrong balances when approvals overlapped; requests hanging under load | Read-modify-write over several rows without one lock; unbounded waits | Per-person advisory locks; per-transaction lock/statement/idle timeouts (`002c94d`) | doc 02 §2–3 |
| INC-11 | Joiners onboarded before their joining month got the month credited twice | Onboarding credited the month and the month job credited it again from that balance | Joining month credited once (`6c0cd4b`); report script for past cases | Tests on onboarding + job; `scripts/report_double_joining_credit.py` |
| INC-12 | Newest allocations missing from HR lists | API returns 200 rows per page oldest first; the page read only page 0 | Read every page (`26dfd6b`, frontend) | Checklist item doc 02 §12 |
| INC-13 | Re-running the accrual job wiped leave taken that month | Job rebuilds the month from last month's balance | Skip people who already have that month's ACCRUAL row | Idempotency test in `test_scheduled_jobs_service.py` |
| INC-14 | Designation/role creation failed with primary-key collisions after imports | Sequences behind `max(id)` after bulk loads | Sequence resync + retry | Resync in seed path |

## Class D — Dates, time zones and calendars

| ID | Symptom | Root cause | Fix |
| --- | --- | --- | --- |
| INC-15 | Allocation list/forecast 500s; meeting-room crashes | Naive vs aware datetime comparisons and binds | Normalise to aware UTC; business dates in IST |
| INC-16 | Who's out empty; timelog dates wrong format | Mixed `dd/mm/yyyy` and ISO across endpoints and the client | One API date contract (`DATE_API_CONTRACT.md`), serializers on every endpoint |
| INC-17 | A mandatory holiday inside a leave counted as a leave day | Holidays not applied per person's calendar | Per-calendar holiday exclusion (`ab3186a`, `faa7a4a`) |
| INC-18 | "Optional with Muharram" imported as mandatory | Spreadsheet parser read one block only | Optional blocks/sheets parsed; re-import script |
| INC-19 | Future-month leave reduced today's balance | Deducted immediately instead of reserving | RESERVE now, DEDUCT when the month's balance exists (`aa05f77`) |

## Class E — Latency and timeouts

| ID | Symptom | Root cause | Fix |
| --- | --- | --- | --- |
| INC-20 | Bug report form timed out (~36 s) and users resubmitted | Per-recipient SMTP fan-out inside the request, past the 30 s client timeout | Respond immediately; notify in background (`67cf1e9`) |
| INC-21 | Submitting leave/WFH slow | Emails and SSE publish awaited in the request | After-response delivery (`a6f002a`) |
| INC-22 | Offboarding, balances, onboarding resend slow | Heavy ORM loads | Lean queries + async delivery (perf commit) |

## Class F — Build, deploy and configuration

| ID | Symptom | Root cause | Fix |
| --- | --- | --- | --- |
| INC-23 | UAT build failed on a type error | No CI; `tsc` only runs in `next build` on the server | Fixed; CI recommended (doc 01 §8) |
| INC-24 | UAT BFF returned 500 / hit the wrong backend | Build-time rewrites baked localhost into the image | Runtime catch-all proxy using `API_BASE_URL` |
| INC-25 | Render build broke | Duplicate `pool_size` kwargs | Removed |
| INC-26 | Backend didn't pick up new env on UAT | Edited `.env` but `restart` doesn't reload `env_file`; one paste duplicated a placeholder block | `docker compose up -d webtrak-backend`; duplicates removed with a backup (doc 08) |
| INC-27 | Profile photos lost on each deploy | Stored on the container disk | Moved to the database, then object storage with DB fallback |

## Class G — Business-rule mismatches

| ID | Symptom | Root cause | Fix |
| --- | --- | --- | --- |
| INC-28 | Half-day leave refused on a half-day WFH day (bug #11) | Leave/WFH treated as exclusive regardless of half days | Two halves may share a day; never a third (`9cdad4f`), later extended for emergency leave (`180037b`) |
| INC-29 | Leave policy disputes (joining month, encashment) | Code followed the handbook's example, which contradicted its rule | Rules decided with HR and encoded in `leave_accrual_policy.py`; later changed again (`43c6985`) — see doc 03 |
| INC-30 | Offboarded people and ended allocations cluttered allocation lists; talent pool invisible there | No current/history split; BENCH rows filtered out | Current/History views, talent-pool rows read-only with "Allocate" (`3436c81`) |
| INC-31 | Email buttons opened 404 pages | CTA map pointed at routes that didn't exist | Fixed map + guard test (`56c49f2`) |

## Lessons (what we now do by default)

1. **Log when configuration makes a feature a no-op.** Classes A and F are mostly "it was configured, just not the way
   we thought".
2. **Credentials travel to exactly one person.** Anything that acts as someone (signed links, tokens) is never CC'd.
3. **Lock the whole read-modify-write, bound every wait.**
4. **Side effects after commit, outside the request.**
5. **Paginate on both ends**: the server pages, the client reads all pages it needs.
6. **Make the dangerous omission a failing test** (route auth, CTA links, release notes).
7. **Verify on the real thing**: e2e scripts against Postgres; runtime-only env when testing config; signed calls to
   the public URL when wiring integrations.
