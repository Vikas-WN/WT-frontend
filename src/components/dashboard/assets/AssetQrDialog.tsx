"use client";

import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import type { AssetItem } from "@/types/asset";
import {
  assetQrFilename,
  downloadDataUrl,
  encodeAssetQrPayload,
  printAssetTag,
  qrToDataUrl,
} from "@/utils/assetQr";
import { notifyError } from "@/lib/notify";

export function AssetQrDialog({
  asset,
  onClose,
}: {
  asset: AssetItem;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"download" | "print" | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const url = await qrToDataUrl(encodeAssetQrPayload(asset.asset_tag));
        if (alive) setDataUrl(url);
      } catch {
        if (alive) {
          setDataUrl(null);
          notifyError("Couldn't generate this QR code.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [asset.asset_tag]);

  const subtitle = [asset.brand, asset.model].filter(Boolean).join(" ");

  const handleDownload = () => {
    if (!dataUrl) return;
    setBusy("download");
    try {
      downloadDataUrl(dataUrl, assetQrFilename(asset.asset_tag));
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = async () => {
    setBusy("print");
    try {
      await printAssetTag(asset);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Couldn't print this tag.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={MODAL_OVERLAY_CLASS}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="asset-qr-title" className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 id="asset-qr-title" className="text-base font-semibold text-wt-text">
            Asset QR
          </h2>
        </div>
        <div className={MODAL_BODY_CLASS}>
          <div className="flex flex-col items-center py-2 text-center">
            {loading ? (
              <div className="flex size-[240px] items-center justify-center rounded-2xl border border-wt-border bg-wt-surface-2 text-sm text-wt-text-muted">
                Generating QR…
              </div>
            ) : dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt={`QR code for ${asset.asset_tag}`}
                className="size-[240px] rounded-2xl border border-wt-border bg-white p-3"
              />
            ) : (
              <p className="text-sm text-destructive">QR code is unavailable.</p>
            )}
            <p className="mt-4 text-lg font-semibold tracking-tight text-wt-text">{asset.asset_tag}</p>
            <p className="mt-1 text-sm text-wt-text-muted">
              {asset.category}
              {subtitle ? ` · ${subtitle}` : ""}
            </p>
          </div>
        </div>
        <div className={MODAL_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={onClose} disabled={Boolean(busy)}>
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            disabled={!dataUrl || Boolean(busy)}
          >
            <Download className="size-4" />
            {busy === "download" ? "Downloading…" : "Download QR"}
          </Button>
          <Button type="button" onClick={() => void handlePrint()} disabled={!dataUrl || Boolean(busy)}>
            <Printer className="size-4" />
            {busy === "print" ? "Printing…" : "Print tag"}
          </Button>
        </div>
      </div>
    </div>
  );
}
