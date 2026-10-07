# WebTrak observability

How we know WebTrak is healthy, what people experience, and how it is being used — and how to look at all of it in production.

## 1. What you get

| Question | Where you look | Fed by |
|---|---|---|
| Is the site up right now? Is the certificate about to expire? | Grafana → **SLO & infrastructure** | blackbox probes of the public URLs |
| Are we meeting our targets (99.5% succeed, 95% under 1 s)? | Grafana → **SLO & infrastructure** | backend `/metrics` + recording rules |
| How fast do pages feel to real people? Which pages are slow/broken? | Grafana → **Frontend experience** | browser telemetry (`POST /api/v1/telemetry/events`) |
| Who uses the product, which pages, how many requests/Pulse, adoption | Grafana → **Product usage** | `analytics_*` views in Postgres (aggregates only) |
| Are approvals stuck? Are e-mails failing? | Grafana → **Business health** | gauges refreshed from the DB on each scrape |
| What exactly happened to one request? | Grafana → **Logs** (paste the request id) | JSON logs → Alloy → Loki |
| Why was that request slow? | Grafana → Explore → Tempo | OpenTelemetry traces (opt-in) |
| Exceptions with stack traces, grouped, per release | Sentry or GlitchTip | `sentry-sdk` (opt-in) |
| Is the machine / database healthy? | Grafana → **SLO & infrastructure** | node-exporter, cAdvisor, postgres-exporter |
| Someone must be told | Slack / e-mail | Alertmanager (30 alert rules + SLO burn-rate alerts) |

### How the pieces connect

```
Browser ──(page views, web vitals, errors, failed calls; batched)──► /api/v1/telemetry/events ─┐
   │  X-Request-ID                                                                              │
   ▼                                                                                            ▼
Next.js BFF  ── forwards X-Request-ID, logs slow upstream ──►  FastAPI backend ── /metrics ──► Prometheus ──► Alertmanager ──► Slack/e-mail
 (/api/health)                                                  JSON logs (request_id, trace_id) ─► Alloy ─► Loki ─┐
                                                                traces (OTLP) ─► Collector ─► Tempo ───────────────┼──► Grafana
                                                                errors ─► Sentry/GlitchTip                          │
                                       Postgres analytics_* views (read-only role) ────────────────────────────────┘
```

One **request id** is created in the browser (or the BFF) and appears in the browser error report, the BFF log, the backend log, the
response header `X-Request-ID` and the trace. Given any one of them you can find the rest.

## 2. Turn it on in production

### 2a. The application (do first — this is what produces the data)

Backend environment (`.env` / deployment settings):

| Variable | Value | Why |
|---|---|---|
| `APP_ENV` | `prod` | JSON logs switch on automatically for `prod`/`uat` |
| `LOG_FORMAT` | `auto` (default), `json` or `text` | force a format if needed |
| `APP_RELEASE` | git SHA / version | labels errors and metrics with the release |
| `METRICS_ENABLED` | `true` | exposes `/metrics` |
| `METRICS_AUTH_TOKEN` | long random string | **set this if `/metrics` is reachable from the internet**; put the same value in `observability/secrets/metrics_token` |
| `SENTRY_DSN` | from Sentry/GlitchTip | optional — exception tracking; PII is scrubbed before sending |
| `SENTRY_TRACES_SAMPLE_RATE` | `0`–`0.2` | optional |
| `OTEL_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT` | `true`, `http://<monitoring-host>:4318` | optional — distributed traces |

Frontend: build with the release label, e.g.
`docker build --build-arg NEXT_PUBLIC_APP_RELEASE=$(git rev-parse --short HEAD) .`

The new database migration (`20261019_01`, adds `analytics_page_views` and five `analytics_*` views) runs automatically on backend start.

### 2b. The monitoring stack

Run it on a **separate small machine** (2 vCPU / 4 GB is plenty) so that if the app host dies you still get the alert. It can share the app host to start, but then host-down alerts can't fire.

```bash
git clone <repo> && cd webtrak1.0/observability
cp .env.observability.example .env          # set the passwords, GRAFANA_DOMAIN, etc.
mkdir -p secrets                            # create the files listed in .env.observability.example
# edit: prometheus/prometheus.yml (backend address), prometheus/targets/uptime.yml (your public URLs),
#       alertmanager/alertmanager.yml (SMTP + recipients)
psql "$DATABASE_URL" -v pw="'strong-password'" -f sql/grafana_ro.sql   # read-only analytics user
docker compose -f docker-compose.observability.yml -f docker-compose.prod.yml up -d
```

Point DNS for `GRAFANA_DOMAIN` at the machine; Caddy obtains the HTTPS certificate automatically. Only ports 80/443 are exposed — Prometheus,
Alertmanager, Loki and Tempo are reachable only through Grafana. Use a firewall to allow the backend host to reach port 4318 (traces) if you
enable them. **Locally:** drop the prod overlay and open `http://localhost:3001`.

