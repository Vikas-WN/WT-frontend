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
function dedupeId(kind: "success" | "error" | "warning", message: string): string {
  return `wt-${kind}:${message}`;
}

export function showSuccessToast(message: string, id?: string) {
  toast.success(message, { ...sharedToastOptions, id: id ?? dedupeId("success", message) });
}

export function showErrorToast(message: string, id?: string) {
  toast.error(message, { ...sharedToastOptions, id: id ?? dedupeId("error", message) });
}

export function showWarningToast(message: string, id?: string) {
  toast.warning(message, { ...sharedToastOptions, id: id ?? dedupeId("warning", message) });
}

/**
 * Shows a toast notification listing all missing required fields.
 * Useful for form validation where multiple fields are required.
 */
export function showMissingFieldsToast(missingFields: string[], action: string = "submit"): void {
  if (!missingFields.length) return;
  
  const fieldList = missingFields
    .map((field) => `• ${field}`)
    .join("\n");
    
  const message = 
    missingFields.length === 1
      ? `Please fill in the required field:\n${fieldList}`
      : `Please fill in the following required fields before ${action}:\n${fieldList}`;
      
  showErrorToast(message, `missing-fields-${action}`);
}
