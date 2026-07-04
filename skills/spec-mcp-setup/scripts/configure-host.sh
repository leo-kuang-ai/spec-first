#!/bin/bash
# configure-host.sh - Unix host config writer for spec-mcp-setup
# Usage: configure-host.sh --tool <tool-id>

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TOOLS_JSON="$SKILL_DIR/mcp-tools.json"
source "$SCRIPT_DIR/lib-toml.sh"
source "$SCRIPT_DIR/lib-template.sh"
require_mcp_tools_schema_version 7 "$TOOLS_JSON"

TOOL_ID=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      TOOL_ID="${2:-}"
      shift 2
      ;;
    --user-scope)
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

require_explicit_mcp_setup_host() {
  case "${MCP_SETUP_HOST:-}" in
    claude|codex|kiro|qoder|cursor) return 0 ;;
    *)
      echo '错误：install/configure/uninstall 写入宿主 MCP 配置必须显式设置 MCP_SETUP_HOST=claude|codex|kiro|qoder|cursor；不会根据 PATH、环境变量或历史 facts 推断 mutation target。' >&2
      exit 1
      ;;
  esac
}

require_explicit_mcp_setup_host

HOST_INFO_JSON="$(bash "$SCRIPT_DIR/detect-host.sh")"
HOST="$(jq -r '.host' <<<"$HOST_INFO_JSON")"
SELECTED_SCOPE="$(jq -r '.selected_scope // empty' <<<"$HOST_INFO_JSON")"
CONFIG_PATH="$(jq -r '.config_path' <<<"$HOST_INFO_JSON")"
CONFIG_FORMAT="$(jq -r '.config_format // empty' <<<"$HOST_INFO_JSON")"
LOCK_FILE="${CONFIG_PATH}.lock"
CONFIG_DIR="$(dirname "$CONFIG_PATH")"

[ -n "$TOOL_ID" ] || { echo '错误：缺少 --tool' >&2; exit 1; }
[ -n "$SELECTED_SCOPE" ] || { echo '错误：未找到可用宿主配置目标' >&2; exit 1; }
mkdir -p "$CONFIG_DIR"

HOST_CONFIG_JSON=$(jq -c --arg id "$TOOL_ID" --arg host "$HOST" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) as $t | $t.host_config[$host] | .args = (.args | map(expand_tpl($t)))' "$TOOLS_JSON")
[ -n "$HOST_CONFIG_JSON" ] && [ "$HOST_CONFIG_JSON" != "null" ] || { echo "错误：未找到 $TOOL_ID 的 host_config" >&2; exit 1; }

RESOLVED_TOOL_CONFIG_JSON="$(jq -c '{command, args} + (if has("type") then {type} else {} end) + (if has("env") then {env} else {} end) + (if has("envFile") then {envFile} else {} end) + (if has("startup_timeout_sec") then {startup_timeout_sec} else {} end)' <<<"$HOST_CONFIG_JSON")"
EXPECTED_COMMAND="$(jq -r '.command' <<<"$RESOLVED_TOOL_CONFIG_JSON")"
EXPECTED_ARGS="$(jq -c '.args' <<<"$RESOLVED_TOOL_CONFIG_JSON")"
EXPECTED_TYPE="$(jq -r '.type // empty' <<<"$RESOLVED_TOOL_CONFIG_JSON")"
DETECT_KIND="$(jq -r --arg id "$TOOL_ID" '.tools[] | select(.id == $id) | .detection.kind' "$TOOLS_JSON")"
DETECT_KEY="$(jq -r --arg id "$TOOL_ID" '.tools[] | select(.id == $id) | .detection.key' "$TOOLS_JSON")"
FALLBACK_APPLIED=false
if [ "$HOST" = "claude" ] && [ "$SELECTED_SCOPE" != "managed" ]; then
  FALLBACK_APPLIED=true
fi

host_uses_json_config() {
  [ "$CONFIG_FORMAT" = "json" ]
}

