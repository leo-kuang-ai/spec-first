#!/bin/bash
# detect-host.sh - Detect the current host for MCP setup (Claude Code or Codex)
# Output: JSON with host-specific paths and Route B host facts

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TOOLS_JSON="$SKILL_DIR/mcp-tools.json"
source "$SCRIPT_DIR/lib-template.sh"
require_mcp_tools_schema_version 7 "$TOOLS_JSON"

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

apply_target_override() {
  local host="$1"
  local target_key="$2"
  local resolved_path="$3"
  case "$host:$target_key" in
    claude:managed)
      printf '%s' "${MCP_SETUP_CLAUDE_MANAGED_PATH_OVERRIDE:-$resolved_path}"
      ;;
    codex:system)
      printf '%s' "${MCP_SETUP_CODEX_SYSTEM_PATH_OVERRIDE:-$resolved_path}"
      ;;
    kiro:workspace)
      printf '%s' "${MCP_SETUP_KIRO_WORKSPACE_PATH_OVERRIDE:-$resolved_path}"
      ;;
    kiro:user)
      printf '%s' "${MCP_SETUP_KIRO_USER_PATH_OVERRIDE:-$resolved_path}"
      ;;
    *)
      printf '%s' "$resolved_path"
      ;;
  esac
}

kiro_user_scope_requested() {
  case "${KIRO_USER_SCOPE:-}" in
    1|true|TRUE|yes|YES|approved|APPROVED) return 0 ;;
    *) return 1 ;;
  esac
}

detect_host() {
  case "${MCP_SETUP_HOST:-}" in
    claude|codex|kiro)
      echo "$MCP_SETUP_HOST"
      return 0
      ;;
  esac

  if [ -n "${CODEX_CI:-}" ] || [ -n "${CODEX_MANAGED_BY_NPM:-}" ] || [ -n "${CODEX_THREAD_ID:-}" ] || [ -n "${CODEX_SANDBOX:-}" ]; then
    echo "codex"
    return 0
  fi

  if [ -n "${CLAUDE_CODE_SSE_PORT:-}" ] || [ -n "${CLAUDE_CODE_SESSION_ID:-}" ] || [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
    echo "claude"
    return 0
  fi

  if command -v codex >/dev/null 2>&1 && ! command -v claude >/dev/null 2>&1; then
    echo "codex"
    return 0
  fi

  if command -v claude >/dev/null 2>&1 && ! command -v codex >/dev/null 2>&1; then
    echo "claude"
    return 0
  fi

  echo "错误：无法自动识别宿主。请显式设置 MCP_SETUP_HOST=claude、MCP_SETUP_HOST=codex 或 MCP_SETUP_HOST=kiro 后再运行。" >&2
  return 1
}

detect_platform() {
  case "$(uname -s 2>/dev/null || echo unknown)" in
    Darwin)
      echo "macos"
      ;;
    Linux)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
      else
        echo "linux"
      fi
      ;;
    MINGW*|MSYS*|CYGWIN*)
      echo "windows"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

find_existing_parent() {
  local current="$1"
  while [ "$current" != "/" ] && [ ! -e "$current" ]; do
    current="$(dirname "$current")"
  done
  printf '%s' "$current"
}

can_write_target() {
  local path="$1"
  local check_mode="$2"
  local parent existing_parent
  parent="$(dirname "$path")"

  if [ -e "$path" ]; then
    [ -w "$path" ] && return 0
    [ "$check_mode" = "parent-or-file" ] && [ -w "$parent" ] && return 0
    return 1
  fi

  if [ "$check_mode" = "file-only" ]; then
    return 1
  fi

  existing_parent="$(find_existing_parent "$parent")"
  [ -d "$existing_parent" ] || return 1
  [ -w "$existing_parent" ]
}

load_host_contract() {
  local host="$1"
  local contracts_json unique_count
  contracts_json="$(jq -c --arg host "$host" '[.tools[] | .host_config[$host] | {scope, targets, fallback_order, uninstall_targets}]' "$TOOLS_JSON")"
  unique_count="$(jq 'unique | length' <<<"$contracts_json")"
  [ "$unique_count" = "1" ] || {
    echo "错误：$host 宿主配置元数据在不同工具之间不一致，请先统一 mcp-tools.json" >&2
    exit 1
  }
  jq -c '.[0]' <<<"$contracts_json"
}

build_target_json() {
  local host_contract_json="$1"
  local host="$2"
  local platform="$3"
  local target_key="$4"

  local target_json raw_path resolved_path config_format precedence writable_check exists writable
  target_json="$(jq -c --arg key "$target_key" '.targets[$key]' <<<"$host_contract_json")"
  raw_path="$(jq -r '.config_path | if type == "object" then .[$platform] // empty else . end' --arg platform "$platform" <<<"$target_json")"
  resolved_path="$(resolve_path_template "$raw_path")"
  resolved_path="$(apply_target_override "$host" "$target_key" "$resolved_path")"
  config_format="$(jq -r '.config_format' <<<"$target_json")"
  precedence="$(jq -r '.precedence' <<<"$target_json")"
  writable_check="$(jq -r '.writable_check // "parent-or-file"' <<<"$target_json")"

  if [ -e "$resolved_path" ]; then
    exists=true
  else
    exists=false
  fi

  if can_write_target "$resolved_path" "$writable_check"; then
    writable=true
  else
    writable=false
  fi

  jq -n \
    --arg key "$target_key" \
    --arg config_path "$resolved_path" \
    --arg config_format "$config_format" \
    --argjson precedence "$precedence" \
    --arg writable_check "$writable_check" \
    --argjson exists "$exists" \
    --argjson writable "$writable" \
    '{
      key: $key,
      config_path: $config_path,
      config_format: $config_format,
      precedence: $precedence,
      writable_check: $writable_check,
      exists: $exists,
      writable: $writable
    }'
}

