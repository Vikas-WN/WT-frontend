/**
 * Pure logic behind the shared manager-review draft: every manager the
 * submission went to edits the same ratings, so what arrives from the server has
 * to be merged with what this manager is typing without either clobbering the
 * other. No React, no imports from the app — unit-testable on its own.
 */

export interface ReviewFields {
  kpi: Record<number, number>;
  values: Record<number, number>;
  /** Why each rating was given — a comment can be written before the rating is chosen. */
  kpiComments: Record<number, string>;
  valueComments: Record<number, string>;
  comments: string;
}

/** Fields this manager has changed locally and the server has not acknowledged yet. */
export type DirtyKey = `k:${number}` | `v:${number}` | `kc:${number}` | `vc:${number}` | "comments";

/** Structural subset of the API's `ManagerReviewDraft`. */
export interface RemoteDraftLike {
  kpi_ratings: Record<string, number>;
  value_ratings: Record<string, number>;
  kpi_comments?: Record<string, string>;
  value_comments?: Record<string, string>;
  comments: string;
  version: number;
}

export interface DraftPatch {
  kpi_ratings: Array<{ kpi_id: number; rating: number }>;
  value_ratings: Array<{ value_id: number; rating: number; comment: string }>;
  kpi_comments: Array<{ id: number; comment: string }>;
  value_comments: Array<{ id: number; comment: string }>;
  comments?: string;
}

export const EMPTY_FIELDS: ReviewFields = { kpi: {}, values: {}, kpiComments: {}, valueComments: {}, comments: "" };

function toNumberKeyed(record: Record<string, number>): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [key, rating] of Object.entries(record)) {
    const id = Number(key);
    if (Number.isFinite(id)) out[id] = rating;
  }
  return out;
}

function toTextKeyed(record: Record<string, string> | undefined): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [key, text] of Object.entries(record ?? {})) {
    const id = Number(key);
    if (Number.isFinite(id) && typeof text === "string") out[id] = text;
  }
  return out;
}

export function fieldsFromDraft(draft: RemoteDraftLike | null | undefined): ReviewFields {
  if (!draft) return { kpi: {}, values: {}, kpiComments: {}, valueComments: {}, comments: "" };
  return {
    kpi: toNumberKeyed(draft.kpi_ratings),
    values: toNumberKeyed(draft.value_ratings),
    kpiComments: toTextKeyed(draft.kpi_comments),
    valueComments: toTextKeyed(draft.value_comments),
    comments: draft.comments ?? "",
  };
}

/**
 * Take the server's draft for every field this manager is not in the middle of
 * changing. A dirty field keeps the local value (it is about to be sent, and is
 * the newer write); a field the server doesn't have yet keeps the local value
 * too. Ratings can't be un-set, so a missing remote rating never erases one.
 */
export function mergeRemoteDraft(
  local: ReviewFields,
  remote: RemoteDraftLike | null | undefined,
  dirty: ReadonlySet<DirtyKey>
): ReviewFields {
  if (!remote) return local;
  const incoming = fieldsFromDraft(remote);
  const kpi = { ...local.kpi };
  for (const [key, rating] of Object.entries(incoming.kpi)) {
    if (!dirty.has(`k:${key}` as DirtyKey)) kpi[Number(key)] = rating;
  }
  const values = { ...local.values };
  for (const [key, rating] of Object.entries(incoming.values)) {
    if (!dirty.has(`v:${key}` as DirtyKey)) values[Number(key)] = rating;
  }
  const kpiComments = { ...local.kpiComments };
  for (const [key, text] of Object.entries(incoming.kpiComments)) {
    if (!dirty.has(`kc:${key}` as DirtyKey)) kpiComments[Number(key)] = text;
  }
  const valueComments = { ...local.valueComments };
  for (const [key, text] of Object.entries(incoming.valueComments)) {
    if (!dirty.has(`vc:${key}` as DirtyKey)) valueComments[Number(key)] = text;
  }
  const comments = dirty.has("comments") ? local.comments : remote.version > 0 ? incoming.comments : local.comments;
  return { kpi, values, kpiComments, valueComments, comments };
}

/** The request body for exactly the dirty fields — nothing else is overwritten. */
export function buildPatch(fields: ReviewFields, dirty: ReadonlySet<DirtyKey>): DraftPatch {
  const patch: DraftPatch = { kpi_ratings: [], value_ratings: [], kpi_comments: [], value_comments: [] };
  for (const key of dirty) {
    const id = Number(key.slice(key.indexOf(":") + 1));
    if (key === "comments") {
      patch.comments = fields.comments;
    } else if (key.startsWith("kc:")) {
      patch.kpi_comments.push({ id, comment: fields.kpiComments[id] ?? "" });
    } else if (key.startsWith("vc:")) {
      patch.value_comments.push({ id, comment: fields.valueComments[id] ?? "" });
    } else if (key.startsWith("k:")) {
      if (fields.kpi[id] != null) patch.kpi_ratings.push({ kpi_id: id, rating: fields.kpi[id] });
    } else if (fields.values[id] != null) {
      patch.value_ratings.push({ value_id: id, rating: fields.values[id], comment: "" });
    }
  }
  return patch;
}

export function isEmptyPatch(patch: DraftPatch): boolean {
  return (
    patch.kpi_ratings.length === 0 &&
    patch.value_ratings.length === 0 &&
    patch.kpi_comments.length === 0 &&
    patch.value_comments.length === 0 &&
    patch.comments === undefined
  );
}

/**
 * After a save succeeds, which dirty keys are settled. A key stays dirty if the
 * manager changed that field again while the request was in flight — otherwise
 * the next poll would overwrite their newer value with the one just saved.
 */
export function settleDirty(
  dirty: ReadonlySet<DirtyKey>,
  sent: ReviewFields,
  current: ReviewFields
): Set<DirtyKey> {
  const stillDirty = new Set<DirtyKey>();
  for (const key of dirty) {
    const id = Number(key.slice(key.indexOf(":") + 1));
    const changedSince =
      key === "comments"
        ? current.comments !== sent.comments
        : key.startsWith("kc:")
          ? current.kpiComments[id] !== sent.kpiComments[id]
          : key.startsWith("vc:")
            ? current.valueComments[id] !== sent.valueComments[id]
            : key.startsWith("k:")
              ? current.kpi[id] !== sent.kpi[id]
              : current.values[id] !== sent.values[id];
    if (changedSince) stillDirty.add(key);
  }
  return stillDirty;
}

/** Copy of `fields` for the sent snapshot (the live object keeps changing). */
export function snapshotFields(fields: ReviewFields): ReviewFields {
  return {
    kpi: { ...fields.kpi },
    values: { ...fields.values },
    kpiComments: { ...fields.kpiComments },
    valueComments: { ...fields.valueComments },
    comments: fields.comments,
  };
}
