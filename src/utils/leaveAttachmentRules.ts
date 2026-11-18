/**
 * The client-approval email an on-site employee attaches to a leave request (mirrors the backend rule in
 * webtrak1.0/app/domain/request_attachment.py). Kept free of imports so it can be unit-tested directly.
 *
 * Mandatory for on-site employees, and only for leave (Leave / Optional) — WFH and comp-off don't need it.
 */

export const LEAVE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const LEAVE_ATTACHMENT_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf,.png,.jpg,.jpeg,.webp,.pdf";
const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const ATTACHMENT_REQUEST_TYPES = new Set(["LEAVE", "OPTIONAL"]);

export type LeaveAttachmentRequirement = { onsite: boolean; required_for: string[] };

export const LEAVE_ATTACHMENT_COPY = {
  label: "Client approval email",
  hint: "You work on-site, so attach a screenshot (PNG, JPG, WEBP) or PDF of the client's email approving this leave. Up to 5MB.",
  missing: "Client approval email (screenshot)",
  tooBig: "The client approval email must be 5MB or less.",
  wrongType: "Attach the client approval email as a PNG, JPG or WEBP screenshot, or a PDF.",
  attached: "Attached",
  replace: "Replace",
  choose: "Choose file",
  remove: "Remove",
  view: "View",
  detailLink: "View client approval email",
} as const;

/** Does this leave request need the client-approval email? */
export function leaveAttachmentRequired(requirement: LeaveAttachmentRequirement | null | undefined, requestType: unknown): boolean {
  if (!requirement?.onsite) return false;
  const type = String(requestType ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const required = requirement.required_for?.length ? new Set(requirement.required_for.map((t) => t.toUpperCase())) : ATTACHMENT_REQUEST_TYPES;
  return required.has(type);
}

/** Why this file can't be attached, or null when it can. The server checks the real bytes again. */
export function leaveAttachmentFileProblem(file: { name: string; size: number; type: string }): string | null {
  if (file.size > LEAVE_ATTACHMENT_MAX_BYTES) return LEAVE_ATTACHMENT_COPY.tooBig;
  const name = file.name.toLowerCase();
  const typeOk = ACCEPTED_TYPES.includes(file.type.toLowerCase());
  const extensionOk = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  return typeOk || (!file.type && extensionOk) ? null : LEAVE_ATTACHMENT_COPY.wrongType;
}
