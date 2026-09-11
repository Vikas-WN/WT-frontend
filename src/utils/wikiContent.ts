/**
 * Turns plain-text wiki/policy content into a line-typed structure for
 * rendering as React elements — never HTML. Any employee can write a WIKI
 * page and every employee reads it, so there is no markdown-to-HTML step
 * here to avoid: content always goes through React's normal text escaping,
 * nothing is ever parsed as markup.
 *
 * Recognised line prefixes (checked in order):
 *  - "Section N: ..."      -> heading (h3)
 *  - "S.N.N ..." / "N. "   -> sub-heading (h4) — handbook subsection markers
 *    and numbered-list-looking lines both read fine as a small heading
 *  - "- " / "* " / "● "    -> bullet list item
 *  - blank line            -> paragraph break
 *  - anything else         -> paragraph line
 */

export type WikiLine =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "bullet"; text: string }
  | { type: "blank" }
  | { type: "text"; text: string };

const SECTION_RE = /^Section\s+\d+:/i;
const SUBSECTION_RE = /^S\.\d+(\.\d+)?\s+\S/;
const NUMBERED_RE = /^\d+\.\s+\S/;
const BULLET_RE = /^[-*●]\s+/;

export function parseWikiContent(content: string): WikiLine[] {
  const rawLines = (content ?? "").replace(/\r\n/g, "\n").split("\n");
  return rawLines.map((raw): WikiLine => {
    const line = raw.trim();
    if (!line) return { type: "blank" };
    if (SECTION_RE.test(line)) return { type: "heading", text: line };
    if (SUBSECTION_RE.test(line) || NUMBERED_RE.test(line)) {
      return { type: "subheading", text: line };
    }
    if (BULLET_RE.test(line)) return { type: "bullet", text: line.replace(BULLET_RE, "") };
    return { type: "text", text: line };
  });
}

/** Short, whitespace-collapsed preview for list rows / search results. */
export function excerptOf(content: string, limit = 180): string {
  const text = (content ?? "").replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : `${text.slice(0, limit).trimEnd()}…`;
}
