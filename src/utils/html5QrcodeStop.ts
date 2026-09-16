import { Html5QrcodeScannerState, type Html5Qrcode } from "html5-qrcode";

/**
 * html5-qrcode's stop() throws synchronously when the scanner is idle
 * ("Cannot stop, scanner is not running or paused"). That throw is not a
 * rejected promise, so `.catch()` does not catch it and React's error
 * boundary takes down the page. Always go through this helper.
 */
export async function safeStopHtml5Qrcode(
  scanner: Html5Qrcode | null | undefined,
  options?: { clear?: boolean }
): Promise<void> {
  if (!scanner) return;
  try {
    const state = typeof scanner.getState === "function" ? scanner.getState() : undefined;
    const active =
      Boolean(scanner.isScanning) ||
      state === Html5QrcodeScannerState.SCANNING ||
      state === Html5QrcodeScannerState.PAUSED;
    if (active) {
      await scanner.stop();
    }
  } catch {
    /* already stopped, never started, or element gone */
  }
  if (options?.clear === false) return;
  try {
    scanner.clear();
  } catch {
    /* reader node already unmounted */
  }
}
