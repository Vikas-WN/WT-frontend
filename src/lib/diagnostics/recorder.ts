"use client";

import { maskText, pushBounded, routeTemplate } from "@/utils/diagnostics";

/**
 * A small rolling memory of what the app just did — the last pages visited, the last errors, the last API calls — so a bug report
 * can say what led up to the problem. Kept only in memory (gone on reload), bounded, with no request or response bodies, and
 * with ids, e-mail addresses and tokens removed.
 */
const MAX_PAGES = 15;
const MAX_ERRORS = 8;
const MAX_CALLS = 15;

export interface PageVisit {
  at: string;
  path: string;
}
export interface RecordedError {
  at: string;
  kind: string;
  message: string;
}
export interface RecordedCall {
  at: string;
  method: string;
  path: string;
  /** 0 when the request never got an answer (offline, blocked, timed out). */
  status: number;
  ms: number;
  /** The server's id for this request (X-Request-ID): the key to its log lines and trace. */
  requestId?: string;
}

const pages: PageVisit[] = [];
const errors: RecordedError[] = [];
const calls: RecordedCall[] = [];

const now = () => new Date().toISOString();

export function recordPage(path: string): void {
  if (pages.at(-1)?.path === path) return;
  pushBounded(pages, { at: now(), path: routeTemplate(path) }, MAX_PAGES);
}

export function recordError(kind: string, message: string): void {
  pushBounded(errors, { at: now(), kind, message: maskText(message, 300) }, MAX_ERRORS);
}

export function recordCall(call: Omit<RecordedCall, "at" | "path"> & { path: string }): void {
  pushBounded(calls, { ...call, at: now(), path: routeTemplate(call.path) }, MAX_CALLS);
}

export function snapshotRecording(): { pages: PageVisit[]; errors: RecordedError[]; calls: RecordedCall[] } {
  return { pages: [...pages], errors: [...errors], calls: [...calls] };
}
