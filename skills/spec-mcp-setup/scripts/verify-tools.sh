#!/bin/bash
# verify-tools.sh - Write Required Harness Runtime readiness ledger v2.

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo '错误：node 是必需依赖，请先安装 Node.js' >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ARG=""
FOLDER_ARG=""
ALL_REPOS=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_ARG="${2:-}"
      [ -n "$REPO_ARG" ] || { echo "verify-tools.sh: --repo requires a value" >&2; exit 1; }
      shift 2
      ;;
    --folder)
      FOLDER_ARG="${2:-}"
      [ -n "$FOLDER_ARG" ] || { echo "verify-tools.sh: --folder requires a value" >&2; exit 1; }
      shift 2
      ;;
    --all-repos)
      ALL_REPOS=true
      shift
      ;;
    *)
      echo "verify-tools.sh: unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ -n "$REPO_ARG" ] && [ -n "$FOLDER_ARG" ]; then
  echo "verify-tools.sh: use either --repo or --folder, not both" >&2
  exit 1
fi
if [ "$ALL_REPOS" = "true" ] && [ -n "$FOLDER_ARG" ]; then
  echo "verify-tools.sh: use either --all-repos or --folder, not both" >&2
  exit 1
fi

HOST_INFO_JSON="$(bash "$SCRIPT_DIR/detect-host.sh")"
MARKER_PATH="$(jq -r '.marker_path' <<<"$HOST_INFO_JSON")"
MARKER_DIR="$(dirname "$MARKER_PATH")"

# U2 host pointer self-heal: 检测 setup-owned host pointer drift,
# 在 ledger 中记录 reconciliation advisory event。 detect-only,
# 重写动作由后续构造 ledger 时统一完成。
# Caller 必须在 detect-tools.sh 给出 facts 后传入 child repo root,
# 以便 --repo <child> / parent-workspace 路径下也能正确 reconcile。
compute_host_pointer_reconciliation() {
  local current_host="$1"
  local repo_root="$2"
  local marker_path="$3"
  local runtime_path previous_host previous_path
  [ -n "$current_host" ] || { printf 'null'; return 0; }
  [ -n "$repo_root" ] || { printf 'null'; return 0; }
  runtime_path="$repo_root/.spec-first/config/runtime-capabilities.json"
  [ -f "$runtime_path" ] || { printf 'null'; return 0; }
  if ! jq -e . "$runtime_path" >/dev/null 2>&1; then
    echo "verify-tools.sh: runtime-capabilities.json at $runtime_path is unreadable; host pointer reconciliation skipped (will be rewritten by setup)" >&2
    printf 'null'
    return 0
  fi
  previous_host="$(jq -r '.host_ledger_pointer.host // empty' "$runtime_path" 2>/dev/null || true)"
  previous_path="$(jq -r '.host_ledger_pointer.path // empty' "$runtime_path" 2>/dev/null || true)"
  if [ -z "$previous_host" ] || [ "$previous_host" = "$current_host" ]; then
    printf 'null'
    return 0
  fi
  jq -nc \
    --arg from_host "$previous_host" \
    --arg to_host "$current_host" \
    --arg from_marker "$previous_path" \
    --arg to_marker "$marker_path" \
    --arg reconciled_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    '{
      schema_version: "host-pointer-reconciliation.v1",
      from_host: $from_host,
      to_host: $to_host,
      from_marker_path: $from_marker,
      to_marker_path: $to_marker,
      reconciled_at: $reconciled_at,
      reason: "host marker drift detected between previous setup run and current detect-host"
    }'
}

resolve_bundled_manifest_version() {
  local repo_root version
  if [ -n "${SPEC_FIRST_BUNDLED_VERSION:-}" ]; then
    printf '%s' "$SPEC_FIRST_BUNDLED_VERSION"
    return 0
  fi

  repo_root="$(cd "$SCRIPT_DIR/../../.." && pwd)"
  if [ -f "$repo_root/package.json" ]; then
    version="$(jq -r '.version // empty' "$repo_root/package.json" 2>/dev/null || true)"
    if [ -n "$version" ] && [ "$version" != "null" ]; then
      printf '%s' "$version"
      return 0
    fi
  fi

  if command -v spec-first >/dev/null 2>&1; then
    version="$(spec-first --version 2>/dev/null | sed -n 's/.*Spec-First v\([0-9][0-9A-Za-z._-]*\).*/\1/p' | head -n 1 || true)"
    if [ -n "$version" ]; then
      printf '%s' "$version"
      return 0
    fi
  fi

  printf ''
}

runtime_state_path_for_host() {
  local host="$1"
  local target_root="$2"
  case "$host" in
    codex)
      printf '%s/.codex/spec-first/state.json' "$target_root"
      ;;
    claude)
      printf '%s/.claude/spec-first/state.json' "$target_root"
      ;;
    kiro)
      printf '%s/.kiro/spec-first/state.json' "$target_root"
      ;;
    qoder)
      printf '%s/.qoder/spec-first/state.json' "$target_root"
      ;;
    cursor)
      printf '%s/.cursor/spec-first/state.json' "$target_root"
      ;;
    *)
      printf ''
      ;;
  esac
}

