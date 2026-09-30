// A tiny stand-in for the FastAPI backend, just enough for the dashboard to load and for
// preferences to behave like the real ones: they are remembered server-side, so what one
// browser saves is what a different browser is told. Failures can be switched on per test.
import http from "node:http";

const DEFAULT_PREFS = {
  timezone: "Asia/Kolkata", theme: "light", density: "comfortable", reduce_motion: false,
  email_notifications: true, desktop_notifications: true, week_starts_on: "monday", date_format: "DMY",
};
const RELEASE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/; // what the real backend accepts

export function startMockApi({ port }) {
  const state = {
    lastSeen: null, // the user's saved last_seen_release — server-side, shared by every browser
    putStatus: 200, // set to 500 to simulate the save failing
    getStatus: 200, // set to 500 to simulate preferences failing to load
    userStatus: "ACTIVE",
    puts: [], // every body PUT to /profile/preferences
    writes: [], // every non-GET request anywhere: { method, path, body }
    requests: [],
  };
  const json = (res, status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  const prefs = () => ({ ...DEFAULT_PREFS, last_seen_release: state.lastSeen });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      state.requests.push(`${req.method} ${url.pathname}`);
      if (req.method !== "GET") {
        let body = raw;
        try { body = raw ? JSON.parse(raw) : null; } catch { /* leave as text */ }
        state.writes.push({ method: req.method, path: url.pathname, body });
      }
      const path = url.pathname.replace(/^\/api\/v1/, "");
      // Like the real API: no session cookie forwarded, no access. (Without this the sign-in page
      // would think you are logged in and bounce you to the dashboard.)
      if (!/(^|;\s*)(accessToken|tokenId)=/.test(req.headers.cookie ?? "")) {
        return json(res, 401, { detail: "Not authenticated" });
      }
      if (path === "/auth/me") {
        return json(res, 200, {
          message: "ok",
          data: {
            message: "ok", email: "qa@webknot.in", name: "QA Tester", roles: ["ROLE_EMPLOYEE"],
            status: state.userStatus, user_type: "FULLTIME", session_inactivity_minutes: 240,
          },
        });
      }
      if (path === "/roles") return json(res, 200, { message: "ok", data: { roles: ["ROLE_EMPLOYEE"] } });
      if (path === "/profile/preferences") {
        if (req.method === "GET") {
          return state.getStatus === 200 ? json(res, 200, { message: "ok", data: prefs() }) : json(res, state.getStatus, { detail: "boom" });
        }
        if (req.method === "PUT") {
          const body = raw ? JSON.parse(raw) : {};
          state.puts.push(body);
          if (state.putStatus !== 200) return json(res, state.putStatus, { detail: "boom" });
          if (body.last_seen_release != null) {
            if (!RELEASE_ID.test(body.last_seen_release)) return json(res, 400, { detail: "invalid release id" });
            state.lastSeen = body.last_seen_release;
          }
          return json(res, 200, { message: "ok", data: prefs() });
        }
      }
      if (path === "/profile") {
        return json(res, 200, { message: "ok", data: { email: "qa@webknot.in", name: "QA Tester", status: state.userStatus, roles: ["ROLE_EMPLOYEE"] } });
      }
      if (path === "/profile/balances") {
        return json(res, 200, { message: "ok", data: { emp_id: "E1", leave: { primary: 5, secondary: 2, carry_forward: 0, total: 7 }, comp_off_balance: 0 } });
      }
      if (path === "/profile/balances/monthly") {
        const month = (m, label, extra = {}) => ({ year: 2026, month: m, label, is_current: false, credit: 1.5, approved_days: 0, pending_days: 0, closing_total: 8.5, lop_days: 0, closing_total_if_pending: 8.5, lop_days_if_pending: 0, ...extra });
        return json(res, 200, { message: "ok", data: { accrues: true, monthly_credit_total: 1.5, monthly_credit_primary: 1, monthly_credit_secondary: 0.5, credited_on: "the 1st of every month", current_total: 7,
          months: [month(9, "Sep 2026", { is_current: true, credit: 0, closing_total: 7 }), month(10, "Oct 2026", { approved_days: 3, closing_total: 5.5 }), month(11, "Nov 2026")] } });
      }
      if (path === "/profile/balances/leave-impact") {
        return json(res, 200, { message: "ok", data: { leave_days: 1, lop_days: 0, covered_days: 1, balance_after: 6, message: "Covered by your leave balance — 1 day(s) will be deducted." } });
      }
      // Shapes the dashboard home needs to render without its error boundary.
      if (path === "/celebrations") return json(res, 200, { message: "ok", data: { birthdays: [], anniversaries: [], today: [], upcoming: [] } });
      return json(res, 200, { message: "ok", data: [] }); // everything else the dashboard asks for: empty
    });
  });

  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () => resolve({ state, close: () => new Promise((r) => server.close(r)) }))
  );
}
