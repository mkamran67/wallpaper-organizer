#!/bin/bash
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  printf 'Missing npm. Install Node.js (including npm), then run this script again.\n' >&2
  exit 1
fi

npm unlink --global wallpaper-organizer

printf '\nUninstalled the global wo command. The project folder and your images are unchanged.\n'
