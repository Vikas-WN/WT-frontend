import type { AssetItem } from "@/types/asset";
import { DASHBOARD_ROUTES } from "@/constants/routes";

export const ASSET_QR_PREFIX = "webtrak:asset:v1:";

export function assetQrPath(tag: string): string {
  return `${DASHBOARD_ROUTES.assets}?tag=${encodeURIComponent(tag.trim())}`;
}

export function encodeAssetQrPayload(assetTag: string): string {
  const tag = assetTag.trim();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!origin) return `${ASSET_QR_PREFIX}${tag}`;
  return `${origin}${assetQrPath(tag)}`;
}

function tagFromAssetTrackingUrl(text: string): string | null {
  try {
    const url = text.includes("://")
      ? new URL(text)
      : new URL(text, typeof window !== "undefined" ? window.location.origin : "https://webtrak.local");
    if (url.pathname.replace(/\/$/, "") !== DASHBOARD_ROUTES.assets) return null;
    const tag = url.searchParams.get("tag")?.trim() ?? "";
    return tag || null;
  } catch {
    return null;
  }
}

export function decodeAssetQrPayload(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  if (text.startsWith(ASSET_QR_PREFIX)) {
    const tag = text.slice(ASSET_QR_PREFIX.length).trim();
    return tag || null;
  }
  return tagFromAssetTrackingUrl(text);
}

export function assetQrFilename(assetTag: string): string {
  const safe = assetTag.trim().replace(/[^\w.-]+/g, "_") || "asset";
  return `${safe}-qr.png`;
}

const QR_LOGO_SRC = "/webtrak-logo.png";
// Keep the logo well under the ~30% redundancy "H" error correction gives us —
// a square this size covers ~6% of the code's area, leaving huge margin for a
// scanner to still resolve the payload even with a logo punched in the middle.
const QR_LOGO_SIZE_RATIO = 0.24;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/**
 * Renders a scannable QR with the WebTrak logo centered on top. Error
 * correction is bumped to "H" (from the plain-QR default "M") specifically so
 * covering the middle with a logo doesn't break scans.
 */
export async function qrToDataUrl(payload: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  const size = 480;
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, payload, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");

  try {
    const logo = await loadImage(QR_LOGO_SRC);
    const logoBoxSize = canvas.width * QR_LOGO_SIZE_RATIO;
    const center = canvas.width / 2;

    // White backing so the logo reads cleanly against whatever QR modules sit
    // beneath it, with a little breathing room (padding) around the artwork.
    const padding = logoBoxSize * 0.12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    const backingHalf = logoBoxSize / 2 + padding;
    const backingRadius = backingHalf * 0.28;
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(center - backingHalf, center - backingHalf, backingHalf * 2, backingHalf * 2, backingRadius);
    } else {
      ctx.rect(center - backingHalf, center - backingHalf, backingHalf * 2, backingHalf * 2);
    }
    ctx.fill();

    // Preserve the logo's own aspect ratio inside the square box instead of
    // stretching it (webtrak-logo.png isn't perfectly square).
    const scale = Math.min(logoBoxSize / logo.width, logoBoxSize / logo.height);
    const drawWidth = logo.width * scale;
    const drawHeight = logo.height * scale;
    ctx.drawImage(logo, center - drawWidth / 2, center - drawHeight / 2, drawWidth, drawHeight);
  } catch {
    // Logo failed to load — still return a perfectly valid plain QR rather
    // than failing the whole asset-tag flow over a missing decoration.
  }

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function printAssetTag(
  asset: Pick<AssetItem, "asset_tag" | "category" | "brand" | "model">
): Promise<void> {
  const dataUrl = await qrToDataUrl(encodeAssetQrPayload(asset.asset_tag));
  const subtitle = [asset.brand, asset.model].filter(Boolean).join(" ");
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    throw new Error("Couldn't open the print preview.");
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(asset.asset_tag)} tag</title>
  <style>
    @page { margin: 12mm; size: auto; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, sans-serif;
      color: #0f172a;
    }
    .tag {
      width: 72mm;
      border: 1.5pt solid #0f172a;
      border-radius: 4mm;
      padding: 6mm 5mm 5mm;
      text-align: center;
    }
    .brand {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #355095;
      margin: 0 0 3mm;
    }
    img { width: 42mm; height: 42mm; }
    .tag-id {
      margin: 3mm 0 0;
      font-size: 14pt;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .meta {
      margin: 1mm 0 0;
      font-size: 9pt;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="tag">
    <p class="brand">WebTrak</p>
    <img src="${dataUrl}" alt="QR code for ${escapeHtml(asset.asset_tag)}" />
    <p class="tag-id">${escapeHtml(asset.asset_tag)}</p>
    <p class="meta">${escapeHtml(asset.category)}${subtitle ? ` · ${escapeHtml(subtitle)}` : ""}</p>
  </div>
</body>
</html>`);
  doc.close();

  const cleanup = () => {
    iframe.remove();
  };
  win.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 60_000);

  await new Promise<void>((resolve) => {
    const printNow = () => {
      win.focus();
      win.print();
      resolve();
    };
    if (doc.readyState === "complete") {
      window.setTimeout(printNow, 50);
    } else {
      iframe.addEventListener("load", () => window.setTimeout(printNow, 50), { once: true });
    }
  });
}
