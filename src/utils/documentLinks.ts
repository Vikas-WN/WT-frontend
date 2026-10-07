/** Documents uploaded to object storage are referenced as `s3://<key>` and opened through the API, which checks access. */
const STORED_REF_PREFIX = "s3://";

export function isStoredDocumentRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(STORED_REF_PREFIX);
}

/** Same-origin URL that streams the document (the API decides who may open it). */
export function storedDocumentHref(ref: string): string {
  return `/api/v1/documents/download?ref=${encodeURIComponent(ref)}`;
}

/** Link target for a stored value: our download URL for a stored document, the value itself for a web link, else null. */
export function documentHref(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (isStoredDocumentRef(text)) return storedDocumentHref(text);
  return /^https?:\/\//i.test(text) ? text : null;
}
