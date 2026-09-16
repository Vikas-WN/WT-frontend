"use client";

import { useCallback, useRef, useState } from "react";
import { SwitchCamera } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { useHtml5QrScanner } from "@/hooks/useHtml5QrScanner";
import { decodeAssetQrPayload } from "@/utils/assetQr";
import { cn } from "@/lib/utils";

const READER_ID = "asset-qr-scanner";

export type AssetQrScanCloseReason = "commit" | "dismiss";

export function AssetQrScanDialog({
  onClose,
  onTagScanned,
}: {
  onClose: (reason: AssetQrScanCloseReason) => void;
  /** Return an error message to keep scanning; return void/null on success (parent closes). */
  onTagScanned: (tag: string) => Promise<string | null | void>;
}) {
  const [scanError, setScanError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const handlingRef = useRef(false);
  const dismissedRef = useRef(false);
  const onTagScannedRef = useRef(onTagScanned);
  onTagScannedRef.current = onTagScanned;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const stopRef = useRef<() => Promise<void>>(async () => undefined);

  const finish = async (reason: AssetQrScanCloseReason) => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    handlingRef.current = true;
    try {
      await stopRef.current();
    } finally {
      onCloseRef.current(reason);
    }
  };

  const onDecode = useCallback((text: string) => {
    if (dismissedRef.current || handlingRef.current) return;
    const tag = decodeAssetQrPayload(text);
    if (!tag) {
      setScanError("That QR is not a WebTrak asset tag.");
      return;
    }
    handlingRef.current = true;
    setScanError(null);
    setBusy(true);
    void (async () => {
      const result = await onTagScannedRef.current(tag);
      if (dismissedRef.current) return;
      if (result) {
        handlingRef.current = false;
        setBusy(false);
        setScanError(result);
        return;
      }
      await finish("commit");
    })();
  }, []);

  const { cameras, error: cameraError, switching, switchCamera, stopAndWait } = useHtml5QrScanner({
    elementId: READER_ID,
    onDecode,
  });
  stopRef.current = stopAndWait;

  const error = scanError ?? cameraError;
  const canSwitch = cameras.length > 1 && !busy && !switching;

  return (
    <div
      className={MODAL_OVERLAY_CLASS}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !switching) void finish("dismiss");
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-qr-scan-title"
        className={cn(MODAL_PANEL_CLASS, "h-[min(90dvh,880px)] max-w-3xl")}
      >
        <div className={MODAL_HEADER_CLASS}>
          <h2 id="asset-qr-scan-title" className="text-base font-semibold text-wt-text">
            Scan asset QR
          </h2>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5 sm:px-7">
          <p className="mb-3 shrink-0 text-sm text-wt-text-muted">
            Point the camera at the asset sticker. A match opens the asset details.
          </p>
          <div
            id={READER_ID}
            className={cn(
              "relative min-h-0 w-full flex-1 overflow-hidden rounded-2xl border border-wt-border bg-black",
              "max-sm:[&_video]:!object-cover sm:[&_video]:!object-contain",
              "[&_video]:!h-full [&_video]:!w-full",
              "[&_canvas]:!h-full [&_canvas]:!w-full sm:[&_canvas]:!object-contain"
            )}
          />
          {error ? (
            <p className="mt-3 shrink-0 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className={MODAL_FOOTER_CLASS}>
          {cameras.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="mr-auto"
              onClick={() => void switchCamera()}
              disabled={!canSwitch}
            >
              <SwitchCamera className="size-4" />
              {switching ? "Switching…" : "Switch camera"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void finish("dismiss")} disabled={switching}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
