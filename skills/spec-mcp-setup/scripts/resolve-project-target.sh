#!/bin/bash
# resolve-project-target.sh - Resolve the repo target for project-local spec-first state.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib-git-health.sh"

REPO_ARG=""
FOLDER_ARG=""
OUTPUT_FORMAT="json"
SCAN_DEPTH=3

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_ARG="${2:-}"
      [ -n "$REPO_ARG" ] || { echo "resolve-project-target.sh: --repo requires a value" >&2; exit 1; }
      shift 2
      ;;
    --folder)
      FOLDER_ARG="${2:-}"
      [ -n "$FOLDER_ARG" ] || { echo "resolve-project-target.sh: --folder requires a value" >&2; exit 1; }
      shift 2
      ;;
    --format)
      OUTPUT_FORMAT="${2:-}"
      [ "$OUTPUT_FORMAT" = "json" ] || [ "$OUTPUT_FORMAT" = "env" ] || {
        echo "resolve-project-target.sh: --format must be json or env" >&2
        exit 1
      }
      shift 2
      ;;
    --scan-depth)
      SCAN_DEPTH="${2:-}"
      [[ "$SCAN_DEPTH" =~ ^[0-9]+$ ]] || { echo "resolve-project-target.sh: --scan-depth must be an integer" >&2; exit 1; }
      shift 2
      ;;
    *)
      echo "resolve-project-target.sh: unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ -n "$REPO_ARG" ] && [ -n "$FOLDER_ARG" ]; then
  echo "resolve-project-target.sh: use either --repo or --folder, not both" >&2
  exit 1
fi

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  printf '%s' "$value"
}

env_quote() {
  # Wrap value in single quotes for safe `eval`. Most caller-supplied values come from
  # controlled sources (resolver-derived enums, fixed strings) without literal single quotes,
  # so the bash-builtin fast path avoids per-call `sed` forks. The slow path activates only
  # when the input actually contains a `'`, e.g. a repo path or git config value with an
  # apostrophe — there we need a real escape so install-mcp.sh `eval "$TARGET_ENV"` stays safe.
  case "$1" in
    *\'*)
      printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"
      ;;
    *)
      printf "'%s'" "$1"
      ;;
  esac
}

canonicalize_existing_path() {
  local path="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$path"
  elif command -v readlink >/dev/null 2>&1 && readlink -f "$path" >/dev/null 2>&1; then
    readlink -f "$path"
  else
    python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$path"
  fi
}

