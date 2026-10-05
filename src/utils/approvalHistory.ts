import type { ApprovalHistoryEntry, ApprovalPerson } from "@/types/userRequest";

export type ApprovalDetails = {
  /** False when the row came from an endpoint that doesn't carry the trail at all. */
  supported: boolean;
  history: ApprovalHistoryEntry[];
  pending: ApprovalPerson[];
};

function text(value: unknown): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

function read(row: Record<string, unknown>, snake: string, camel: string): unknown {
  return row[snake] ?? row[camel];
}

/**
 * Pull the approval trail off a request row. Tolerates snake_case and camelCase and any
 * missing field, so older cached rows or other list endpoints just yield empty details.
 */
export function readApprovalDetails(
  row: Record<string, unknown> | null | undefined
): ApprovalDetails {
  if (!row) return { supported: false, history: [], pending: [] };

  const rawHistory = read(row, "approval_history", "approvalHistory");
  const history = asArray(rawHistory).map(
    (entry): ApprovalHistoryEntry => ({
      action: String(entry.action ?? "").trim().toUpperCase(),
      actioner_role: text(read(entry, "actioner_role", "actionerRole")),
      actioner_name: text(read(entry, "actioner_name", "actionerName")),
      actioner_email: text(read(entry, "actioner_email", "actionerEmail")),
      message: text(entry.message),
      acted_at: text(read(entry, "acted_at", "actedAt")),
    })
  );

  const pending = asArray(read(row, "pending_approvers", "pendingApprovers")).map(
    (person): ApprovalPerson => ({
      name: text(person.name),
      email: text(person.email),
    })
  );

  return { supported: Array.isArray(rawHistory), history, pending };
}
