/** Turns a bug report into plain text a developer can paste into a ticket. Reads the captured context defensively: it varies by release. */

type Rec = Record<string, unknown>;

const asRec = (v: unknown): Rec => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {});
const asList = (v: unknown): Rec[] => (Array.isArray(v) ? v.filter((x): x is Rec => !!x && typeof x === "object") : []);
const text = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

export interface BugTextInput {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  reporterName: string;
  reportedAt: string;
  occurredAt: string | null;
  pageUrl: string | null;
  context: Record<string, unknown> | null;
  attachments: ReadonlyArray<{ file_name: string; file_url: string }>;
}

export function formatBugForDevelopers(bug: BugTextInput): string {
  const ctx = asRec(bug.context);
  const page = asRec(ctx.page);
  const browser = asRec(ctx.browser);
  const display = asRec(ctx.display);
  const network = asRec(ctx.network);
  const app = asRec(ctx.app);
  const session = asRec(ctx.session);
  const recent = asRec(ctx.recent);
  const lines: string[] = [`Bug #${bug.id}: ${bug.title}`, `Severity: ${bug.severity} · Status: ${bug.status}`, `Reported by: ${bug.reporterName}`, `Reported at: ${bug.reportedAt}`];
  if (bug.occurredAt) lines.push(`Happened at: ${bug.occurredAt}${ctx.time_zone ? ` (reporter's time zone: ${text(ctx.time_zone)})` : ""}`);
  lines.push("", "Description:", bug.description);

  const environment: string[] = [];
  if (page.url || bug.pageUrl) environment.push(`Page: ${text(page.url) || bug.pageUrl}`);
  if (browser.user_agent) environment.push(`Browser: ${text(browser.user_agent)}`);
  if (display.viewport) environment.push(`Window: ${text(display.viewport)} on a ${text(display.screen)} screen at ${text(display.pixel_ratio)}x, ${text(display.color_scheme)} mode${display.installed_app ? ", installed app" : ""}`);
  if (network.online !== undefined) environment.push(`Network: ${network.online ? "online" : "offline"}${network.type ? ` (${text(network.type)})` : ""}`);
  if (app.release) environment.push(`App release: ${text(app.release)}`);
  if (session.roles) environment.push(`Roles: ${Array.isArray(session.roles) ? session.roles.join(", ") : text(session.roles)}${session.active_role ? ` (acting as ${text(session.active_role)})` : ""}`);
  if (environment.length) lines.push("", "Environment:", ...environment.map((l) => `- ${l}`));

  const pages = asList(recent.pages);
  if (pages.length) lines.push("", "Pages visited (oldest first):", ...pages.map((p) => `- ${text(p.at)}  ${text(p.path)}`));
  const errors = asList(recent.errors);
  if (errors.length) lines.push("", "Recent errors:", ...errors.map((e) => `- ${text(e.at)}  [${text(e.kind)}] ${text(e.message)}`));
  const calls = asList(recent.api_calls);
  if (calls.length) {
    lines.push("", "Recent API calls (request id = the key to the server logs):");
    for (const c of calls) lines.push(`- ${text(c.at)}  ${text(c.method)} ${text(c.path)} → ${text(c.status) === "0" ? "no answer" : text(c.status)} in ${text(c.ms)} ms${c.requestId ? `  request_id=${text(c.requestId)}` : ""}`);
  }
  if (bug.attachments.length) lines.push("", "Attachments:", ...bug.attachments.map((a) => `- ${a.file_name}  (${a.file_url})`));
  return lines.join("\n");
}