codex_higher_precedence_status() {
  [ "$HOST" = "codex" ] || {
    echo "none||"
    return 0
  }

  local selected_precedence path scope
  selected_precedence="$(jq -r --arg scope "$SELECTED_SCOPE" '.targets[$scope].precedence // 0' <<<"$HOST_INFO_JSON")"
  while IFS=$'\t' read -r scope path; do
    [ -n "$path" ] || continue
    [ -f "$path" ] || continue
    section="$(extract_toml_mcp_section "$path" "$DETECT_KEY")"
    [ -n "$section" ] || continue
    if toml_mcp_section_matches_exact "$path" "$DETECT_KEY" "$EXPECTED_COMMAND" "$EXPECTED_ARGS"; then
      printf 'ready|%s|%s\n' "$scope" "$path"
    else
      printf 'blocked|%s|%s\n' "$scope" "$path"
    fi
    return 0
  done < <(jq -r --arg scope "$SELECTED_SCOPE" --argjson selected_precedence "$selected_precedence" '.targets | to_entries[] | select(.key != $scope and (.value.exists == true) and ((.value.precedence // 0) > $selected_precedence)) | [.key, .value.config_path] | @tsv' <<<"$HOST_INFO_JSON")

  echo "none||"
}

tool_is_configured() {
  local higher_status higher_scope higher_path
  IFS='|' read -r higher_status higher_scope higher_path <<<"$(codex_higher_precedence_status)"
  if [ "$higher_status" = "ready" ]; then
    CONFIGURED_EFFECTIVE_PATH="$higher_path"
    CONFIGURED_EFFECTIVE_SCOPE="$higher_scope"
    return 0
  fi
  if [ "$higher_status" = "blocked" ]; then
    BLOCKING_SCOPE="$higher_scope"
    BLOCKING_PATH="$higher_path"
    return 2
  fi

  [ -f "$CONFIG_PATH" ] || return 1

  case "$DETECT_KIND" in
    host_config_exact)
      if host_uses_json_config; then
        jq -e --arg key "$DETECT_KEY" --arg command "$EXPECTED_COMMAND" --argjson expected_args "$EXPECTED_ARGS" --arg expected_type "$EXPECTED_TYPE" '.mcpServers[$key].command == $command and (.mcpServers[$key].args // []) == $expected_args and (if $expected_type == "" then true else .mcpServers[$key].type == $expected_type end) and ((.mcpServers[$key] | has("scope")) | not)' "$CONFIG_PATH" >/dev/null 2>&1
        return
      fi
      toml_mcp_section_matches_exact "$CONFIG_PATH" "$DETECT_KEY" "$EXPECTED_COMMAND" "$EXPECTED_ARGS"
      return
      ;;
    host_config_key_only)
      if host_uses_json_config; then
        jq -e --arg key "$DETECT_KEY" '.mcpServers[$key] != null' "$CONFIG_PATH" >/dev/null 2>&1
      else
        [ -n "$(extract_toml_mcp_section "$CONFIG_PATH" "$DETECT_KEY")" ]
      fi
      ;;
    *)
      return 1
      ;;
  esac
}

overwrite_approved() {
  case "${SPEC_FIRST_MCP_CONFIGURE_OVERWRITE:-}" in
    approved|APPROVED|yes|YES|true|TRUE|1) return 0 ;;
    *) return 1 ;;
  esac
}