compute_generated_runtime_manifest_health() {
  local host="$1"
  local target_root="$2"
  local bundled_version state_path recorded_version status reason next_action

  bundled_version="$(resolve_bundled_manifest_version)"
  state_path="$(runtime_state_path_for_host "$host" "$target_root")"
  recorded_version=""
  status="unknown"
  reason="unknown-runtime-manifest-health"
  next_action="spec-first init -y"

  if [ -z "$host" ] || [ -z "$target_root" ] || [ -z "$state_path" ]; then
    reason="missing-host-or-target-root"
  elif [ ! -f "$state_path" ]; then
    status="missing"
    reason="runtime-state-missing"
  elif ! jq -e . "$state_path" >/dev/null 2>&1; then
    status="unknown"
    reason="runtime-state-unreadable"
  else
    recorded_version="$(jq -r '.manifestVersion // empty' "$state_path" 2>/dev/null || true)"
    if [ -z "$recorded_version" ]; then
      status="missing"
      reason="runtime-manifest-version-missing"
    elif [ -z "$bundled_version" ]; then
      status="unknown"
      reason="bundled-manifest-version-unknown"
    elif [ "$recorded_version" = "$bundled_version" ]; then
      status="current"
      reason=""
      next_action=""
    else
      status="stale"
      reason="runtime-manifest-version-stale"
    fi
  fi

  jq -n \
    --arg status "$status" \
    --arg reason_code "$reason" \
    --arg host "$host" \
    --arg state_path "$state_path" \
    --arg recorded_manifest_version "$recorded_version" \
    --arg bundled_manifest_version "$bundled_version" \
    --arg next_action "$next_action" \
    '{
      status:$status,
      reason_code:(if $reason_code == "" then null else $reason_code end),
      host:$host,
      state_path:(if $state_path == "" then null else $state_path end),
      recorded_manifest_version:(if $recorded_manifest_version == "" then null else $recorded_manifest_version end),
      bundled_manifest_version:(if $bundled_manifest_version == "" then null else $bundled_manifest_version end),
      evidence_basis:"state.manifestVersion vs bundled manifest.version",
      next_action:(if $next_action == "" then null else $next_action end)
    }'
}

write_workspace_summary_atomic() {
  local workspace_root="$1"
  local file_name="$2"
  local spec_dir="$workspace_root/.spec-first"
  local workspace_dir="$spec_dir/workspace"
  local path="$workspace_dir/$file_name"
  local tmp

  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ]; then
    echo "verify-tools.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  mkdir -p "$workspace_dir" || return 1
  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ] || [ -L "$path" ]; then
    echo "verify-tools.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  tmp="$(mktemp "${path}.XXXXXX")" || return 1
  if ! cat > "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  if [ -L "$spec_dir" ] || [ -L "$workspace_dir" ] || [ -L "$path" ]; then
    rm -f "$tmp"
    echo "verify-tools.sh: refusing to write workspace summary through symlinked .spec-first/workspace" >&2
    return 1
  fi
  mv "$tmp" "$path" || { rm -f "$tmp"; return 1; }
}

json_field_or_empty() {
  local json_path="$1"
  local jq_filter="$2"
  [ -f "$json_path" ] || { printf ''; return 0; }
  jq -r "$jq_filter // empty" "$json_path" 2>/dev/null || true
}