Alloy reads the logs of every container on the machine it runs on, so for log search run an Alloy (the same `alloy/config.alloy`, with
`loki.write` pointing at your Loki address) on the **app host** too.

## 3. "In prod, how do I see the analytics?" — step by step

1. Open `https://<GRAFANA_DOMAIN>` and sign in (`GF_SECURITY_ADMIN_USER` / `GF_SECURITY_ADMIN_PASSWORD`; create named users for HR/managers under *Administration → Users*, role **Viewer**).
2. **Dashboards** menu → folder of WebTrak dashboards:
   - **Product usage** — daily/weekly/monthly active people, adoption %, most used pages, requests by type and outcome, Pulse by month, headcount. Change the time picker (top right) for any period. This is the one to show HR/leadership.
   - **Frontend experience** — Core Web Vitals per page, browser errors, failed calls, most visited pages, feature usage.
   - **Business health** — pending requests, requests stuck over 48 h, e-mail failures.
   - **SLO & infrastructure** — uptime, TLS days left, error budget, CPU/memory/disk/containers/database.
   - **Logs** — search; type a request id into the box at the top.
   - **API overview / Background jobs / Resilience** — backend internals.
3. Alerts: **Alerting → Alert rules / Active notifications** in Grafana shows what is firing; Alertmanager sends Slack/e-mail.

Usage numbers appear after the new frontend + backend are deployed and people use the app (the *Product usage* adoption tiles fill in over the first days).

## 4. Runbook

### Runbook: site down
Alert `WebtrakProbeFailed` / `PostgresDown`. 1) Open *SLO & infrastructure*: which address fails? 2) Frontend `/api/health` failing → check the web container (`docker ps`, `docker logs`). 3) Only `/api/v1/readyz` failing → backend or database; check *Logs* filtered to `ERROR`, then database connections panel. 4) Roll back to the previous image if it began right after a deploy (the release label is on every error and log line).

### Runbook: errors or slowness
Alerts `WebtrakAvailabilityBudgetBurn*`, `WebtrakLatencyBudgetBurn`, `HighErrorRate`. 1) *API overview* → which route has the 5xx/slow requests? 2) *Logs* → `level=ERROR` around that time; copy the `request_id`. 3) *Explore → Tempo* for the trace (if enabled). 4) Check *Resilience* for an open circuit breaker (SMTP, object storage, etc.).

### Runbook: people say "it's slow / broken for me"
Ask for the time and page. *Frontend experience* → that page's LCP/INP and errors. If the browser shows failed calls but the backend's numbers are fine, suspect network/proxy/DNS. If an API call failed, the browser's network tab shows the `X-Request-ID` response header → paste it into *Logs*; client errors reported by the browser are also searchable in *Logs* (`client_error`).

### Runbook: approvals stuck
`WebtrakRequestsWaitingTooLong` → *Business health*; confirm the approver notifications are being delivered (`WebtrakEmailsFailing`).

## 5. Privacy and cost guard-rails

- Telemetry never contains names, e-mails or free text from forms. Route paths are reduced to templates (`/dashboard/leave/[id]`), event names are capped, and URLs are stripped of query strings. Sentry events are scrubbed of e-mails, tokens and cookies before leaving the server.
- Grafana's database user can read only the five aggregate `analytics_*` views.
- Telemetry intake is rate-limited and size-capped; metric label cardinality is bounded.
- Retention: metrics 90 days, logs 30 days, traces per `tempo/tempo.yaml`. Raise/lower in `docker-compose.observability.yml` and `loki/loki.yaml`. `analytics_page_views` holds one row per person per page per day; prune it with a periodic `DELETE ... WHERE day < now() - interval '2 years'` if desired.

## 6. Alternatives

- **No server to run?** Use Grafana Cloud's free tier: keep Alloy on the app host with `prometheus.remote_write` / `loki.write` pointing at Grafana Cloud, and import the JSON from `observability/grafana/dashboards/`.
- **Error tracking:** Sentry cloud (free tier) or self-hosted GlitchTip — both accept the same `SENTRY_DSN`.
- Dashboards are generated by `python3 observability/tools/build_dashboards.py`; edit that and re-run rather than hand-editing JSON.

## 7. Verified vs. not verified

Verified locally: all unit tests and an end-to-end script against a real Postgres (telemetry intake → metrics → analytics views); Prometheus alert/recording rules and every dashboard PromQL expression parse with `promtool`; every dashboard SQL query runs against the real views; compose files validate. **Not verified** (needs your servers): the containers themselves starting, Slack/SMTP delivery, Let's Encrypt, and dashboards rendering with live data.
