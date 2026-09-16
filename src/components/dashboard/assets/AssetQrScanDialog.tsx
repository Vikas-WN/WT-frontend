"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { decodeAssetQrPayload } from "@/utils/assetQr";

const READER_ID = "asset-qr-scanner";

export function AssetQrScanDialog({
  onClose,
  onTagScanned,
}: {
  onClose: () => void;
  /** Return an error message to keep scanning; return void/null on success (parent closes). */
  onTagScanned: (tag: string) => Promise<string | null | void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const handlingRef = useRef(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const onTagScannedRef = useRef(onTagScanned);
  onTagScannedRef.current = onTagScanned;

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(READER_ID);
        scannerRef.current = scanner;
        const onScan = (decodedText: string) => {
          if (handlingRef.current || cancelled) return;
          const tag = decodeAssetQrPayload(decodedText);
          if (!tag) {
            setError("That QR is not a WebTrak asset tag.");
            return;
          }
          handlingRef.current = true;
          setError(null);
          setBusy(true);
          void (async () => {
            const result = await onTagScannedRef.current(tag);
            if (result) {
              handlingRef.current = false;
              setBusy(false);
              setError(result);
              return;
            }
            try {
              await scanner.stop();
            } catch {
              /* already stopped */
            }
          })();
        };
        const config = { fps: 8, qrbox: { width: 240, height: 240 } };
        try {
          await scanner.start({ facingMode: "environment" }, config, onScan, () => undefined);
        } catch {
          try {
            await scanner.stop();
          } catch {
            /* not running */
          }
          await scanner.start({ facingMode: "user" }, config, onScan, () => undefined);
        }
      } catch {
        if (!cancelled) {
          setError("Couldn't start the camera. Allow camera access and try again.");
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      void scanner.stop().catch(() => undefined);
    };
  }, []);

  return (
    <div
      className={MODAL_OVERLAY_CLASS}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="asset-qr-scan-title" className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 id="asset-qr-scan-title" className="text-base font-semibold text-wt-text">
            Scan asset QR
          </h2>
        </div>
        <div className={MODAL_BODY_CLASS}>
          <p className="mb-4 text-sm text-wt-text-muted">
            Point the camera at the asset sticker. Available assets open the assign form.
          </p>
          <div
            id={READER_ID}
            className="overflow-hidden rounded-2xl border border-wt-border bg-black [&_video]:w-full"
          />
          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className={MODAL_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