selected_config_conflicts() {
  [ "$DETECT_KIND" = "host_config_exact" ] || return 1
  [ -f "$CONFIG_PATH" ] || return 1
  if host_uses_json_config; then
    jq -e --arg key "$DETECT_KEY" '.mcpServers[$key] != null' "$CONFIG_PATH" >/dev/null 2>&1 || return 1
    jq -e --arg key "$DETECT_KEY" --arg command "$EXPECTED_COMMAND" --argjson expected_args "$EXPECTED_ARGS" --arg expected_type "$EXPECTED_TYPE" '.mcpServers[$key].command == $command and (.mcpServers[$key].args // []) == $expected_args and (if $expected_type == "" then true else .mcpServers[$key].type == $expected_type end) and ((.mcpServers[$key] | has("scope")) | not)' "$CONFIG_PATH" >/dev/null 2>&1 && return 1
    return 0
  fi
  [ -n "$(extract_toml_mcp_section "$CONFIG_PATH" "$DETECT_KEY")" ] || return 1
  toml_mcp_section_matches_exact "$CONFIG_PATH" "$DETECT_KEY" "$EXPECTED_COMMAND" "$EXPECTED_ARGS" && return 1
  return 0
}

acquire_lock() {
  if command -v flock >/dev/null 2>&1; then
    exec 200>"$LOCK_FILE" 2>/dev/null || return 1
    flock -w 10 200 || return 1
    return 0
  fi

  LOCK_DIR="${CONFIG_PATH}.lock.d"
  local attempts=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    attempts=$((attempts + 1))
    if [ $attempts -ge 100 ]; then
      return 1
    fi
    sleep 0.1
  done
  echo $$ > "$LOCK_DIR/pid"
}

release_lock() {
  if command -v flock >/dev/null 2>&1; then
    flock -u 200 2>/dev/null || true
    exec 200>&- 2>/dev/null || true
    rm -f "$LOCK_FILE"
  elif [ -n "${LOCK_DIR:-}" ]; then
    rm -rf "$LOCK_DIR"
  fi
}

write_json_mcp_config() {
  local config_json="$1"
  local tmp
  tmp="$(mktemp "${CONFIG_PATH}.XXXXXX")"
  chmod 600 "$tmp"
  if [ -f "$CONFIG_PATH" ]; then
    jq --arg id "$TOOL_ID" --argjson cfg "$config_json" '(.mcpServers //= {}) | .mcpServers[$id] = $cfg' "$CONFIG_PATH" > "$tmp"
  else
    jq -n --arg id "$TOOL_ID" --argjson cfg "$config_json" '{mcpServers: {($id): $cfg}}' > "$tmp"
  fi
  mv "$tmp" "$CONFIG_PATH"
}

assert_no_literal_secret_values() {
  [ "$HOST" = "kiro" ] || [ "$HOST" = "qoder" ] || [ "$HOST" = "cursor" ] || return 0
  jq -e '
    [.. | objects | to_entries[]? |
      select((.key | test("(?i)(token|secret|api[_-]?key|password)"))
        and (.value | type == "string")
        and ((.value | test("^\\$\\{[A-Za-z_][A-Za-z0-9_]*\\}$")) | not))]
    | length == 0
  ' "$CONFIG_PATH" >/dev/null
}

write_codex_config() {
  local command args_json timeout section_body
  command="$(jq -r '.command' <<<"$RESOLVED_TOOL_CONFIG_JSON")"
  args_json="$(jq -c '.args' <<<"$RESOLVED_TOOL_CONFIG_JSON")"
  timeout="$(jq -r '.startup_timeout_sec // empty' <<<"$RESOLVED_TOOL_CONFIG_JSON")"
  section_body="$(printf 'command = "%s"\nargs = %s' "$command" "$args_json")"
  if [ -n "$timeout" ]; then
    section_body="$(printf '%s\nstartup_timeout_sec = %s' "$section_body" "$timeout")"
  fi
  local tmp
  tmp="$(mktemp "${CONFIG_PATH}.XXXXXX")"
  chmod 600 "$tmp"
  write_toml_mcp_section "$CONFIG_PATH" "$DETECT_KEY" "$section_body" "$tmp"
  mv "$tmp" "$CONFIG_PATH"
}

restore_backup() {
  [ -n "${BACKUP_PATH:-}" ] || return 0
  if [ -f "$BACKUP_PATH" ]; then
    mv "$BACKUP_PATH" "$CONFIG_PATH"
  else
    rm -f "$CONFIG_PATH"
  fi
}

