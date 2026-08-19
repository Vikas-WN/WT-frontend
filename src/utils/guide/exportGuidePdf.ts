import { jsPDF } from "jspdf";
import type { GuideChapter, GuideHandbookKind } from "@/content/guide/guideContent";
import { handbookMeta } from "@/content/guide/guideContent";

const MARGIN = 52;
const LINE_HEIGHT = 14;
const PAGE_HEIGHT = 841.89; // A4 pt
const PAGE_WIDTH = 595.28;

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  options?: { fontStyle?: "normal" | "bold" | "italic" }
): number {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", options?.fontStyle ?? "normal");
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line) => {
    doc.text(line, x, y);
    y += LINE_HEIGHT;
  });
  return y;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export function exportGuidePdf(chapters: GuideChapter[], handbook: GuideHandbookKind): void {
  const meta = handbookMeta(handbook);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  let y = MARGIN;

  // Cover
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(53, 80, 149);
  doc.text("WebTrak", MARGIN, y);
  y += 32;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(meta.title, maxWidth) as string[];
  titleLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 26;
  });
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  y = addWrappedText(doc, meta.subtitle, MARGIN, y, maxWidth, 11);
  y += 6;
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, MARGIN, y);
  y += 28;

  // Table of contents
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Contents", MARGIN, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  chapters.forEach((chapter, index) => {
    y = ensureSpace(doc, y, LINE_HEIGHT);
    doc.text(`${index + 1}. ${chapter.title}`, MARGIN + 8, y);
    y += LINE_HEIGHT;
  });
  doc.addPage();
  y = MARGIN;

  chapters.forEach((chapter, chapterIndex) => {
    if (chapterIndex > 0) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(53, 80, 149);
    y = addWrappedText(doc, chapter.title, MARGIN, y, maxWidth, 16, { fontStyle: "bold" });
    y += 4;
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "italic");
    y = addWrappedText(doc, chapter.summary, MARGIN, y, maxWidth, 10, { fontStyle: "italic" });
    y += 12;

    chapter.steps.forEach((step, stepIndex) => {
      y = ensureSpace(doc, y, LINE_HEIGHT * 3);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      y = addWrappedText(
        doc,
        `${stepIndex + 1}. ${step.title}`,
        MARGIN,
        y,
        maxWidth,
        11,
        { fontStyle: "bold" }
      );
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      y = addWrappedText(doc, step.body, MARGIN + 12, y, maxWidth - 12, 10);
      if (step.tip) {
        y = ensureSpace(doc, y, LINE_HEIGHT * 2);
        doc.setTextColor(146, 64, 14);
        y = addWrappedText(doc, `Tip: ${step.tip}`, MARGIN + 12, y, maxWidth - 12, 9);
      }
      y += 8;
    });

    if (chapter.relatedHref) {
      y = ensureSpace(doc, y, LINE_HEIGHT * 2);
      doc.setTextColor(53, 80, 149);
      doc.setFontSize(9);
      doc.text(`In WebTrak: ${chapter.relatedHref}`, MARGIN, y);
      y += LINE_HEIGHT;
    }
  });

  doc.save(meta.filename);
}
