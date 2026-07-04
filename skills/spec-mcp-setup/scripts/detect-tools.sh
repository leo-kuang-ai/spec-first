#!/bin/bash
# detect-tools.sh - Detect MCP tool host readiness facts.

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TOOLS_JSON="$SKILL_DIR/mcp-tools.json"
source "$SCRIPT_DIR/lib-toml.sh"
source "$SCRIPT_DIR/lib-template.sh"
require_mcp_tools_schema_version 7 "$TOOLS_JSON"

REPO_ARG=""
FOLDER_ARG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_ARG="${2:-}"
      [ -n "$REPO_ARG" ] || { echo "detect-tools.sh: --repo requires a value" >&2; exit 1; }
      shift 2
      ;;
    --folder)
      FOLDER_ARG="${2:-}"
      [ -n "$FOLDER_ARG" ] || { echo "detect-tools.sh: --folder requires a value" >&2; exit 1; }
      shift 2
      ;;
    *)
      echo "detect-tools.sh: unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ -n "$REPO_ARG" ] && [ -n "$FOLDER_ARG" ]; then
  echo "detect-tools.sh: use either --repo or --folder, not both" >&2
  exit 1
fi

HOST_INFO_JSON="$(bash "$SCRIPT_DIR/detect-host.sh")"
HOST="$(jq -r '.host' <<<"$HOST_INFO_JSON")"
CONFIG_PATH="$(jq -r '.config_path' <<<"$HOST_INFO_JSON")"
CONFIG_FORMAT="$(jq -r '.config_format // empty' <<<"$HOST_INFO_JSON")"
PLATFORM="$(jq -r '.platform' <<<"$HOST_INFO_JSON")"
SELECTED_SCOPE="$(jq -r '.selected_scope // empty' <<<"$HOST_INFO_JSON")"

TARGET_ARGS=()
if [ -n "$REPO_ARG" ]; then
  TARGET_ARGS+=(--repo "$REPO_ARG")
fi
if [ -n "$FOLDER_ARG" ]; then
  TARGET_ARGS+=(--folder "$FOLDER_ARG")
fi
set +e
TARGET_ENV="$(bash "$SCRIPT_DIR/resolve-project-target.sh" --format env ${TARGET_ARGS[@]+"${TARGET_ARGS[@]}"})"
TARGET_ENV_STATUS=$?
TARGET_JSON="$(bash "$SCRIPT_DIR/resolve-project-target.sh" --format json ${TARGET_ARGS[@]+"${TARGET_ARGS[@]}"})"
TARGET_JSON_STATUS=$?
set -e
[ -n "$TARGET_ENV" ] || { echo "detect-tools.sh: target resolver returned no env output" >&2; exit 1; }
[ -n "$TARGET_JSON" ] || { echo "detect-tools.sh: target resolver returned no JSON output" >&2; exit 1; }
eval "$TARGET_ENV"
TARGET_MODE="$mode"
TARGET_REPO_STATUS="$repo_status"
TARGET_KIND="$target_kind"
TARGET_SELECTION_SOURCE="$selection_source"
TARGET_STATE_WRITE_ALLOWED="$state_write_allowed"
TARGET_WORKSPACE_ROOT="$workspace_root"
TARGET_SELECTED_REPO_ROOT="$selected_repo_root"
TARGET_SELECTED_FOLDER_ROOT="$selected_folder_root"
TARGET_ROOT="$target_root"
TARGET_REPO_LABEL="$repo_label"
TARGET_REASON_CODE="$reason_code"
TARGET_NEXT_ACTION="$next_action"
if [ "$TARGET_ENV_STATUS" -ne 0 ] || [ "$TARGET_JSON_STATUS" -ne 0 ]; then
  TARGET_STATE_WRITE_ALLOWED="false"
fi
if [ -n "$TARGET_ROOT" ]; then
  REPO_ROOT="$TARGET_ROOT"
elif [ -n "$TARGET_SELECTED_REPO_ROOT" ]; then
  REPO_ROOT="$TARGET_SELECTED_REPO_ROOT"
