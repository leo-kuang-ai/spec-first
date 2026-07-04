#!/bin/bash
# repair-install.sh - Deterministic Unix repair path for spec-mcp-setup
# Usage: repair-install.sh --tool <tool-id>

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TOOLS_JSON="$SKILL_DIR/mcp-tools.json"
source "$SCRIPT_DIR/lib-template.sh"
require_mcp_tools_schema_version 7 "$TOOLS_JSON"
TOOL_ID=""
USER_SCOPE_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      TOOL_ID="${2:-}"
      shift 2
      ;;
    --user-scope)
      USER_SCOPE_ARGS+=(--user-scope)
      export KIRO_USER_SCOPE=1
      export QODER_USER_SCOPE=1
      export CURSOR_USER_SCOPE=1
      shift
      ;;
    *)
      shift
      ;;
  esac
done

[ -n "$TOOL_ID" ] || { echo '错误：缺少 --tool' >&2; exit 1; }

missing_dep=""
while IFS= read -r dep; do
  if ! command -v "$dep" >/dev/null 2>&1; then
    missing_dep="$dep"
    break
  fi
done < <(jq -r --arg id "$TOOL_ID" '.tools[] | select(.id == $id) | .dependencies[]' "$TOOLS_JSON")

if [ -n "$missing_dep" ]; then
  echo "repair_failed:missing_dependency:$missing_dep" >&2
  exit 1
fi

bash "$SCRIPT_DIR/configure-host.sh" --tool "$TOOL_ID" "${USER_SCOPE_ARGS[@]}"
