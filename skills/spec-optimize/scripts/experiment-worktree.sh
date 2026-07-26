#!/bin/bash

# Experiment Worktree Manager
# Creates, cleans up, and manages worktrees for optimization experiments.
# Each experiment gets an isolated worktree with copied shared resources.
#
# Usage:
#   experiment-worktree.sh create [--copy-env] <spec_name> <exp_index> <base_branch> [shared_file ...]
#   experiment-worktree.sh cleanup <spec_name> <exp_index>
#   experiment-worktree.sh cleanup-all <spec_name>
#   experiment-worktree.sh count
#
# Worktrees are created at: .worktrees/optimize-<spec>-exp-<NNN>/
# Branches are named: optimize-exp/<spec>/exp-<NNN>

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo -e "${RED}Error: Not in a git repository${NC}" >&2
  exit 1
}

WORKTREE_DIR="$GIT_ROOT/.worktrees"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
SOURCE_SECRET_DENY_HELPER="$SCRIPT_DIR/../../../src/cli/helpers/secret-deny-patterns.js"
SPEC_FIRST_CLI="${SPEC_FIRST_CLI:-spec-first}"

experiment_branch_name() {
  local spec_name="${1:?Error: spec_name required}"
  local padded_index="${2:?Error: padded_index required}"

  # Keep experiment refs outside optimize/<spec> so they do not collide
  # with the long-lived optimization branch namespace.
  echo "optimize-exp/${spec_name}/exp-${padded_index}"
}

ensure_worktree_exclude() {
  local exclude_file
  exclude_file=$(git rev-parse --git-path info/exclude)

  mkdir -p "$(dirname "$exclude_file")"

  if ! grep -q "^\.worktrees$" "$exclude_file" 2>/dev/null; then
    echo ".worktrees" >> "$exclude_file"
  fi
}

is_registered_worktree() {
  local worktree_path="${1:?Error: worktree_path required}"

  # awk splits on whitespace, so `$2` truncates any worktree path containing a space and the
  # lookup silently never matches. Take the rest of the line instead, like worktree-manager.sh.
  git worktree list --porcelain | awk -v target="$worktree_path" '
    /^worktree / && substr($0, 10) == target { found = 1 }
    END { exit(found ? 0 : 1) }
  '
}

is_branch_checked_out() {
  local branch_name="${1:?Error: branch_name required}"
  local branch_ref="refs/heads/$branch_name"

  git worktree list --porcelain | awk -v target="$branch_ref" '
    $1 == "branch" && $2 == target { found = 1 }
    END { exit(found ? 0 : 1) }
  '
}

reset_worktree_to_base() {
  local worktree_path="${1:?Error: worktree_path required}"
  local branch_name="${2:?Error: branch_name required}"
  local base_branch="${3:?Error: base_branch required}"
  local current_branch

  current_branch=$(git -C "$worktree_path" symbolic-ref --quiet --short HEAD 2>/dev/null || true)
  if [[ "$current_branch" != "$branch_name" ]]; then
    echo -e "${RED}Error: Existing worktree is on unexpected branch: ${current_branch:-detached} (expected $branch_name)${NC}" >&2
    echo -e "${RED}Clean up the stale worktree before rerunning this experiment.${NC}" >&2
    return 1
  fi

  echo -e "${YELLOW}Resetting existing experiment worktree to base: $branch_name -> $base_branch${NC}" >&2
  git -C "$worktree_path" reset --hard "$base_branch" >/dev/null
  git -C "$worktree_path" clean -fdx >/dev/null
}

realpath_existing() {
  local path="${1:?Error: path required}"
  node -e 'const fs = require("fs"); console.log(fs.realpathSync(process.argv[1]));' "$path"
}

realpath_for_new_path() {
  local path="${1:?Error: path required}"
  node -e 'const fs = require("fs"); const path = require("path"); const target = process.argv[1]; const dir = fs.realpathSync(path.dirname(target)); console.log(path.join(dir, path.basename(target)));' "$path"
}

