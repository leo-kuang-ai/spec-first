#!/bin/bash
# bootstrap-project-config.sh - Apply explicit project-local setup actions.

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }

REFRESH_EXAMPLE="no"
CREATE_LOCAL="no"
ENSURE_GITIGNORE="no"
DELETE_LEGACY_MARKDOWN="no"
JSON_OUTPUT="no"
REPO_ARG=""
FOLDER_ARG=""
ALL_REPOS="no"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --refresh-example)
      REFRESH_EXAMPLE="yes"
      shift
      ;;
    --create-local)
      CREATE_LOCAL="yes"
      shift
      ;;
    --ensure-gitignore)
      ENSURE_GITIGNORE="yes"
      shift
      ;;
    --delete-legacy-markdown)
      DELETE_LEGACY_MARKDOWN="yes"
      shift
      ;;
    --json)
      JSON_OUTPUT="yes"
      shift
      ;;
    --repo)
      REPO_ARG="${2:-}"
      [ -n "$REPO_ARG" ] || { echo "bootstrap-project-config.sh: --repo requires a value" >&2; exit 1; }
      shift 2
      ;;
    --folder)
      FOLDER_ARG="${2:-}"
      [ -n "$FOLDER_ARG" ] || { echo "bootstrap-project-config.sh: --folder requires a value" >&2; exit 1; }
      shift 2
      ;;
    --all-repos)
      ALL_REPOS="yes"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

if [ -n "$REPO_ARG" ] && [ -n "$FOLDER_ARG" ]; then
  echo "bootstrap-project-config.sh: use either --repo or --folder, not both" >&2
  exit 1
fi
if [ "$ALL_REPOS" = "yes" ] && [ -n "$FOLDER_ARG" ]; then
  echo "bootstrap-project-config.sh: use either --all-repos or --folder, not both" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  printf '%s' "$value"
}

emit_json() {
  local overall_status="$1"
  local reason="$2"
  local repo_root="$3"
  local example_status="$4"
  local local_status="$5"
  local gitignore_status="$6"
  local legacy_markdown_status="$7"
  local legacy_config_status="$8"
  local target_kind_value="${target_kind:-}"

  printf '{'
  printf '"schema_version":"project-config-bootstrap.v1",'
  printf '"overall_status":"%s",' "$(json_escape "$overall_status")"
  printf '"reason":"%s",' "$(json_escape "$reason")"
  printf '"repo_root":"%s",' "$(json_escape "$repo_root")"
  printf '"target_kind":"%s",' "$(json_escape "$target_kind_value")"
  printf '"project":{"example_config_status":"%s","local_config_status":"%s","local_config_gitignore_status":"%s"},' \
    "$(json_escape "$example_status")" \
    "$(json_escape "$local_status")" \
    "$(json_escape "$gitignore_status")"
  printf '"legacy":{"legacy_markdown_status":"%s","legacy_local_config_status":"%s"}' \
    "$(json_escape "$legacy_markdown_status")" \
    "$(json_escape "$legacy_config_status")"
  printf '}\n'
}

write_workspace_summary_atomic() {
  local workspace_root="$1"
  local file_name="$2"
  local spec_dir="$workspace_root/.spec-first"
  local workspace_dir="$spec_dir/workspace"
  local path="$workspace_dir/$file_name"
  local tmp

  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ]; then
    echo "bootstrap-project-config.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  mkdir -p "$workspace_dir" || return 1
  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ] || [ -L "$path" ]; then
    echo "bootstrap-project-config.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  tmp="$(mktemp "${path}.XXXXXX")" || return 1
  if ! cat > "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ] || [ -L "$path" ]; then
    rm -f "$tmp"
    echo "bootstrap-project-config.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  mv "$tmp" "$path" || { rm -f "$tmp"; return 1; }
}

ensure_project_config_dir_safe() {
  if [ -L "$SPEC_DIR" ]; then
    return 1
  fi
  mkdir -p "$SPEC_DIR" || return 1
  [ ! -L "$SPEC_DIR" ]
}

ensure_project_config_file_safe() {
  local path="$1"
  ensure_project_config_dir_safe || return 1
  [ ! -L "$path" ]
}

fail_project_config() {
  local reason="$1"
  local example_status="${2:-skipped}"
  local local_status="${3:-skipped}"
  local gitignore_status="${4:-skipped}"
  if [ "$JSON_OUTPUT" = "yes" ]; then
    emit_json "action-required" "$reason" "$REPO_ROOT" "$example_status" "$local_status" "$gitignore_status" "$legacy_markdown_status" "$legacy_config_status"
  else
    echo "Project config bootstrap blocked: $reason" >&2
  fi
  exit 1
}

