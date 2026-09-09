#!/usr/bin/env bash
# Resolve the browser test server port through the shared project resolver.
# Usage: resolve-port.sh [--free] [EXPLICIT_PORT]
set -euo pipefail

free=0
explicit=""
for arg in "$@"; do
  case "$arg" in
    --free) free=1 ;;
    '' ) ;;
    *[!0-9]*) ;;
    *) explicit="$arg" ;;
  esac
done

skill_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
project_root=$(pwd)
if [ -n "$explicit" ]; then
  port="$explicit"
else
  port=$(bash "$skill_dir/spec-polish/scripts/resolve-port.sh" "$project_root")
fi

if [ "$free" -eq 1 ]; then
  while lsof -i ":$port" -sTCP:LISTEN -t >/dev/null 2>&1; do
    port=$((port + 1))
  done
fi
printf '%s\n' "$port"
