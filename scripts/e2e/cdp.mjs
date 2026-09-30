// Drives a real headless Chrome over the DevTools protocol — no test framework, no extra
// dependency (Node's built-in WebSocket and fetch). Used by the e2e scripts in this folder.
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, existsSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

export function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const cache = join(homedir(), ".cache", "puppeteer", "chrome");
  if (existsSync(cache)) {
    for (const version of readdirSync(cache).sort().reverse()) {
      const bin = join(cache, version, "chrome-linux64", "chrome");
      if (existsSync(bin)) return bin;
    }
  }
  throw new Error("Chrome not found — set CHROME_BIN to a Chrome/Chromium binary.");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchChrome({ debugPort, width = 1280, height = 900 }) {
  const profile = mkdtempSync(join(tmpdir(), "wt-e2e-"));
  const proc = spawn(
    findChrome(),
    ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--window-size=${width},${height}`,
     `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"],
    { stdio: "ignore" }
  );
  let targets = null;
  for (let i = 0; i < 60 && !targets; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      targets = list.find((t) => t.type === "page") ?? null;
    } catch { /* not up yet */ }
    if (!targets) await sleep(250);
  }
  if (!targets) { proc.kill(); throw new Error("Chrome did not start"); }
  const page = await Page.connect(targets.webSocketDebuggerUrl);
  return { page, close: async () => { try { page.ws.close(); } catch { /* */ } proc.kill("SIGKILL"); } };
}

export class Page {
  constructor(ws) {
    this.ws = ws; this.nextId = 1; this.pending = new Map(); this.console = []; this.errors = [];
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id); this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method === "Runtime.consoleAPICalled") {
        this.console.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
      } else if (msg.method === "Runtime.exceptionThrown") {
        this.errors.push(msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text ?? "exception");
      }
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
    const page = new Page(ws);
    await page.send("Page.enable"); await page.send("Runtime.enable"); await page.send("Network.enable");
    return page;
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async evaluate(expression) {
    const out = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (out.exceptionDetails) throw new Error(out.exceptionDetails.exception?.description ?? "evaluate failed");
    return out.result.value;
  }
  async goto(url) {
    await this.send("Page.navigate", { url });
    await this.waitFor(() => "document.readyState === 'complete'", { timeout: 60000 });
  }
  /** Poll a page-side expression until it is truthy. `fn` returns the expression source. */
  async waitFor(fn, { timeout = 20000, interval = 150, what = "condition" } = {}) {
    const started = Date.now();
    for (;;) {
      try { if (await this.evaluate(fn())) return true; } catch { /* page navigating */ }
      if (Date.now() - started > timeout) throw new Error(`Timed out waiting for ${what}`);
      await sleep(interval);
    }
  }
  /** True if the expression stays falsy for the whole window (used to prove something does NOT appear). */
  async staysFalse(fn, { forMs = 2500, interval = 150 } = {}) {
    const started = Date.now();
    while (Date.now() - started < forMs) {
      try { if (await this.evaluate(fn())) return false; } catch { /* */ }
      await sleep(interval);
    }
    return true;
  }
  async setCookies(cookies) {
    for (const c of cookies) await this.send("Network.setCookie", { url: "http://localhost", path: "/", ...c });
  }
  async clearBrowserData(origin) {
    await this.send("Storage.clearDataForOrigin", { origin, storageTypes: "all" });
    await this.send("Network.clearBrowserCookies");
  }
  async screenshot(path) {
    const { data } = await this.send("Page.captureScreenshot", { format: "png" });
    (await import("node:fs")).writeFileSync(path, Buffer.from(data, "base64"));
  }
  /** A real key press. Enter must carry its character ("\r") or Chrome won't activate a focused button. */
  async press(key, code) {
    const vk = { Escape: 27, Enter: 13 }[key];
    const base = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
    const text = key === "Enter" ? { text: "\r", unmodifiedText: "\r" } : {};
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", ...base, ...text });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  }
}
