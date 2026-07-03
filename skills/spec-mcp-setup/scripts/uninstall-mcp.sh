#!/bin/bash
# uninstall-mcp.sh - Deterministic Unix uninstall path for spec-mcp-setup
# Usage: uninstall-mcp.sh [--tool <tool-id>]

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TOOLS_JSON="$SKILL_DIR/mcp-tools.json"
source "$SCRIPT_DIR/lib-toml.sh"
source "$SCRIPT_DIR/lib-template.sh"
require_mcp_tools_schema_version 7 "$TOOLS_JSON"

KIRO_USER_SCOPE_ARG=false
for arg in "$@"; do
  if [ "$arg" = "--user-scope" ]; then
    KIRO_USER_SCOPE_ARG=true
    export KIRO_USER_SCOPE=1
  fi
done

HOST_INFO_JSON="$(bash "$SCRIPT_DIR/detect-host.sh")"
HOST="$(jq -r '.host' <<<"$HOST_INFO_JSON")"
PLATFORM="$(jq -r '.platform' <<<"$HOST_INFO_JSON")"
TOOL_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      TOOL_ID="${2:-}"
      shift 2
      ;;
    --user-scope)
      KIRO_USER_SCOPE_ARG=true
      export KIRO_USER_SCOPE=1
      shift
      ;;
    *)
      shift
      ;;
  esac
done

resolve_path_template() {
  local template="$1"
  case "$template" in
    '$HOME'*)
      printf '%s%s' "$HOME" "${template#'$HOME'}"
      ;;
    *)
      printf '%s' "$template"
      ;;
  esac
}

kiro_user_scope_requested() {
  [ "$KIRO_USER_SCOPE_ARG" = "true" ] && return 0
  case "${KIRO_USER_SCOPE:-}" in
    1|true|TRUE|yes|YES|approved|APPROVED) return 0 ;;
    *) return 1 ;;
  esac
}

remove_claude_entry() {
  local config_path="$1"
  local tool_id="$2"
  [ -f "$config_path" ] || return 0
  local tmp backup
  tmp="$(mktemp "${config_path}.XXXXXX")"
  backup="$(mktemp "${config_path}.backup.XXXXXX")"
  chmod 600 "$tmp"
  cp "$config_path" "$backup"
  chmod 600 "$backup"
  if jq --arg id "$tool_id" 'if .mcpServers then .mcpServers |= with_entries(select(.key != $id)) else . end' "$config_path" > "$tmp" && mv "$tmp" "$config_path"; then
    rm -f "$backup"
  else
    cp "$backup" "$config_path"
    rm -f "$tmp" "$backup"
    return 1
  fi
}

remove_json_mcp_entry() {
  remove_claude_entry "$@"
}

remove_codex_entry() {
  local config_path="$1"
  local detect_key="$2"
  [ -f "$config_path" ] || return 0
  local tmp backup
  tmp="$(mktemp "${config_path}.XXXXXX")"
  backup="$(mktemp "${config_path}.backup.XXXXXX")"
  chmod 600 "$tmp"
  cp "$config_path" "$backup"
  chmod 600 "$backup"
  if remove_toml_mcp_section "$config_path" "$detect_key" "$tmp" && mv "$tmp" "$config_path"; then
    rm -f "$backup"
  else
    cp "$backup" "$config_path"
    rm -f "$tmp" "$backup"
    return 1
  fi
}

if [ -n "$TOOL_ID" ]; then
  if ! jq -e --arg id "$TOOL_ID" '.tools[] | select(.id == $id)' "$TOOLS_JSON" >/dev/null; then
    echo "错误：未找到 $TOOL_ID 的工具定义" >&2
    exit 1
  fi
  TOOL_IDS=("$TOOL_ID")
else
  mapfile -t TOOL_IDS < <(jq -r '.tools[].id' "$TOOLS_JSON")
fi

for tool_id in "${TOOL_IDS[@]}"; do
  detect_key="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .detection.key' "$TOOLS_JSON")"
  while IFS= read -r target_key; do
    target_json="$(jq -c --arg id "$tool_id" --arg host "$HOST" --arg key "$target_key" '.tools[] | select(.id == $id) | .host_config[$host].targets[$key]' "$TOOLS_JSON")"
    [ "$target_json" != "null" ] || continue
    raw_path="$(jq -r '.config_path | if type == "object" then .[$platform] // empty else . end' --arg platform "$PLATFORM" <<<"$target_json")"
    [ -n "$raw_path" ] || continue
    if [ "$HOST" = "kiro" ] && [ "$target_key" = "user" ] && ! kiro_user_scope_requested; then
      continue
    fi
    config_path="$(jq -r --arg key "$target_key" '.targets[$key].config_path // empty' <<<"$HOST_INFO_JSON")"
    [ -n "$config_path" ] || config_path="$(resolve_path_template "$raw_path")"
    if [ "$HOST" = "claude" ]; then
      remove_claude_entry "$config_path" "$detect_key"
    elif [ "$HOST" = "kiro" ]; then
      remove_json_mcp_entry "$config_path" "$detect_key"
    elif [ "$HOST" = "codex" ]; then
      remove_codex_entry "$config_path" "$detect_key"
    else
      echo "错误：无法识别宿主：$HOST" >&2
      exit 1
    fi
  done < <(jq -r --arg id "$tool_id" --arg host "$HOST" '.tools[] | select(.id == $id) | .host_config[$host].uninstall_targets[]' "$TOOLS_JSON")
done

refresh_status="ready"
if ! bash "$SCRIPT_DIR/verify-tools.sh" >/dev/null 2>&1; then
  refresh_status="failed"
fi

jq -n --arg host "$HOST" --arg platform "$PLATFORM" --arg refresh_status "$refresh_status" --argjson tools "$(printf '%s
' "${TOOL_IDS[@]}" | jq -R . | jq -s .)" '{host:$host,platform:$platform,removed_tools:$tools,readiness_refresh:$refresh_status}'
