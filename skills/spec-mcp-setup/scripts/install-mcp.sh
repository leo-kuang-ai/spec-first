#!/bin/bash
# install-mcp.sh - Unix installer pipeline for Required Harness Runtime MCP servers
# Usage: install-mcp.sh [--only <tool-ids>] [--refresh] [--repo <child>] [--all-repos]

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib-template.sh"

KIRO_USER_SCOPE_ARG=false
for arg in "$@"; do
  if [ "$arg" = "--user-scope" ]; then
    KIRO_USER_SCOPE_ARG=true
    export KIRO_USER_SCOPE=1
  fi
done

SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TOOLS_JSON="$SKILL_DIR/mcp-tools.json"
PROVIDER_TOOLS_JSON="$SKILL_DIR/provider-tools.json"
require_mcp_tools_schema_version 7 "$TOOLS_JSON"
HOST_INFO_JSON="$(bash "$SCRIPT_DIR/detect-host.sh")"
HOST="$(jq -r '.host' <<<"$HOST_INFO_JSON")"
HOST_DISPLAY_NAME="$(jq -r '.display_name' <<<"$HOST_INFO_JSON")"
CONFIG_PATH="$(jq -r '.config_path' <<<"$HOST_INFO_JSON")"
PLATFORM="$(jq -r '.platform' <<<"$HOST_INFO_JSON")"
CONFIG_DIR="$(dirname "$CONFIG_PATH")"

ONLY_FILTER=""
REPO_ARG=""
FOLDER_ARG=""
ALL_REPOS=false
PLAN_MODE=false
REQUIREMENT_WORKSPACE="${SPEC_FIRST_PROVIDER_GRAPHIFY_REQUIREMENT_WORKSPACE:-${SPEC_FIRST_REQUIREMENT_WORKSPACE:-}}"
GRAPHIFY_REFRESH=false
DEFAULT_STAGE_TIMEOUT_SECONDS="${SPEC_FIRST_STAGE_TIMEOUT_SECONDS:-900}"
WARMUP_CACHE_ROOT="${SPEC_FIRST_WARMUP_CACHE_DIR:-}"
WARMUP_LATEST_TTL_SECONDS="${SPEC_FIRST_WARMUP_LATEST_TTL_SECONDS:-86400}"
case "$DEFAULT_STAGE_TIMEOUT_SECONDS" in ''|*[!0-9]*) DEFAULT_STAGE_TIMEOUT_SECONDS=900 ;; esac
case "$WARMUP_LATEST_TTL_SECONDS" in ''|*[!0-9]*) WARMUP_LATEST_TTL_SECONDS=86400 ;; esac

stage_log() {
  local stage="$1"
  local message="$2"
  printf 'spec-mcp-setup: [mcp/%s] %s\n' "$stage" "$message" >&2
}

write_workspace_summary_atomic() {
  local workspace_root="$1"
  local file_name="$2"
  local spec_dir="$workspace_root/.spec-first"
  local workspace_dir="$spec_dir/workspace"
  local path="$workspace_dir/$file_name"
  local tmp

  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ]; then
    echo "install-mcp.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  mkdir -p "$workspace_dir" || return 1
  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ] || [ -L "$path" ]; then
    echo "install-mcp.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  tmp="$(mktemp "${path}.XXXXXX")" || return 1
  if ! cat > "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ] || [ -L "$path" ]; then
    rm -f "$tmp"
    echo "install-mcp.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  mv "$tmp" "$path" || { rm -f "$tmp"; return 1; }
}