absolutize_maybe_missing() {
  local path="$1"
  case "$path" in
    /*) printf '%s\n' "$path" ;;
    *) printf '%s/%s\n' "$INVOCATION_CWD" "$path" ;;
  esac
}

path_is_within() {
  local child="$1"
  local parent="$2"
  [ "$child" = "$parent" ] && return 0
  case "$child" in
    "$parent"/*) return 0 ;;
    *) return 1 ;;
  esac
}

IGNORE_DIR_NAMES=(.git node_modules vendor .claude .codex .kiro .agents .spec-first build .cache .direnv .venv)

is_ignored_dir_name() {
  local name="$1"
  local ignored
  for ignored in "${IGNORE_DIR_NAMES[@]}"; do
    [ "$name" = "$ignored" ] && return 0
  done
  return 1
}

relative_to_workspace() {
  local path="$1"
  local root="$2"
  if [ "$path" = "$root" ]; then
    printf '.\n'
  elif path_is_within "$path" "$root"; then
    printf '%s\n' "${path#"$root"/}"
  else
    printf '%s\n' "$path"
  fi
}

INVOCATION_CWD="$(pwd -P)"
detect_git_health "$INVOCATION_CWD"
ROOT_GIT_HEALTH_STATUS="$GIT_HEALTH_STATUS"
ROOT_GIT_HEALTH_REASON_CODE="$GIT_HEALTH_REASON_CODE"
ROOT_GIT_HEALTH_GIT_ENTRY_TYPE="$GIT_HEALTH_GIT_ENTRY_TYPE"
ROOT_GIT_HEALTH_WORKTREE_POINTER_RAW="$GIT_HEALTH_WORKTREE_POINTER_RAW"
ROOT_GIT_HEALTH_WORKTREE_POINTER_PATH="$GIT_HEALTH_WORKTREE_POINTER_PATH"
ROOT_GIT_HEALTH_WORKTREE_POINTER_EXISTS="$GIT_HEALTH_WORKTREE_POINTER_EXISTS"

CWD_GIT_ROOT=""
if [ "$ROOT_GIT_HEALTH_STATUS" = "ok" ]; then
  CWD_GIT_ROOT="$(git -C "$INVOCATION_CWD" rev-parse --show-toplevel 2>/dev/null || true)"
fi
if [ -n "$CWD_GIT_ROOT" ]; then
  CWD_GIT_ROOT="$(canonicalize_existing_path "$CWD_GIT_ROOT")"
fi

mode=""
repo_status="not-git-repo"
target_kind=""
selection_source=""
state_write_allowed="false"
workspace_root="$INVOCATION_CWD"
selected_repo_root=""
selected_folder_root=""
target_root=""
repo_label=""
folder_label=""
reason_code=""
next_action=""
exit_code=0
candidate_roots=()
candidate_labels=()
diagnostic_paths=()
diagnostic_statuses=()
diagnostic_reason_codes=()
diagnostic_git_entry_types=()
diagnostic_pointer_raws=()
diagnostic_pointer_paths=()
diagnostic_pointer_exists=()
coverage_gap_json=""

add_candidate() {
  local root="$1"
  local existing
  for existing in ${candidate_roots[@]+"${candidate_roots[@]}"}; do
    [ "$root" = "$existing" ] && return 0
    if path_is_within "$root" "$existing"; then
      return 0
    fi
  done
  candidate_roots+=("$root")
}

discover_candidates() {
  local root="$1"
  local queue=()
  local current depth child name git_root canonical_root diagnostic_path

  queue+=("0|$root")
  while [ "${#queue[@]}" -gt 0 ]; do
    current="${queue[0]}"
    queue=("${queue[@]:1}")
    depth="${current%%|*}"
    current="${current#*|}"

    while IFS= read -r child; do
      [ -n "$child" ] || continue
      name="$(basename "$child")"
      is_ignored_dir_name "$name" && continue

      if [ -e "$child/.git" ]; then
        git_root="$(git -C "$child" rev-parse --show-toplevel 2>/dev/null || true)"
        if [ -z "$git_root" ]; then
          detect_git_health "$child"
          if [ "$GIT_HEALTH_STATUS" != "not-git" ]; then
            diagnostic_path="$(canonicalize_existing_path "$child")"
            diagnostic_paths+=("$diagnostic_path")
            diagnostic_statuses+=("$GIT_HEALTH_STATUS")
            diagnostic_reason_codes+=("$GIT_HEALTH_REASON_CODE")
            diagnostic_git_entry_types+=("$GIT_HEALTH_GIT_ENTRY_TYPE")
            diagnostic_pointer_raws+=("$GIT_HEALTH_WORKTREE_POINTER_RAW")
            diagnostic_pointer_paths+=("$GIT_HEALTH_WORKTREE_POINTER_PATH")
            diagnostic_pointer_exists+=("$GIT_HEALTH_WORKTREE_POINTER_EXISTS")
          fi
          continue
        fi
        canonical_root="$(canonicalize_existing_path "$git_root")"
        path_is_within "$canonical_root" "$root" || continue
        add_candidate "$canonical_root"
        continue
      fi

      if [ "$depth" -lt "$SCAN_DEPTH" ]; then
        queue+=("$((depth + 1))|$child")
      fi
    done < <(find -P "$current" -mindepth 1 -maxdepth 1 -type d -print 2>/dev/null | sort)
  done

  local sorted candidate
  sorted="$(printf '%s\n' ${candidate_roots[@]+"${candidate_roots[@]}"} | sed '/^$/d' | sort)"
  candidate_roots=()
  while IFS= read -r candidate; do
    [ -n "$candidate" ] || continue
    candidate_roots+=("$candidate")
  done <<<"$sorted"
}

emit_git_health_json() {
  local status="$1"
  local reason_code="$2"
  local git_entry_type="$3"
  local pointer_raw="$4"
  local pointer_path="$5"
  local pointer_exists="$6"

  printf '{"status":"%s","reason_code":"%s","git_entry_type":"%s"' \
    "$(json_escape "$status")" \
    "$(json_escape "$reason_code")" \
    "$(json_escape "$git_entry_type")"
  if [ -n "$pointer_raw" ] || [ -n "$pointer_path" ] || [ -n "$pointer_exists" ]; then
    printf ',"worktree_pointer":{'
    printf '"raw":"%s",' "$(json_escape "$pointer_raw")"
    if [ -n "$pointer_path" ]; then
      printf '"path":"%s",' "$(json_escape "$pointer_path")"
    else
      printf '"path":null,'
    fi
    if [ -n "$pointer_exists" ]; then
      printf '"exists":%s' "$pointer_exists"
    else
      printf '"exists":null'
    fi
    printf '}'
  fi
  printf '}'
}

compute_coverage_gap() {
  local root="$1"
  local uncovered=()
  local child name canonical_child candidate skip sample_json ignored_json first item i

  while IFS= read -r child; do
    [ -n "$child" ] || continue
    name="$(basename "$child")"
    is_ignored_dir_name "$name" && continue
    [ -e "$child/.git" ] && continue
    canonical_child="$(canonicalize_existing_path "$child")"
    skip="false"
    for candidate in ${candidate_roots[@]+"${candidate_roots[@]}"}; do
      if [ "$canonical_child" = "$candidate" ] || path_is_within "$candidate" "$canonical_child"; then
        skip="true"
        break
      fi
    done
    [ "$skip" = "true" ] && continue
    uncovered+=("$(relative_to_workspace "$canonical_child" "$root")")
  done < <(find -P "$root" -mindepth 1 -maxdepth 1 -type d -print 2>/dev/null | sort)

  sample_json="["
  first="true"
  for i in "${!uncovered[@]}"; do
    [ "$i" -lt 7 ] || break
    [ "$first" = "true" ] || sample_json+=","
    first="false"
    sample_json+="\"$(json_escape "${uncovered[$i]}")\""
  done
  sample_json+="]"

  ignored_json="["
  first="true"
  for item in "${IGNORE_DIR_NAMES[@]}"; do
    [ "$first" = "true" ] || ignored_json+=","
    first="false"
    ignored_json+="\"$(json_escape "$item")\""
  done
  ignored_json+="]"

  coverage_gap_json="$(printf '{"uncovered_top_level_dirs":%s,"sample":%s,"ignored_dir_patterns":%s,"advisory":"%s"}' \
    "${#uncovered[@]}" \
    "$sample_json" \
    "$ignored_json" \
    "$(json_escape "Some top-level folders are not independent Git repos and are not covered by --all-repos. Use --folder <path> explicitly for non-git folder indexing.")")"
}

if [ -n "$FOLDER_ARG" ]; then
  raw_target="$(absolutize_maybe_missing "$FOLDER_ARG")"
  if [ ! -e "$raw_target" ]; then
    mode="invalid-target"
    target_kind="invalid"
    reason_code="folder-target-not-found"
    next_action="Choose an existing non-git folder and rerun with --folder <path>."
    exit_code=1
  elif [ ! -d "$raw_target" ]; then
    mode="invalid-target"
    target_kind="invalid"
    reason_code="folder-target-not-directory"
    next_action="Choose an existing non-git folder and rerun with --folder <path>."
    exit_code=1
  else
    canonical_target="$(canonicalize_existing_path "$raw_target")"
    if [ -n "$CWD_GIT_ROOT" ]; then
      workspace_root="$CWD_GIT_ROOT"
    else
      workspace_root="$INVOCATION_CWD"
    fi

    if ! path_is_within "$canonical_target" "$workspace_root"; then
      mode="invalid-target"
      target_kind="invalid"
      reason_code="folder-target-outside-workspace"
      next_action="Choose a folder inside the current workspace."
      exit_code=1
    else
      target_git_root="$(git -C "$canonical_target" rev-parse --show-toplevel 2>/dev/null || true)"
      if [ -n "$target_git_root" ]; then
        mode="invalid-target"
        target_kind="invalid"
        reason_code="folder-target-is-git-repo"
        next_action="Use --repo for Git repositories, or choose a folder outside any Git repo."
        exit_code=1
      else
        mode="non-git-folder"
        repo_status="not-git-repo"
        target_kind="non-git-folder"
        selection_source="explicit-folder"
        state_write_allowed="true"
        selected_folder_root="$canonical_target"
        target_root="$canonical_target"
        folder_label="$(relative_to_workspace "$selected_folder_root" "$workspace_root")"
        repo_label="$folder_label"
      fi
    fi
  fi
elif [ -n "$REPO_ARG" ]; then
  raw_target="$(absolutize_maybe_missing "$REPO_ARG")"
  if [ ! -e "$raw_target" ]; then
    mode="invalid-target"
    target_kind="invalid"
    reason_code="repo-target-not-found"
    next_action="Choose an existing child Git repo and rerun with --repo <path>."
    exit_code=1
  else
    canonical_target="$(canonicalize_existing_path "$raw_target")"
    if [ -n "$CWD_GIT_ROOT" ]; then
      workspace_root="$CWD_GIT_ROOT"
    else
      workspace_root="$INVOCATION_CWD"
    fi

    if ! path_is_within "$canonical_target" "$workspace_root"; then
      mode="invalid-target"
      target_kind="invalid"
      reason_code="repo-target-outside-workspace"
      next_action="Choose a child Git repo inside the current workspace."
      exit_code=1
    else
      target_git_root="$(git -C "$canonical_target" rev-parse --show-toplevel 2>/dev/null || true)"
      if [ -z "$target_git_root" ]; then
        mode="invalid-target"
        target_kind="invalid"
        reason_code="repo-target-not-git"
        next_action="Choose a path inside a child Git repo and rerun with --repo <path>."
        exit_code=1
      else
        selected_repo_root="$(canonicalize_existing_path "$target_git_root")"
        if ! path_is_within "$selected_repo_root" "$workspace_root"; then
          mode="invalid-target"
          target_kind="invalid"
          reason_code="repo-target-outside-workspace"
          next_action="Choose a child Git repo inside the current workspace."
          exit_code=1
        elif [ -n "$CWD_GIT_ROOT" ] && [ "$selected_repo_root" != "$CWD_GIT_ROOT" ]; then
          mode="invalid-target"
          target_kind="invalid"
          reason_code="repo-target-outside-workspace"
          next_action="Run from the target repo or invoke from its parent workspace."
          exit_code=1
        else
          mode="git-repo"
          repo_status="git-repo"
          target_kind="git-repo"
          selection_source="explicit-repo"
          state_write_allowed="true"
          target_root="$selected_repo_root"
          repo_label="$(relative_to_workspace "$selected_repo_root" "$workspace_root")"
        fi
      fi
    fi
  fi
elif [ -n "$CWD_GIT_ROOT" ]; then
  mode="git-repo"
  repo_status="git-repo"
  target_kind="git-repo"
  selection_source="cwd-git-root"
  state_write_allowed="true"
  workspace_root="$CWD_GIT_ROOT"
  selected_repo_root="$CWD_GIT_ROOT"
  target_root="$CWD_GIT_ROOT"
  repo_label="$(basename "$CWD_GIT_ROOT")"
else
  target_kind="workspace"
  discover_candidates "$workspace_root"
  compute_coverage_gap "$workspace_root"
  if [ "${#candidate_roots[@]}" -eq 0 ]; then
    mode="workspace-no-git-candidates"
    reason_code="workspace-no-git-candidates"
    case "$ROOT_GIT_HEALTH_STATUS" in
      broken-worktree)
        next_action="Run spec-first repair-worktree --dry-run, or pass --folder . for explicit non-git folder indexing."
        ;;
      corrupted-gitdir)
        next_action="Run git fsck or inspect the .git directory, then rerun setup."
        ;;
      *)
        next_action="Run from a Git repo or pass --repo <child> after creating one."
        ;;
    esac
  elif [ "${#candidate_roots[@]}" -eq 1 ]; then
    mode="workspace-single-candidate"
    reason_code="workspace-target-required"
    candidate_labels+=("$(relative_to_workspace "${candidate_roots[0]}" "$workspace_root")")
    case "$ROOT_GIT_HEALTH_STATUS" in
      broken-worktree)
        next_action="Run spec-first repair-worktree --dry-run, or rerun with --repo ${candidate_labels[0]}."
        ;;
      corrupted-gitdir)
        next_action="Run git fsck or inspect the .git directory, then rerun with --repo ${candidate_labels[0]}."
        ;;
      *)
        next_action="Rerun with --repo ${candidate_labels[0]}."
        ;;
    esac
  else
    mode="workspace-multi-repo"
    reason_code="workspace-target-required"
    for candidate in "${candidate_roots[@]}"; do
      candidate_labels+=("$(relative_to_workspace "$candidate" "$workspace_root")")
    done
    case "$ROOT_GIT_HEALTH_STATUS" in
      broken-worktree)
        next_action="Run spec-first repair-worktree --dry-run, choose a child Git repo with --repo <child>, or pass --folder . for explicit non-git folder indexing."
        ;;
      corrupted-gitdir)
        next_action="Run git fsck or inspect the .git directory, then choose a child Git repo with --repo <child>."
        ;;
      *)
        next_action="Choose a child Git repo and rerun with --repo <child>."
        ;;
    esac
  fi
fi

emit_json() {
  local candidates_json="[]"
  local diagnostics_json="[]"
  local git_health_json
  local i item first="true"
  candidates_json="["
  for i in "${!candidate_roots[@]}"; do
    [ "$first" = "true" ] || candidates_json+=","
    first="false"
    item="$(printf '{"repo_label":"%s","git_root":"%s","workspace_relative_path":"%s","relationship":"child_git_repo"}' \
      "$(json_escape "${candidate_labels[$i]:-$(relative_to_workspace "${candidate_roots[$i]}" "$workspace_root")}")" \
      "$(json_escape "${candidate_roots[$i]}")" \
      "$(json_escape "$(relative_to_workspace "${candidate_roots[$i]}" "$workspace_root")")")"
    candidates_json+="$item"
  done
  candidates_json+="]"

  diagnostics_json="["
  first="true"
  for i in "${!diagnostic_paths[@]}"; do
    [ "$first" = "true" ] || diagnostics_json+=","
    first="false"
    item="$(printf '{"workspace_relative_path":"%s","path":"%s","git_health":%s}' \
      "$(json_escape "$(relative_to_workspace "${diagnostic_paths[$i]}" "$workspace_root")")" \
      "$(json_escape "${diagnostic_paths[$i]}")" \
      "$(emit_git_health_json "${diagnostic_statuses[$i]}" "${diagnostic_reason_codes[$i]}" "${diagnostic_git_entry_types[$i]}" "${diagnostic_pointer_raws[$i]}" "${diagnostic_pointer_paths[$i]}" "${diagnostic_pointer_exists[$i]}")")"
    diagnostics_json+="$item"
  done
  diagnostics_json+="]"

  git_health_json="$(emit_git_health_json "$ROOT_GIT_HEALTH_STATUS" "$ROOT_GIT_HEALTH_REASON_CODE" "$ROOT_GIT_HEALTH_GIT_ENTRY_TYPE" "$ROOT_GIT_HEALTH_WORKTREE_POINTER_RAW" "$ROOT_GIT_HEALTH_WORKTREE_POINTER_PATH" "$ROOT_GIT_HEALTH_WORKTREE_POINTER_EXISTS")"

  printf '{'
  printf '"schema_version":"project-target.v2",'
  printf '"mode":"%s",' "$(json_escape "$mode")"
  printf '"repo_status":"%s",' "$(json_escape "$repo_status")"
  printf '"target_kind":"%s",' "$(json_escape "$target_kind")"
  printf '"selection_source":"%s",' "$(json_escape "$selection_source")"
  printf '"state_write_allowed":%s,' "$state_write_allowed"
  printf '"invocation_cwd":"%s",' "$(json_escape "$INVOCATION_CWD")"
  printf '"workspace_root":"%s",' "$(json_escape "$workspace_root")"
  if [ -n "$selected_repo_root" ]; then
    printf '"selected_repo_root":"%s",' "$(json_escape "$selected_repo_root")"
  else
    printf '"selected_repo_root":null,'
  fi
  if [ -n "$selected_folder_root" ]; then
    printf '"selected_folder_root":"%s",' "$(json_escape "$selected_folder_root")"
  else
    printf '"selected_folder_root":null,'
  fi
  if [ -n "$target_root" ]; then
    printf '"target_root":"%s",' "$(json_escape "$target_root")"
  else
    printf '"target_root":null,'
  fi
  printf '"repo_label":"%s",' "$(json_escape "$repo_label")"
  printf '"folder_label":"%s",' "$(json_escape "$folder_label")"
  printf '"candidates":%s,' "$candidates_json"
  printf '"git_health":%s,' "$git_health_json"
  if [ -n "$coverage_gap_json" ]; then
    printf '"coverage_gap":%s,' "$coverage_gap_json"
  fi
  if [ "${#diagnostic_paths[@]}" -gt 0 ]; then
    printf '"candidates_diagnostics":%s,' "$diagnostics_json"
  fi
  printf '"reason_code":"%s",' "$(json_escape "$reason_code")"
  printf '"next_action":"%s"' "$(json_escape "$next_action")"
  printf '}\n'
}

emit_env() {
  printf 'schema_version=%s\n' "$(env_quote "project-target.v2")"
  printf 'mode=%s\n' "$(env_quote "$mode")"
  printf 'repo_status=%s\n' "$(env_quote "$repo_status")"
  printf 'target_kind=%s\n' "$(env_quote "$target_kind")"
  printf 'selection_source=%s\n' "$(env_quote "$selection_source")"
  printf 'state_write_allowed=%s\n' "$(env_quote "$state_write_allowed")"
  printf 'invocation_cwd=%s\n' "$(env_quote "$INVOCATION_CWD")"
  printf 'workspace_root=%s\n' "$(env_quote "$workspace_root")"
  printf 'selected_repo_root=%s\n' "$(env_quote "$selected_repo_root")"
  printf 'selected_folder_root=%s\n' "$(env_quote "$selected_folder_root")"
  printf 'target_root=%s\n' "$(env_quote "$target_root")"
  printf 'repo_label=%s\n' "$(env_quote "$repo_label")"
  printf 'folder_label=%s\n' "$(env_quote "$folder_label")"
  printf 'reason_code=%s\n' "$(env_quote "$reason_code")"
  printf 'next_action=%s\n' "$(env_quote "$next_action")"
}

if [ "$OUTPUT_FORMAT" = "env" ]; then
  emit_env
else
  emit_json
fi

exit "$exit_code"
