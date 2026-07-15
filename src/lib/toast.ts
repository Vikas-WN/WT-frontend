import { toast } from "sonner";

export const TOAST_DURATION_MS = 3600;

const sharedToastOptions = {
  duration: TOAST_DURATION_MS,
  closeButton: true,
} as const;

/**
 * Sonner replaces (instead of stacking) toasts that share an id and restarts
 * their timer. Keying by kind+message means firing the same toast repeatedly
 * shows a single toast instead of a duplicate pile, while different messages
 * still stack normally.
 */
function dedupeId(kind: "success" | "error", message: string): string {
  return `wt-${kind}:${message}`;
}

export function showSuccessToast(message: string, id?: string) {
  toast.success(message, { ...sharedToastOptions, id: id ?? dedupeId("success", message) });
}

export function showErrorToast(message: string, id?: string) {
  toast.error(message, { ...sharedToastOptions, id: id ?? dedupeId("error", message) });
}
