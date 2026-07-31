"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  API_DOCS_BASE_URL,
  API_DOCS_ENDPOINTS,
  API_DOCS_NAV,
  type ApiDocsEndpoint,
} from "@/components/api-docs/docsSections";
import { cn } from "@/lib/utils";

function MethodBadge({ method }: { method: ApiDocsEndpoint["method"] }) {
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

function CodeBlock({ title, children }: { title?: string; children: string }) {
  return (
    <div className="api-docs-code-block overflow-hidden rounded-lg border border-slate-800/80">
      {title ? (
        <div className="border-b border-white/10 bg-slate-900/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </div>
      ) : null}
      <pre className="overflow-x-auto bg-[#0f172a] p-4 text-[13px] leading-relaxed text-slate-100">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function EndpointSection({ id, endpoint }: { id: string; endpoint: ApiDocsEndpoint }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-200/80 pt-10 first:border-t-0 first:pt-0">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-800">
          {API_DOCS_BASE_URL}
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
          <h3 className="text-sm font-semibold text-slate-900">Query parameters (optional)</h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Param</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.queryParams.map((param) => (
                  <tr key={param.name} className="border-t border-slate-200">
                    <td className="px-4 py-2.5 font-mono text-[13px] text-violet-700">{param.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{param.type}</td>
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
          <CodeBlock title="bash">{endpoint.exampleRequest}</CodeBlock>
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

export function ApiDocsPage() {
  const [origin, setOrigin] = useState("");
  const sectionIds = useMemo(
    () => API_DOCS_NAV.flatMap((group) => group.items.map((item) => item.id)),
    []
  );
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "overview");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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

  return (
    <div className="api-docs-root min-h-screen bg-[#f4f5f7] text-slate-900">
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
                  Workforce Tracker · API Reference
                </p>
              </div>
            </Link>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            v1
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200/80 bg-white/70 lg:block">
          <nav className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-8">
            {API_DOCS_NAV.map((group) => (
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
                              ? "bg-violet-50 font-medium text-violet-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span>{item.label}</span>
                          {item.path ? (
                            <code className="text-[10px] text-slate-400">{item.path}</code>
                          ) : null}
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
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Overview</h1>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                The WebTrak API powers workforce operations — employee profiles, project allocation,
                leave and WFH, timelogs, clients, and HR reporting. All routes are served from the
                application origin under <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">{API_DOCS_BASE_URL}</code>.
              </p>
              <div className="mt-6">
                <CodeBlock title="Base URL">
                  {origin ? `${origin}${API_DOCS_BASE_URL}` : API_DOCS_BASE_URL}
                </CodeBlock>
              </div>
              <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
                <p className="font-semibold">Who this is for</p>
                <p className="mt-1 leading-relaxed text-sky-900/90">
                  WebTrak portal developers, internal integrators, and operators wiring automations
                  against the BFF. Client master data is synchronized from WK Business when server
                  integration credentials are configured.
                </p>
              </div>
            </section>

            <section id="getting-started" className="scroll-mt-24 border-t border-slate-200/80 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Getting started</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-slate-600">
                <li>Sign in through the WebTrak portal (Google SSO) to obtain session cookies.</li>
                <li>Call API routes with credentials included (<code className="rounded bg-slate-100 px-1">credentials: &quot;include&quot;</code> in fetch, or <code className="rounded bg-slate-100 px-1">-b cookies.txt</code> in curl).</li>
                <li>Use role-appropriate endpoints — HR, Manager, and Employee scopes differ per route.</li>
                <li>For client lists, prefer <code className="rounded bg-slate-100 px-1">GET /masters/clients</code>; the server proxies WK Business when configured.</li>
              </ol>
              <div className="mt-6">
                <CodeBlock title="bash">{`curl -b "accessToken=<token>" \\\n  "${API_DOCS_BASE_URL}/masters/clients?active_only=true"`}</CodeBlock>
              </div>
            </section>

            <section id="authentication" className="scroll-mt-24 border-t border-slate-200/80 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Authentication</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Browser clients authenticate with Google OAuth and receive HttpOnly session cookies
                (<code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">accessToken</code>,{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">refreshToken</code>,{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">tokenId</code>).
                Server-to-server callers should use the same cookie jar or forward cookies from an
                authenticated portal session.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-slate-600">
                <li>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">GET /api/v1/auth/me</code> — current user profile and roles
                </li>
                <li>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">POST /api/v1/auth/refresh</code> — rotate access token
                </li>
                <li>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">POST /api/v1/auth/logout</code> — end session
                </li>
              </ul>
            </section>

            <section id="conventions" className="scroll-mt-24 border-t border-slate-200/80 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Conventions</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-slate-600">
                <li>JSON request and response bodies use camelCase aliases where noted in schemas.</li>
                <li>Dates are ISO <code className="rounded bg-slate-100 px-1">YYYY-MM-DD</code> unless a timestamp is required.</li>
                <li>List endpoints return <code className="rounded bg-slate-100 px-1">data.items</code> with pagination metadata when applicable.</li>
                <li>Errors use HTTP status codes with a <code className="rounded bg-slate-100 px-1">detail</code> string from FastAPI.</li>
              </ul>
            </section>

            {Object.entries(API_DOCS_ENDPOINTS).map(([id, endpoint]) => (
              <EndpointSection key={id} id={id} endpoint={endpoint} />
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
                      <td className="px-4 py-2.5">Validation failed or business rule rejected the request.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">401</td>
                      <td className="px-4 py-2.5">Missing or expired session.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">403</td>
                      <td className="px-4 py-2.5">Authenticated but missing required role for the route.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">404</td>
                      <td className="px-4 py-2.5">Resource not found.</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-2.5 font-mono">502</td>
                      <td className="px-4 py-2.5">Upstream integration (e.g. WK Business clients) unavailable.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="support" className="scroll-mt-24 border-t border-slate-200/80 pt-10 pb-16">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Support</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                For API access issues, contact the WebTrak platform team. Include the request path,
                approximate timestamp, and your portal email when reporting failures.
              </p>
              <p className="mt-4 text-sm text-slate-500">
                WK Business client source:{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                  https://wk-business.webknot-dev.in/api/integrations/v1/clients
                </code>
              </p>
            </section>
          </article>
        </main>
      </div>
    </div>
  );
}
