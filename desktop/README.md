# WebTrak for desktop

A small, standard desktop app that opens WebTrak in its own window — installed like any other program, on macOS, Windows
and Ubuntu/Debian, whatever browser a person uses. It is a window onto the website (`https://webtrak.webknot-dev.in`), so
there is nothing to update when WebTrak changes; only the installer needs re-sharing when the app shell itself changes.

| System | File | Installs to |
|---|---|---|
| macOS 11+ (Apple silicon & Intel) | `WebTrak-<version>-mac-universal.pkg` | `/Applications/WebTrak.app`, and added to the Dock |
| Windows 10 / 11 (64-bit) | `WebTrak-<version>-win-x64.exe` | per-user, with Desktop and Start-menu shortcuts |
| Ubuntu / Debian (x64 or arm64) | `WebTrak-<version>-linux-<arch>.deb` | `/opt/WebTrak`, launcher `webtrak`, added to the dock favourites |

## Install (one click)

- **macOS** — double-click the `.pkg` and follow the prompts. WebTrak appears in the Dock.
- **Windows** — double-click the `.exe`. It installs in a few seconds and opens WebTrak.
- **Ubuntu** — double-click the `.deb` (Software Install), or: `sudo apt install ./WebTrak-*-linux-*.deb`

### Until the installers are code-signed
Without a signing certificate the operating systems warn that the app is from an unidentified developer:
- **Windows SmartScreen** — click *More info* → *Run anyway*.
- **macOS Gatekeeper** — right-click the `.pkg` → *Open* → *Open* (or *System Settings → Privacy & Security → Open Anyway*).
  Installs pushed by an MDM (Jamf, Intune, Kandji) are not blocked.

## Rolling it out to everyone (IT)

Silent installs, for scripting or a management tool:

```bash
# macOS (as root)
sudo installer -pkg WebTrak-1.0.0-mac-universal.pkg -target /

# Windows (PowerShell) — per-user install
.\WebTrak-1.0.0-win-x64.exe /S

# Ubuntu / Debian
sudo apt-get install -y ./WebTrak-1.0.0-linux-x64.deb
```

**Keeping it on the Dock / taskbar**
- **macOS** — the installer adds it to the Dock of the logged-in user. To enforce it for everyone, push a Dock profile
  from your MDM (`com.apple.dock` → `static-apps`).
- **Ubuntu** — the installer adds WebTrak to the default dock favourites (people who already customised their dock
  keep their own list and can pin it from the launcher).
- **Windows** — Windows 11 does not let installers pin themselves. Pin it by policy: Intune → *Devices → Configuration →
  Settings catalog → Start → Pin to taskbar* (or a Group Policy *Start Layout / Taskbar layout* XML that lists
  `WebTrak`). Without a policy people can right-click the taskbar icon → *Pin to taskbar*.

**Stopping people removing it** needs the same management tool: on Windows deploy it from Intune as a *required* app,
on macOS from Jamf/Intune as a managed app, on Ubuntu install it with the package manager as root and keep employees
as non-admin users.

## Build it yourself

Requires Node 20+. From this folder:

```bash
npm install
npm run build:mac      # .pkg  (run on a Mac)
npm run build:win      # .exe  (needs Windows, or Docker/Wine on Mac/Linux)
npm run build:linux    # .deb
```

Point it at another environment (for example UAT) when building:

```bash
WEBTRAK_URL=https://uat-webtrak.webknot-dev.in npm run build:mac
```

Installers appear in `dist/`.

### Signing (recommended before sharing widely)
- **macOS** — an Apple *Developer ID Installer / Application* certificate, then set `CSC_LINK`, `CSC_KEY_PASSWORD`,
  and the notarisation variables (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`), and remove
  `identity: null` in `electron-builder.config.cjs`.
- **Windows** — a code-signing certificate: set `CSC_LINK` / `CSC_KEY_PASSWORD` (and remove
  `signAndEditExecutable: false` when building on Windows).

## How it behaves
- Opens WebTrak at `/dashboard`; sign in with your company Google account, as in the browser.
- Links to other sites open in your normal browser; Google sign-in stays inside the app.
- Remembers its window size and position; one window at a time.
- If the network drops it shows a friendly offline screen and reconnects by itself.
- Allows notifications from WebTrak; declines camera, microphone and location requests.
