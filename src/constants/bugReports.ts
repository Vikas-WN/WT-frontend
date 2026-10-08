import type { BADGE_TONE } from "@/components/dashboard/ui/badgeTones";
import type { BugSeverity, BugStatus } from "@/types/bugReport";

export const BUG_REPORT_QUERY_KEYS = {
  mine: ["bug-reports", "mine"] as const,
  list: (status?: string, severity?: string, page?: number) =>
    ["bug-reports", "list", status ?? null, severity ?? null, page ?? 0] as const,
  all: ["bug-reports"] as const,
};

export const BUG_REPORT_PAGE_SIZE = 20;
export const BUG_REPORT_TRIAGE_ROLES = ["ROLE_HR", "ROLE_ADMIN"] as const;

export const BUG_SEVERITY_OPTIONS: ReadonlyArray<{ value: BugSeverity; label: string; hint: string }> = [
  { value: "LOW", label: "Low", hint: "Cosmetic or minor" },
  { value: "MEDIUM", label: "Medium", hint: "Annoying, but I can work around it" },
  { value: "HIGH", label: "High", hint: "Blocks part of my work" },
  { value: "CRITICAL", label: "Critical", hint: "I can't use the app / data looks wrong" },
];

export const BUG_STATUS_OPTIONS: ReadonlyArray<{ value: BugStatus; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "WONT_FIX", label: "Won't fix" },
];

export const BUG_SEVERITY_TONE: Record<BugSeverity, keyof typeof BADGE_TONE> = {
  LOW: "slate",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

export const BUG_STATUS_TONE: Record<BugStatus, keyof typeof BADGE_TONE> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  WONT_FIX: "neutral",
};

export const BUG_REPORT_COPY = {
  buttonLabel: "Report a bug",
  dialogTitle: "Report a bug",
  dialogDescription: "Tell us what went wrong. HR and Admin are notified straight away.",
  titleLabel: "What went wrong?",
  titlePlaceholder: "e.g. Leave calendar shows a blank page",
  descriptionLabel: "Details",
  descriptionPlaceholder: "What were you doing, what did you expect, and what happened instead?",
  severityLabel: "How bad is it?",
  contextLabel: "Sent with your report",
  submit: "Send report",
  submitting: "Sending…",
  pageTitle: "Bug Reports",
  pageDescriptionTriage: "Everything employees have reported. Review, update the status and leave a note — the reporter is told.",
  pageDescriptionMine: "Problems you've reported and what happened to them.",
  emptyMine: "You haven't reported any bugs.",
  emptyTriage: "No bug reports match these filters.",
  allStatuses: "All statuses",
  allSeverities: "All severities",
  triage: "Review",
  triageTitle: "Review bug report",
  noteLabel: "Note to the reporter",
  notePlaceholder: "What you found, or what was done.",
  save: "Save",
  saving: "Saving…",
} as const;

/** The same limits the server enforces (app/domain/bug_report_rules.py); checking here just saves a wasted upload. */
export const BUG_ATTACHMENT_LIMITS = {
  maxFiles: 5,
  imageBytes: 10 * 1024 * 1024,
  videoBytes: 25 * 1024 * 1024,
  otherBytes: 10 * 1024 * 1024,
} as const;

/** extension -> which size cap applies. Anything else is refused. */
export const BUG_ATTACHMENT_KINDS: Record<string, "image" | "video" | "other"> = {
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
  ".gif": "image",
  ".mp4": "video",
  ".webm": "video",
  ".mov": "video",
  ".pdf": "other",
  ".txt": "other",
  ".log": "other",
  ".json": "other",
};

export const BUG_ATTACHMENT_ACCEPT = Object.keys(BUG_ATTACHMENT_KINDS).join(",");

export const BUG_ATTACHMENT_COPY = {
  heading: "Screenshots or recordings",
  optional: "optional",
  dropTitle: "Drop files here, paste a screenshot, or browse",
  dropHint: (max: number) => `Up to ${max} files — images, a short screen recording, PDF or log. Images and logs 10 MB, video 25 MB.`,
  remove: "Remove",
  queued: "Ready",
  uploading: "Uploading…",
  done: "Uploaded",
  failed: "Couldn't upload",
  tooMany: (max: number) => `You can attach up to ${max} files.`,
  unsupported: (name: string) => `${name} isn't a supported type.`,
  tooBig: (name: string, mb: number) => `${name} is larger than ${mb} MB.`,
  empty: (name: string) => `${name} is empty.`,
} as const;

export const BUG_CONTEXT_COPY = {
  include: "Include technical details to help us reproduce it",
  includeHint: "The time, page, browser, screen, and the last few pages, errors and requests. Never what you typed or any page content.",
  show: "See what will be sent",
  hide: "Hide details",
  captured: "Time",
  page: "Page",
  browser: "Browser",
  screen: "Screen",
  network: "Connection",
  recent: "Recent activity",
  recentSummary: (pages: number, errors: number, calls: number) => `${pages} pages, ${errors} errors, ${calls} requests`,
} as const;

export const BUG_SUBMIT_COPY = {
  sentTitle: "Your report was sent",
  sentNote: "HR and Admin have been told.",
  partialTitle: "Report sent — some files didn't upload",
  partialHint: "The report is saved. You can retry the files below, or close this and add them later by reporting again.",
  retry: "Retry failed files",
  close: "Close",
  uploadingOverall: (done: number, total: number) => `Uploading files (${done} of ${total})…`,
  thanksWithFiles: "Thanks — your report and files were sent to HR and Admin.",
  thanks: "Thanks — your report was sent to HR and Admin.",
} as const;

export const BUG_DETAIL_COPY = {
  happened: "Happened",
  files: "Attachments",
  details: "Technical details",
  showDetails: "Show technical details",
  hideDetails: "Hide technical details",
  copy: "Copy for developers",
  copied: "Copied",
  noContext: "No technical details were sent with this report.",
  pagesVisited: "Pages visited (oldest first)",
  recentErrors: "Recent errors",
  recentCalls: "Recent API calls",
  requestId: "request id",
  noAnswer: "no answer",
  openFile: "Open",
} as const;