is_foreign_absolute_stat_failure() {
  local candidate="$1"
  [ -n "$candidate" ] || return 1
  case "$candidate" in
    /*) ;;
    *) return 1 ;;
  esac
  [ ! -e "$candidate" ] || return 1
  [ -n "${HOME:-}" ] || return 0
  case "$candidate" in
    "$HOME"|"$HOME"/*) return 1 ;;
    *) return 0 ;;
  esac
}

append_parent_quarantine_item() {
  local items_file="$1"
  local rel_path="$2"
  local reason_code="$3"
  local stale_indicator="$4"
  local last_generated_at="$5"
  local fingerprint_origin="$6"

  jq \
    --arg path "$rel_path" \
    --arg reason_code "$reason_code" \
    --arg stale_indicator "$stale_indicator" \
    --arg last_generated_at "$last_generated_at" \
    --arg fingerprint_origin "$fingerprint_origin" \
    '. + [{
      path:$path,
      reason_code:$reason_code,
      stale_indicator:(if $stale_indicator == "" then null else $stale_indicator end),
      last_generated_at:(if $last_generated_at == "" then null else $last_generated_at end),
      fingerprint_origin:(if $fingerprint_origin == "" then null else $fingerprint_origin end)
    }]' "$items_file" > "$items_file.next"
  mv "$items_file.next" "$items_file"
}

append_parent_json_artifact_quarantine_item() {
  local workspace_root="$1"
  local items_file="$2"
  local rel_path="$3"
  local default_reason="$4"
  local artifact_path="$workspace_root/$rel_path"
  local repo_root generated_at pointer_path reason_code stale_indicator fingerprint_origin

  [ -e "$artifact_path" ] || return 0

  repo_root="$(json_field_or_empty "$artifact_path" '.repo_root')"
  generated_at="$(json_field_or_empty "$artifact_path" '.generated_at')"
  pointer_path="$(json_field_or_empty "$artifact_path" '.host_ledger_pointer.path')"
  reason_code="$default_reason"
  stale_indicator="parent-workspace-repo-local-artifact-present"
  fingerprint_origin="$repo_root"

  if is_foreign_absolute_stat_failure "$repo_root"; then
    reason_code="foreign-absolute-path-stat-failed"
    stale_indicator="$repo_root"
  elif is_foreign_absolute_stat_failure "$pointer_path"; then
    reason_code="foreign-absolute-path-stat-failed"
    stale_indicator="$pointer_path"
    fingerprint_origin="$pointer_path"
  elif [ -n "$repo_root" ] && [ "$repo_root" != "$workspace_root" ]; then
    reason_code="repo_root-mismatches-workspace-root"
    stale_indicator="$repo_root"
  fi

  append_parent_quarantine_item "$items_file" "$rel_path" "$reason_code" "$stale_indicator" "$generated_at" "$fingerprint_origin"
}

build_parent_artifact_quarantine_json() {
  local workspace_root="$1"
  local items_file
  items_file="$(mktemp "${TMPDIR:-/tmp}/parent-artifact-quarantine.XXXXXX")" || return 1
  jq -n '[]' > "$items_file"

  if [ -L "$workspace_root/.spec-first" ]; then
    jq -n \
      --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      '{
        schema_version:"parent-artifact-quarantine.v1",
        topology:"multi-repo-workspace",
        advisory:true,
        authority_level:"advisory",
        freshness:"generated",
        generated_at:$generated_at,
        generated_by:"spec-mcp-setup",
        consumers:["spec-first clean --workspace-orphans","LLM workflow degraded-evidence judgment"],
        quarantined_paths:[]
      }'
    rm -f "$items_file"
    return 0
  fi

  append_parent_json_artifact_quarantine_item "$workspace_root" "$items_file" ".spec-first/config/tool-facts.json" "parent-workspace-must-not-have-repo-local-setup-artifact"
  append_parent_json_artifact_quarantine_item "$workspace_root" "$items_file" ".spec-first/config/runtime-capabilities.json" "parent-workspace-must-not-have-repo-local-setup-artifact"

  jq -n \
    --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --slurpfile paths "$items_file" \
    '{
      schema_version:"parent-artifact-quarantine.v1",
      topology:"multi-repo-workspace",
      advisory:true,
      authority_level:"advisory",
      freshness:"generated",
      generated_at:$generated_at,
      generated_by:"spec-mcp-setup",
      consumers:["spec-first clean --workspace-orphans","LLM workflow degraded-evidence judgment"],
      quarantined_paths:($paths[0] // [])
    }'
  rm -f "$items_file"
}

write_setup_scenario_fingerprint() {
  local state_write_allowed target_root output helper repo_root result status tmp

  state_write_allowed="$(jq -r 'if (.target | type == "object") then (.target.state_write_allowed // true | tostring) else "true" end' "$MARKER_PATH" 2>/dev/null || echo "false")"
  [ "$state_write_allowed" = "true" ] || return 0

  target_root="$(jq -r '.target_root // .selected_repo_root // .workspace_root // empty' "$MARKER_PATH" 2>/dev/null || true)"
  [ -n "$target_root" ] && [ -d "$target_root" ] || return 0

  output="$target_root/.spec-first/workspace/scenario-fingerprint-setup.json"
  repo_root="$(cd "$SCRIPT_DIR/../../.." && pwd)"
  helper="$repo_root/src/cli/helpers/scenario-fingerprint.js"

  set +e
  if [ -f "$helper" ]; then
    result="$(node "$helper" --layer setup --ledger "$MARKER_PATH" --out "$output" 2>&1)"
    status=$?
  elif [ -n "${SPEC_FIRST_CLI:-}" ]; then
    if [ -f "$SPEC_FIRST_CLI" ] && [[ "$SPEC_FIRST_CLI" == *.js ]]; then
      result="$(node "$SPEC_FIRST_CLI" internal compute-scenario-fingerprint --layer setup --ledger "$MARKER_PATH" --out "$output" 2>&1)"
      status=$?
    else
      result="$("$SPEC_FIRST_CLI" internal compute-scenario-fingerprint --layer setup --ledger "$MARKER_PATH" --out "$output" 2>&1)"
      status=$?
    fi
  elif command -v spec-first >/dev/null 2>&1; then
    result="$(spec-first internal compute-scenario-fingerprint --layer setup --ledger "$MARKER_PATH" --out "$output" 2>&1)"
    status=$?
  else
    result="spec-first CLI unavailable"
    status=127
  fi
  set -e

  tmp="$(mktemp "${MARKER_PATH}.scenario-fingerprint.XXXXXX")" || return 0
  if [ "$status" -eq 0 ] && [ -f "$output" ]; then
    jq --arg path "$output" '
      .scenario_fingerprint_setup = {
        status:"written",
        schema_version:"developer-scenario-fingerprint-setup.v1",
        path:$path,
        advisory:true
      }
    ' "$MARKER_PATH" > "$tmp" && mv "$tmp" "$MARKER_PATH"
    echo "🧭 setup scenario fingerprint: $output"
  else
    jq --arg diagnostic "$result" '
      .scenario_fingerprint_setup = {
        status:"failed",
        schema_version:"developer-scenario-fingerprint-setup.v1",
        advisory:true,
        diagnostic:($diagnostic | split("\n") | .[0:6] | join("\n"))
      }
    ' "$MARKER_PATH" > "$tmp" && mv "$tmp" "$MARKER_PATH"
    rm -f "$tmp"
    echo "verify-tools.sh: setup scenario fingerprint failed; continuing" >&2
  fi
}

write_all_repos_verify_summary_and_exit() {
  local target_json="$1"
  local selection_source="${2:-explicit-all-repos}"
  local target_mode workspace_root candidate_count summary_items summary_json quarantine_json parent_workspace_pollution_count

  target_mode="$(jq -r '.mode // empty' <<<"$target_json")"
  workspace_root="$(jq -r '.workspace_root // .invocation_cwd' <<<"$target_json")"

  if [ -n "$REPO_ARG" ]; then
    jq -n --arg workspace_root "$workspace_root" '{
      schema_version:"workspace-mcp-verify-summary.v1",
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
      schema_version:"workspace-mcp-verify-summary.v1",
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
      schema_version:"workspace-mcp-verify-summary.v1",
      overall_status:"action-required",
      workflow_mode:"blocked",
      reason_code:($target.reason_code // "workspace-no-git-candidates"),
      workspace_root:($target.workspace_root // null),
      parent_workspace_advisory:{
        git_health:($target.git_health // null),
        coverage_gap:($target.coverage_gap // null),
        candidates_diagnostics:($target.candidates_diagnostics // []),
        repair_action_available:(($target.git_health.status // "") == "broken-worktree"),
        repair_command:(if (($target.git_health.status // "") == "broken-worktree") then "spec-first repair-worktree --dry-run" else null end),
        diagnostic_action_available:(($target.git_health.status // "") == "corrupted-gitdir"),
        diagnostic_command:(if (($target.git_health.status // "") == "corrupted-gitdir") then "git fsck" else null end)
      },
      candidates:($target.candidates // []),
      advisory:true,
      next_action:($target.next_action // "Run from a parent workspace containing child Git repos.")
    }'
    exit 1
  fi

  mkdir -p "$MARKER_DIR"
  summary_items="$(mktemp "${TMPDIR:-/tmp}/mcp-verify-all-repos.XXXXXX")"
  jq -n '[]' > "$summary_items"
  while IFS=$'\t' read -r child_label child_path; do
    [ -n "$child_path" ] || continue
    set +e
    child_output="$(bash "$0" --repo "$child_path")"
    child_status=$?
    set -e
    if [ -f "$MARKER_PATH" ] && jq -e . "$MARKER_PATH" >/dev/null 2>&1; then
      child_ledger="$(cat "$MARKER_PATH")"
      child_overall="$(jq -r '
        (.generated_runtime_manifest.status // "unknown") as $manifest_status
        | if (.overall_status // "") != "" then
            .overall_status
          elif (($manifest_status == "stale") or ($manifest_status == "missing")) then
            "action-required"
          elif (.baseline_ready == true) then
            "ready"
          else
            "action-required"
          end
      ' <<<"$child_ledger")"
      child_reason="$(jq -r '
        (.generated_runtime_manifest.status // "unknown") as $manifest_status
        | if (($manifest_status == "stale") or ($manifest_status == "missing")) then
            "generated-runtime-manifest-refresh-required"
          else
            (.reason_code // empty)
          end
      ' <<<"$child_ledger")"
      child_result="$(jq -n --argjson ledger "$child_ledger" '{
        schema_version:"mcp-verify-child-result.v1",
        baseline_ready:($ledger.baseline_ready // false),
        generated_runtime_manifest:($ledger.generated_runtime_manifest // {status:"unknown", reason_code:"not-reported"}),
        tool_facts_status:($ledger.tool_facts_status // "unknown"),
        runtime_capabilities_status:($ledger.runtime_capabilities_status // "unknown"),
        reason_code:($ledger.reason_code // ""),
        next_actions:($ledger.next_actions // [])
      }')"
    else
      child_overall="action-required"
      child_reason="child-verify-ledger-unavailable"
      child_result="$(jq -n --arg output "$child_output" '{schema_version:"mcp-verify-child-result.v1",baseline_ready:false,reason_code:"child-verify-ledger-unavailable",diagnostic:$output}')"
    fi
    if [ "$child_status" -ne 0 ] && [ "$child_overall" = "ready" ]; then
      child_overall="action-required"
      child_reason="child-verify-failed"
    fi
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

  quarantine_json="$(build_parent_artifact_quarantine_json "$workspace_root" 2>/dev/null || true)"
  if [ -n "$quarantine_json" ] && jq -e . >/dev/null 2>&1 <<<"$quarantine_json"; then
    parent_workspace_pollution_count="$(jq -r '(.quarantined_paths // []) | length' <<<"$quarantine_json")"
  else
    parent_workspace_pollution_count=0
  fi

  parent_host="$(jq -r '.host // empty' <<<"$HOST_INFO_JSON")"
  parent_generated_runtime_manifest="$(compute_generated_runtime_manifest_health "$parent_host" "$workspace_root" | jq '
    if ((.status // "unknown") == "stale") or ((.status // "unknown") == "missing") then
      .next_action = "spec-first init --all-repos -y"
    else
      .
    end
  ')"

  summary_json="$(jq -n \
    --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg selection_source "$selection_source" \
    --argjson target "$target_json" \
    --argjson parent_generated_runtime_manifest "$parent_generated_runtime_manifest" \
    --argjson parent_workspace_pollution_count "$parent_workspace_pollution_count" \
    --slurpfile items "$summary_items" \
    '($items[0] // []) as $results
    | (((($parent_generated_runtime_manifest.status // "unknown") == "stale") or (($parent_generated_runtime_manifest.status // "unknown") == "missing"))) as $parent_manifest_refresh_required
    | ([$results[] | select(((.result.generated_runtime_manifest.status // "unknown") == "stale") or ((.result.generated_runtime_manifest.status // "unknown") == "missing"))] | length) as $child_manifest_refresh_required_count
    | {
        schema_version:"workspace-mcp-verify-summary.v1",
        generated_at:$generated_at,
        advisory:true,
        workflow_mode:"all-repos",
        selection_source:$selection_source,
        workspace_root:($target.workspace_root // null),
        parent_workspace_advisory:{
          git_health:($target.git_health // null),
          coverage_gap:($target.coverage_gap // null),
          candidates_diagnostics:($target.candidates_diagnostics // []),
          repair_action_available:(($target.git_health.status // "") == "broken-worktree"),
          repair_command:(if (($target.git_health.status // "") == "broken-worktree") then "spec-first repair-worktree --dry-run" else null end),
          diagnostic_action_available:(($target.git_health.status // "") == "corrupted-gitdir"),
          diagnostic_command:(if (($target.git_health.status // "") == "corrupted-gitdir") then "git fsck" else null end)
        },
        parent_writes_repo_local_artifacts:false,
        parent_generated_runtime_manifest:$parent_generated_runtime_manifest,
        results:$results,
        counts:{
          total:($results | length),
          ready:([$results[] | select(.overall_status == "ready")] | length),
          action_required:([$results[] | select(.overall_status != "ready")] | length),
          generated_runtime_manifest:{
            current:([$results[] | select((.result.generated_runtime_manifest.status // "unknown") == "current")] | length),
            stale:([$results[] | select((.result.generated_runtime_manifest.status // "unknown") == "stale")] | length),
            missing:([$results[] | select((.result.generated_runtime_manifest.status // "unknown") == "missing")] | length),
            unknown:([$results[] | select((.result.generated_runtime_manifest.status // "unknown") == "unknown")] | length)
          }
        },
        overall_status:(
          if ($results | length) == 0 then "action-required"
          elif $parent_manifest_refresh_required then (
            if ([$results[] | select(.overall_status == "ready")] | length) > 0 then "partial" else "action-required" end
          )
          elif ([$results[] | select(.overall_status != "ready")] | length) == 0 then "ready"
          elif ([$results[] | select(.overall_status == "ready")] | length) > 0 then "partial"
          else "action-required"
          end
        ),
        reason_code:(
          if ($results | length) == 0 then "workspace-no-git-candidates"
          elif ($parent_manifest_refresh_required or ($child_manifest_refresh_required_count > 0)) then "generated-runtime-manifest-refresh-required"
          elif ([$results[] | select(.overall_status != "ready")] | length) == 0 then null
          else "all-repos-partial-or-action-required"
          end
        ),
        parent_workspace_pollution_count:$parent_workspace_pollution_count,
        runtime_hints:(
          (if $parent_workspace_pollution_count > 0 then
            ["- Workspace pollution detected: wrote .spec-first/workspace/parent-artifact-quarantine.json (\($parent_workspace_pollution_count) paths quarantined). Run `spec-first clean --workspace-orphans` for read-only inspection."]
          else [] end)
          + (if ($parent_manifest_refresh_required or ($child_manifest_refresh_required_count > 0)) then
            ["- Generated runtime manifest stale or missing in the parent workspace or one or more child repos. Run `spec-first init --all-repos -y` from the parent workspace."]
          else [] end)
        ),
        next_action:(
          if ($parent_manifest_refresh_required or ($child_manifest_refresh_required_count > 0)) then
            "Run spec-first init --all-repos -y from the parent workspace, then rerun verify."
          elif ([$results[] | select(.overall_status != "ready")] | length) == 0 then
            "All child repos verified required MCP/helper dependency readiness."
          else
            "Inspect per-child reason_code and rerun setup/verify for action-required repos."
          end
        )
      }')"
  rm -f "$summary_items"
  if [ -n "$quarantine_json" ] && ! printf '%s\n' "$quarantine_json" | write_workspace_summary_atomic "$workspace_root" "parent-artifact-quarantine.json"; then
    echo "verify-tools.sh: parent artifact quarantine write failed; continuing" >&2
  fi
  if ! printf '%s\n' "$summary_json" | write_workspace_summary_atomic "$workspace_root" "mcp-verify-summary.json"; then
    jq -n --arg workspace_root "$workspace_root" '{
      schema_version:"workspace-mcp-verify-summary.v1",
      overall_status:"action-required",
      workflow_mode:"blocked",
      reason_code:"workspace-summary-symlink-escape",
      workspace_root:$workspace_root,
      advisory:true,
      next_action:"Replace symlinked .spec-first/workspace with a real workspace-local directory and rerun verify."
    }'
    exit 1
  fi
  printf '%s\n' "$summary_json"
  if [ "$(jq -r '.overall_status' <<<"$summary_json")" != "ready" ]; then
    exit 1
  fi
  exit 0
}

DETECT_ARGS=()
if [ -n "$REPO_ARG" ] && [ "$ALL_REPOS" != "true" ]; then
  DETECT_ARGS+=(--repo "$REPO_ARG")
fi
if [ -n "$FOLDER_ARG" ] && [ "$ALL_REPOS" != "true" ]; then
  DETECT_ARGS+=(--folder "$FOLDER_ARG")
fi

if [ "$ALL_REPOS" = "true" ]; then
  set +e
  TARGET_JSON="$(bash "$SCRIPT_DIR/resolve-project-target.sh" --format json)"
  TARGET_STATUS=$?
  set -e
  [ -n "$TARGET_JSON" ] || { echo "verify-tools.sh: target resolver returned no JSON output" >&2; exit 1; }
  if [ "$TARGET_STATUS" -ne 0 ]; then
    :
  fi
  write_all_repos_verify_summary_and_exit "$TARGET_JSON" "explicit-all-repos"
fi

if [ -z "$REPO_ARG" ] && [ -z "$FOLDER_ARG" ]; then
  set +e
  DEFAULT_TARGET_JSON="$(bash "$SCRIPT_DIR/resolve-project-target.sh" --format json)"
  DEFAULT_TARGET_STATUS=$?
  set -e
  [ -n "$DEFAULT_TARGET_JSON" ] || { echo "verify-tools.sh: target resolver returned no JSON output" >&2; exit 1; }
  DEFAULT_TARGET_MODE="$(jq -r '.mode // empty' <<<"$DEFAULT_TARGET_JSON")"
  DEFAULT_TARGET_CANDIDATE_COUNT="$(jq -r '(.candidates // []) | length' <<<"$DEFAULT_TARGET_JSON")"
  if [ "$DEFAULT_TARGET_MODE" != "git-repo" ] && [ "$DEFAULT_TARGET_CANDIDATE_COUNT" -gt 0 ]; then
    if [ "$DEFAULT_TARGET_STATUS" -ne 0 ]; then
      :
    fi
    write_all_repos_verify_summary_and_exit "$DEFAULT_TARGET_JSON" "workspace-default-all-repos"
  fi
fi

FACTS_JSON="$(bash "$SCRIPT_DIR/detect-tools.sh" ${DETECT_ARGS[@]+"${DETECT_ARGS[@]}"})"

# U2: facts 给出 child repo root 后再做 reconciliation,
# 让 --repo <child> 在 parent workspace 下也能正确比对 runtime-capabilities.json。
RECONCILIATION_HOST="$(jq -r '.host // empty' <<<"$FACTS_JSON")"
RECONCILIATION_REPO_ROOT="$(jq -r '.selected_repo_root // .selected_folder_root // .target.target_root // .repo_root // empty' <<<"$FACTS_JSON")"
HOST_POINTER_RECONCILIATION="$(compute_host_pointer_reconciliation "$RECONCILIATION_HOST" "$RECONCILIATION_REPO_ROOT" "$MARKER_PATH")"
GENERATED_RUNTIME_MANIFEST="$(compute_generated_runtime_manifest_health "$RECONCILIATION_HOST" "$RECONCILIATION_REPO_ROOT")"
HELPER_JSON="$(
  SPEC_FIRST_PROVIDER_HOST="$RECONCILIATION_HOST" \
  SPEC_FIRST_PROVIDER_REPO_ROOT="$RECONCILIATION_REPO_ROOT" \
  bash "$SCRIPT_DIR/install-helpers.sh" --verify-only
)"

mkdir -p "$MARKER_DIR"
[ -w "$MARKER_DIR" ] || { echo "verify-tools.sh: 无法写入 ${MARKER_DIR}" >&2; exit 1; }

combined_tmp="$(mktemp "${MARKER_DIR}/readiness-ledger-combined.XXXXXX")"
final_tmp="$(mktemp "${MARKER_DIR}/readiness-ledger.XXXXXX")"
facts_scan_tmp="$(mktemp "${MARKER_DIR}/readiness-ledger-facts.XXXXXX")"
trap 'rm -f "$combined_tmp" "$final_tmp" "$facts_scan_tmp"' EXIT
chmod 600 "$combined_tmp" "$final_tmp"
printf '%s\n' "$FACTS_JSON" > "$facts_scan_tmp"
CONFIGURED_SCAN="$(bash "$SCRIPT_DIR/scan-configured-deps.sh" --repo-root "$RECONCILIATION_REPO_ROOT" --facts-file "$facts_scan_tmp" 2>/dev/null || jq -n '{configured_dependencies:[]}')"
MCP_PROVIDER_JSON="$(SPEC_FIRST_PROVIDER_HOST="$RECONCILIATION_HOST" node "$SCRIPT_DIR/provider-readiness-renderer.cjs" --source mcp --facts-file "$facts_scan_tmp" --repo-root "$RECONCILIATION_REPO_ROOT" 2>/dev/null || printf '[]')"

jq --arg completed_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg marker_path "$MARKER_PATH" \
  --argjson helper "$HELPER_JSON" \
  --argjson mcp_provider_readiness "$MCP_PROVIDER_JSON" \
  --argjson configured_scan "$CONFIGURED_SCAN" \
  --argjson host_pointer_reconciliation "$HOST_POINTER_RECONCILIATION" \
  --argjson generated_runtime_manifest "$GENERATED_RUNTIME_MANIFEST" \
  '
  def host_ready:
    ((.host_config_required == false) and (.host_config_status == "not-required"))
    or (.host_config_status == "ready")
    or (.host_config_status == "fallback-active")
    or (.host_config_status == "registry-args-drift");
  def tool_ready:
    ((if has("baseline_blocking") then .baseline_blocking else (.required // true) end) == false)
    or (
      (.dependency_status == "ready")
      and host_ready
      and ((.project_status == "ready") or (.project_status == "not-applicable") or (.project_status == "workspace-target-required"))
    );
  def baseline_blocking:
    if has("baseline_blocking") then .baseline_blocking else true end;
  def helper_ready:
    ((.result // "action-required") == "ready")
    or ((baseline_blocking == false) and (((.result // "") == "degraded") or ((.result // "") == "skipped")));
  def helper_action_required:
    (baseline_blocking == true)
    or (((.result // "") != "ready") and (((.result // "") != "degraded") and ((.result // "") != "skipped")));
  def parent_workspace_advisory($facts):
    ($facts.git_health // $facts.target.git_health // null) as $git_health
    | ($git_health.status // "") as $git_status
    | {
        git_health: $git_health,
        coverage_gap: ($facts.coverage_gap // $facts.target.coverage_gap // null),
        candidates_diagnostics: ($facts.candidates_diagnostics // $facts.target.candidates_diagnostics // []),
        repair_action_available: ($git_status == "broken-worktree"),
        repair_command: (if $git_status == "broken-worktree" then "spec-first repair-worktree --dry-run" else null end),
        diagnostic_action_available: ($git_status == "corrupted-gitdir"),
        diagnostic_command: (if $git_status == "corrupted-gitdir" then "git fsck" else null end)
      };

  . as $facts
  | ($helper.helper_tools // {}) as $helper_tools
  | ([($facts.tools // {})[] | tool_ready] | all) as $tools_ready
  | ([($helper_tools // {})[] | helper_ready] | all) as $helper_ready
  | ($tools_ready and $helper_ready) as $baseline_ready
  | {
      schema_version: "v2",
      host: $facts.host,
      platform: $facts.platform,
      repo_root: $facts.repo_root,
      repo_status: $facts.repo_status,
      target: ($facts.target // null),
      target_mode: ($facts.target_mode // ""),
      target_kind: ($facts.target_kind // ""),
      workspace_root: ($facts.workspace_root // null),
      selected_repo_root: ($facts.selected_repo_root // null),
      selected_folder_root: ($facts.selected_folder_root // null),
      target_root: ($facts.target.target_root // $facts.repo_root // null),
      parent_workspace_advisory: parent_workspace_advisory($facts),
      target_candidate_count: ($facts.target_candidate_count // 0),
      target_candidates: ($facts.target_candidates // []),
      reason_code: ($facts.reason_code // ""),
      host_ledger_pointer: {
        host: $facts.host,
        path: $marker_path,
        schema_version: "v2"
      },
      host_pointer_reconciliation: $host_pointer_reconciliation,
      generated_runtime_manifest: $generated_runtime_manifest,
      tool_facts_status: "pending",
      tool_facts_path: null,
      runtime_capabilities_status: "pending",
      runtime_capabilities_path: null,
      overall_status: (if $baseline_ready then "ready" else "action-required" end),
      baseline_ready: $baseline_ready,
      host_runtime_ready: $baseline_ready,
      completed_at: $completed_at,
      tools: $facts.tools,
      helper_tools: $helper_tools,
      provider_readiness: (
        (($facts.provider_readiness // []) + ($helper.provider_readiness // []) + ($mcp_provider_readiness // []))
        | unique_by(.provider)
      ),
      configured_dependencies: ($configured_scan.configured_dependencies // []),
      mirror_endpoints: ($helper.mirror_endpoints // null),
      recommended_environment_variables: ($helper.recommended_environment_variables // null),
      next_actions: (
        (($facts.next_actions // []) + [
          ($helper_tools // {})[] | select(helper_action_required) | .next_action // ""
        ] + [
          ($configured_scan.configured_dependencies // [])[] | select((.result // "") == "action-required") | "review configured dependency: \(.command)"
        ])
        | map(select(. != ""))
        | unique
      )
    }
  ' <<<"$FACTS_JSON" > "$combined_tmp"

SETUP_FACTS_RESULT="$(bash "$SCRIPT_DIR/write-setup-facts.sh" --facts-file "$combined_tmp")"

jq --argjson setup "$SETUP_FACTS_RESULT" \
  '.tool_facts_status = ($setup.tool_facts_status // "unknown")
   | .tool_facts_path = ($setup.tool_facts_path // null)
   | .runtime_capabilities_status = ($setup.runtime_capabilities_status // "unknown")
   | .runtime_capabilities_path = ($setup.runtime_capabilities_path // null)
   | ([.helper_tools[]? | select((if has("baseline_blocking") then .baseline_blocking else true end) == false and (((.result // "") == "degraded") or ((.result // "") == "skipped"))) | .next_action // ""]) as $nonblocking_helper_actions
   | .next_actions = (
       ((.next_actions // []) | map(. as $action | select(
         (($nonblocking_helper_actions | index($action)) == null)
       )))
       + (if ((.generated_runtime_manifest.status // "") != "current" and ((.generated_runtime_manifest.next_action // "") != "")) then
            [.generated_runtime_manifest.next_action]
          else
            []
          end)
       + (if ((.target.state_write_allowed // false) != true and ((.target.next_action // "") != "")) then
            [.target.next_action]
          elif .repo_status == "not-git-repo" and (.target_kind // "") != "non-git-folder" then
            ["choose a child repo and rerun with --repo <child>"]
          else
            []
          end)
       | map(select(. != ""))
       | unique
     )
   | ([.tool_facts_status, .runtime_capabilities_status]
      | any(. != "ready" and . != "written")) as $setup_action_required
   | (.generated_runtime_manifest.status // "unknown") as $manifest_status
   | (($manifest_status == "stale") or ($manifest_status == "missing")) as $runtime_manifest_action_required
   | .baseline_ready = ((.baseline_ready == true) and ($setup_action_required | not))
   | .host_runtime_ready = ((.baseline_ready == true) and ($runtime_manifest_action_required | not))
   | .overall_status = (if .baseline_ready == true and ($runtime_manifest_action_required | not) then "ready" else "action-required" end)
   | .reason_code = (
       if $runtime_manifest_action_required then "generated-runtime-manifest-refresh-required"
       else (.reason_code // "")
       end
     )' "$combined_tmp" > "$final_tmp"

mv "$final_tmp" "$MARKER_PATH"
write_setup_scenario_fingerprint

echo "📝 宿主就绪标记已更新: $MARKER_PATH"
echo "🔎 当前宿主基线状态: $(jq -r '.overall_status' "$MARKER_PATH")"
echo "🧭 baseline_ready: $(jq -r '.baseline_ready' "$MARKER_PATH")"
echo "🧩 代码上下文证据使用 bounded direct source reads、rg、ast-grep、git diff、tests/logs。"
echo "✅ readiness ledger v2 已写入"
echo ""
echo "Setup readiness status (grouped):"
render_status_block() {
  node "$SCRIPT_DIR/render-status-block.cjs"
}

jq -c '
  def display($value):
    if ($value == null or $value == "" or $value == "not-applicable") then "n/a"
    elif $value == "fallback-active" then "fallback"
    else ($value | tostring) end;
  def query($value):
    if $value == true then "ready" elif $value == false then "pending" else "n/a" end;
  def bootstrap($value):
    if $value == true then "required" elif $value == false then "done" else "n/a" end;
  def remark($key):
    if $key == "sequential-thinking" then "反思式推理辅助"
    elif $key == "context7" then "当前框架和库文档"
    elif $key == "agent-browser" then "浏览器自动化辅助"
    elif $key == "gh" then "GitHub issue 和 PR 操作"
    elif $key == "jq" then "JSON 解析与转换"
    elif $key == "vhs" then "终端演示录制"
    elif $key == "silicon" then "代码截图渲染"
    elif $key == "ffmpeg" then "媒体转换与视频合成"
    elif $key == "ast-grep" then "结构化代码搜索和重写"
    elif $key == "ast-grep-skill" then "ast-grep 使用指引"
    else "工具" end;
  def row13($id; $value; $kind):
    [
      display($id),
      display($kind),
      display($value.profile // "minimal"),
      display($value.required // true),
      display(if $value.baseline_blocking == null then true else $value.baseline_blocking end),
      display($value.dependency_status),
      display($value.configured_status // $value.host_config_status // $value.project_status),
      display($value.allowed // "not-applicable"),
      display($value.install_status // "not-applicable"),
      display($value.safety // "not-checked"),
      display($value.result // (if (($value.dependency_status // "") == "ready") then "ready" else "action-required" end)),
      display($value.reason_code // ""),
      display($value.next_action)
    ];
  def summary_rows:
    [
      [
        "Required MCP/helper dependencies",
        (if .baseline_ready == true then "ready" else "action-required" end),
        "baseline_ready=\((.baseline_ready // false) | tostring)",
        (if .baseline_ready == true then "" else "fix action-required rows" end)
      ],
      [
        "Generated runtime manifest",
        display(.generated_runtime_manifest.status // "unknown"),
        "state.manifestVersion=\((.generated_runtime_manifest.recorded_manifest_version // "missing") | tostring), bundled=\((.generated_runtime_manifest.bundled_manifest_version // "unknown") | tostring)",
        display(.generated_runtime_manifest.next_action)
      ]
    ];
  def mcp_rows:
    [(.tools // {} | to_entries[] | select((.value.type // "") == "mcp") | row13(.key; .value; "mcp"))];
  def helper_rows:
    [(.helper_tools // {} | to_entries[] | row13(.key; .value; (.value.kind // .value.type // "helper")))];
  def provider_rows:
    [(.provider_readiness // [])[] |
      [
        display(.provider),
        display(.kind),
        display(.profile),
        display(.readiness_status),
        display(.lifecycle.installed),
        display(.lifecycle.configured),
        display(.lifecycle.indexed),
        display(.lifecycle.server_reachable),
        display(.lifecycle.query_verified),
        display(.repo_aligned),
        display(.fallback.reason_code),
        display((.next_actions // []) | join("; "))
      ]];
  def configured_dependency_rows:
    [(.configured_dependencies // [])[] |
      [
        display(.id),
        display(.kind),
        display(.source_path),
        display(.command),
        display(.args_shape),
        display(.declared_tool_id),
        display(.declared_status),
        display(.dependency_status),
        display(.configured_status),
        display(.result),
        display(.reason_code)
      ]];
  def install_safety_rows:
    [(.helper_tools // {} | to_entries[] |
      [
        display(.key),
        display(.value.safety // "not-checked"),
        display(.value.install_source // ""),
        display(.value.mirror_used // false),
        display(.value.next_action)
      ])];
  def project_rows:
    [
      {
        name: "tool-facts.json",
        status: .tool_facts_status,
        next: (if (.tool_facts_status == "ready" or .tool_facts_status == "written") then "" elif ((.target.next_action // "") != "") then .target.next_action else "write setup facts" end)
      },
      {
        name: "runtime-capabilities.json",
        status: .runtime_capabilities_status,
        next: (if (.runtime_capabilities_status == "ready" or .runtime_capabilities_status == "written") then "" elif ((.target.next_action // "") != "") then .target.next_action else "write runtime capabilities" end)
      }
    ]
    | map([display(.name), display(.status), display(.next)]);
  {
    sections: [
      {title: "Execution result", headers: ["Area", "Status", "Evidence", "Next"], rows: summary_rows},
      {title: "MCP servers", headers: ["id", "kind", "profile", "required", "baseline_blocking", "dependency", "configured", "allowed", "install", "safety", "result", "reason_code", "next_action"], rows: mcp_rows},
      {title: "Helper tools", headers: ["id", "kind", "profile", "required", "baseline_blocking", "dependency", "configured", "allowed", "install", "safety", "result", "reason_code", "next_action"], rows: helper_rows},
      {title: "Provider tools", headers: ["provider", "kind", "profile", "readiness", "installed", "configured", "indexed", "server_reachable", "query_verified", "repo_aligned", "fallback_reason", "next_actions"], rows: provider_rows},
      {title: "Host configured dependencies", headers: ["id", "kind", "source_path", "command", "args_shape", "declared_tool_id", "declared_status", "dependency", "configured", "result", "reason_code"], rows: configured_dependency_rows},
      {title: "Install safety", headers: ["id", "safety", "install_source", "mirror_used", "next_action"], rows: install_safety_rows},
      {title: "Project setup facts", headers: ["Artifact", "Project", "Next"], rows: project_rows},
      {title: "Verification profile", headers: ["Artifact", "Status", "Next"], rows: [["spec-first.verification.json", (if (.target_root // .repo_root) as $root | ($root + "/spec-first.verification.json") then "not-checked" else "not-checked" end), "v1.13 scope"]]},
      {title: "Next steps", headers: ["#", "Action"], rows: [(.next_actions // []) | to_entries[] | [((.key + 1) | tostring), display(.value)]]}
    ]
  }
' "$MARKER_PATH" | render_status_block

host_name="$(jq -r '.host // "unknown"' "$MARKER_PATH")"
baseline_ready="$(jq -r '.baseline_ready // false' "$MARKER_PATH")"
case "$host_name" in
  claude)
    host_display="Claude Code"
    setup_command="/spec:mcp-setup"
    ;;
  codex)
    host_display="Codex"
    setup_command='$spec-mcp-setup'
    ;;
  kiro)
    host_display="Kiro"
    setup_command='Kiro Agent Skill spec-mcp-setup'
    ;;
  qoder)
    host_display="Qoder"
    setup_command='Qoder project command /spec:mcp-setup or Skill spec-mcp-setup'
    ;;
  *)
    host_display="Claude Code / Codex"
    setup_command='/spec:mcp-setup or $spec-mcp-setup'
    ;;
esac

echo ""
echo "下一步:"
if [ "$baseline_ready" = "true" ]; then
  target_state_write_allowed="$(jq -r 'if (.target | type == "object") then (.target.state_write_allowed | tostring) else "true" end' "$MARKER_PATH")"
  target_next_action="$(jq -r '.target.next_action // empty' "$MARKER_PATH")"
  manifest_status="$(jq -r '.generated_runtime_manifest.status // "unknown"' "$MARKER_PATH")"
  manifest_next_action="$(jq -r '.generated_runtime_manifest.next_action // empty' "$MARKER_PATH")"
  if [ "$target_state_write_allowed" != "true" ]; then
    echo "  1. 选择目标 child repo，并用 --repo 重新运行 ${setup_command}。"
    if [ -n "$target_next_action" ]; then
      echo "     $target_next_action"
    fi
  elif [ "$manifest_status" != "current" ] && [ -n "$manifest_next_action" ]; then
    echo "  1. Required MCP/helper dependencies 已就绪；generated runtime manifest 为 ${manifest_status}。"
    echo "  2. 运行 ${manifest_next_action} 刷新 runtime，然后重新运行 ${setup_command}。"
  else
    echo "  1. Required MCP/helper dependencies 与 generated runtime manifest 均已就绪；如果已经有明确任务，可以直接描述目标，或选择匹配的 plan/work/review/debug workflow。"
    echo "  2. 重启 ${host_display} 或新开会话只在下游 workflow 依赖新写入的 MCP 配置前需要。"
  fi
else
  echo "  1. 先处理表格中的 action-required 行，然后重新运行 ${setup_command}。"
  echo "  2. 全部 ready 后重启 ${host_display} 或新开会话，让新写入的 MCP 配置被宿主加载。"
fi