elif [ -n "$TARGET_SELECTED_FOLDER_ROOT" ]; then
  REPO_ROOT="$TARGET_SELECTED_FOLDER_ROOT"
else
  REPO_ROOT="$TARGET_WORKSPACE_ROOT"
fi
REPO_STATUS="$TARGET_REPO_STATUS"

dependency_status() {
  local dep="$1"
  if command -v "$dep" >/dev/null 2>&1; then
    echo ready
  else
    echo missing
  fi
}

path_size_bytes() {
  local path="$1"
  if [ ! -e "$path" ]; then
    echo 0
    return
  fi
  du -sk "$path" 2>/dev/null | awk '{ printf "%d", $1 * 1024 }'
}

host_config_required() {
  local tool_id="$1"
  jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | if has("host_config_required") then .host_config_required else true end' "$TOOLS_JSON"
}

host_uses_json_config() {
  [ "$CONFIG_FORMAT" = "json" ]
}

host_config_status() {
  local tool_id="$1"
  local detect_kind detect_key host_cfg expected_command expected_args expected_type

  if [ "$(host_config_required "$tool_id")" != "true" ]; then
    echo not-required
    return
  fi

  detect_kind="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .detection.kind' "$TOOLS_JSON")"
  detect_key="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .detection.key' "$TOOLS_JSON")"
  host_cfg="$(jq -c --arg id "$tool_id" --arg host "$HOST" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) as $t | $t.host_config[$host] | .args = (.args | map(expand_tpl($t)))' "$TOOLS_JSON")"

  [ -n "$SELECTED_SCOPE" ] || {
    echo action-required
    return
  }

  expected_command="$(jq -r '.command' <<<"$host_cfg")"
  expected_args="$(jq -c '.args' <<<"$host_cfg")"
  expected_type="$(jq -r '.type // empty' <<<"$host_cfg")"

  if [ "$HOST" = "codex" ]; then
    local selected_precedence scope path section
    selected_precedence="$(jq -r --arg scope "$SELECTED_SCOPE" '.targets[$scope].precedence // 0' <<<"$HOST_INFO_JSON")"
    while IFS=$'\t' read -r scope path; do
      [ -n "$path" ] || continue
      [ -f "$path" ] || continue
      section="$(extract_toml_mcp_section "$path" "$detect_key")"
      [ -n "$section" ] || continue
      if toml_mcp_section_matches_exact "$path" "$detect_key" "$expected_command" "$expected_args"; then
        echo ready
      elif toml_mcp_section_matches_registry_args_drift "$path" "$detect_key" "$expected_command" "$expected_args"; then
        echo registry-args-drift
      else
        echo precedence-blocked
      fi
      return
    done < <(jq -r --arg scope "$SELECTED_SCOPE" --argjson selected_precedence "$selected_precedence" '.targets | to_entries[] | select(.key != $scope and (.value.exists == true) and ((.value.precedence // 0) > $selected_precedence)) | [.key, .value.config_path] | @tsv' <<<"$HOST_INFO_JSON")
  fi

  [ -f "$CONFIG_PATH" ] || {
    echo action-required
    return
  }

  case "$detect_kind" in
    host_config_exact)
      if host_uses_json_config; then
        if jq -e --arg key "$detect_key" --arg command "$expected_command" --argjson expected_args "$expected_args" --arg expected_type "$expected_type" '.mcpServers[$key].command == $command and (.mcpServers[$key].args // []) == $expected_args and (if $expected_type == "" then true else .mcpServers[$key].type == $expected_type end) and ((.mcpServers[$key] | has("scope")) | not)' "$CONFIG_PATH" >/dev/null 2>&1; then
          if [ "$HOST" = "claude" ] && [ "$SELECTED_SCOPE" != "managed" ]; then
            echo fallback-active
          else
            echo ready
          fi
        elif jq -e --arg key "$detect_key" --arg command "$expected_command" --argjson expected_args "$expected_args" '
          def normalize_npm_latest:
            map(if type == "string" then sub("@latest$"; "") else . end);
          .mcpServers[$key] != null
          and .mcpServers[$key].command == $command
          and ((.mcpServers[$key] | has("scope")) | not)
          and ((.mcpServers[$key].args // []) | normalize_npm_latest) == ($expected_args | normalize_npm_latest)
          and ((.mcpServers[$key].args // []) != $expected_args)
        ' "$CONFIG_PATH" >/dev/null 2>&1; then
          echo registry-args-drift
        else
          echo action-required
        fi
        return
      fi

      if toml_mcp_section_matches_exact "$CONFIG_PATH" "$detect_key" "$expected_command" "$expected_args"; then
        echo ready
      elif toml_mcp_section_matches_registry_args_drift "$CONFIG_PATH" "$detect_key" "$expected_command" "$expected_args"; then
        echo registry-args-drift
      else
        echo action-required
      fi
      ;;
    host_config_key_only)
      if host_uses_json_config; then
        if jq -e --arg key "$detect_key" '.mcpServers[$key] != null' "$CONFIG_PATH" >/dev/null 2>&1; then
          if [ "$HOST" = "claude" ] && [ "$SELECTED_SCOPE" != "managed" ]; then
            echo fallback-active
          else
            echo ready
          fi
        else
          echo action-required
        fi
      else
        if [ -n "$(extract_toml_mcp_section "$CONFIG_PATH" "$detect_key")" ]; then
          echo ready
        else
          echo action-required
        fi
      fi
      ;;
    *)
      echo action-required
      ;;
  esac
}

project_status() {
  local tool_id="$1"
  local bootstrap_kind required project_file ready_marker_file
  bootstrap_kind="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.kind' "$TOOLS_JSON")"
  required="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.required' "$TOOLS_JSON")"
  if [ "$bootstrap_kind" = "none" ] || [ "$required" != "true" ]; then
    echo not-applicable
    return
  fi

  if [ "$TARGET_STATE_WRITE_ALLOWED" != "true" ]; then
    if [ -n "$TARGET_REASON_CODE" ]; then
      echo "$TARGET_REASON_CODE"
    else
      echo workspace-target-required
    fi
    return
  fi

  project_file="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.project_file // empty' "$TOOLS_JSON")"
  ready_marker_file="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.ready_marker_file // empty' "$TOOLS_JSON")"

  if [ -n "$project_file" ] && [ ! -f "$REPO_ROOT/$project_file" ]; then
    echo pending
    return
  fi

  echo ready
}

tools_json='{}'
next_actions_json='[]'

append_next_action() {
  local action="$1"
  [ -n "$action" ] || return 0
  next_actions_json="$(jq --arg action "$action" 'if index($action) then . else . + [$action] end' <<<"$next_actions_json")"
}

while IFS= read -r tool_id; do
  required="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .required' "$TOOLS_JSON")"
  category="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .category // "mcp"' "$TOOLS_JSON")"
  host_required="$(host_config_required "$tool_id")"
  baseline_blocking="$required"
  dep_status=ready

  while IFS= read -r dep; do
    current_dep_status="$(dependency_status "$dep")"
    if [ "$current_dep_status" != "ready" ]; then
      dep_status="$current_dep_status"
      break
    fi
  done < <(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .dependencies[]' "$TOOLS_JSON")

  cfg_status="$(host_config_status "$tool_id")"
  if [ "$required" != "true" ] && [ "$cfg_status" = "action-required" ]; then
    proj_status="not-applicable"
  else
    proj_status="$(project_status "$tool_id")"
  fi
  tool_extra_json='{}'
  host_ready=false
  if [ "$cfg_status" = "ready" ] || [ "$cfg_status" = "fallback-active" ] || [ "$cfg_status" = "registry-args-drift" ]; then
    host_ready=true
  elif [ "$host_required" != "true" ] && [ "$cfg_status" = "not-required" ]; then
    host_ready=true
  fi

  configured=false
  if [ "$cfg_status" = "ready" ] || [ "$cfg_status" = "fallback-active" ] || [ "$cfg_status" = "registry-args-drift" ]; then
    configured=true
  fi

  next_action=""
  if [ "$required" != "true" ] && [ "$cfg_status" = "action-required" ]; then
    next_action=""
  elif [ "$dep_status" != "ready" ]; then
    next_action="install dependency"
  elif [ "$cfg_status" = "action-required" ]; then
    next_action="configure host"
  elif [ "$cfg_status" = "precedence-blocked" ]; then
    next_action="review higher-precedence host config"
  elif [ "$proj_status" = "workspace-target-required" ] || [[ "$proj_status" == repo-target-* ]] || [ "$proj_status" = "workspace-no-git-candidates" ]; then
    next_action="$TARGET_NEXT_ACTION"
  elif [ "$proj_status" = "pending" ]; then
    next_action="bootstrap project"
  elif [ "$proj_status" = "failed" ]; then
    next_action="repair project bootstrap"
  fi

  result="ready"
  reason_code="ready"
  if [ "$required" != "true" ] && [ "$cfg_status" = "action-required" ]; then
    result="action-required"
    reason_code="optional-capability-not-selected"
  elif [ "$dep_status" != "ready" ]; then
    result="action-required"
    reason_code="missing_dependency"
  elif [ "$cfg_status" = "registry-args-drift" ]; then
    result="degraded"
    reason_code="host-config-version-drift"
  elif [ "$cfg_status" = "action-required" ]; then
    result="action-required"
    reason_code="host-config-action-required"
  elif [ "$cfg_status" = "precedence-blocked" ]; then
    result="action-required"
    reason_code="host-config-precedence-blocked"
  elif [ "$proj_status" = "pending" ]; then
    result="action-required"
    reason_code="project-bootstrap-pending"
  elif [ "$proj_status" = "failed" ]; then
    result="action-required"
    reason_code="project-bootstrap-failed"
  fi

  append_next_action "$next_action"

  tools_json="$(jq \
    --arg id "$tool_id" \
    --argjson required_json "$required" \
    --argjson baseline_blocking_json "$baseline_blocking" \
    --arg type "$category" \
    --arg dep "$dep_status" \
    --arg cfg "$cfg_status" \
    --arg host_required "$host_required" \
    --arg proj "$proj_status" \
    --arg scope "$SELECTED_SCOPE" \
    --arg next "$next_action" \
    --arg result "$result" \
    --arg reason_code "$reason_code" \
    --argjson configured "$configured" \
    --argjson extra "$tool_extra_json" \
    '.
      + {($id): ({
        required: $required_json,
        baseline_blocking: $baseline_blocking_json,
        type: $type,
        host_config_required: ($host_required == "true"),
        dependency_status: $dep,
        host_config_status: $cfg,
        project_status: $proj,
        selected_scope: $scope,
        result: $result,
        reason_code: $reason_code,
        next_action: $next
      } + $extra)}
      | .[$id] += {configured: $configured}' <<<"$tools_json")"
done < <(jq -r '.tools[].id' "$TOOLS_JSON")

jq -n \
  --arg host "$HOST" \
  --arg platform "$PLATFORM" \
  --arg repo_root "$REPO_ROOT" \
  --arg repo_status "$REPO_STATUS" \
  --arg target_kind "$TARGET_KIND" \
  --argjson target "$TARGET_JSON" \
  --argjson tools "$tools_json" \
  --argjson next_actions "$next_actions_json" \
  '{
    schema_version: "tool-facts.v2",
    host: $host,
    platform: $platform,
    repo_root: $repo_root,
    repo_status: $repo_status,
    target_kind: $target_kind,
    target: $target,
    target_mode: ($target.mode // ""),
    workspace_root: ($target.workspace_root // ""),
    selected_repo_root: ($target.selected_repo_root // null),
    selected_folder_root: ($target.selected_folder_root // null),
    target_root: ($target.target_root // null),
    git_health: ($target.git_health // null),
    coverage_gap: ($target.coverage_gap // null),
    candidates_diagnostics: ($target.candidates_diagnostics // []),
    target_candidate_count: (($target.candidates // []) | length),
    target_candidates: ($target.candidates // []),
    reason_code: ($target.reason_code // ""),
    tools: $tools,
    next_actions: $next_actions
  }'
