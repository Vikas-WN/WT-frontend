import { jsPDF } from "jspdf";

import type { ImportColumn, ImportDefinition } from "@/constants/bulkImports";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;
const BRAND: [number, number, number] = [59, 91, 219];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const RULE: [number, number, number] = [226, 232, 240];
const HEAD_BG: [number, number, number] = [238, 242, 255];
/** The logo is only ever read from this bundled asset — never from user input — so a template can't carry a swapped logo. */
const LOGO_URL = "/webtrak-logo.png";
const COMPANY = "Webknot Technologies";

async function loadLogo(): Promise<{ data: string; ratio: number } | null> {
  try {
    const response = await fetch(LOGO_URL);
    if (!response.ok) return null;
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const ratio = await new Promise<number>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 1);
      img.onerror = () => resolve(1);
      img.src = data;
    });
    return { data, ratio };
  } catch {
    return null; // The wordmark text still renders; the download must not fail over an image.
  }
}

function formatHint(column: ImportColumn): string {
  switch (column.type) {
    case "email":
      return "Email address";
    case "date":
      return "YYYY-MM-DD or DD/MM/YYYY";
    case "boolean":
      return "true or false";
    case "number": {
      const range = column.min !== undefined && column.max !== undefined ? ` (${column.min}–${column.max})` : column.min !== undefined ? ` (≥ ${column.min})` : "";
      return `Number${range}`;
    }
    default:
      return "Text";
  }
}

function randomOwnerPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Builds and downloads a branded, printable PDF guide for an import: the exact column names to use, which are required,
 * and the format each expects. The CSV template stays the file people fill in; this is the reference that goes with it.
 * The PDF is written with editing/annotation off and a throwaway owner password — a deterrent against altering the logo,
 * not cryptographic tamper-proofing.
 */
export async function exportImportTemplatePdf(definition: ImportDefinition): Promise<void> {
  const logo = await loadLogo();
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    encryption: { userPermissions: ["print"], ownerPassword: randomOwnerPassword() },
  });
  const contentW = PAGE_W - MARGIN * 2;
  let y = 0;

  const chrome = () => {
    if (logo) {
      const h = 38;
      doc.addImage(logo.data, "PNG", MARGIN, MARGIN - 6, h * logo.ratio, h);
    }
    const textX = MARGIN + (logo ? 38 * logo.ratio + 10 : 0);
    doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(...INK).text(COMPANY, textX, MARGIN + 12);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED).text("WebTrak · Import template", textX, MARGIN + 26);
    doc.setDrawColor(...BRAND).setLineWidth(1).line(MARGIN, MARGIN + 40, PAGE_W - MARGIN, MARGIN + 40);
    y = MARGIN + 62;
  };
  const ensure = (height: number) => {
    if (y + height > PAGE_H - MARGIN - 20) {
      doc.addPage();
      chrome();
      drawTableHead();
    }
  };
  const para = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {}) => {
    const { size = 10, bold = false, color = INK, gap = 8 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).setTextColor(...color);
    for (const line of doc.splitTextToSize(text, contentW) as string[]) {
      doc.text(line, MARGIN, y);
      y += size + 4;
    }
    y += gap;
  };

  const cols = [
    { label: "Column name", x: MARGIN + 6, w: 150 },
    { label: "Meaning", x: MARGIN + 160, w: 150 },
    { label: "Required", x: MARGIN + 318, w: 55 },
    { label: "Format", x: MARGIN + 378, w: contentW - 378 },
  ];
  function drawTableHead() {
    doc.setFillColor(...HEAD_BG).rect(MARGIN, y - 12, contentW, 20, "F");
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(30, 58, 138);
    cols.forEach((c) => doc.text(c.label, c.x, y + 1));
    doc.setDrawColor(...BRAND).setLineWidth(0.8).line(MARGIN, y + 8, PAGE_W - MARGIN, y + 8);
    y += 24;
  }

  chrome();
  para(definition.name, { size: 20, bold: true, gap: 2 });
  para(definition.description, { size: 11, color: MUTED, gap: 10 });
  para("How it behaves", { size: 11, bold: true, gap: 0 });
  para(definition.behavior, { size: 9.5, gap: 10 });
  para(`Rows are matched on: ${definition.key.join(" + ")}. Upload the filled file as ${definition.format.toUpperCase()}; required columns must not be blank.`, {
    size: 9.5,
    color: MUTED,
    gap: 14,
  });

  drawTableHead();
  definition.columns.forEach((column) => {
    const meaning = doc.splitTextToSize(column.label, cols[1].w) as string[];
    const format = doc.splitTextToSize(formatHint(column), cols[3].w) as string[];
    const lines = Math.max(meaning.length, format.length, 1);
    ensure(lines * 12 + 10);
    doc.setFont("courier", "bold").setFontSize(8.5).setTextColor(...INK).text(column.key, cols[0].x, y);
    doc.setFont("helvetica", "normal").setFontSize(9).text(meaning, cols[1].x, y);
    doc.setFont("helvetica", column.required ? "bold" : "normal").setTextColor(...(column.required ? BRAND : MUTED)).text(column.required ? "Required" : "Optional", cols[2].x, y);
    doc.setFont("helvetica", "normal").setTextColor(...INK).text(format, cols[3].x, y);
    y += lines * 12 + 4;
    doc.setDrawColor(...RULE).setLineWidth(0.5).line(MARGIN, y - 6, PAGE_W - MARGIN, y - 6);
    y += 4;
  });

  const pages = doc.getNumberOfPages();
  const generated = new Date().toLocaleDateString("en-GB");
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...RULE).setLineWidth(0.5).line(MARGIN, PAGE_H - MARGIN, PAGE_W - MARGIN, PAGE_H - MARGIN);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
    doc.text(`${COMPANY} · Generated ${generated}`, MARGIN, PAGE_H - MARGIN + 14);
    doc.text(`Page ${page} of ${pages}`, PAGE_W - MARGIN, PAGE_H - MARGIN + 14, { align: "right" });
  }

  doc.save(`webtrak-${definition.id}-template.pdf`);
}