write_all_repos_install_summary_and_exit() {
  local target_json="$1"
  local selection_source="${2:-explicit-all-repos}"
  local target_mode workspace_root candidate_count summary_items summary_json

  target_mode="$(jq -r '.mode // empty' <<<"$target_json")"
  workspace_root="$(jq -r '.workspace_root // .invocation_cwd' <<<"$target_json")"

  if [ -n "$REPO_ARG" ]; then
    jq -n --arg workspace_root "$workspace_root" '{
      schema_version:"workspace-mcp-setup-summary.v1",
      overall_status:"action-required",
      workflow_mode:"blocked",
      reason_code:"all-repos-conflicts-with-repo",
      workspace_root:$workspace_root,
      advisory:true,
      next_action:"Use either --all-repos from a parent workspace or --repo <child>, not both."
    }'
    exit 1
  fi

  if [ "$target_mode" = "git-repo" ]; then
    jq -n --arg workspace_root "$workspace_root" '{
      schema_version:"workspace-mcp-setup-summary.v1",
      overall_status:"action-required",
      workflow_mode:"blocked",
      reason_code:"all-repos-requires-parent-workspace",
      workspace_root:$workspace_root,
      advisory:true,
      next_action:"Run --all-repos from a parent workspace containing child Git repos, or omit --all-repos in a single Git repo."
    }'
    exit 1
  fi

  candidate_count="$(jq -r '(.candidates // []) | length' <<<"$target_json")"
  if [ "$candidate_count" -eq 0 ]; then
    jq -n --argjson target "$target_json" '{
      schema_version:"workspace-mcp-setup-summary.v1",
      overall_status:"action-required",
      workflow_mode:"blocked",
      reason_code:($target.reason_code // "workspace-no-git-candidates"),
      workspace_root:($target.workspace_root // null),
      candidates:($target.candidates // []),
      advisory:true,
      next_action:($target.next_action // "Run from a parent workspace containing child Git repos.")
    }'
    exit 1
  fi

  summary_items="$(mktemp "${TMPDIR:-/tmp}/mcp-setup-all-repos.XXXXXX")"
  jq -n '[]' > "$summary_items"
  while IFS=$'\t' read -r child_label child_path; do
    [ -n "$child_path" ] || continue
    child_args=(--repo "$child_path")
    if [ -n "$ONLY_FILTER" ]; then
      child_args+=(--only "$ONLY_FILTER")
    fi
    if [ "$GRAPHIFY_REFRESH" = "true" ]; then
      child_args+=(--refresh)
    fi
    if [ -n "$REQUIREMENT_WORKSPACE" ]; then
      child_args+=(--requirement-workspace "$REQUIREMENT_WORKSPACE")
    fi
    set +e
    child_output="$(bash "$0" ${child_args[@]+"${child_args[@]}"})"
    child_status=$?
    set -e
    if ! jq -e . >/dev/null 2>&1 <<<"$child_output"; then
      child_result="$(jq -n --arg output "$child_output" '{host:"unknown",display_name:"unknown",platform:"unknown",results:[],diagnostic:$output}')"
    else
      child_result="$child_output"
    fi
    child_overall="$(jq -r --argjson exit_code "$child_status" '
      if $exit_code != 0 then "action-required"
      elif any((.results // [])[]; .status == "action-required") then "action-required"
      elif ((.provider_apply // {}).status == "action-required") then "action-required"
      elif any((.results // [])[]; .status != "ready") then "partial"
      elif ((.results // []) | length) == 0 and ((.provider_apply // {}).status == "ready") then "ready"
      elif ((.results // []) | length) == 0 then "action-required"
      else "ready"
      end' <<<"$child_result")"
    child_reason="$(jq -r '[(.results // [])[] | select((.reason_code // "") != "") | .reason_code][0] // (.provider_apply.reason_code // empty)' <<<"$child_result")"
    jq \
      --arg repo_label "$child_label" \
      --arg workspace_relative_path "$child_path" \
      --argjson exit_code "$child_status" \
      --arg overall_status "$child_overall" \
      --arg reason_code "$child_reason" \
      --argjson result "$child_result" \
      '. + [{
        repo_label:$repo_label,
        workspace_relative_path:$workspace_relative_path,
        exit_code:$exit_code,
        overall_status:$overall_status,
        reason_code:(if $reason_code == "" then null else $reason_code end),
        result:$result
      }]' "$summary_items" > "$summary_items.next"
    mv "$summary_items.next" "$summary_items"
  done < <(jq -r '.candidates[] | [.repo_label, .workspace_relative_path] | @tsv' <<<"$target_json")

  summary_json="$(jq -n \
    --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg selection_source "$selection_source" \
    --argjson target "$target_json" \
    --slurpfile items "$summary_items" \
    '($items[0] // []) as $results
    | {
        schema_version:"workspace-mcp-setup-summary.v1",
        generated_at:$generated_at,
        advisory:true,
        workflow_mode:"all-repos",
        selection_source:$selection_source,
        workspace_root:($target.workspace_root // null),
        parent_writes_repo_local_artifacts:false,
        results:$results,
        counts:{
          total:($results | length),
          ready:([$results[] | select(.overall_status == "ready")] | length),
          partial:([$results[] | select(.overall_status == "partial")] | length),
          action_required:([$results[] | select(.overall_status == "action-required")] | length)
        },
        overall_status:(
          if ($results | length) == 0 then "action-required"
          elif ([$results[] | select(.overall_status == "action-required")] | length) > 0 and ([$results[] | select(.overall_status != "action-required")] | length) == 0 then "action-required"
          elif ([$results[] | select(.overall_status != "ready")] | length) > 0 then "partial"
          else "ready"
          end
        ),
        reason_code:(
          if ($results | length) == 0 then "workspace-no-git-candidates"
          elif ([$results[] | select(.overall_status != "ready")] | length) == 0 then null
          else "all-repos-partial-or-action-required"
          end
        ),
        next_action:(
          if ([$results[] | select(.overall_status != "ready")] | length) > 0 then
            "Inspect per-child reason_code and rerun setup for action-required repos."
          else
            "All child repos completed MCP setup."
          end
        )
      }')"
  rm -f "$summary_items"
  if ! printf '%s\n' "$summary_json" | write_workspace_summary_atomic "$workspace_root" "mcp-setup-summary.json"; then
    jq -n --arg workspace_root "$workspace_root" '{
      schema_version:"workspace-mcp-setup-summary.v1",
      overall_status:"action-required",
      workflow_mode:"blocked",
      reason_code:"workspace-summary-symlink-escape",
      workspace_root:$workspace_root,
      advisory:true,
      next_action:"Replace symlinked .spec-first/workspace with a real workspace-local directory and rerun setup."
    }'
    exit 1
  fi
  printf '%s\n' "$summary_json"
  if [ "$(jq -r '.overall_status' <<<"$summary_json")" != "ready" ]; then
    exit 1
  fi
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)
      ONLY_FILTER="${2:-}"
      shift 2
      ;;
    --repo)
      REPO_ARG="${2:-}"
      [ -n "$REPO_ARG" ] || { echo "install-mcp.sh: --repo requires a value" >&2; exit 1; }
      shift 2
      ;;
    --folder)
      FOLDER_ARG="${2:-}"
      [ -n "$FOLDER_ARG" ] || { echo "install-mcp.sh: --folder requires a value" >&2; exit 1; }
      shift 2
      ;;
    --all-repos)
      ALL_REPOS=true
      shift
      ;;
    --plan)
      PLAN_MODE=true
      shift
      ;;
    --user-scope)
      KIRO_USER_SCOPE_ARG=true
      export KIRO_USER_SCOPE=1
      shift
      ;;
    --requirement-workspace)
      REQUIREMENT_WORKSPACE="${2:-}"
      shift 2
      ;;
    --refresh|--refresh-graphify)
      GRAPHIFY_REFRESH=true
      shift
      ;;
    *)
      echo "未知参数: $1" >&2
      exit 1
      ;;
  esac
done

if [ -n "$REPO_ARG" ] && [ -n "$FOLDER_ARG" ]; then
  echo "install-mcp.sh: use either --repo or --folder, not both" >&2
  exit 1
fi
if [ "$ALL_REPOS" = "true" ] && [ -n "$FOLDER_ARG" ]; then
  echo "install-mcp.sh: use either --all-repos or --folder, not both" >&2
  exit 1
fi

TARGET_ARGS=()
if [ -n "$REPO_ARG" ] && [ "$ALL_REPOS" != "true" ]; then
  TARGET_ARGS+=(--repo "$REPO_ARG")
fi
if [ -n "$FOLDER_ARG" ] && [ "$ALL_REPOS" != "true" ]; then
  TARGET_ARGS+=(--folder "$FOLDER_ARG")
fi
set +e
TARGET_ENV="$(bash "$SCRIPT_DIR/resolve-project-target.sh" --format env ${TARGET_ARGS[@]+"${TARGET_ARGS[@]}"})"
TARGET_STATUS=$?
TARGET_JSON="$(bash "$SCRIPT_DIR/resolve-project-target.sh" --format json ${TARGET_ARGS[@]+"${TARGET_ARGS[@]}"})"
TARGET_JSON_STATUS=$?
set -e
[ -n "$TARGET_ENV" ] || { echo "install-mcp.sh: target resolver returned no env output" >&2; exit 1; }
[ -n "$TARGET_JSON" ] || { echo "install-mcp.sh: target resolver returned no JSON output" >&2; exit 1; }
eval "$TARGET_ENV"
TARGET_STATE_WRITE_ALLOWED="$state_write_allowed"
TARGET_REASON_CODE="$reason_code"
TARGET_NEXT_ACTION="$next_action"
TARGET_SELECTED_REPO_ROOT="$selected_repo_root"
TARGET_SELECTED_FOLDER_ROOT="$selected_folder_root"
TARGET_ROOT="$target_root"
TARGET_WORKSPACE_ROOT="$workspace_root"
TARGET_MODE="$(jq -r '.mode // empty' <<<"$TARGET_JSON")"
TARGET_CANDIDATE_COUNT="$(jq -r '(.candidates // []) | length' <<<"$TARGET_JSON")"
DEFAULT_ALL_REPOS=false
if [ "$ALL_REPOS" != "true" ] && [ -z "$REPO_ARG" ] && [ "$TARGET_MODE" != "git-repo" ] && [ "$TARGET_CANDIDATE_COUNT" -gt 0 ]; then
  DEFAULT_ALL_REPOS=true
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
if [ -z "$WARMUP_CACHE_ROOT" ]; then
  WARMUP_CACHE_ROOT="$REPO_ROOT/.spec-first/cache/mcp-warmup"
fi
if [ -z "${NPM_CONFIG_CACHE:-}" ] && [ -z "${npm_config_cache:-}" ]; then
  export NPM_CONFIG_CACHE="$REPO_ROOT/.spec-first/cache/npm"
  export npm_config_cache="$REPO_ROOT/.spec-first/cache/npm"
fi
if [ "$TARGET_STATUS" -ne 0 ] || [ "$TARGET_JSON_STATUS" -ne 0 ]; then
  TARGET_STATE_WRITE_ALLOWED="false"
fi

if [ "$PLAN_MODE" = "true" ]; then
  plan_args=(--mode plan --repo-root "$REPO_ROOT")
  if [ -n "$ONLY_FILTER" ]; then
    plan_args+=(--only "$ONLY_FILTER")
  fi
  if [ -n "$REQUIREMENT_WORKSPACE" ]; then
    plan_args+=(--requirement-workspace "$REQUIREMENT_WORKSPACE")
  fi
  node "$SCRIPT_DIR/setup-plan-renderer.cjs" "${plan_args[@]}"
  exit $?
fi

if [ "$ALL_REPOS" = "true" ]; then
  write_all_repos_install_summary_and_exit "$TARGET_JSON" "explicit-all-repos"
fi

if [ "$DEFAULT_ALL_REPOS" = "true" ]; then
  write_all_repos_install_summary_and_exit "$TARGET_JSON" "workspace-default-all-repos"
fi

if [ -n "$ONLY_FILTER" ]; then
  IFS=',' read -ra ONLY_ARRAY <<< "$ONLY_FILTER"
else
  ONLY_ARRAY=()
fi

selection_contains() {
  local wanted="$1"
  local only
  for only in ${ONLY_ARRAY[@]+"${ONLY_ARRAY[@]}"}; do
    if [ "$only" = "$wanted" ]; then
      return 0
    fi
  done
  return 1
}

validate_only_filter() {
  [ -n "$ONLY_FILTER" ] || return 0
  local valid_ids unknown_ids only
  valid_ids="$(
    jq -r '.tools[].id' "$TOOLS_JSON"
    jq -r '.providers[].id' "$PROVIDER_TOOLS_JSON"
  )"
  unknown_ids=()
  for only in ${ONLY_ARRAY[@]+"${ONLY_ARRAY[@]}"}; do
    if ! grep -Fxq "$only" <<<"$valid_ids"; then
      unknown_ids+=("$only")
    fi
  done
  if [ "${#unknown_ids[@]}" -eq 0 ]; then
    return 0
  fi
  printf '%s\n' "${unknown_ids[@]}" | jq -R . | jq -s \
    --arg host "$HOST" \
    --arg display "$HOST_DISPLAY_NAME" \
    --arg platform "$PLATFORM" \
    '{host:$host,display_name:$display,platform:$platform,results:[],overall_status:"action-required",reason_code:"unknown-optional-provider-selection",unknown_ids:.,next_action:"Use one of: codegraph,graphify"}'
  exit 1
}

validate_only_filter

should_install() {
  local tool_id="$1"

  if [ -n "$ONLY_FILTER" ]; then
    for only in ${ONLY_ARRAY[@]+"${ONLY_ARRAY[@]}"}; do
      if [ "$only" = "$tool_id" ]; then
        return 0
      fi
    done
    return 1
  fi

  return 0
}

optional_tool_allowed() {
  local tool_id="$1"
  local explicit_consent_required
  explicit_consent_required="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .opt_in.explicit_consent_required // false' "$TOOLS_JSON")"
  [ "$explicit_consent_required" = "true" ] && [ -n "$ONLY_FILTER" ]
}

check_tool_dependencies() {
  local tool_id="$1"
  local dep
  while IFS= read -r dep; do
    if ! command -v "$dep" >/dev/null 2>&1; then
      printf '%s' "$dep"
      return 1
    fi
  done < <(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .dependencies[]' "$TOOLS_JSON")
  return 0
}

sha256_stdin() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import hashlib, sys; print(hashlib.sha256(sys.stdin.buffer.read()).hexdigest())'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 | awk '{print $1}'
    return
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | awk '{print $1}'
    return
  fi
  echo 'install-mcp.sh: missing sha256 helper: install python3, shasum, or sha256sum' >&2
  return 1
}

warmup_command_hash() {
  local command="$1"
  shift
  {
    printf 'command=%s\n' "$command"
    local arg
    for arg in "$@"; do
      printf 'arg=%s\n' "$arg"
    done
  } | sha256_stdin
}

warmup_cache_path() {
  local tool_id="$1"
  printf '%s/%s/%s/%s.json' "$WARMUP_CACHE_ROOT" "$HOST" "$PLATFORM" "$tool_id"
}

warmup_cache_ttl_seconds() {
  local command="$1"
  shift
  local joined
  joined="$command $*"
  if [[ "$joined" == *"@latest"* ]] || [[ "$joined" == *" --upgrade "* ]]; then
    printf '%s' "$WARMUP_LATEST_TTL_SECONDS"
  else
    printf '0'
  fi
}

warmup_cache_hit() {
  local tool_id="$1"
  local command_hash="$2"
  local ttl_seconds="$3"
  local cache_file now last_success_epoch
  cache_file="$(warmup_cache_path "$tool_id")"
  [ "${SPEC_FIRST_FORCE_WARMUP:-}" != "1" ] || return 1
  [ "${SPEC_FIRST_DISABLE_WARMUP_CACHE:-}" != "1" ] || return 1
  case "$ttl_seconds" in ''|*[!0-9]*) return 1 ;; esac
  [ -f "$cache_file" ] || return 1
  jq -e --arg tool_id "$tool_id" \
        --arg host "$HOST" \
        --arg platform "$PLATFORM" \
        --arg command_hash "$command_hash" \
        '.schema_version == "mcp-warmup-cache.v1"
          and .tool_id == $tool_id
          and .host == $host
          and .platform == $platform
          and .command_hash == $command_hash
          and .exit_code == 0' "$cache_file" >/dev/null 2>&1 || return 1
  if [ "$ttl_seconds" -gt 0 ]; then
    last_success_epoch="$(jq -r '.last_success_epoch // 0' "$cache_file")"
    case "$last_success_epoch" in ''|*[!0-9]*) return 1 ;; esac
    now="$(date +%s)"
    [ $((last_success_epoch + ttl_seconds)) -ge "$now" ] || return 1
  fi
  return 0
}

