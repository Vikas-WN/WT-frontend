#!/bin/bash
rm -f /usr/bin/webtrak
rm -f /etc/dconf/db/local.d/50-webtrak-favorites
command -v dconf >/dev/null 2>&1 && dconf update >/dev/null 2>&1 || true
update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
exit 0
