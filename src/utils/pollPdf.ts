import { jsPDF } from "jspdf";

import type { PollResults } from "@/types/announcement";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";

const MARGIN = 48;
const PAGE_HEIGHT = 842;
const PAGE_WIDTH = 595;
const LINE = 15;

/** A4 writer that wraps text and starts a new page when it runs out of room. */
class Writer {
  readonly doc = new jsPDF({ unit: "pt", format: "a4" });
  y = MARGIN;

  private ensure(height: number) {
    if (this.y + height > PAGE_HEIGHT - MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  text(value: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {}) {
    const { size = 10, bold = false, color = [15, 23, 42], indent = 0, gap = 0 } = opts;
    this.doc.setFont("helvetica", bold ? "bold" : "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
    const lines = this.doc.splitTextToSize(value, PAGE_WIDTH - MARGIN * 2 - indent) as string[];
    for (const line of lines) {
      this.ensure(LINE);
      this.doc.text(line, MARGIN + indent, this.y);
      this.y += size + 5;
    }
    this.y += gap;
  }
}

function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "poll";
}

/** Builds and downloads a PDF of a poll's results: tallies, who chose what, and who hasn't voted. */
export function exportPollPdf(results: PollResults): void {
  const w = new Writer();
  w.text("WebTrak · Poll results", { size: 9, color: [100, 116, 139], gap: 4 });
  w.text(results.title, { size: 18, bold: true, gap: 2 });
  w.text(results.question, { size: 12, color: [51, 65, 85], gap: 6 });
  w.text(
    `${results.total_voters} of ${results.recipient_count} voted${results.multiple ? " · multiple choices allowed" : ""} · Generated ${new Date().toLocaleString()}`,
    { size: 9, color: [100, 116, 139], gap: 14 }
  );

  for (const option of results.options) {
    const percent = results.total_voters > 0 ? Math.round((option.votes / results.total_voters) * 100) : 0;
    w.text(`${option.label} — ${option.votes} (${percent}%)`, { size: 11, bold: true, gap: 2 });
    if (option.voters.length === 0) w.text("No votes", { color: [100, 116, 139], indent: 12, gap: 8 });
    option.voters.forEach((person, index) =>
      w.text(
        `${person.name} <${person.email}>${person.voted_at ? ` · ${formatApiDateTimeDisplay(person.voted_at)}` : ""}`,
        { indent: 12, gap: index === option.voters.length - 1 ? 8 : 0 }
      )
    );
  }

  w.text(`Haven't voted (${results.not_voted.length})`, { size: 11, bold: true, gap: 2 });
  if (results.not_voted.length === 0) w.text("Everyone has voted.", { color: [100, 116, 139], indent: 12 });
  results.not_voted.forEach((person) => w.text(`${person.name} <${person.email}>`, { indent: 12 }));

  w.doc.save(`poll-${safeFileName(results.title)}.pdf`);
}
