#!/bin/bash

# Experiment Worktree Manager
# Creates, cleans up, and manages worktrees for optimization experiments.
# Each experiment gets an isolated worktree with copied shared resources.
#
# Usage:
#   experiment-worktree.sh create [--copy-env] <spec_name> <exp_index> <base_branch> [shared_file ...]
#   experiment-worktree.sh cleanup [--discard] <spec_name> <exp_index>
#   experiment-worktree.sh cleanup-all [--discard] <spec_name>
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

# Store ownership in worktree-specific Git metadata, outside tracked checkout content.
experiment_manifest() {
  local mode="$1" worktree_path="$2" branch_name="$3" base_sha="${4:-}"
  local git_dir common_dir root_common
  git_dir=$(git -C "$worktree_path" rev-parse --absolute-git-dir)
  common_dir=$(git -C "$worktree_path" rev-parse --git-common-dir)
  root_common=$(git rev-parse --git-common-dir)
  [[ "$(realpath_existing "$common_dir")" == "$(realpath_existing "$root_common")" ]] || return 1
  node - "$mode" "$git_dir/spec-first-optimize-owner.json" "$GIT_ROOT" "$worktree_path" "$branch_name" "$base_sha" <<'NODE'
const fs = require('node:fs');
const [mode, file, root, target, branch, base] = process.argv.slice(2);
const identity = { version: 1, repo: fs.realpathSync(root), worktree: fs.realpathSync(target), branch };
try {
  if (mode === 'create') {
    fs.writeFileSync(file, JSON.stringify({ ...identity, base_sha: base }) + '\n', { flag: 'wx', mode: 0o600 });
  } else {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('invalid ownership file');
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Object.keys(identity).some(key => record[key] !== identity[key]) || !/^[a-f0-9]{40,64}$/.test(record.base_sha)) {
      throw new Error('ownership identity mismatch');
    }
    process.stdout.write(record.base_sha);
  }
} catch (error) {
  console.error(`Error: experiment ownership unavailable: ${error.message}`);
  process.exitCode = 1;
}
NODE
}

assert_worktree_container() {
  if [[ -L "$WORKTREE_DIR" || ( -e "$WORKTREE_DIR" && ! -d "$WORKTREE_DIR" ) ]]; then
    echo 'Error: .worktrees must be an owned directory, not a symlink or file' >&2
    return 1
  fi
}

assert_owned_worktree() {
  local worktree_path="$1" branch_name="$2"
  [[ ! -L "$worktree_path" ]] || { echo 'Error: symlink worktree is not owned' >&2; return 1; }
  is_registered_worktree "$worktree_path" || { echo 'Error: path is not a registered experiment worktree' >&2; return 1; }
  assert_cleanup_target_within_worktrees "$worktree_path" || return 1
  [[ "$(git -C "$worktree_path" symbolic-ref --quiet --short HEAD)" == "$branch_name" ]] || {
    echo 'Error: experiment branch identity changed' >&2; return 1;
  }
  experiment_manifest read "$worktree_path" "$branch_name"
}

assert_pristine_experiment() {
  local worktree_path="$1" base_sha="$2" current_head worktree_status
  current_head=$(git -C "$worktree_path" rev-parse HEAD) || return 1
  worktree_status=$(git -C "$worktree_path" status --porcelain=v1 --untracked-files=all --ignored) || return 1
  if [[ "$current_head" != "$base_sha" || -n "$worktree_status" ]]; then
    echo 'Error: experiment contains commits or working files; preserve them, or explicitly cleanup --discard after retaining evidence' >&2
    return 1
  fi
}

realpath_existing() {
  local path="${1:?Error: path required}"
  node -e 'const fs = require("fs"); console.log(fs.realpathSync(process.argv[1]));' "$path"
}

