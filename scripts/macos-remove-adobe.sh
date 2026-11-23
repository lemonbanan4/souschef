#!/usr/bin/env bash
# Remove Adobe Creative Cloud + Photoshop from /Applications (requires admin password).
# Run after closing Photoshop / Creative Cloud desktop app.
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
  echo "Re-running with sudo…"
  exec sudo "$0" "$@"
fi

paths=(
  "/Applications/Adobe Photoshop 2026"
  "/Applications/Adobe Photoshop 2027"
  "/Applications/Adobe Creative Cloud"
  "/Applications/Utilities/Adobe Creative Cloud"
  "/Applications/Utilities/Adobe Creative Cloud Experience"
  "/Applications/Utilities/Adobe Application Manager"
  "/Applications/Utilities/Adobe Sync"
  "/Applications/Utilities/Adobe Installers"
  "/Applications/Utilities/Adobe Genuine Service"
)

for p in "${paths[@]}"; do
  if [[ -e "$p" ]]; then
    echo "Removing $p"
    rm -rf "$p"
  fi
done

echo "Done. Check: ls /Applications/Adobe*"