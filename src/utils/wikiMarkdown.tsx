import type { Components } from "react-markdown";
import { defaultUrlTransform } from "react-markdown";

import { cn } from "@/lib/utils";

/** Only allow navigable http(s) and mailto URLs. Everything else (including
 *  javascript: and relative paths) is dropped so employee-authored pages
 *  cannot inject a dangerous href. */
export function wikiUrlTransform(url: string): string {
  const safe = defaultUrlTransform(url);
  if (!safe) return "";
  if (/^(https?:|mailto:)/i.test(safe)) return safe;
  return "";
}

/** Markdown images are URL strings, never Blobs. React 19 types img.src as
 *  string | Blob; only https URLs are shown. */
export function httpsImageSrc(src: string | Blob | undefined): string | null {
  if (typeof src !== "string") return null;
  if (!/^https:/i.test(src)) return null;
  return src;
}

export const wikiMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 text-xl font-semibold text-wt-text first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 text-lg font-semibold text-wt-text first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 text-base font-semibold text-wt-text first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 text-sm font-semibold text-wt-text">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="mt-3 text-sm font-semibold text-wt-text">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="mt-3 text-xs font-semibold uppercase tracking-wide text-wt-text-muted">{children}</h6>
  ),
  p: ({ children }) => <p className="text-sm leading-relaxed text-wt-text">{children}</p>,
  ul: ({ children }) => (
    <ul className="ml-5 list-disc space-y-1 text-sm text-wt-text">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="ml-5 list-decimal space-y-1 text-sm text-wt-text">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-wt-border pl-3 text-sm text-wt-text-muted">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-wt-border" />,
  strong: ({ children }) => <strong className="font-semibold text-wt-text">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  del: ({ children }) => <del className="text-wt-text-muted">{children}</del>,
  a: ({ href, children }) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--wt-brand)] underline-offset-2 hover:underline"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  img: ({ src, alt }) => {
    const href = httpsImageSrc(src);
    if (!href) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- employee markdown; https only
      <img src={href} alt={alt ?? ""} className="max-h-80 max-w-full rounded-lg border border-wt-border" />
    );
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-xl border border-wt-border bg-wt-surface-2 p-3 text-[0.8rem] leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const fenced = Boolean(className);
    return (
      <code
        className={cn(
          "font-mono",
          fenced ? "text-[0.8rem] text-wt-text" : "rounded bg-wt-surface-2 px-1 py-0.5 text-[0.85em] text-wt-text"
        )}
      >
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm text-wt-text">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-wt-surface-2">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-wt-border px-2.5 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-wt-border px-2.5 py-1.5 align-top">{children}</td>
  ),
  input: ({ type, checked }) =>
    type === "checkbox" ? (
      <input type="checkbox" checked={Boolean(checked)} disabled className="mr-2 align-middle" />
    ) : null,
};
