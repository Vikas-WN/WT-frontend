#!/bin/bash
# WebTrak post-install: command-line link, Electron sandbox permission, and a default spot in the GNOME dock.

ln -sf '/opt/WebTrak/webtrak' '/usr/bin/webtrak' || true

# Electron's sandbox helper must be setuid root on kernels without unprivileged user namespaces.
chmod 4755 '/opt/WebTrak/chrome-sandbox' || true

update-mime-database /usr/share/mime >/dev/null 2>&1 || true
update-desktop-database /usr/share/applications >/dev/null 2>&1 || true

# Ubuntu / GNOME: add WebTrak to the dock's default favourites for people who haven't customised their own.
if command -v dconf >/dev/null 2>&1 && [ -d /usr/share/gnome-shell ]; then
  mkdir -p /etc/dconf/profile /etc/dconf/db/local.d
  if [ ! -f /etc/dconf/profile/user ]; then
    printf 'user-db:user\nsystem-db:local\n' > /etc/dconf/profile/user
  elif ! grep -q 'system-db:local' /etc/dconf/profile/user; then
    printf 'system-db:local\n' >> /etc/dconf/profile/user
  fi
  cat > /etc/dconf/db/local.d/50-webtrak-favorites <<'FAV'
[org/gnome/shell]
favorite-apps=['org.gnome.Nautilus.desktop', 'firefox_firefox.desktop', 'webtrak.desktop', 'org.gnome.Terminal.desktop']
FAV
  dconf update >/dev/null 2>&1 || true
fi
exit 0