project_bootstrap_status() {
  local tool_id="$1"
  local bootstrap_kind required project_file
  bootstrap_kind="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.kind // "none"' "$TOOLS_JSON")"
  required="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.required // false' "$TOOLS_JSON")"
  if [ "$bootstrap_kind" = "none" ] || [ "$required" != "true" ]; then
    echo not-applicable
    return
  fi
  if [ "$TARGET_STATE_WRITE_ALLOWED" != "true" ]; then
    echo target-action-required
    return
  fi
  project_file="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.project_file // empty' "$TOOLS_JSON")"
  if [ -n "$project_file" ] && [ -f "$REPO_ROOT/$project_file" ]; then
    echo ready
    return
  fi
  echo pending
}

write_warmup_cache() {
  local tool_id="$1"
  local command="$2"
  local command_hash="$3"
  local package_spec="$4"
  shift 4
  local cache_file args_json tmp
  cache_file="$(warmup_cache_path "$tool_id")"
  mkdir -p "$(dirname "$cache_file")" 2>/dev/null || return 0
  args_json="$(printf '%s\n' "$@" | jq -R . | jq -s -c .)" || return 0
  tmp="$(mktemp "${cache_file}.XXXXXX" 2>/dev/null)" || return 0
  if jq -n --arg tool_id "$tool_id" \
        --arg host "$HOST" \
        --arg platform "$PLATFORM" \
        --arg command "$command" \
        --argjson args "$args_json" \
        --arg command_hash "$command_hash" \
        --arg package_spec "$package_spec" \
        --arg last_success_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --argjson last_success_epoch "$(date +%s)" \
        '{
          schema_version:"mcp-warmup-cache.v1",
          tool_id:$tool_id,
          host:$host,
          platform:$platform,
          command:$command,
          args:$args,
          command_hash:$command_hash,
          package_spec:$package_spec,
          last_success_at:$last_success_at,
          last_success_epoch:$last_success_epoch,
          exit_code:0
        }' > "$tmp"; then
    mv "$tmp" "$cache_file" 2>/dev/null || rm -f "$tmp"
  else
    rm -f "$tmp"
  fi
  return 0
}