write_all_repos_project_config_summary_and_exit() {
  local target_json="$1"
  local selection_source="${2:-explicit-all-repos}"
  local target_mode workspace_root candidate_count summary_items summary_json

  target_mode="$(jq -r '.mode // empty' <<<"$target_json")"
  workspace_root="$(jq -r '.workspace_root // .invocation_cwd' <<<"$target_json")"

  if [ -n "$REPO_ARG" ]; then
    jq -n --arg workspace_root "$workspace_root" '{
      schema_version:"workspace-project-config-bootstrap-summary.v1",
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
      schema_version:"workspace-project-config-bootstrap-summary.v1",
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
      schema_version:"workspace-project-config-bootstrap-summary.v1",
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

  summary_items="$(mktemp "${TMPDIR:-/tmp}/project-config-all-repos.XXXXXX")"
  jq -n '[]' > "$summary_items"
  while IFS=$'\t' read -r child_label child_path; do
    [ -n "$child_path" ] || continue
    child_args=(--repo "$child_path" --json)
    [ "$REFRESH_EXAMPLE" = "yes" ] && child_args+=(--refresh-example)
    [ "$CREATE_LOCAL" = "yes" ] && child_args+=(--create-local)
    [ "$ENSURE_GITIGNORE" = "yes" ] && child_args+=(--ensure-gitignore)
    [ "$DELETE_LEGACY_MARKDOWN" = "yes" ] && child_args+=(--delete-legacy-markdown)
    set +e
    child_output="$(bash "$0" ${child_args[@]+"${child_args[@]}"})"
    child_status=$?
    set -e
    if ! jq -e . >/dev/null 2>&1 <<<"$child_output"; then
      child_result="$(jq -n --arg output "$child_output" '{schema_version:"project-config-bootstrap.v1",overall_status:"action-required",reason:"child-output-unparseable",diagnostic:$output}')"
    else
      child_result="$child_output"
    fi
    jq \
      --arg repo_label "$child_label" \
      --arg workspace_relative_path "$child_path" \
      --argjson exit_code "$child_status" \
      --argjson result "$child_result" \
      '. + [{
        repo_label:$repo_label,
        workspace_relative_path:$workspace_relative_path,
        exit_code:$exit_code,
        overall_status:($result.overall_status // "unknown"),
        reason_code:(if (($result.reason // "") == "") then null else $result.reason end),
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
        schema_version:"workspace-project-config-bootstrap-summary.v1",
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
          action_required:([$results[] | select(.overall_status != "ready")] | length)
        },
        overall_status:(
          if ($results | length) == 0 then "action-required"
          elif ([$results[] | select(.overall_status != "ready")] | length) == 0 then "ready"
          elif ([$results[] | select(.overall_status == "ready")] | length) > 0 then "partial"
          else "action-required"
          end
        ),
        reason_code:(
          if ($results | length) == 0 then "workspace-no-git-candidates"
          elif ([$results[] | select(.overall_status != "ready")] | length) == 0 then null
          else "all-repos-partial-or-action-required"
          end
        ),
        next_action:(
          if ([$results[] | select(.overall_status != "ready")] | length) == 0 then
            "All child repos completed project config bootstrap."
          else
            "Inspect per-child reason_code and rerun project config bootstrap for action-required repos."
          end
        )
      }')"
  rm -f "$summary_items"
  if ! printf '%s\n' "$summary_json" | write_workspace_summary_atomic "$workspace_root" "project-config-bootstrap-summary.json"; then
    jq -n --arg workspace_root "$workspace_root" '{
      schema_version:"workspace-project-config-bootstrap-summary.v1",
      overall_status:"action-required",
      workflow_mode:"blocked",
      reason_code:"workspace-summary-symlink-escape",
      workspace_root:$workspace_root,
      advisory:true,
      next_action:"Replace symlinked .spec-first/workspace with a real workspace-local directory and rerun project config bootstrap."
    }'
    exit 1
  fi
  printf '%s\n' "$summary_json"
  if [ "$(jq -r '.overall_status' <<<"$summary_json")" != "ready" ]; then
    exit 1
  fi
  exit 0
}

TARGET_ARGS=()
if [ -n "$REPO_ARG" ] && [ "$ALL_REPOS" != "yes" ]; then
  TARGET_ARGS+=(--repo "$REPO_ARG")
fi
if [ -n "$FOLDER_ARG" ] && [ "$ALL_REPOS" != "yes" ]; then
  TARGET_ARGS+=(--folder "$FOLDER_ARG")
fi
set +e
TARGET_ENV="$(bash "$SCRIPT_DIR/resolve-project-target.sh" --format env ${TARGET_ARGS[@]+"${TARGET_ARGS[@]}"})"
TARGET_STATUS=$?
TARGET_JSON="$(bash "$SCRIPT_DIR/resolve-project-target.sh" --format json ${TARGET_ARGS[@]+"${TARGET_ARGS[@]}"})"
TARGET_JSON_STATUS=$?
set -e
[ -n "$TARGET_ENV" ] || { echo "bootstrap-project-config.sh: target resolver returned no env output" >&2; exit 1; }
[ -n "$TARGET_JSON" ] || { echo "bootstrap-project-config.sh: target resolver returned no JSON output" >&2; exit 1; }
eval "$TARGET_ENV"
if [ "$ALL_REPOS" = "yes" ]; then
  write_all_repos_project_config_summary_and_exit "$TARGET_JSON" "explicit-all-repos"
fi
DEFAULT_ALL_REPOS="no"
TARGET_MODE="$(jq -r '.mode // empty' <<<"$TARGET_JSON")"
TARGET_CANDIDATE_COUNT="$(jq -r '(.candidates // []) | length' <<<"$TARGET_JSON")"
if [ -z "$REPO_ARG" ] && [ -z "$FOLDER_ARG" ] && [ "$TARGET_MODE" != "git-repo" ] && [ "$TARGET_CANDIDATE_COUNT" -gt 0 ]; then
  DEFAULT_ALL_REPOS="yes"
fi
if [ "$DEFAULT_ALL_REPOS" = "yes" ]; then
  write_all_repos_project_config_summary_and_exit "$TARGET_JSON" "workspace-default-all-repos"
fi
if [ "$TARGET_JSON_STATUS" -ne 0 ]; then
  TARGET_STATUS="$TARGET_JSON_STATUS"
fi
if [ "$TARGET_STATUS" -ne 0 ] || [ "$state_write_allowed" != "true" ]; then
  resolved_reason="${reason_code:-workspace-target-required}"
  if [ "$JSON_OUTPUT" = "yes" ]; then
    emit_json "action-required" "$resolved_reason" "" "not-applicable" "not-applicable" "not-applicable" "not-applicable" "not-applicable"
  else
    echo "${next_action:-Project config bootstrap requires a selected git repo.}"
  fi
  exit 0
fi

REPO_ROOT="${target_root:-}"
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$selected_repo_root"
fi
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$selected_folder_root"
fi
TEMPLATE="$SCRIPT_DIR/../references/config-template.yaml"
SPEC_DIR="$REPO_ROOT/.spec-first"
EXAMPLE_CONFIG="$SPEC_DIR/config.local.example.yaml"
LOCAL_CONFIG="$SPEC_DIR/config.local.yaml"
GITIGNORE="$REPO_ROOT/.gitignore"
LEGACY_MARKDOWN="$REPO_ROOT/compound-engineering.local.md"

[ -f "$TEMPLATE" ] || {
  if [ "$JSON_OUTPUT" = "yes" ]; then
    emit_json "action-required" "missing-template" "$REPO_ROOT" "missing-template" "skipped" "skipped" "skipped" "skipped"
  else
    echo "Missing template: $TEMPLATE" >&2
  fi
  exit 1
}

example_status="skipped"
local_status="skipped"
gitignore_status="skipped"
legacy_markdown_status="missing"
legacy_config_status="retired"

if [ -f "$LEGACY_MARKDOWN" ]; then
  legacy_markdown_status="present"
fi

if [ "$REFRESH_EXAMPLE" = "yes" ]; then
  ensure_project_config_file_safe "$EXAMPLE_CONFIG" || fail_project_config "project-config-symlink-escape"
  cp "$TEMPLATE" "$EXAMPLE_CONFIG"
  example_status="refreshed"
fi

if [ "$CREATE_LOCAL" = "yes" ]; then
  ensure_project_config_file_safe "$LOCAL_CONFIG" || fail_project_config "project-config-symlink-escape" "$example_status"
  if [ -f "$LOCAL_CONFIG" ]; then
    local_status="already-exists"
  else
    cp "$TEMPLATE" "$LOCAL_CONFIG"
    local_status="created"
  fi
fi

if [ "$ENSURE_GITIGNORE" = "yes" ]; then
  if [ "${target_kind:-}" = "non-git-folder" ]; then
    gitignore_status="not-applicable-non-git-folder"
  elif [ -L "$GITIGNORE" ]; then
    fail_project_config "gitignore-symlink-escape" "$example_status" "$local_status" "blocked"
  elif git check-ignore -q "$LOCAL_CONFIG" 2>/dev/null; then
    gitignore_status="already-ignored"
  else
    touch "$GITIGNORE"
    if grep -Fxq '.spec-first/*.local.yaml' "$GITIGNORE"; then
      gitignore_status="already-present"
    else
      if [ -s "$GITIGNORE" ] && [ "$(tail -c 1 "$GITIGNORE" | wc -l | tr -d ' ')" = "0" ]; then
        printf '\n' >>"$GITIGNORE"
      fi
      printf '.spec-first/*.local.yaml\n' >>"$GITIGNORE"
      gitignore_status="added"
    fi
  fi
fi

if [ "$DELETE_LEGACY_MARKDOWN" = "yes" ]; then
  if [ -f "$LEGACY_MARKDOWN" ]; then
    rm "$LEGACY_MARKDOWN"
    legacy_markdown_status="deleted"
  else
    legacy_markdown_status="missing"
  fi
fi

if [ "$JSON_OUTPUT" = "yes" ]; then
  emit_json "ready" "" "$REPO_ROOT" "$example_status" "$local_status" "$gitignore_status" "$legacy_markdown_status" "$legacy_config_status"
else
  echo "Project config bootstrap complete."
  echo "  example_config: $example_status"
  echo "  local_config: $local_status"
  echo "  local_config_gitignore: $gitignore_status"
  echo "  legacy_markdown: $legacy_markdown_status"
  echo "  legacy_config: $legacy_config_status"
fi
