"use client";

import { useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { wikiMarkdownComponents, wikiUrlTransform } from "@/utils/wikiMarkdown";

/** Renders wiki/policy `content` as markdown. Raw HTML in the source is not
 *  executed (skipHtml; no rehype-raw). Links/images are http(s)/mailto only. */
export function WikiContentView({ content }: { content: string }) {
  const source = content ?? "";
  const empty = !source.trim();

  const body = useMemo(
    () => (
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={wikiUrlTransform}
        components={wikiMarkdownComponents}
      >
        {source}
      </Markdown>
    ),
    [source]
  );

  if (empty) {
    return <p className="text-sm text-wt-text-muted">This page is empty.</p>;
  }

  return <div className="space-y-3">{body}</div>;
}