append_result() {
  local tool_id="$1"
  local status="$2"
  local last_action="$3"
  local install_kind="$4"
  local reason_code="$5"
  local next_action="$6"
  local configured_path="$7"
  local selected_scope="$8"
  local fallback_applied="$9"
  local exit_code="${10}"
  local diagnostic_summary="${11}"
  local repair_diagnostic_summary="${12}"

  jq --arg id "$tool_id" \
     --arg status "$status" \
     --arg last_action "$last_action" \
     --arg install_kind "$install_kind" \
     --arg reason_code "$reason_code" \
     --arg next_action "$next_action" \
     --arg configured_path "$configured_path" \
     --arg selected_scope "$selected_scope" \
     --arg fallback_applied "$fallback_applied" \
     --arg exit_code "$exit_code" \
     --arg diagnostic_summary "$diagnostic_summary" \
     --arg repair_diagnostic_summary "$repair_diagnostic_summary" \
     '.results += [{
       tool_id:$id,
       status:$status,
       last_action:$last_action,
       install_kind:$install_kind,
       reason_code:$reason_code,
       next_action:$next_action,
       configured_path:$configured_path,
       selected_scope:$selected_scope,
       fallback_applied:($fallback_applied == "true"),
       exit_code:($exit_code | if . == "" then null else tonumber end),
       diagnostic_summary:$diagnostic_summary,
       repair_diagnostic_summary:$repair_diagnostic_summary
     }]' \
     "$ledger_tmp" > "$ledger_tmp.next"
  mv "$ledger_tmp.next" "$ledger_tmp"
}

