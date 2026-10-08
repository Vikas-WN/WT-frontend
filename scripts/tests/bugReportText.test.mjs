import assert from "node:assert/strict";
import { test } from "node:test";

import { formatBugForDevelopers } from "../../src/utils/bugReportText.ts";

const base = { id: 7, title: "Leave page blank", description: "Blank after Apply", severity: "HIGH", status: "OPEN", reporterName: "Amy Rao", reportedAt: "08/10/2026 15:04:09", occurredAt: "08/10/2026 15:00:02", pageUrl: "https://app/x", attachments: [] };

test("a report with full context reads like a ticket, with request ids", () => {
  const out = formatBugForDevelopers({
    ...base,
    attachments: [{ file_name: "shot.png", file_url: "s3://bug-reports/1/shot.png" }],
    context: {
      time_zone: "Asia/Kolkata",
      page: { url: "https://app/dashboard/leave" },
      browser: { user_agent: "Chrome 126" },
      display: { viewport: "390x844", screen: "390x844", pixel_ratio: 3, color_scheme: "dark", installed_app: true },
      network: { online: true, type: "4g" },
      app: { release: "abc123" },
      session: { roles: ["ROLE_HR", "ROLE_EMPLOYEE"], active_role: "ROLE_HR" },
      recent: {
        pages: [{ at: "2026-10-08T09:30:00Z", path: "/dashboard/home" }],
        errors: [{ at: "2026-10-08T09:30:05Z", kind: "js", message: "Cannot read x" }],
        api_calls: [{ at: "2026-10-08T09:30:06Z", method: "POST", path: "/api/v1/leave", status: 500, ms: 812, requestId: "ab12cd34ef56ab12" }, { at: "x", method: "GET", path: "/api/v1/profile", status: 0, ms: 30 }],
      },
    },
  });
  for (const expected of ["Bug #7: Leave page blank", "Happened at: 08/10/2026 15:00:02 (reporter's time zone: Asia/Kolkata)", "Window: 390x844", "installed app", "Roles: ROLE_HR, ROLE_EMPLOYEE (acting as ROLE_HR)", "/dashboard/home", "[js] Cannot read x", "POST /api/v1/leave → 500 in 812 ms  request_id=ab12cd34ef56ab12", "→ no answer", "shot.png"]) {
    assert.ok(out.includes(expected), `missing: ${expected}\n${out}`);
  }
});

test("an old report without context still produces a clean summary", () => {
  const out = formatBugForDevelopers({ ...base, occurredAt: null, context: null });
  assert.ok(out.includes("Description:"));
  assert.equal(out.includes("Environment:") && out.includes("undefined"), false);
  assert.ok(out.includes("Page: https://app/x"));
});

test("junk in the context is ignored rather than crashing", () => {
  const out = formatBugForDevelopers({ ...base, context: { recent: "oops", display: 5, page: null } });
  assert.ok(out.includes("Bug #7"));
});
