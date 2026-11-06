#!/bin/bash
set -euo pipefail

for dependency in node npm; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    printf 'Missing %s. Install Node.js 18 or newer (including npm), then run this script again.\n' "$dependency" >&2
    exit 1
  fi
done

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

npm ci
npm run build
npm link

printf '\nInstalled globally. Run: wo --help\n'