RUN_STDOUT=""
RUN_DIAGNOSTIC=""
RUN_EXIT_CODE=0

version_output_matches_expected() {
  local expected="$1"
  local output="$2"
  if [ -z "$expected" ]; then
    return 0
  fi
  grep -Eq "(^|[^0-9A-Za-z.])${expected//./\\.}([^0-9A-Za-z.]|$)" <<<"$output"
}

run_and_capture() {
  local stage="$1"
  local timeout_seconds="$2"
  shift 2
  local stdout_file stderr_file combined
  stdout_file="$(mktemp "${TMPDIR:-/tmp}/spec-mcp-command-stdout.XXXXXX")"
  stderr_file="$(mktemp "${TMPDIR:-/tmp}/spec-mcp-command-stderr.XXXXXX")"

  stage_log "$stage" "start"
  set +e
  python3 - "$timeout_seconds" "$@" <<'PY' >"$stdout_file" 2>"$stderr_file"
import os
import signal
import subprocess
import sys
import time

timeout = float(sys.argv[1])
args = sys.argv[2:]

def terminate_process_tree(process):
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except Exception:
        try:
            process.terminate()
        except Exception:
            return
    deadline = time.time() + 5
    while time.time() < deadline:
        if process.poll() is not None:
            return
        time.sleep(0.1)
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except Exception:
        try:
            process.kill()
        except Exception:
            pass

try:
    process = subprocess.Popen(
        args,
        stdin=subprocess.DEVNULL,
        start_new_session=True,
    )
    try:
        exit_code = process.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        terminate_process_tree(process)
        sys.exit(124)
except subprocess.TimeoutExpired:
    sys.exit(124)
except FileNotFoundError as exc:
    sys.stderr.write(f"{exc}\n")
    sys.exit(127)
except Exception as exc:
    sys.stderr.write(f"{exc}\n")
    sys.exit(1)

sys.exit(exit_code)
PY
  RUN_EXIT_CODE=$?
  set -e

  RUN_STDOUT="$(cat "$stdout_file")"
  combined="$(cat "$stderr_file" "$stdout_file" | tr '\n' ' ' | cut -c 1-1000)"
  RUN_DIAGNOSTIC="$combined"
  rm -f "$stdout_file" "$stderr_file"
  if [ "$RUN_EXIT_CODE" -eq 124 ]; then
    stage_log "$stage" "timed out after ${timeout_seconds}s"
  else
    stage_log "$stage" "done (exit $RUN_EXIT_CODE)"
  fi
  return "$RUN_EXIT_CODE"
}

codegraph_status_requests_full_reindex() {
  local output="$1"
  grep -qi "codegraph index -f" <<<"$output" || return 1
  return 0
}

