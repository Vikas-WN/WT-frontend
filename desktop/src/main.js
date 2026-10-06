"use strict";

const { app, BrowserWindow, Menu, screen, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config.json");

const APP_ORIGIN = new URL(config.url).origin;
// Google sign-in (the only way into WebTrak) runs on these hosts; they stay inside the app window.
const AUTH_HOSTS = new Set(["accounts.google.com", "accounts.youtube.com"]);
const APP_ID = "in.webknot.webtrak";

app.setAppUserModelId(APP_ID);

// Google refuses sign-in from browsers that announce themselves as "Electron", so present as the Chromium this is.
app.userAgentFallback = app.userAgentFallback
  .replace(/\sElectron\/\S+/, "")
  .replace(new RegExp(`\\s${app.getName().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/\\S+`), "");

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;
let retryTimer = null;

// ---- remembering the window -------------------------------------------------------------------------------------

const stateFile = () => path.join(app.getPath("userData"), "window-state.json");

function loadWindowState() {
  const fallback = { width: 1360, height: 860 };
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile(), "utf8"));
    const visible = screen.getAllDisplays().some((display) => {
      const b = display.workArea;
      return saved.x >= b.x - 40 && saved.y >= b.y - 40 && saved.x < b.x + b.width - 80 && saved.y < b.y + b.height - 80;
    });
    return { ...fallback, ...saved, ...(visible ? {} : { x: undefined, y: undefined }) };
  } catch {
    return fallback;
  }
}

function saveWindowState(win) {
  try {
    const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, maximized: win.isMaximized() }));
  } catch {
    // Not being able to remember the size is not worth bothering anyone about.
  }
}

// ---- what may open where ----------------------------------------------------------------------------------------

function isInApp(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.origin === APP_ORIGIN || (url.protocol === "https:" && AUTH_HOSTS.has(url.hostname));
  } catch {
    return false;
  }
}

function openExternally(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:") void shell.openExternal(url.toString());
  } catch {
    // Malformed address: ignore.
  }
}

// ---- offline page -----------------------------------------------------------------------------------------------

function showOffline(win) {
  const file = path.join(__dirname, "offline.html");
  void win.loadFile(file, { query: { to: APP_ORIGIN + "/dashboard" } });
  clearInterval(retryTimer);
  retryTimer = setInterval(() => {
    if (win.isDestroyed()) return clearInterval(retryTimer);
    fetch(APP_ORIGIN, { method: "HEAD" })
      .then(() => {
        clearInterval(retryTimer);
        void win.loadURL(APP_ORIGIN + "/dashboard");
      })
      .catch(() => {});
  }, 8000);
}

// ---- window -----------------------------------------------------------------------------------------------------

function createWindow() {
  const state = loadWindowState();
  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    title: "WebTrak",
    icon: path.join(__dirname, "icon.png"),
    show: false,
    backgroundColor: "#0b0d12",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });
  mainWindow = win;
  if (state.maximized) win.maximize();
  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInApp(url)) return { action: "allow" };
    openExternally(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file:")) return;
    if (!isInApp(url)) {
      event.preventDefault();
      openExternally(url);
    }
  });
  win.webContents.on("did-fail-load", (_event, code, _description, _url, isMainFrame) => {
    // -3 is "aborted" (a redirect replaced the load): not a failure.
    if (isMainFrame && code !== -3) showOffline(win);
  });
  // The page title is the section name; keep the product name visible next to it.
  win.on("page-title-updated", (event, title) => {
    event.preventDefault();
    win.setTitle(title && !/webtrak/i.test(title) ? `${title} — WebTrak` : "WebTrak");
  });
  ["resize", "move", "close"].forEach((name) => win.on(name, () => saveWindowState(win)));
  win.on("closed", () => {
    clearInterval(retryTimer);
    mainWindow = null;
  });

  void win.loadURL(APP_ORIGIN + "/dashboard");
  return win;
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        { label: "Open WebTrak in browser", click: () => openExternally(APP_ORIGIN + "/dashboard") },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  // Notifications from WebTrak are welcome; everything else (camera, location, …) is declined.
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const requester = webContents.getURL();
    callback(permission === "notifications" && requester.startsWith(APP_ORIGIN));
  });
  buildMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
