import { toast } from "sonner";

export const TOAST_DURATION_MS = 3600;

const sharedToastOptions = {
  duration: TOAST_DURATION_MS,
  closeButton: true,
} as const;

export function showSuccessToast(message: string, id?: string) {
  toast.success(message, { ...sharedToastOptions, ...(id ? { id } : {}) });
}

export function showErrorToast(message: string, id?: string) {
  toast.error(message, { ...sharedToastOptions, ...(id ? { id } : {}) });
}
