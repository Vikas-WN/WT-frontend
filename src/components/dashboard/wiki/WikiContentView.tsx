"use client";

import { parseWikiContent, type WikiLine } from "@/utils/wikiContent";

/** Renders parsed wiki/policy content as React elements — text only, never
 *  HTML, so there is no XSS surface no matter who wrote the page. */
export function WikiContentView({ content }: { content: string }) {
  const lines = parseWikiContent(content);
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="ml-5 list-disc space-y-1 text-sm text-wt-text">
        {bulletBuffer.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line: WikiLine, idx) => {
    if (line.type === "bullet") {
      bulletBuffer.push(line.text);
      return;
    }
    flushBullets(`ul-${idx}`);
    if (line.type === "heading") {
      blocks.push(
        <h3 key={idx} className="mt-6 text-base font-semibold text-wt-text first:mt-0">
          {line.text}
        </h3>
      );
    } else if (line.type === "subheading") {
      blocks.push(
        <h4 key={idx} className="mt-4 text-sm font-semibold text-wt-text">
          {line.text}
        </h4>
      );
    } else if (line.type === "text") {
      blocks.push(
        <p key={idx} className="text-sm leading-relaxed text-wt-text">
          {line.text}
        </p>
      );
    }
    // blank lines just create spacing via the sibling margins above/below
  });
  flushBullets("ul-end");

  if (blocks.length === 0) {
    return <p className="text-sm text-wt-text-muted">This page is empty.</p>;
  }

  return <div className="space-y-2">{blocks}</div>;
}
