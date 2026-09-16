"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

import {
  nextCameraId,
  pickPreferredCameraId,
  type CameraDevice,
} from "@/utils/cameraDevices";
import { safeStopHtml5Qrcode } from "@/utils/html5QrcodeStop";

function viewfinderQrbox(viewfinderWidth: number, viewfinderHeight: number) {
  const minSide = Math.min(viewfinderWidth, viewfinderHeight);
  if (!Number.isFinite(minSide) || minSide < 40) {
    return { width: 120, height: 120 };
  }
  const size = Math.max(96, Math.min(Math.floor(minSide * 0.42), minSide - 16));
  return { width: size, height: size };
}

const SCAN_CONFIG = {
  fps: 8,
  qrbox: viewfinderQrbox,
  aspectRatio: 4 / 3,
};

export function useHtml5QrScanner({
  elementId,
  onDecode,
}: {
  elementId: string;
  onDecode: (text: string) => void;
}) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const currentIdRef = useRef<string | null>(null);
  const camerasRef = useRef<CameraDevice[]>([]);
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  const stopAndWait = useCallback(async () => {
    const scanner = scannerRef.current;
    await safeStopHtml5Qrcode(scanner);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const listed = await Html5Qrcode.getCameras();
        const devices: CameraDevice[] = listed.map((device) => ({
          id: device.id,
          label: device.label ?? "",
        }));
        if (cancelled) return;
        camerasRef.current = devices;
        setCameras(devices);
        if (!devices.length) {
          setError("No camera found. Allow camera access and try again.");
          return;
        }

        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;
        if (cancelled) {
          await safeStopHtml5Qrcode(scanner);
          return;
        }

        const onScan = (decodedText: string) => {
          if (cancelled) return;
          onDecodeRef.current(decodedText);
        };

        const tryStart = async (cameraId: string) => {
          currentIdRef.current = cameraId;
          await scanner.start(cameraId, SCAN_CONFIG, onScan, () => undefined);
        };

        const preferred = pickPreferredCameraId(devices);
        if (!preferred) {
          setError("Couldn't start the camera. Allow camera access and try again.");
          return;
        }
        try {
          await tryStart(preferred);
        } catch {
          const fallback = nextCameraId(devices, preferred);
          if (!fallback || fallback === preferred) throw new Error("start failed");
          await safeStopHtml5Qrcode(scanner, { clear: false });
          if (cancelled) return;
          scannerRef.current = scanner;
          await tryStart(fallback);
        }
        if (cancelled) {
          await safeStopHtml5Qrcode(scanner);
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
      void safeStopHtml5Qrcode(scanner);
    };
  }, [elementId]);

  const switchCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    const devices = camerasRef.current;
    const next = nextCameraId(devices, currentIdRef.current);
    if (!scanner || !next || next === currentIdRef.current) return;
    setSwitching(true);
    setError(null);
    try {
      await safeStopHtml5Qrcode(scanner, { clear: false });
      currentIdRef.current = next;
      scannerRef.current = scanner;
      await scanner.start(next, SCAN_CONFIG, (decodedText) => {
        onDecodeRef.current(decodedText);
      }, () => undefined);
    } catch {
      setError("Couldn't switch camera.");
    } finally {
      setSwitching(false);
    }
  }, []);

  return {
    cameras,
    error,
    switching,
    switchCamera,
    stopAndWait,
  };
}
