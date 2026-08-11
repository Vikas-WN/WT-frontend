"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  INTEGRATIONS_BASE_PATH,
  INTEGRATIONS_ENDPOINTS,
  INTEGRATIONS_NAV,
  type IntegrationsEndpoint,
} from "@/components/integrations-api/integrationsSections";
import { cn } from "@/lib/utils";

function MethodBadge({ method }: { method: IntegrationsEndpoint["method"] }) {
  const tone =
    method === "GET"
      ? "bg-emerald-100 text-emerald-800"
      : method === "POST"
        ? "bg-sky-100 text-sky-800"
        : method === "PUT"
          ? "bg-amber-100 text-amber-900"
          : "bg-rose-100 text-rose-800";
  return (
    <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold tracking-wide", tone)}>
      {method}
    </span>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="4.5" y="1" width="7.5" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 4.5h1.5M1 4.5V12H8.5v-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CodeBlock({ title, children }: { title?: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [children]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800/80">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-2">
        {title ? (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy to clipboard"
          className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
        >
          {copied ? (
            <>
              <CheckIcon />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#0f172a] p-4 text-[13px] leading-relaxed text-slate-100">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function EndpointSection({
  id,
  endpoint,
  resolveUrl,
}: {
  id: string;
  endpoint: IntegrationsEndpoint;
  resolveUrl: (template: string) => string;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-200/80 pt-10 first:border-t-0 first:pt-0">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-800">
          {endpoint.path}
        </code>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 capitalize">
        {id.replace(/-/g, " ")}
      </h2>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">{endpoint.description}</p>
      {endpoint.scope ? (
        <p className="mt-2 text-sm text-slate-500">
          Required access: <span className="font-medium text-slate-700">{endpoint.scope}</span>
        </p>
      ) : null}
      {endpoint.queryParams?.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900">Query parameters</h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Param</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Required</th>
                  <th className="px-4 py-2.5 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.queryParams.map((param) => (
                  <tr key={param.name} className="border-t border-slate-200">
                    <td className="px-4 py-2.5 font-mono text-[13px] text-violet-700">{param.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{param.type}</td>
                    <td className="px-4 py-2.5 text-slate-600">{param.required ? "Yes" : "No"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{param.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {endpoint.exampleRequest ? (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Example request</h3>
          <CodeBlock title="bash">{resolveUrl(endpoint.exampleRequest)}</CodeBlock>
        </div>
      ) : null}
      {endpoint.exampleResponse ? (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Example response</h3>
          <CodeBlock title="json">{endpoint.exampleResponse}</CodeBlock>
        </div>
      ) : null}
    </section>
  );
}

export function IntegrationsApiPage() {
  const [origin, setOrigin] = useState("");
  const sectionIds = useMemo(
    () => INTEGRATIONS_NAV.flatMap((group) => group.items.map((item) => item.id)),
    []
  );
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "overview");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Resolves {{ORIGIN}} and {{BASE_URL}} placeholders in curl template strings.
  // Falls back to relative paths until the browser origin is known (SSR/hydration).
  const resolveUrl = useCallback(
    (template: string) =>
      template
        .replace(/\{\{ORIGIN\}\}/g, origin || "")
        .replace(/\{\{BASE_URL\}\}/g, origin ? `${origin}${INTEGRATIONS_BASE_PATH}` : INTEGRATIONS_BASE_PATH),
    [origin]
  );

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveId(id);
          });
        },
        { rootMargin: "-20% 0px -65% 0px", threshold: 0.1 }
      );
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, [sectionIds]);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }, []);

  const curlBaseUrl = origin ? `${origin}${INTEGRATIONS_BASE_PATH}` : INTEGRATIONS_BASE_PATH;

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-3" aria-label="WebTrak home">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/80">
                <Image
                  src="/webtrak-logo.png"
                  alt="WebTrak"
                  width={36}
                  height={36}
                  className="size-full object-contain"
                  priority
                />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  WebTrak
                </p>
                <p className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">
                  Workforce Tracker · Integrations API
                </p>
              </div>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/api-docs"
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              Portal API docs →
            </Link>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              External
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              v1
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200/80 bg-white/70 lg:block">
          <nav className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-8">
            {INTEGRATIONS_NAV.map((group) => (
              <div key={group.title} className="mb-8 last:mb-0">
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => scrollTo(item.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                            isActive
                              ? "bg-indigo-50 font-medium text-indigo-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <article className="mx-auto max-w-3xl">

            <section id="overview" className="scroll-mt-24">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                External Integrations API
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Overview</h1>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                The WebTrak Integrations API lets external systems read workforce data — projects,
                allocations, and employees — via API keys. All integration routes are served under{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">{INTEGRATIONS_BASE_PATH}</code>.
              </p>
              <div className="mt-6">
                <CodeBlock title="Base URL">{curlBaseUrl}</CodeBlock>
              </div>
              <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-950">
                <p className="font-semibold">Who this is for</p>
                <p className="mt-1 leading-relaxed text-indigo-900/90">
                  External applications, automation pipelines, and third-party systems that need
                  programmatic access to WebTrak workforce data. Authentication is via API keys only —
                  no user session required.
                </p>
              </div>
            </section>

            <section id="getting-started" className="scroll-mt-24 border-t border-slate-200/80 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Getting started</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-slate-600">
                <li>
                  Contact the WebTrak platform team to have an API key issued for your application.
                  Keys have the format <code className="rounded bg-slate-100 px-1">wtak_...</code> and
                  are issued with <code className="rounded bg-slate-100 px-1">ROLE_HR</code> access.
                </li>
                <li>
                  Pass the key as a Bearer token in every request:{" "}
                  <code className="rounded bg-slate-100 px-1">Authorization: Bearer wtak_...</code>
                </li>
                <li>Use the health endpoint to verify connectivity before making data requests.</li>
              </ol>
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Verify your key</h3>
                <CodeBlock title="bash">{resolveUrl(`curl --location '{{BASE_URL}}/projects' \\\n  --header 'Authorization: Bearer wtak_your_api_key'`)}</CodeBlock>
              </div>
            </section>

            <section id="authentication" className="scroll-mt-24 border-t border-slate-200/80 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Authentication</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                All integration endpoints (except{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">/integrations/health</code>)
                require a <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">wtak_</code> API
                key. Session cookies and user JWTs are explicitly rejected — this API is for machine-to-machine use only.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Header</th>
                      <th className="px-4 py-2.5 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr>
                      <td className="px-4 py-2.5 font-mono text-[13px]">Authorization</td>
                      <td className="px-4 py-2.5 font-mono text-[13px]">Bearer wtak_...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                <p className="font-semibold">Key management</p>
                <p className="mt-1 leading-relaxed text-amber-900/90">
                  API keys can be created and revoked by WebTrak admins via the portal settings. Each key
                  is associated with a specific application and can be scoped to specific roles. Rotate
                  keys immediately if compromised.
                </p>
              </div>
            </section>

            <section id="conventions" className="scroll-mt-24 border-t border-slate-200/80 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Conventions</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-slate-600">
                <li>All endpoints return JSON with a top-level <code className="rounded bg-slate-100 px-1">message</code> string and a <code className="rounded bg-slate-100 px-1">data</code> object.</li>
                <li>List endpoints return <code className="rounded bg-slate-100 px-1">data.items</code> array plus <code className="rounded bg-slate-100 px-1">data.total</code>, <code className="rounded bg-slate-100 px-1">data.page</code>, and <code className="rounded bg-slate-100 px-1">data.size</code>.</li>
                <li>Dates are in <code className="rounded bg-slate-100 px-1">YYYY-MM-DD</code> ISO format.</li>
                <li>All list endpoints are read-only (GET). No write operations are exposed through the integrations API.</li>
                <li>Page size is capped at 100 per request. Use <code className="rounded bg-slate-100 px-1">page</code> to paginate through larger datasets.</li>
              </ul>
            </section>

            {Object.entries(INTEGRATIONS_ENDPOINTS).map(([id, endpoint]) => (
              <EndpointSection key={id} id={id} endpoint={endpoint} resolveUrl={resolveUrl} />
            ))}

            <section id="errors" className="scroll-mt-24 border-t border-slate-200/80 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Errors</h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">400</td>
                      <td className="px-4 py-2.5">Invalid query parameter value.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">401</td>
                      <td className="px-4 py-2.5">Missing API key, invalid key, or non-API-key credential supplied.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">403</td>
                      <td className="px-4 py-2.5">API key exists but lacks the required role for this endpoint.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">404</td>
                      <td className="px-4 py-2.5">Resource not found.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">422</td>
                      <td className="px-4 py-2.5">Request validation error — check query parameter types.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">500</td>
                      <td className="px-4 py-2.5">Internal server error — contact the WebTrak platform team.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="support" className="scroll-mt-24 border-t border-slate-200/80 pt-10 pb-16">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Support</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                For API key requests, access issues, or integration support, contact the WebTrak platform
                team. Include the endpoint path, approximate timestamp, and the application name when
                reporting failures.
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Portal API reference (for browser session auth):{" "}
                <Link href="/api-docs" className="text-indigo-600 hover:underline">
                  /api-docs
                </Link>
              </p>
            </section>

          </article>
        </main>
      </div>
    </div>
  );
}
