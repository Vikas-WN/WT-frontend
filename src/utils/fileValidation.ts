/**
 * Client-side guard for file <input accept=".pdf,image/*"> fields.
 *
 * The `accept` attribute only filters what the native OS file picker shows —
 * it never blocks a file chosen via drag-and-drop, "All Files", or a picker
 * that ignores it. Nothing downstream (onboarding submit, this codebase's
 * FastAPI handlers) validated type or size either, so an arbitrary file
 * (confirmed live: an .exe picked for "Relieving Letter") reached the backend
 * as-is. Whatever the backend's file-handling did with it, the failure
 * surfaced to the user as a generic "Unable to reach the server" — this stops
 * it from ever leaving the browser, with a specific, actionable message.
 */

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — ID docs, payslips, resumes.

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

/** True when `file` satisfies at least one pattern in an <input accept="..."> string. */
export function fileMatchesAccept(file: File, accept: string | undefined): boolean {
  const patterns = (accept ?? "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (!patterns.length) return true;

  const ext = extensionOf(file.name);
  const mime = (file.type || "").toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return ext === pattern;
    if (pattern.endsWith("/*")) return mime.startsWith(pattern.slice(0, -1));
    return mime === pattern;
  });
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** Returns an error message, or null when the file is acceptable. */
export function validateUploadedFile(
  file: File,
  options?: { accept?: string; maxSizeBytes?: number; label?: string }
): string | null {
  const label = options?.label ?? "File";
  if (!fileMatchesAccept(file, options?.accept)) {
    return `${label}: "${file.name}" is not an accepted file type.`;
  }
  const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
  if (file.size > maxSize) {
    return `${label}: "${file.name}" (${humanFileSize(file.size)}) exceeds the ${humanFileSize(maxSize)} limit.`;
  }
  return null;
}