path_within() {
  local path="${1:?Error: path required}"
  local root="${2:?Error: root required}"
  [[ "$path" == "$root" || "$path" == "$root"/* ]]
}

validate_safe_spec_name() {
  local spec_name="${1:?Error: spec_name required}"
  if [[ ! "$spec_name" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ || "$spec_name" == *..* ]]; then
    echo -e "${RED}Error: unsafe spec_name. Use only letters, numbers, dot, underscore, and dash; path traversal is not allowed.${NC}" >&2
    return 1
  fi
}

# `printf %03d` reads a leading-zero argument as octal: `010` formats as 008 and `008` aborts as
# an invalid number. Displayed indices are zero-padded, so copying one back in is the normal case.
normalize_experiment_index() {
  local value="${1:?Error: exp_index required}"
  # 命名契约固定为三位 exp-000..exp-999。先限制字符数，再做 10 进制转换，避免 Bash
  # 对超大整数算术溢出后回绕并把 cleanup 重定向到另一个合法 worktree。
  if [[ ! "$value" =~ ^[0-9]{1,3}$ ]]; then
    echo -e "${RED}Error: exp_index must be an integer from 0 to 999: ${value}${NC}" >&2
    return 1
  fi
  printf '%03d\n' "$((10#$value))"
}

assert_cleanup_target_within_worktrees() {
  local worktree_path="${1:?Error: worktree_path required}"
  local git_root_real worktree_dir_real worktree_real

  git_root_real=$(realpath_existing "$GIT_ROOT")
  worktree_dir_real=$(realpath_existing "$WORKTREE_DIR")
  if ! path_within "$worktree_dir_real" "$git_root_real"; then
    echo -e "${RED}Error: .worktrees escapes the git root; refusing cleanup.${NC}" >&2
    return 1
  fi

  worktree_real=$(realpath_existing "$worktree_path")
  if ! path_within "$worktree_real" "$worktree_dir_real"; then
    echo -e "${RED}Error: cleanup target escapes .worktrees; refusing cleanup: $worktree_path${NC}" >&2
    return 1
  fi
}

run_secret_deny_helper() {
  local mode="${1:?Error: mode required}"
  local target_path="${2:?Error: path required}"
  if [[ -f "$SOURCE_SECRET_DENY_HELPER" ]]; then
    node "$SOURCE_SECRET_DENY_HELPER" "$mode" "$target_path"
    return $?
  fi
  "$SPEC_FIRST_CLI" internal secret-deny "$mode" "$target_path"
}

is_exact_repo_relative_path() {
  run_secret_deny_helper is-exact-repo-relative "${1:-}"
}

is_secret_denied_path() {
  local status
  set +e
  run_secret_deny_helper is-denied "${1:-}"
  status=$?
  set -e
  case "$status" in
    0) return 0 ;;
    1) return 1 ;;
    *)
      echo -e "${RED}Error: secret deny helper failed for path: ${1:-<empty>}${NC}" >&2
      return 0
      ;;
  esac
}

reject_secret_denied_tree() {
  local source_real="${1:?Error: source_real required}"
  local root_real="${2:?Error: root_real required}"
  local relative_path child_path

  if [[ -f "$source_real" ]]; then
    relative_path="${source_real#"$root_real"/}"
    if is_secret_denied_path "$relative_path"; then
      echo -e "${RED}Error: shared_file matches secret deny patterns: $relative_path${NC}" >&2
      return 1
    fi
    return 0
  fi

  while IFS= read -r -d '' child_path; do
    relative_path="${child_path#"$root_real"/}"
    if is_secret_denied_path "$relative_path"; then
      echo -e "${RED}Error: shared_file directory contains secret-denied directory: $relative_path${NC}" >&2
      return 1
    fi
  done < <(find "$source_real" -type d -print0)

  while IFS= read -r -d '' child_path; do
    relative_path="${child_path#"$root_real"/}"
    if is_secret_denied_path "$relative_path"; then
      echo -e "${RED}Error: shared_file directory contains secret-denied path: $relative_path${NC}" >&2
      return 1
    fi
  done < <(find "$source_real" -type f -print0)

  while IFS= read -r -d '' child_path; do
    relative_path="${child_path#"$root_real"/}"
    echo -e "${RED}Error: shared_file directory contains symlink; symlink copying is not supported: $relative_path${NC}" >&2
    return 1
  done < <(find "$source_real" -type l -print0)
  return 0
}

ensure_env_copy_log_excluded() {
  local worktree_path="${1:?Error: worktree_path required}"
  local exclude_file
  exclude_file=$(git -C "$worktree_path" rev-parse --git-path info/exclude)
  mkdir -p "$(dirname "$exclude_file")"
  if ! grep -Fxq ".env-copy.log" "$exclude_file" 2>/dev/null; then
    echo ".env-copy.log" >> "$exclude_file"
  fi
}

file_sha256_8() {
  local source="${1:?Error: source required}"
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$source" | awk '{print substr($1, 1, 8)}'
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$source" | awk '{print substr($1, 1, 8)}'
  else
    echo -e "${RED}Error: no SHA-256 tool found for env copy audit${NC}" >&2
    return 1
  fi
}

validate_env_copy_log_path() {
  local worktree_path="${1:?Error: worktree_path required}"
  local worktree_real="${2:-}"
  local log_file="$worktree_path/.env-copy.log"
  local log_real

  if [[ -z "$worktree_real" ]]; then
    worktree_real=$(realpath_existing "$worktree_path")
  fi
  if [[ -L "$log_file" ]]; then
    echo -e "${RED}Error: refusing to write env copy log through symlink destination${NC}" >&2
    return 1
  fi
  log_real=$(realpath_for_new_path "$log_file")
  if ! path_within "$log_real" "$worktree_real"; then
    echo -e "${RED}Error: env copy log destination escapes the worktree${NC}" >&2
    return 1
  fi
}

append_env_copy_log() {
  local worktree_path="${1:?Error: worktree_path required}"
  local source="${2:?Error: source required}"
  local dest="${3:?Error: dest required}"
  local size sha8 timestamp log_file
  size=$(wc -c < "$source" | tr -d '[:space:]')
  sha8=$(file_sha256_8 "$source")
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  log_file="$worktree_path/.env-copy.log"
  validate_env_copy_log_path "$worktree_path"
  printf 'timestamp=%s source_path=%s destination_path=%s size_bytes=%s sha256_8=%s\n' \
    "$timestamp" "$source" "$dest" "$size" "$sha8" >> "$log_file"
}

copy_env_files() {
  local worktree_path="${1:?Error: worktree_path required}"
  local copied=0
  local worktree_real
  worktree_real=$(realpath_existing "$worktree_path")

  ensure_env_copy_log_excluded "$worktree_path"
  validate_env_copy_log_path "$worktree_path" "$worktree_real"
  shopt -s nullglob
  local env_files=()
  for f in "$GIT_ROOT"/.env*; do
    [[ -f "$f" ]] || continue
    local basename
    basename=$(basename "$f")
    case "$basename" in
      .env.example|.env.template|.env.sample|.env-copy.log) continue ;;
    esac
    env_files+=("$f")
  done

  if [[ ${#env_files[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No .env files copied: none found in main repo${NC}" >&2
    shopt -u nullglob
    return
  fi

  echo -e "${YELLOW}Copying env files by explicit --copy-env opt-in:${NC}" >&2
  for f in "${env_files[@]}"; do
    local basename dest dest_real
    basename=$(basename "$f")
    dest="$worktree_path/$basename"
    if [[ -L "$dest" ]]; then
      echo -e "${RED}Error: refusing to copy env file through symlink destination: $basename${NC}" >&2
      return 1
    fi
    dest_real=$(realpath_for_new_path "$dest")
    if ! path_within "$dest_real" "$worktree_real"; then
      echo -e "${RED}Error: env copy destination escapes the worktree: $basename${NC}" >&2
      return 1
    fi
    echo -e "${YELLOW}  - $basename${NC}" >&2
    cp "$f" "$dest"
    append_env_copy_log "$worktree_path" "$f" "$dest"
    copied=$((copied + 1))
  done
  shopt -u nullglob

  echo -e "${GREEN}Copied $copied env file(s) into experiment worktree${NC}" >&2
}

copy_shared_file() {
  local worktree_path="${1:?Error: worktree_path required}"
  local shared_file="${2:?Error: shared_file required}"
  local source_path="$GIT_ROOT/$shared_file"
  local dest_path="$worktree_path/$shared_file"
  local root_real worktree_real source_real dest_real dest_dir

  if ! is_exact_repo_relative_path "$shared_file"; then
    echo -e "${RED}Error: shared_file must be an exact repo-relative path: $shared_file${NC}" >&2
    return 1
  fi

  if is_secret_denied_path "$shared_file"; then
    echo -e "${RED}Error: shared_file matches secret deny patterns: $shared_file${NC}" >&2
    return 1
  fi

  if [[ ! -e "$source_path" ]]; then
    echo -e "${RED}Error: shared_file does not exist: $shared_file${NC}" >&2
    return 1
  fi

  root_real=$(realpath_existing "$GIT_ROOT")
  worktree_real=$(realpath_existing "$worktree_path")
  source_real=$(realpath_existing "$source_path")
  if ! path_within "$source_real" "$root_real"; then
    echo -e "${RED}Error: shared_file resolves outside repo: $shared_file${NC}" >&2
    return 1
  fi

  reject_secret_denied_tree "$source_real" "$root_real"

  dest_dir=$(dirname "$dest_path")
  mkdir -p "$dest_dir"
  dest_real=$(realpath_for_new_path "$dest_path")
  if ! path_within "$dest_real" "$worktree_real"; then
    echo -e "${RED}Error: shared_file destination resolves outside experiment worktree: $shared_file${NC}" >&2
    return 1
  fi

  if [[ -f "$source_real" ]]; then
    rm -rf "$dest_real"
    cp "$source_real" "$dest_real"
  elif [[ -d "$source_real" ]]; then
    rm -rf "$dest_real"
    cp -R "$source_real" "$dest_real"
  fi
}

# Create an experiment worktree
create_worktree() {
  local copy_env="false"
  if [[ "${1:-}" == "--copy-env" ]]; then
    copy_env="true"
    shift
  fi

  local spec_name="${1:?Error: spec_name required}"
  local exp_index="${2:?Error: exp_index required}"
  local base_branch="${3:?Error: base_branch required}"
  shift 3
  validate_safe_spec_name "$spec_name"

  local padded_index
  padded_index=$(normalize_experiment_index "$exp_index")
  local worktree_name="optimize-${spec_name}-exp-${padded_index}"
  local branch_name
  branch_name=$(experiment_branch_name "$spec_name" "$padded_index")
  local worktree_path="$WORKTREE_DIR/$worktree_name"

  # Check if worktree already exists
  if [[ -d "$worktree_path" ]]; then
    if ! git -C "$worktree_path" rev-parse --is-inside-work-tree >/dev/null 2>&1 || \
       ! is_registered_worktree "$worktree_path"; then
      echo -e "${RED}Error: Existing path is not a valid registered git worktree: $worktree_path${NC}" >&2
      echo -e "${RED}Remove or repair that directory before rerunning the experiment.${NC}" >&2
      return 1
    fi

    echo -e "${YELLOW}Worktree already exists: $worktree_path${NC}" >&2
    reset_worktree_to_base "$worktree_path" "$branch_name" "$base_branch"
  else
    mkdir -p "$WORKTREE_DIR"
    ensure_worktree_exclude

    # Create worktree from the base branch
    if ! git worktree add -b "$branch_name" "$worktree_path" "$base_branch" --quiet 2>/dev/null; then
      if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        if is_branch_checked_out "$branch_name"; then
          echo -e "${RED}Error: Existing experiment branch is already checked out: $branch_name${NC}" >&2
          echo -e "${RED}Clean up the stale worktree before rerunning this experiment.${NC}" >&2
          return 1
        fi

        echo -e "${YELLOW}Resetting existing experiment branch to base: $branch_name -> $base_branch${NC}" >&2
        git branch -f "$branch_name" "$base_branch" >/dev/null
        git worktree add "$worktree_path" "$branch_name" --quiet
      else
        echo -e "${RED}Error: Failed to create worktree for $branch_name from $base_branch${NC}" >&2
        return 1
      fi
    fi
  fi

  if [[ "$copy_env" == "true" ]]; then
    copy_env_files "$worktree_path"
  else
    echo -e "${YELLOW}Environment files not copied by default. Pass --copy-env to opt in.${NC}" >&2
  fi

  # 路径和 secret 边界校验后，再复制显式声明的 shared files。
  for shared_file in "$@"; do
    copy_shared_file "$worktree_path" "$shared_file"
  done

  echo "$worktree_path"
}

# 清理单个 experiment worktree。
cleanup_worktree() {
  local spec_name="${1:?Error: spec_name required}"
  local exp_index="${2:?Error: exp_index required}"
  validate_safe_spec_name "$spec_name"

  local padded_index
  padded_index=$(normalize_experiment_index "$exp_index")
  local worktree_name="optimize-${spec_name}-exp-${padded_index}"
  local branch_name
  branch_name=$(experiment_branch_name "$spec_name" "$padded_index")
  local worktree_path="$WORKTREE_DIR/$worktree_name"

  if [[ -d "$worktree_path" ]]; then
    assert_cleanup_target_within_worktrees "$worktree_path"
    git worktree remove "$worktree_path" --force 2>/dev/null || {
      # If worktree remove fails, try manual cleanup
      rm -rf "$worktree_path" 2>/dev/null || true
      git worktree prune 2>/dev/null || true
    }
  fi

  # Delete the experiment branch
  git branch -D "$branch_name" 2>/dev/null || true

  echo -e "${GREEN}Cleaned up: $worktree_name${NC}" >&2
}

# Clean up all experiment worktrees for a spec
cleanup_all() {
  local spec_name="${1:?Error: spec_name required}"
  validate_safe_spec_name "$spec_name"
  local prefix="optimize-${spec_name}-exp-"
  local count=0

  if [[ ! -d "$WORKTREE_DIR" ]]; then
    echo -e "${YELLOW}No worktrees directory found${NC}" >&2
    return 0
  fi
  local git_root_real worktree_dir_real
  git_root_real=$(realpath_existing "$GIT_ROOT")
  worktree_dir_real=$(realpath_existing "$WORKTREE_DIR")
  if ! path_within "$worktree_dir_real" "$git_root_real"; then
    echo -e "${RED}Error: .worktrees escapes the git root; refusing cleanup.${NC}" >&2
    return 1
  fi

  for worktree_path in "$WORKTREE_DIR"/${prefix}*; do
    if [[ -d "$worktree_path" ]]; then
      assert_cleanup_target_within_worktrees "$worktree_path"
      local worktree_name
      worktree_name=$(basename "$worktree_path")
      # Extract index from name
      local index_str="${worktree_name#$prefix}"

      git worktree remove "$worktree_path" --force 2>/dev/null || {
        rm -rf "$worktree_path" 2>/dev/null || true
      }

      # Delete the branch
      local branch_name
      branch_name=$(experiment_branch_name "$spec_name" "$index_str")
      git branch -D "$branch_name" 2>/dev/null || true

      count=$((count + 1))
    fi
  done

  git worktree prune 2>/dev/null || true

  # Clean up empty worktree directory
  if [[ -d "$WORKTREE_DIR" ]] && [[ -z "$(ls -A "$WORKTREE_DIR" 2>/dev/null)" ]]; then
    rmdir "$WORKTREE_DIR" 2>/dev/null || true
  fi

  echo -e "${GREEN}Cleaned up $count experiment worktree(s) for $spec_name${NC}" >&2
}

# Count total worktrees (for budget check)
count_worktrees() {
  local count=0
  if [[ -d "$WORKTREE_DIR" ]]; then
    for worktree_path in "$WORKTREE_DIR"/*; do
      if [[ -d "$worktree_path" ]] && [[ -e "$worktree_path/.git" ]]; then
        count=$((count + 1))
      fi
    done
  fi
  echo "$count"
}

# Main
main() {
  local command="${1:-help}"

  case "$command" in
    create)
      shift
      create_worktree "$@"
      ;;
    cleanup)
      shift
      cleanup_worktree "$@"
      ;;
    cleanup-all)
      shift
      cleanup_all "$@"
      ;;
    count)
      count_worktrees
      ;;
    help)
      cat << 'EOF'
Experiment Worktree Manager

Usage:
  experiment-worktree.sh create [--copy-env] <spec_name> <exp_index> <base_branch> [shared_file ...]
  experiment-worktree.sh cleanup <spec_name> <exp_index>
  experiment-worktree.sh cleanup-all <spec_name>
  experiment-worktree.sh count

Commands:
  create       Create an experiment worktree with copied shared files; .env* copy requires --copy-env
  cleanup      Remove a single experiment worktree and its branch
  cleanup-all  Remove all experiment worktrees for a spec
  count        Count total active worktrees (for budget checking)

Worktrees:  .worktrees/optimize-<spec>-exp-<NNN>/
Branches:   optimize-exp/<spec>/exp-<NNN>
EOF
      ;;
    *)
      echo -e "${RED}Unknown command: $command${NC}" >&2
      exit 1
      ;;
  esac
}

main "$@"
