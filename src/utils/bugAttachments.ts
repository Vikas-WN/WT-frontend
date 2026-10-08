export type AttachmentKind = "image" | "video" | "other";

export interface AttachmentRules {
  maxFiles: number;
  imageBytes: number;
  videoBytes: number;
  otherBytes: number;
  kinds: Record<string, AttachmentKind>;
}

export type AttachmentProblem =
  | { code: "too_many"; max: number }
  | { code: "unsupported"; name: string }
  | { code: "empty"; name: string }
  | { code: "too_big"; name: string; mb: number };

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
};

/** Whether `file` may be added to a report that already has `existing` files. Mirrors the server's rules; null means fine. */
export function checkBugFile(file: { name: string; size: number }, existing: number, rules: AttachmentRules): AttachmentProblem | null {
  if (existing >= rules.maxFiles) return { code: "too_many", max: rules.maxFiles };
  const kind = rules.kinds[extensionOf(file.name)];
  if (!kind) return { code: "unsupported", name: file.name };
  if (file.size === 0) return { code: "empty", name: file.name };
  const cap = kind === "image" ? rules.imageBytes : kind === "video" ? rules.videoBytes : rules.otherBytes;
  if (file.size > cap) return { code: "too_big", name: file.name, mb: Math.floor(cap / (1024 * 1024)) };
  return null;
}

/** "1.4 MB", "820 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** A pasted screenshot arrives as "image.png"; give it a name that says what it is and when it was taken. */
export function nameForPastedImage(type: string, at: Date): string {
  const ext = type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `screenshot-${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}.${ext}`;
}