host="$(detect_host)"
platform="$(detect_platform)"
host_contract_json="$(load_host_contract "$host")"

case "$host" in
  claude)
    cli_command="claude"
    display_name="Claude Code"
    marker_path="$HOME/.claude/spec-first/host-setup.json"
    config_format="json"
    ;;
  codex)
    cli_command="codex"
    display_name="Codex"
    marker_path="$HOME/.codex/spec-first/host-setup.json"
    config_format="toml"
    ;;
  kiro)
    cli_command="kiro"
    display_name="Kiro"
    marker_path="$HOME/.kiro/spec-first/host-setup.json"
    config_format="json"
    ;;
  *)
    echo "错误：无法识别宿主：$host" >&2
    exit 1
    ;;
esac

primary_scope="$(jq -r '.scope' <<<"$host_contract_json")"
fallback_order_json="$(jq -c '.fallback_order // []' <<<"$host_contract_json")"
uninstall_targets_json="$(jq -c '.uninstall_targets // []' <<<"$host_contract_json")"
if [ "$host" = "kiro" ] && kiro_user_scope_requested; then
  primary_scope="user"
  fallback_order_json='["user"]'
fi

targets_json='{}'
while IFS= read -r target_key; do
  target_fact="$(build_target_json "$host_contract_json" "$host" "$platform" "$target_key")"
  targets_json="$(jq --arg key "$target_key" --argjson value "$target_fact" '. + {($key): $value}' <<<"$targets_json")"
done < <(jq -r '.targets | keys[]' <<<"$host_contract_json")

selected_scope=""
selected_target_json='null'
while IFS= read -r scope_key; do
  candidate="$(jq -c --arg key "$scope_key" '.[$key]' <<<"$targets_json")"
  if [ "$candidate" != "null" ] && [ "$(jq -r '.writable' <<<"$candidate")" = "true" ]; then
    selected_scope="$scope_key"
    selected_target_json="$candidate"
    break
  fi
done < <(jq -r '.[]' <<<"$fallback_order_json")

if [ -z "$selected_scope" ]; then
  selected_scope="$(jq -r '.[0] // empty' <<<"$fallback_order_json")"
  if [ -n "$selected_scope" ]; then
    selected_target_json="$(jq -c --arg key "$selected_scope" '.[$key]' <<<"$targets_json")"
  fi
fi

config_path="$(jq -r '.config_path // empty' <<<"$selected_target_json")"
selected_precedence="$(jq -r '.precedence // 0' <<<"$selected_target_json")"
selected_writable="$(jq -r '.writable // false' <<<"$selected_target_json")"
selected_exists="$(jq -r '.exists // false' <<<"$selected_target_json")"

precedence_blocked=false
precedence_blocking_scope=""
precedence_blocking_path=""
higher_precedence_targets_json='[]'
if [ "$host" = "codex" ]; then
  while IFS= read -r target_key; do
    [ "$target_key" = "$selected_scope" ] && continue
    candidate="$(jq -c --arg key "$target_key" '.[$key]' <<<"$targets_json")"
    [ "$candidate" = "null" ] && continue
    if [ "$(jq -r '.exists' <<<"$candidate")" = "true" ] && [ "$(jq -r '.precedence' <<<"$candidate")" -gt "$selected_precedence" ]; then
      higher_precedence_targets_json="$(jq --arg key "$target_key" --argjson target "$candidate" '. + [{key:$key, config_path:$target.config_path, precedence:$target.precedence}]' <<<"$higher_precedence_targets_json")"
    fi
  done < <(jq -r 'keys[]' <<<"$targets_json")
fi

jq -n \
  --arg host "$host" \
  --arg display_name "$display_name" \
  --arg cli_command "$cli_command" \
  --arg config_path "$config_path" \
  --arg marker_path "$marker_path" \
  --arg config_format "$config_format" \
  --arg platform "$platform" \
  --arg primary_scope "$primary_scope" \
  --arg selected_scope "$selected_scope" \
  --argjson selected_writable "$selected_writable" \
  --argjson selected_exists "$selected_exists" \
  --argjson targets "$targets_json" \
  --argjson fallback_order "$fallback_order_json" \
  --argjson uninstall_targets "$uninstall_targets_json" \
  --argjson precedence_blocked "$precedence_blocked" \
  --arg precedence_blocking_scope "$precedence_blocking_scope" \
  --arg precedence_blocking_path "$precedence_blocking_path" \
  --argjson higher_precedence_targets "$higher_precedence_targets_json" \
  '{
    host: $host,
    display_name: $display_name,
    cli_command: $cli_command,
    config_path: $config_path,
    marker_path: $marker_path,
    config_format: $config_format,
    platform: $platform,
    primary_scope: $primary_scope,
    selected_scope: $selected_scope,
    selected_writable: $selected_writable,
    selected_exists: $selected_exists,
    fallback_order: $fallback_order,
    uninstall_targets: $uninstall_targets,
    targets: $targets,
    precedence_blocked: $precedence_blocked,
    precedence_blocking_scope: $precedence_blocking_scope,
    precedence_blocking_path: $precedence_blocking_path,
    higher_precedence_targets: $higher_precedence_targets
  }'