realpath_for_new_path() {
  local path="${1:?Error: path required}"
  # 目标及其中间目录可能尚不存在（SUP-02：containment 校验要先于 mkdir）。解析最深的已存在祖先，
  # 拼接剩余段；缺少的段若本身是（悬空）符号链接，则跟随一次后继续解析，避免链接指向边界外时被误判为安全。
  node -e '
const fs = require("fs");
const path = require("path");

function resolveTarget(target, depth) {
  if (depth > 40) throw new Error("symlink chain too deep: " + target);
  let base = path.resolve(target);
  const tail = [];
  for (;;) {
    try {
      return path.join(fs.realpathSync(base), ...tail.reverse());
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      let stat = null;
      try { stat = fs.lstatSync(base); } catch (_) { stat = null; }
      if (stat && stat.isSymbolicLink()) {
        const link = fs.readlinkSync(base);
        const next = path.isAbsolute(link) ? link : path.join(path.dirname(base), link);
        return resolveTarget(path.join(next, ...tail.reverse()), depth + 1);
      }
      const parent = path.dirname(base);
      if (parent === base) return path.join(base, ...tail.reverse());
      tail.push(path.basename(base));
      base = parent;
    }
  }
}

console.log(resolveTarget(process.argv[1], 0));
' "$path"
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
  # SUP-02 fix: verify containment BEFORE creating any directories
  dest_real=$(realpath_for_new_path "$dest_path")
  if ! path_within "$dest_real" "$worktree_real"; then
    echo -e "${RED}Error: shared_file destination resolves outside experiment worktree: $shared_file${NC}" >&2
    return 1
  fi

  mkdir -p "$dest_dir"

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

  assert_worktree_container
  local base_sha owned_base
  base_sha=$(git rev-parse --verify --end-of-options "$base_branch^{commit}")
  if [[ -e "$worktree_path" || -L "$worktree_path" ]]; then
    owned_base=$(assert_owned_worktree "$worktree_path" "$branch_name")
    [[ "$owned_base" == "$base_sha" ]] || { echo 'Error: experiment base changed; use a new index' >&2; return 1; }
    assert_pristine_experiment "$worktree_path" "$owned_base"
    echo -e "${YELLOW}Worktree already exists: $worktree_path${NC}" >&2
    # Idempotent create never resets, cleans, or overwrites shared/env files.
    echo "$worktree_path"
    return 0
  fi
  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    echo "Error: existing experiment branch is not owned by this create: $branch_name" >&2
    return 1
  fi
  mkdir -p "$WORKTREE_DIR"
  ensure_worktree_exclude
  git worktree add -b "$branch_name" --quiet "$worktree_path" "$base_sha"
  experiment_manifest create "$worktree_path" "$branch_name" "$base_sha"

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
  local discard="false"
  if [[ "${1:-}" == "--discard" ]]; then discard="true"; shift; fi
  local spec_name="${1:?Error: spec_name required}"
  local exp_index="${2:?Error: exp_index required}"
  validate_safe_spec_name "$spec_name"
  local padded_index branch_name worktree_name worktree_path owned_base
  padded_index=$(normalize_experiment_index "$exp_index")
  worktree_name="optimize-${spec_name}-exp-${padded_index}"
  branch_name=$(experiment_branch_name "$spec_name" "$padded_index")
  worktree_path="$WORKTREE_DIR/$worktree_name"
  assert_worktree_container || return 1
  if [[ ! -e "$worktree_path" && ! -L "$worktree_path" ]]; then
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
      echo 'Error: branch without worktree ownership; refusing deletion' >&2
      return 1
    fi
    echo "Cleaned up: $worktree_name (already absent)" >&2
    return 0
  fi
  owned_base=$(assert_owned_worktree "$worktree_path" "$branch_name") || return 1
  if [[ "$discard" != "true" ]]; then
    assert_pristine_experiment "$worktree_path" "$owned_base" || return 1
    git worktree remove "$worktree_path" || return 1
  else
    git worktree remove --force "$worktree_path" || return 1
  fi
  git branch -D "$branch_name" >&2 || return 1
  echo -e "${GREEN}Cleaned up: $worktree_name${NC}" >&2
}

cleanup_all() {
  local discard="false"
  if [[ "${1:-}" == "--discard" ]]; then discard="true"; shift; fi
  local spec_name="${1:?Error: spec_name required}"
  validate_safe_spec_name "$spec_name"
  assert_worktree_container || return 1
  local prefix="optimize-${spec_name}-exp-" count=0 failed=0
  local worktree_path worktree_name index_str
  for worktree_path in "$WORKTREE_DIR"/"$prefix"*; do
    [[ -e "$worktree_path" || -L "$worktree_path" ]] || continue
    worktree_name=$(basename "$worktree_path")
    index_str="${worktree_name#$prefix}"
    if [[ ! "$index_str" =~ ^[0-9]{3}$ ]]; then
      echo "Error: unowned experiment-like path preserved: $worktree_path" >&2
      failed=1
      continue
    fi
    local result=0
    if [[ "$discard" == "true" ]]; then
      cleanup_worktree --discard "$spec_name" "$index_str" || result=$?
    else
      cleanup_worktree "$spec_name" "$index_str" || result=$?
    fi
    if [[ "$result" == 0 ]]; then
      count=$((count + 1))
    else
      failed=1
    fi
  done
  echo "Cleaned up $count experiment worktree(s) for $spec_name" >&2
  return "$failed"
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
  experiment-worktree.sh cleanup [--discard] <spec_name> <exp_index>
  experiment-worktree.sh cleanup-all [--discard] <spec_name>
  experiment-worktree.sh count

Commands:
  create       Create an experiment worktree with copied shared files; .env* copy requires --copy-env
  cleanup      Remove an owned pristine experiment; --discard explicitly permits dropping its changes
  cleanup-all  Remove owned experiments for a spec; preserve unknown paths and report failure
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
