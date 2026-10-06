#!/usr/bin/env bash
# Builds the Windows installer without Windows or Wine: electron-builder packages the app files, then makensis
# (run in a small Linux container so it works on any Mac/Linux with Docker) wraps them in installer/webtrak.nsi.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="$(node -p "require('./package.json').version")"
node scripts/write-config.cjs
node scripts/make-ico.cjs
npx electron-builder --config electron-builder.config.cjs --win dir --x64
docker run --rm -v "$PWD":/work -w /work/installer debian:bookworm-slim bash -c \
  "apt-get update -qq && apt-get install -y -qq nsis >/dev/null && makensis -V2 -DVERSION=${VERSION} -DSOURCE_DIR=/work/dist/win-unpacked -DOUT_FILE=/work/dist/WebTrak-${VERSION}-win-x64.exe webtrak.nsi"
ls -la "dist/WebTrak-${VERSION}-win-x64.exe"