export PATH="$HOME/.cargo/bin:$HOME/.fnm/aliases/default/bin:$HOME/.local/bin:$PATH"
mkdir -p "$CONFIG_DIR"

ledger_tmp="$(mktemp "${TMPDIR:-/tmp}/spec-mcp-install-ledger.XXXXXX")"
trap 'rm -f "$ledger_tmp"' EXIT

jq -n --arg host "$HOST" --arg display "$HOST_DISPLAY_NAME" --arg platform "$PLATFORM" '{host:$host,display_name:$display,platform:$platform,results:[]}' > "$ledger_tmp"

TOOL_IDS=()
while IFS= read -r tool_id; do
  TOOL_IDS+=("$tool_id")
done < <(jq -r '.tools[].id' "$TOOLS_JSON")

for tool_id in "${TOOL_IDS[@]}"; do
  required="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .required' "$TOOLS_JSON")"
  if ! should_install "$tool_id"; then
    continue
  fi

  install_kind="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .installation.kind' "$TOOLS_JSON")"
  if [ "$required" != "true" ] && [ -z "$ONLY_FILTER" ]; then
    continue
  fi
  if [ "$required" != "true" ] && ! optional_tool_allowed "$tool_id"; then
    append_result "$tool_id" "action-required" "failed" "$install_kind" "registry_not_required" "optional MCP tools require explicit opt-in metadata and --only <tool-id>" "" "" false "" "" ""
    continue
  fi

  host_config_required="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | if has("host_config_required") then .host_config_required else true end' "$TOOLS_JSON")"

  last_action="installed"
  reason_code=""
  status="ready"
  next_action=""
  configured_path=""
  selected_scope=""
  fallback_applied=false
  exit_code=""
  diagnostic_summary=""
  repair_diagnostic_summary=""

  missing_dep="$(check_tool_dependencies "$tool_id" || true)"
  if [ -n "$missing_dep" ]; then
    status="action-required"
    last_action="failed"
    reason_code="missing_dependency"
    next_action="安装依赖: $missing_dep"
    diagnostic_summary="missing dependency: $missing_dep"
  fi

  if [ "$status" = "ready" ] && [ "$install_kind" = "warmup" ]; then
    install_command="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .installation.unix.command' "$TOOLS_JSON")"
    install_args=()
    while IFS= read -r arg; do
      install_args+=("$arg")
    done <<EOF
$(jq -r --arg id "$tool_id" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) as $t | $t.installation.unix.args[] | expand_tpl($t)' "$TOOLS_JSON")
EOF
    warmup_hash="$(warmup_command_hash "$install_command" "${install_args[@]}")"
    warmup_ttl_seconds="$(warmup_cache_ttl_seconds "$install_command" "${install_args[@]}")"
    if warmup_cache_hit "$tool_id" "$warmup_hash" "$warmup_ttl_seconds"; then
      last_action="warmup-cache-hit"
    elif ! run_and_capture "warmup:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" "$install_command" "${install_args[@]}"; then
      status="action-required"
      last_action="failed"
      reason_code="warmup_failed"
      next_action="检查工具 warmup 命令与网络可达性"
      exit_code="$RUN_EXIT_CODE"
      diagnostic_summary="$RUN_DIAGNOSTIC"
    else
      package_spec="$(jq -r --arg id "$tool_id" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) | if ((.package // "") != "" and (.version // "") != "") then "\(.package)@\(.version)" else "" end' "$TOOLS_JSON")"
      write_warmup_cache "$tool_id" "$install_command" "$warmup_hash" "$package_spec" "${install_args[@]}"
    fi
  elif [ "$status" = "ready" ] && [ "$install_kind" = "global-npm" ]; then
    install_command="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .installation.unix.command' "$TOOLS_JSON")"
    install_args=()
    while IFS= read -r arg; do
      install_args+=("$arg")
    done <<EOF
$(jq -r --arg id "$tool_id" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) as $t | $t.installation.unix.args[] | expand_tpl($t)' "$TOOLS_JSON")
EOF
    verify_command="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .installation.verify_command.command // empty' "$TOOLS_JSON")"
    verify_args=()
    if [ -n "$verify_command" ]; then
      while IFS= read -r arg; do
        verify_args+=("$arg")
      done <<EOF