trap release_lock EXIT
acquire_lock || { echo '错误：无法获取配置锁' >&2; exit 1; }

CONFIGURED_EFFECTIVE_PATH="$CONFIG_PATH"
CONFIGURED_EFFECTIVE_SCOPE="$SELECTED_SCOPE"
BLOCKING_SCOPE=""
BLOCKING_PATH=""
set +e
tool_is_configured
configured_status=$?
set -e
if [ "$configured_status" -eq 0 ]; then
  jq -n --arg tool_id "$TOOL_ID" --arg configured_path "$CONFIGURED_EFFECTIVE_PATH" --arg selected_scope "$CONFIGURED_EFFECTIVE_SCOPE" --argjson fallback_applied "$FALLBACK_APPLIED" '{tool_id:$tool_id,configured_path:$configured_path,selected_scope:$selected_scope,fallback_applied:$fallback_applied}'
  exit 0
elif [ "$configured_status" -eq 2 ]; then
  echo "错误：$TOOL_ID 被更高优先级 Codex MCP 配置覆盖：$BLOCKING_SCOPE ($BLOCKING_PATH)" >&2
  exit 1
fi

if selected_config_conflicts && ! overwrite_approved; then
  echo "错误：$TOOL_ID 已存在同名但不同 command/args 的宿主 MCP 配置；如需覆盖，请设置 SPEC_FIRST_MCP_CONFIGURE_OVERWRITE=approved 后重跑" >&2
  exit 1
fi

BACKUP_PATH=""
if [ -f "$CONFIG_PATH" ]; then
  BACKUP_PATH="$(mktemp "${CONFIG_PATH}.backup.XXXXXX")"
  cp "$CONFIG_PATH" "$BACKUP_PATH"
  chmod 600 "$BACKUP_PATH"
else
  BACKUP_PATH="${CONFIG_PATH}.missing"
fi

if [ "$HOST" = "claude" ]; then
  if ! write_json_mcp_config "$RESOLVED_TOOL_CONFIG_JSON"; then
    restore_backup
    echo "错误：$TOOL_ID 写入宿主配置失败，已回滚" >&2
    exit 1
  fi
elif [ "$HOST" = "codex" ]; then
  if ! write_codex_config; then
    restore_backup
    echo "错误：$TOOL_ID 写入宿主配置失败，已回滚" >&2
    exit 1
  fi
elif [ "$HOST" = "kiro" ] || [ "$HOST" = "qoder" ] || [ "$HOST" = "cursor" ]; then
  if ! write_json_mcp_config "$RESOLVED_TOOL_CONFIG_JSON" || ! assert_no_literal_secret_values; then
    restore_backup
    echo "错误：$TOOL_ID 写入 $HOST 配置失败或包含非 env reference 形式的敏感字段，已回滚" >&2
    exit 1
  fi
else
  restore_backup
  echo "错误：无法识别宿主：$HOST" >&2
  exit 1
fi

CONFIGURED_EFFECTIVE_PATH="$CONFIG_PATH"
CONFIGURED_EFFECTIVE_SCOPE="$SELECTED_SCOPE"
if tool_is_configured; then
  [ -f "$BACKUP_PATH" ] && rm -f "$BACKUP_PATH"
  jq -n --arg tool_id "$TOOL_ID" --arg configured_path "$CONFIGURED_EFFECTIVE_PATH" --arg selected_scope "$CONFIGURED_EFFECTIVE_SCOPE" --argjson fallback_applied "$FALLBACK_APPLIED" '{tool_id:$tool_id,configured_path:$configured_path,selected_scope:$selected_scope,fallback_applied:$fallback_applied}'
  exit 0
fi

restore_backup
echo "错误：$TOOL_ID 配置后仍未检测到有效宿主配置，已回滚" >&2
exit 1
