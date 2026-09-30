// End-to-end test of the "What's new" dialog in a REAL browser against the REAL app (Next dev
// server), with a mock backend that remembers preferences the way the real one does.
//
//   pnpm test:e2e:whats-new        (needs Chrome: auto-detected in ~/.cache/puppeteer, or CHROME_BIN)
//
// Screenshots go to scripts/e2e/out/ so you can look at what the user would see.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { launchChrome } from "./cdp.mjs";
import { startMockApi } from "./mock-api.mjs";
import { RELEASE_NOTES } from "../../src/constants/releaseNotes.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "scripts", "e2e", "out");
const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3111);
const API_PORT = Number(process.env.E2E_API_PORT ?? 3211);
const BASE = `http://localhost:${APP_PORT}`; // not 127.0.0.1: the Next dev server blocks its own scripts for that host
const LATEST = RELEASE_NOTES[0];
const COOKIES = ["accessToken", "tokenId", "refreshToken", "email"].map((name) => ({ name, value: "e2e" }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dialogOpen = () => `!!document.querySelector('[role="dialog"][aria-labelledby="whats-new-title"]')`;
const dialogText = () => `document.querySelector('[role="dialog"][aria-labelledby="whats-new-title"]')?.innerText ?? ""`;
const clickGotIt = () => `(() => { const b = [...document.querySelectorAll('[role="dialog"] button')].find((x) => x.innerText.trim() === "Got it"); b?.click(); return !!b; })()`;

let failures = 0;
const results = [];
function check(label, ok, detail = "") {
  results.push({ label, ok });
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `   ${detail}` : ""}`);
}

async function waitForApp() {
  for (let i = 0; i < 240; i += 1) {
    try { if ((await fetch(`${BASE}/login`)).status === 200) return; } catch { /* starting */ }
    await sleep(500);
  }
  throw new Error("Next dev server did not come up");
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const mock = await startMockApi({ port: API_PORT });
  const app = spawn("pnpm", ["exec", "next", "dev", "--turbopack", "-p", String(APP_PORT)], {
    cwd: ROOT, detached: true, stdio: "ignore",
    env: { ...process.env, API_BASE_URL: `http://127.0.0.1:${API_PORT}`, NEXT_TELEMETRY_DISABLED: "1" },
  });
  const stopApp = () => { try { process.kill(-app.pid, "SIGKILL"); } catch { /* gone */ } };
  process.on("exit", stopApp);
  let chrome;
  try {
    await waitForApp();
    chrome = await launchChrome({ debugPort: 9333 });
    const { page } = chrome;
    const s = mock.state;

    // Fresh browser (no storage, no cookies), server-side state as given.
    async function reset({ lastSeen = null, putStatus = 200, getStatus = 200, userStatus = "ACTIVE" } = {}) {
      Object.assign(s, { lastSeen, putStatus, getStatus, userStatus, puts: [], requests: [] });
      await page.goto(`${BASE}/login`);
      await page.clearBrowserData(BASE);
    }
    async function visit(path = "/dashboard/meeting-rooms") {
      await page.setCookies(COOKIES);
      s.requests.length = 0;
      await page.goto(`${BASE}${path}`);
    }
    const prefsLoaded = () => page.waitFor(() => `true`, { timeout: 1 }).then(async () => {
      for (let i = 0; i < 100 && !s.requests.includes("GET /api/v1/profile/preferences"); i += 1) await sleep(150);
      return s.requests.includes("GET /api/v1/profile/preferences");
    });
    const neverAppears = async () => { await prefsLoaded(); return page.staysFalse(dialogOpen, { forMs: 3000 }); };

    console.log(`\nLatest release in this build: ${LATEST.id}  (${LATEST.highlights.length} highlights)\n`);

    // 1 ---------------------------------------------------------------------------------------------
    await reset(); await visit();
    await page.waitFor(dialogOpen, { what: "the dialog on a first visit", timeout: 60000 });
    const text = await page.evaluate(dialogText());
    check("first visit: the dialog appears", true);
    check("it says what's new, and lists every highlight of the release", text.includes("What's new") && LATEST.highlights.every((h) => text.includes(h.title)), "");
    check("it shows the release date", text.includes("30 Sep 2026"));
    check("focus is on the dismiss button (Enter closes it)", (await page.evaluate(`document.activeElement?.innerText?.trim()`)) === "Got it");
    check("nothing is recorded just by seeing it", s.lastSeen === null && s.puts.length === 0);
    await page.screenshot(join(OUT, "1-dialog-first-visit.png"));

    // 2 ---------------------------------------------------------------------------------------------
    await page.evaluate(clickGotIt());
    await page.waitFor(() => `!(${dialogOpen()})`, { what: "the dialog to close" });
    check("'Got it' closes the dialog immediately", true);
    for (let i = 0; i < 60 && s.lastSeen === null; i += 1) await sleep(100);
    check("and records the release as seen on the server", s.lastSeen === LATEST.id, `saved: ${s.lastSeen}`);
    check("the save is the only preference change made", s.puts.length === 1 && Object.keys(s.puts[0]).join() === "last_seen_release");
    check("no error message was shown", !(await page.evaluate(`document.body.innerText.includes("Could not save")`)));
    await page.screenshot(join(OUT, "2-after-got-it.png"));

    // 3 ---------------------------------------------------------------------------------------------
    await visit();
    check("reload: it does NOT come back", await neverAppears());
    await visit("/dashboard/profile");
    check("another page: it does NOT come back", await neverAppears());

    // 4 ---------------------------------------------------------------------------------------------
    const seenOnServer = s.lastSeen;
    await page.clearBrowserData(BASE); // a different device: no localStorage at all
    s.requests.length = 0; await visit();
    check("a different device/browser: still not shown (seen is saved per user, not per browser)", s.lastSeen === seenOnServer && (await neverAppears()));

    // 5 ---------------------------------------------------------------------------------------------
    await reset(); await visit();
    await page.waitFor(dialogOpen, { what: "dialog before Escape", timeout: 60000 });
    await page.press("Escape", "Escape");
    await page.waitFor(() => `!(${dialogOpen()})`, { what: "Escape to close" });
    for (let i = 0; i < 60 && s.lastSeen === null; i += 1) await sleep(100);
    check("Escape closes it and counts as seen", s.lastSeen === LATEST.id);

    // 6 ---------------------------------------------------------------------------------------------
    await reset(); await visit();
    await page.waitFor(dialogOpen, { what: "dialog before clicking outside", timeout: 60000 });
    await page.evaluate(`(() => { const d = document.querySelector('[role="dialog"][aria-labelledby="whats-new-title"]'); d.parentElement.click(); })()`);
    await page.waitFor(() => `!(${dialogOpen()})`, { what: "outside click to close" });
    for (let i = 0; i < 60 && s.lastSeen === null; i += 1) await sleep(100);
    check("clicking outside closes it and counts as seen", s.lastSeen === LATEST.id);

    // 7 ---------------------------------------------------------------------------------------------
    await reset(); await visit();
    await page.waitFor(dialogOpen, { what: "dialog before Enter", timeout: 60000 });
    await page.press("Enter", "Enter");
    await page.waitFor(() => `!(${dialogOpen()})`, { what: "Enter to close" });
    check("keyboard: Enter dismisses it", true);

    // 8 ---------------------------------------------------------------------------------------------
    await reset({ putStatus: 500 }); await visit();
    await page.waitFor(dialogOpen, { what: "dialog before a failing save", timeout: 60000 });
    await page.evaluate(clickGotIt());
    await page.waitFor(() => `!(${dialogOpen()})`, { what: "dialog to close despite the failing save" });
    await sleep(1500);
    check("the save fails (server error) but the dialog still closes", s.lastSeen === null && s.puts.length >= 1);
    const stray = await page.evaluate(`(document.body.innerText.match(/.{0,50}(could not save|error|failed).{0,50}/i) || [])[0] ?? ""`);
    if (stray) console.log(`      (page text mentioning an error, for information: "${stray.replace(/\n/g, " ")}")`);
    check("...and nobody is shown an error about saving it", !/could not save/i.test(await page.evaluate(`document.body.innerText`)));
    s.putStatus = 200; await visit();
    check("...and it does not nag again in this browser on reload", await neverAppears());

    // 9 ---------------------------------------------------------------------------------------------
    await reset({ getStatus: 500 }); await visit();
    check("if preferences can't be loaded we can't know what they've seen: show nothing", await neverAppears());

    // 10 --------------------------------------------------------------------------------------------
    await reset({ lastSeen: "2026-09-01-01" }); await visit();
    await page.waitFor(dialogOpen, { what: "dialog for a new release", timeout: 60000 });
    check("a NEW deployment: someone who saw an older release is shown the new one", (await page.evaluate(dialogText())).includes(LATEST.highlights[0].title));
    await reset({ lastSeen: LATEST.id }); await visit();
    check("someone who already saw this release sees nothing", await neverAppears());
    await reset({ lastSeen: "2099-01-01-01" }); await visit();
    check("an id from a NEWER build (a rollback) shows nothing old", await neverAppears());

    // 11 --------------------------------------------------------------------------------------------
    await reset({ lastSeen: LATEST.id }); await visit(`/dashboard/meeting-rooms?whatsNew=preview`);
    await page.waitFor(dialogOpen, { what: "the preview", timeout: 60000 });
    check("?whatsNew=preview shows it even to someone who has seen it, marked as a preview", (await page.evaluate(dialogText())).includes("Preview"));
    await page.screenshot(join(OUT, "3-preview.png"));
    await page.evaluate(clickGotIt());
    await page.waitFor(() => `!(${dialogOpen()})`, { what: "preview to close" });
    await sleep(800);
    check("closing a preview records nothing", s.puts.length === 0 && s.lastSeen === LATEST.id);

    // 12 --------------------------------------------------------------------------------------------
    await reset(); await page.goto(`${BASE}/login`);
    check("the sign-in page never shows it", await page.staysFalse(dialogOpen, { forMs: 2000 }));

    // 13 --------------------------------------------------------------------------------------------
    await reset({ userStatus: "INVITED" }); await visit();
    check("someone still being onboarded isn't interrupted by it", await page.staysFalse(dialogOpen, { forMs: 4000 }));

    check("no uncaught exceptions in the page", page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
  } finally {
    if (chrome) await chrome.close();
    stopApp();
    await mock.close();
  }
}

main()
  .then(() => {
    console.log(`\n${results.length - failures} of ${results.length} checks passed`);
    process.exit(failures ? 1 : 0);
  })
  .catch((error) => { console.error("E2E crashed:", error); process.exit(2); });