$(jq -r --arg id "$tool_id" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) as $t | ($t.installation.verify_command.args // [])[] | expand_tpl($t)' "$TOOLS_JSON")
EOF
    fi
    expected_version="$(jq -r --arg id "$tool_id" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) | .version // empty' "$TOOLS_JSON")"
    if [ -n "$verify_command" ] \
      && run_and_capture "verify-before-install:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" "$verify_command" "${verify_args[@]}" \
      && version_output_matches_expected "$expected_version" "$RUN_STDOUT $RUN_DIAGNOSTIC"; then
      last_action="global-install-cache-hit"
    elif ! run_and_capture "install:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" "$install_command" "${install_args[@]}"; then
      status="action-required"
      last_action="failed"
      reason_code="install_failed"
      next_action="检查 npm 全局安装权限、网络和 registry 配置"
      exit_code="$RUN_EXIT_CODE"
      diagnostic_summary="$RUN_DIAGNOSTIC"
    elif [ -n "$verify_command" ] && ! run_and_capture "verify-after-install:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" "$verify_command" "${verify_args[@]}"; then
      status="action-required"
      last_action="failed"
      reason_code="install_verify_failed"
      next_action="确认安装后的 CLI 在 PATH 上可用: $verify_command"
      exit_code="$RUN_EXIT_CODE"
      diagnostic_summary="$RUN_DIAGNOSTIC"
    elif ! version_output_matches_expected "$expected_version" "$RUN_STDOUT $RUN_DIAGNOSTIC"; then
      status="action-required"
      last_action="failed"
      reason_code="install_verify_version_mismatch"
      next_action="确认 PATH 上的 $verify_command 来自 pinned package version $expected_version，而不是其他同名 CLI"
      diagnostic_summary="$RUN_DIAGNOSTIC"
    else
      last_action="global-installed"
    fi
  fi

  if [ "$status" = "ready" ] && [ "$host_config_required" = "true" ]; then
    configure_output=""
    configure_args=(--tool "$tool_id")
    if [ "$KIRO_USER_SCOPE_ARG" = "true" ]; then
      configure_args+=(--user-scope)
    fi
    if run_and_capture "configure:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" bash "$SCRIPT_DIR/configure-host.sh" "${configure_args[@]}"; then
      configure_output="$RUN_STDOUT"
      configured_path="$(jq -r '.configured_path // empty' <<<"$configure_output")"
      selected_scope="$(jq -r '.selected_scope // empty' <<<"$configure_output")"
      fallback_applied="$(jq -r '.fallback_applied // false' <<<"$configure_output")"
    else
      exit_code="$RUN_EXIT_CODE"
      diagnostic_summary="$RUN_DIAGNOSTIC"
      if run_and_capture "repair:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" bash "$SCRIPT_DIR/repair-install.sh" "${configure_args[@]}"; then
        repair_output="$RUN_STDOUT"
        last_action="repaired"
        configured_path="$(jq -r '.configured_path // empty' <<<"$repair_output")"
        selected_scope="$(jq -r '.selected_scope // empty' <<<"$repair_output")"
        fallback_applied="$(jq -r '.fallback_applied // false' <<<"$repair_output")"
      else
        status="action-required"
        last_action="failed"
        reason_code="configure_failed"
        next_action="检查宿主 CLI 与配置写入权限"
        repair_diagnostic_summary="$RUN_DIAGNOSTIC"
      fi
    fi
  elif [ "$status" = "ready" ]; then
    last_action="host-config-skipped"
    next_action=""
    diagnostic_summary="host MCP config is not required for this tool"
  fi

  project_state="$(project_bootstrap_status "$tool_id")"
  if [ "$status" = "ready" ] && [ "$project_state" = "target-action-required" ]; then
    status="action-required"
    last_action="failed"
    reason_code="project_target_required"
    next_action="${TARGET_NEXT_ACTION:-选择目标 repo 后重跑 setup}"
    diagnostic_summary="project bootstrap requires a writable target repo"
  elif [ "$status" = "ready" ] && [ "$project_state" = "pending" ]; then
    bootstrap_command="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.unix.command' "$TOOLS_JSON")"
    bootstrap_args=()
    while IFS= read -r arg; do
      bootstrap_args+=("$arg")
    done <<EOF
$(jq -r --arg id "$tool_id" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) as $t | $t.project_bootstrap.unix.args[] | expand_tpl($t)' "$TOOLS_JSON")
EOF
    pushd "$REPO_ROOT" >/dev/null
    if run_and_capture "project-bootstrap:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" "$bootstrap_command" "${bootstrap_args[@]}"; then
      popd >/dev/null
      last_action="project-bootstrapped"
    else
      popd >/dev/null
      status="action-required"
      last_action="failed"
      reason_code="project_bootstrap_failed"
      next_action="检查 project_bootstrap 命令、网络和 repo 写入权限"
      exit_code="$RUN_EXIT_CODE"
      diagnostic_summary="$RUN_DIAGNOSTIC"
    fi
  elif [ "$status" = "ready" ] && [ "$project_state" = "ready" ]; then
    last_action="project-bootstrap-cache-hit"
  fi

  if [ "$status" = "ready" ]; then
    status_probe_command="$(jq -r --arg id "$tool_id" '.tools[] | select(.id == $id) | .project_bootstrap.status_probe.command // empty' "$TOOLS_JSON")"
    if [ -n "$status_probe_command" ]; then
      status_probe_args=()
      while IFS= read -r arg; do
        status_probe_args+=("$arg")
      done <<EOF
$(jq -r --arg id "$tool_id" "$SPEC_FIRST_JQ_TEMPLATE_PRELUDE"'tool_by_id($id) as $t | ($t.project_bootstrap.status_probe.args // [])[] | expand_tpl($t)' "$TOOLS_JSON")
EOF
      pushd "$REPO_ROOT" >/dev/null
      if run_and_capture "project-status:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" "$status_probe_command" "${status_probe_args[@]}"; then
        status_probe_output="$RUN_STDOUT $RUN_DIAGNOSTIC"
        if [ "$tool_id" = "codegraph" ] && { grep -q "Pending Changes" <<<"$status_probe_output" || codegraph_status_requests_full_reindex "$status_probe_output"; }; then
          if run_and_capture "project-sync:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" codegraph sync; then
            if run_and_capture "project-status-after-sync:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" "$status_probe_command" "${status_probe_args[@]}"; then
              status_probe_output="$RUN_STDOUT $RUN_DIAGNOSTIC"
              if grep -q "Pending Changes" <<<"$status_probe_output"; then
                status="action-required"
                last_action="failed"
                reason_code="project_status_pending_changes"
                next_action="Run codegraph sync from the project root and inspect pending changes."
                diagnostic_summary="$RUN_DIAGNOSTIC"
              elif codegraph_status_requests_full_reindex "$status_probe_output"; then
                if run_and_capture "project-full-reindex:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" codegraph index -f; then
                  if run_and_capture "project-status-after-full-reindex:$tool_id" "$DEFAULT_STAGE_TIMEOUT_SECONDS" "$status_probe_command" "${status_probe_args[@]}"; then
                    status_probe_output="$RUN_STDOUT $RUN_DIAGNOSTIC"
                    if codegraph_status_requests_full_reindex "$status_probe_output"; then
                      status="degraded"
                      last_action="project-full-reindex-still-required"
                      reason_code="project_full_reindex_still_required"
                      next_action="Run codegraph status and inspect why codegraph index -f did not clear the advisory."
                      diagnostic_summary="$RUN_DIAGNOSTIC"
                    else
                      last_action="project-status-full-reindexed"
                      reason_code="codegraph-full-reindex-used"
                    fi
                  else
                    status="degraded"
                    last_action="project-full-reindex-status-failed"
                    reason_code="project_status_failed_after_full_reindex"
                    next_action="Run codegraph status from the project root and inspect local index state."
                    exit_code="$RUN_EXIT_CODE"
                    diagnostic_summary="$RUN_DIAGNOSTIC"
                  fi
                else
                  status="degraded"
                  last_action="project-full-reindex-failed"
                  reason_code="project_full_reindex_failed"
                  next_action="Run codegraph index -f from the project root and inspect rebuild errors."
                  exit_code="$RUN_EXIT_CODE"
                  diagnostic_summary="$RUN_DIAGNOSTIC"
                fi
              elif [ "$last_action" = "project-bootstrap-cache-hit" ]; then
                last_action="project-status-synced"
              elif [ "$last_action" = "project-bootstrapped" ]; then
                last_action="project-bootstrapped-status-synced"
              fi
            else
              status="action-required"
              last_action="failed"
              reason_code="project_status_failed_after_sync"
              next_action="Run codegraph status from the project root and inspect local index state."
              exit_code="$RUN_EXIT_CODE"
              diagnostic_summary="$RUN_DIAGNOSTIC"
            fi
          else
            status="action-required"
            last_action="failed"
            reason_code="project_sync_failed"
            next_action="Run codegraph sync from the project root and inspect sync errors."
            exit_code="$RUN_EXIT_CODE"
            diagnostic_summary="$RUN_DIAGNOSTIC"
          fi
        fi
        popd >/dev/null
        if [ "$status" = "ready" ] && [ "$last_action" = "project-bootstrap-cache-hit" ]; then
          last_action="project-status-cache-hit"
        elif [ "$status" = "ready" ] && [ "$last_action" = "project-bootstrapped" ]; then
          last_action="project-bootstrapped-status-checked"
        fi
      else
        popd >/dev/null
        status="action-required"
        last_action="failed"
        reason_code="project_status_failed"
        next_action="检查 provider-native project status 命令和本地索引产物"
        exit_code="$RUN_EXIT_CODE"
        diagnostic_summary="$RUN_DIAGNOSTIC"
      fi
    fi
  fi

  append_result "$tool_id" "$status" "$last_action" "$install_kind" "$reason_code" "$next_action" "$configured_path" "$selected_scope" "$fallback_applied" "$exit_code" "$diagnostic_summary" "$repair_diagnostic_summary"
done

if [ -n "$ONLY_FILTER" ] && selection_contains "graphify"; then
  helper_args=(--install)
  if [ "$GRAPHIFY_REFRESH" = "true" ]; then
    helper_args+=(--refresh)
  fi
  if [ -n "$REQUIREMENT_WORKSPACE" ]; then
    helper_args+=(--requirement-workspace "$REQUIREMENT_WORKSPACE")
  fi
  set +e
  helper_output="$(
    SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT=approved \
    SPEC_FIRST_PROVIDER_HOST="$HOST" \
    SPEC_FIRST_PROVIDER_REPO_ROOT="$REPO_ROOT" \
    SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT="graphify-out" \
    bash "$SCRIPT_DIR/install-helpers.sh" "${helper_args[@]}"
  )"
  helper_status=$?
  set -e
  if jq -e . >/dev/null 2>&1 <<<"$helper_output"; then
    jq \
      --argjson helper "$helper_output" \
      --argjson exit_code "$helper_status" \
      '.helper_tools = ($helper.helper_tools // {})
       | .provider_readiness = ($helper.provider_readiness // [])
       | .provider_apply = {
          selected:["graphify"],
          route:"install-helpers",
          status:(if $exit_code == 0 then "ready" else "action-required" end),
          exit_code:$exit_code
        }' "$ledger_tmp" > "$ledger_tmp.next"
    mv "$ledger_tmp.next" "$ledger_tmp"
  else
    jq \
      --arg diagnostic "$helper_output" \
      --argjson exit_code "$helper_status" \
      '.provider_apply = {
          selected:["graphify"],
          route:"install-helpers",
          status:"action-required",
          exit_code:$exit_code,
          reason_code:"graphify-helper-output-invalid",
          diagnostic_summary:$diagnostic
        }' "$ledger_tmp" > "$ledger_tmp.next"
    mv "$ledger_tmp.next" "$ledger_tmp"
  fi
fi

cat "$ledger_tmp"
