#!/bin/bash
#
# Create a new git worktree or attach an existing ref with optional environment
# files and dev-tool trust.
#
# The distinctive work this script does (vs. raw `git worktree add`):
#   1. Optionally copies .env* files from the main repo with --copy-env
#   2. Trusts mise/direnv configs with branch-aware safety rules,
#      so hooks and scripts don't block on interactive trust prompts
#   3. Ensures .worktrees is gitignored (via `git check-ignore`)
#
# List / remove / switch operations are NOT provided here. Use git directly:
#   git worktree list
#   git worktree remove <path>
#   cd <worktree-path>   # switching is just `cd`

set -euo pipefail

DETECT_SCHEMA_VERSION="spec-worktree-detect.v1"
DETECT_STATE=""
DETECT_REASON_CODE=""
DETECT_WORKTREE_ROOT=""
DETECT_MAIN_WORKTREE_ROOT=""
DETECT_GIT_DIR=""
DETECT_COMMON_DIR=""
DETECT_BRANCH=""
GIT_ROOT=""
WORKTREE_DIR=""

realpath_existing() {
  local target_path="${1:?Error: path required}"
  node -e 'const fs = require("fs"); const realpath = fs.realpathSync.native || fs.realpathSync; console.log(realpath(process.argv[1]).replace(/\\/g, "/"));' "$target_path"
}

realpath_for_new_path() {
  local target_path="${1:?Error: path required}"
  node -e 'const fs = require("fs"); const path = require("path"); const target = process.argv[1]; const realpath = fs.realpathSync.native || fs.realpathSync; const resolved = path.join(realpath(path.dirname(target)), path.basename(target)); console.log(resolved.replace(/\\/g, "/"));' "$target_path"
}

path_within() {
  local child_path="${1:?Error: child path required}"
  local root_path="${2:?Error: root path required}"
  [[ "$child_path" == "$root_path" || "$child_path" == "$root_path"/* ]]
}

validated_worktree_root() {
  local candidate_path="${1:-}"
  [[ -n "$candidate_path" ]] || return 1

  local candidate_real candidate_top_raw candidate_top
  candidate_real=$(realpath_existing "$candidate_path" 2>/dev/null) || return 1
  candidate_top_raw=$(git -C "$candidate_real" rev-parse --show-toplevel 2>/dev/null) || return 1
  candidate_top=$(realpath_existing "$candidate_top_raw" 2>/dev/null) || return 1
  [[ "$candidate_top" == "$candidate_real" ]] || return 1
  printf '%s\n' "$candidate_real"
}

# Pass nullable fields through verbatim. An empty value stays empty and the node
# emitter maps empty -> null. No in-band sentinel: a real branch or path name
# could collide with it.
json_arg() {
  printf '%s\n' "${1:-}"
}

# Positional args (order matters; the four path slots are easy to transpose):
#   1:state 2:reason_code 3:worktree_root 4:main_worktree_root 5:git_dir 6:common_dir 7:branch
set_detect_facts() {
  DETECT_STATE="${1:-unknown}"
  DETECT_REASON_CODE="${2:-output-contract-failed}"
  DETECT_WORKTREE_ROOT="${3:-}"
  DETECT_MAIN_WORKTREE_ROOT="${4:-}"
  DETECT_GIT_DIR="${5:-}"
  DETECT_COMMON_DIR="${6:-}"
  DETECT_BRANCH="${7:-}"
}

emit_detect_json() {
  node -e '
const [
  schema_version,
  state,
  reason_code,
  worktree_root,
  main_worktree_root,
  git_dir,
  common_dir,
  branch,
] = process.argv.slice(1);
// An empty value means "absent" for every nullable field here: a path field is
// only empty when that fact does not exist, and an empty branch means detached
// HEAD. Mapping empty -> null avoids an in-band sentinel that a real branch or
// path name could collide with. Fields are passed positionally via argv, which
// is already an out-of-band boundary, so no sentinel is needed.
const nullable = (value) => !value ? null : value;
process.stdout.write(`${JSON.stringify({
  schema_version,
  state,
  reason_code,
  worktree_root: nullable(worktree_root),
  main_worktree_root: nullable(main_worktree_root),
  git_dir: nullable(git_dir),
  common_dir: nullable(common_dir),
  branch: nullable(branch),
}, null, 2)}\n`);
' \
    "$DETECT_SCHEMA_VERSION" \
    "$DETECT_STATE" \
    "$DETECT_REASON_CODE" \
    "$(json_arg "$DETECT_WORKTREE_ROOT")" \
    "$(json_arg "$DETECT_MAIN_WORKTREE_ROOT")" \
    "$(json_arg "$DETECT_GIT_DIR")" \
    "$(json_arg "$DETECT_COMMON_DIR")" \
    "$(json_arg "$DETECT_BRANCH")"
}

detect_worktree_facts() {
  local cwd_real
  cwd_real=$(pwd -P 2>/dev/null || pwd)

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    # worktree_root is null here: cwd is not a git checkout, so there is no
    # git root to report. Emitting cwd would mislead consumers reading the field.
    set_detect_facts "unknown" "not-git-repo" "" "" "" "" ""
    return 1
  fi

  local worktree_root_raw worktree_root git_dir_raw git_dir common_raw common_dir
  local worktree_listing main_root_raw main_root branch superproject

  if ! worktree_root_raw=$(git rev-parse --show-toplevel 2>/dev/null); then
    set_detect_facts "unknown" "git-query-failed" "$cwd_real" "" "" "" ""
    return 1
  fi
  if ! worktree_root=$(realpath_existing "$worktree_root_raw" 2>/dev/null); then
    set_detect_facts "unknown" "output-contract-failed" "$worktree_root_raw" "" "" "" ""
    return 1
  fi

  if ! git_dir_raw=$(git rev-parse --absolute-git-dir 2>/dev/null); then
    set_detect_facts "unknown" "git-query-failed" "$worktree_root" "" "" "" ""
    return 1
  fi
  if ! git_dir=$(realpath_existing "$git_dir_raw" 2>/dev/null); then
    set_detect_facts "unknown" "output-contract-failed" "$worktree_root" "" "$git_dir_raw" "" ""
    return 1
  fi

  if ! common_raw=$(git rev-parse --git-common-dir 2>/dev/null); then
    set_detect_facts "unknown" "git-query-failed" "$worktree_root" "" "$git_dir" "" ""
    return 1
  fi
  if ! common_dir=$(realpath_existing "$common_raw" 2>/dev/null); then
    set_detect_facts "unknown" "output-contract-failed" "$worktree_root" "" "$git_dir" "$common_raw" ""
    return 1
  fi

  if ! worktree_listing=$(git worktree list --porcelain 2>/dev/null); then
    set_detect_facts "unknown" "git-query-failed" "$worktree_root" "" "$git_dir" "$common_dir" ""
    return 1
  fi
  main_root_raw=$(printf '%s\n' "$worktree_listing" | sed -n 's/^worktree //p' | head -n 1)
  if [[ -z "$main_root_raw" ]]; then
    set_detect_facts "unknown" "output-contract-failed" "$worktree_root" "" "$git_dir" "$common_dir" ""
    return 1
  fi
  main_root=$(validated_worktree_root "$main_root_raw" 2>/dev/null || true)

  branch=$(git branch --show-current 2>/dev/null || true)
  superproject=$(git rev-parse --show-superproject-working-tree 2>/dev/null || true)

  if [[ "$git_dir" == "$common_dir" ]]; then
    main_root="${main_root:-$worktree_root}"
    set_detect_facts "ordinary-checkout" "same-git-dir" "$worktree_root" "$main_root" "$git_dir" "$common_dir" "$branch"
  elif [[ -n "$superproject" ]]; then
    set_detect_facts "submodule" "submodule-superproject" "$worktree_root" "$main_root" "$git_dir" "$common_dir" "$branch"
  else
    set_detect_facts "linked-worktree" "linked-worktree" "$worktree_root" "$main_root" "$git_dir" "$common_dir" "$branch"
  fi
}

detect_command() {
  if [[ "${1:-}" != "--json" ]]; then
    echo "Error: detect requires --json" >&2
    usage >&2
    return 1
  fi
  # The detect --json contract promises that every non-zero exit still carries a
  # parseable reason_code on stdout. emit_detect_json shells to node, so if node
  # is missing we must emit the failure JSON by hand rather than aborting under
  # set -e with empty stdout.
  if ! command -v node >/dev/null 2>&1; then
    printf '{\n  "schema_version": "%s",\n  "state": "unknown",\n  "reason_code": "output-contract-failed",\n  "worktree_root": null,\n  "main_worktree_root": null,\n  "git_dir": null,\n  "common_dir": null,\n  "branch": null\n}\n' "$DETECT_SCHEMA_VERSION"
    echo "Error: detect requires node to emit JSON facts" >&2
    return 1
  fi
  local status
  if detect_worktree_facts; then
    status=0
  else
    status=$?
  fi
  emit_detect_json
  return "$status"
}

init_worktree_paths_from_detect() {
  # Anchor on the current working tree (--show-toplevel), not main_worktree_root.
  # create only runs for ordinary-checkout/submodule (linked-worktree is refused
  # above), so the current checkout IS the working tree the user wants .worktrees
  # under. main_worktree_root comes from `git worktree list` and points at the
  # GIT DIR (not the working tree) for --separate-git-dir repos and submodules,
  # which would otherwise place .worktrees/.gitignore inside the git dir.
  GIT_ROOT="${DETECT_WORKTREE_ROOT}"
  WORKTREE_DIR="$GIT_ROOT/.worktrees"
}

usage() {
  cat <<'EOF'
Usage:
  worktree-manager.sh detect --json
  worktree-manager.sh create [--copy-env] <branch-name> [from-branch]
  worktree-manager.sh isolate [--copy-env] <target-ref|pr:<number>|#<number>> [worktree-slug]

Creates .worktrees/<branch-name> with <branch-name> branched from
[from-branch] (default: origin's default branch, or main).

The main repo checkout is not modified; from-branch is fetched but
not checked out.

isolate attaches .worktrees/<slug> to an existing branch, tag, commit, or PR
head. A branch can be checked out in only one worktree at a time; if the target
branch is already checked out, the command reports already_checked_out and exits
0 without creating a duplicate checkout.

By default, .env* files are not copied. Pass --copy-env to opt in.

detect --json emits schema_version spec-worktree-detect.v1 with state:
ordinary-checkout | linked-worktree | submodule | unknown
and reason_code:
same-git-dir | linked-worktree | submodule-superproject | not-git-repo | git-query-failed | output-contract-failed

Exit code: 0 when the state was determined (ordinary-checkout, linked-worktree,
or submodule) -- always parse the state field to choose the next action, since
exit 0 alone does not mean "safe to create". Non-zero (state=unknown) means
detection failed; read reason_code. node is required to emit the JSON.
EOF
}

slugify_ref() {
  local value="${1:?Error: ref required}"
  local slug
  slug=$(printf '%s' "$value" | sed -E 's#[^A-Za-z0-9._-]+#-#g; s#^-+##; s#-+$##')
  if [[ -z "$slug" ]]; then
    slug="target"
  fi
  printf '%s\n' "$slug"
}

# The slug becomes a path segment under $WORKTREE_DIR. slugify_ref permits dots, so `..` passes
# through it unchanged and a caller-supplied slug could otherwise escape the worktree root.
validate_worktree_slug() {
  local value="${1:-}"
  if [[ ! "$value" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ || "$value" == *..* ]]; then
    echo "Error: unsafe worktree slug; use letters, numbers, dot, underscore, and dash without path traversal: ${value:-<empty>}" >&2
    return 1
  fi
}

checked_out_path_for_branch() {
  local branch_name="${1:?Error: branch name required}"
  local branch_ref="refs/heads/$branch_name"
  git worktree list --porcelain 2>/dev/null | awk -v ref="$branch_ref" '
    /^worktree / { path = substr($0, 10) }
    /^branch / {
      if (substr($0, 8) == ref) {
        print path
        exit
      }
    }
  '
}

report_already_checked_out() {
  local branch_name="${1:?Error: branch name required}"
  local checkout_path="${2:?Error: checkout path required}"
  echo "already_checked_out branch=$branch_name path=$checkout_path"
  echo "Use that checkout for this target; git will not allow one branch in two worktrees."
}

# Ensure .worktrees is ignored in the main repo. Runs `git check-ignore` from
# the main repo root so it sees the main repo's .gitignore (which is not
# inherited by linked worktrees). Falls back to a grep guard to avoid
# duplicate entries when check-ignore misses an uncommitted gitignore rule.
ensure_gitignore() {
  local gitignore_path="$GIT_ROOT/.gitignore"
  if [[ -L "$gitignore_path" ]]; then
    echo "Error: refusing to modify symlinked .gitignore" >&2
    return 1
  fi
  if [[ -e "$gitignore_path" && ! -f "$gitignore_path" ]]; then
    echo "Error: refusing to modify non-file .gitignore" >&2
    return 1
  fi
  if (cd "$GIT_ROOT" && git check-ignore -q .worktrees) 2>/dev/null; then
    return
  fi
  if grep -Fxq ".worktrees" "$gitignore_path" 2>/dev/null; then
    return
  fi
  echo ".worktrees" >> "$gitignore_path"
  echo "Added .worktrees to .gitignore"
}

ensure_env_copy_log_excluded() {
  local worktree_path="$1"
  local exclude_file
  exclude_file=$(git -C "$worktree_path" rev-parse --git-path info/exclude)
  mkdir -p "$(dirname "$exclude_file")"
  if ! grep -Fxq ".env-copy.log" "$exclude_file" 2>/dev/null; then
    echo ".env-copy.log" >> "$exclude_file"
  fi
}

validate_env_copy_log_path() {
  local worktree_path="$1"
  local worktree_real="${2:-}"
  local log_file="$worktree_path/.env-copy.log"
  local log_real

  if [[ -z "$worktree_real" ]]; then
    worktree_real=$(realpath_existing "$worktree_path")
  fi
  if [[ -L "$log_file" ]]; then
    echo "Error: refusing to write env copy log through symlink destination" >&2
    return 1
  fi
  log_real=$(realpath_for_new_path "$log_file")
  if ! path_within "$log_real" "$worktree_real"; then
    echo "Error: env copy log destination escapes the worktree" >&2
    return 1
  fi
}

append_env_copy_log() {
  local worktree_path="$1" source="$2" dest="$3"
  local size sha8 timestamp log_file
  size=$(wc -c < "$source" | tr -d '[:space:]')
  if command -v shasum >/dev/null 2>&1; then
    sha8=$(shasum -a 256 "$source" | awk '{print substr($1, 1, 8)}')
  elif command -v sha256sum >/dev/null 2>&1; then
    sha8=$(sha256sum "$source" | awk '{print substr($1, 1, 8)}')
  else
    echo "Error: no SHA-256 tool found for env copy audit" >&2
    return 1
  fi
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  log_file="$worktree_path/.env-copy.log"
  validate_env_copy_log_path "$worktree_path"
  printf 'timestamp=%s source_path=%s destination_path=%s size_bytes=%s sha256_8=%s\n' \
    "$timestamp" "$source" "$dest" "$size" "$sha8" >> "$log_file"
}

is_env_example_file() {
  case "$1" in
    .env.example|.env.template|.env.sample) return 0 ;;
    *) return 1 ;;
  esac
}

# 调用方显式 opt in 时，将主仓库的 .env* 文件复制到 worktree，
# 跳过文档化示例/模板，并备份已存在的目标文件。
copy_env_files() {
  local worktree_path="$1"
  local copied=0
  local worktree_real
  worktree_real=$(realpath_existing "$worktree_path")

  ensure_env_copy_log_excluded "$worktree_path"
  validate_env_copy_log_path "$worktree_path" "$worktree_real"
  shopt -s nullglob

  local sources=()
  for source in "$GIT_ROOT"/.env*; do
    [[ -f "$source" ]] || continue
    local name
    name=$(basename "$source")
    is_env_example_file "$name" && continue
    [[ "$name" == ".env-copy.log" ]] && continue
    sources+=("$source")
  done

  if [[ ${#sources[@]} -eq 0 ]]; then
    echo "  No .env files in main repo"
    shopt -u nullglob
    return
  fi

  echo "  Copying env files by explicit --copy-env opt-in:"
  for source in "${sources[@]}"; do
    local name
    name=$(basename "$source")
    echo "  - $name"
  done

  for source in "${sources[@]}"; do
    local name
    name=$(basename "$source")
    local dest="$worktree_path/$name"
    local dest_real backup_real
    if [[ -L "$dest" ]]; then
      echo "Error: refusing to copy env file through symlink destination: $name" >&2
      return 1
    fi
    if [[ -L "${dest}.backup" ]]; then
      echo "Error: refusing to overwrite symlinked env backup destination: ${name}.backup" >&2
      return 1
    fi
    dest_real=$(realpath_for_new_path "$dest")
    backup_real=$(realpath_for_new_path "${dest}.backup")
    if ! path_within "$dest_real" "$worktree_real" || ! path_within "$backup_real" "$worktree_real"; then
      echo "Error: env copy destination escapes the worktree: $name" >&2
      return 1
    fi
    if [[ -f "$dest" ]]; then
      cp "$dest" "${dest}.backup"
      echo "  Backed up existing $name to ${name}.backup"
    fi
    cp "$source" "$dest"
    append_env_copy_log "$worktree_path" "$source" "$dest"
    echo "  Copied $name"
    copied=$((copied + 1))
  done
  shopt -u nullglob

  if [[ $copied -eq 0 ]]; then
    echo "  No .env files in main repo"
  fi
}

get_default_branch() {
  local head_ref
  head_ref=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || true)
  if [[ -n "$head_ref" ]]; then
    echo "${head_ref#refs/remotes/origin/}"
  else
    echo "main"
  fi
}

# Auto-trust is only safe when the worktree is based on a long-lived branch
# the developer already controls. Review/PR branches fall back to the default
# branch baseline and require manual direnv approval.
is_trusted_base_branch() {
  local branch="$1"
  local default_branch="$2"
  [[ "$branch" == "$default_branch" ]] && return 0
  case "$branch" in
    develop|dev|trunk|staging|release/*) return 0 ;;
    *) return 1 ;;
  esac
}

# Return 0 if worktree's copy of $file has the same blob hash as $base_ref's.
# Symlinks are rejected (can't verify content).
config_unchanged() {
  local file="$1" base_ref="$2" worktree_path="$3"
  [[ -L "$worktree_path/$file" ]] && return 1
  local base_hash worktree_hash
  base_hash=$(git rev-parse "$base_ref:$file" 2>/dev/null) || return 1
  worktree_hash=$(git hash-object "$worktree_path/$file") || return 1
  [[ "$base_hash" == "$worktree_hash" ]]
}

# Trust dev tool configs (mise, direnv) so hooks/scripts don't block on
# interactive trust prompts. Auto-trusts only when the config matches the
# trusted baseline branch.
trust_dev_tools() {
  local worktree_path="$1" base_ref="$2" allow_direnv_auto="$3"
  local trusted=0
  local manual=()

  if command -v mise &>/dev/null; then
    for f in .mise.toml mise.toml .tool-versions; do
      [[ -f "$worktree_path/$f" ]] || continue
      if config_unchanged "$f" "$base_ref" "$worktree_path" \
         && (cd "$worktree_path" && mise trust "$f" --quiet); then
        trusted=$((trusted + 1))
      else
        manual+=("mise trust $f")
      fi
      break
    done
  fi

  if command -v direnv &>/dev/null && [[ -f "$worktree_path/.envrc" ]]; then
    if [[ "$allow_direnv_auto" == "true" ]] \
       && config_unchanged ".envrc" "$base_ref" "$worktree_path" \
       && (cd "$worktree_path" && direnv allow); then
      trusted=$((trusted + 1))
    else
      manual+=("direnv allow")
    fi
  fi

  [[ $trusted -gt 0 ]] && echo "  Trusted $trusted dev tool config(s)"
  if [[ ${#manual[@]} -gt 0 ]]; then
    echo "  Manual review required for: ${manual[*]}"
    echo "  Review the diff, then run from $worktree_path"
  fi
}

create_worktree() {
  local copy_env="false"
  if [[ "${1:-}" == "--copy-env" ]]; then
    copy_env="true"
    shift
  fi

  local branch_name="${1:-}"
  local from_branch="${2:-}"

  if [[ -z "$branch_name" ]]; then
    echo "Error: branch name required" >&2
    usage >&2
    exit 1
  fi

  if ! detect_worktree_facts; then
    echo "Error: cannot create worktree; detection failed reason_code=$DETECT_REASON_CODE" >&2
    return 1
  fi
  if [[ "$DETECT_STATE" == "linked-worktree" ]]; then
    echo "Error: already in an isolated worktree; work in place instead of creating a nested worktree." >&2
    echo "reason_code=linked-worktree worktree_root=$DETECT_WORKTREE_ROOT branch=${DETECT_BRANCH:-detached}" >&2
    return 1
  fi
  case "$DETECT_STATE" in
    ordinary-checkout|submodule) ;;
    *)
      echo "Error: cannot create worktree; unknown detection state=$DETECT_STATE reason_code=$DETECT_REASON_CODE" >&2
      return 1
      ;;
  esac
  init_worktree_paths_from_detect

  local default_branch
  default_branch=$(get_default_branch)
  from_branch="${from_branch:-$default_branch}"

  local worktree_path="$WORKTREE_DIR/$branch_name"
  if [[ -d "$worktree_path" ]]; then
    echo "Error: worktree already exists at $worktree_path" >&2
    echo "Use 'cd $worktree_path' to switch, or 'git worktree remove' first." >&2
    exit 1
  fi

  echo "Creating worktree $branch_name from $from_branch"

  mkdir -p "$WORKTREE_DIR"
  ensure_gitignore

  # Fetch from-branch without touching the main checkout.
  if ! git fetch origin "$from_branch" --quiet; then
    echo "Warning: could not fetch origin/$from_branch; using local ref" >&2
  fi

  # Prefer origin/<from> if available, else fall back to local ref.
  local base_ref="origin/$from_branch"
  if ! git rev-parse --verify "$base_ref" &>/dev/null; then
    base_ref="$from_branch"
  fi

  git worktree add -b "$branch_name" "$worktree_path" "$base_ref"

  echo "Environment files:"
  if [[ "$copy_env" == "true" ]]; then
    copy_env_files "$worktree_path"
  else
    echo "  Not copied by default. Re-run create with --copy-env to opt in."
  fi

  echo "Dev tool trust:"
  local trust_branch="$default_branch"
  local allow_direnv_auto="false"
  if is_trusted_base_branch "$from_branch" "$default_branch"; then
    trust_branch="$from_branch"
    allow_direnv_auto="true"
  fi
  # Refresh the trust baseline before the hash-baseline check. Without this,
  # a stale origin/<default_branch> can cause auto-trust against an outdated
  # baseline when from_branch is untrusted (feature/review branches).
  if [[ "$trust_branch" != "$from_branch" ]]; then
    if ! git fetch origin "$trust_branch" --quiet; then
      echo "  Warning: could not fetch origin/$trust_branch; baseline may be stale" >&2
    fi
  fi
  local trust_ref="origin/$trust_branch"
  if git rev-parse --verify "$trust_ref" &>/dev/null; then
    trust_dev_tools "$worktree_path" "$trust_ref" "$allow_direnv_auto"
  else
    echo "  Skipped: $trust_ref not available locally"
  fi

  echo ""
  echo "Worktree ready: $worktree_path"
  echo "Switch with: cd $worktree_path"
}

isolate_existing_ref() {
  local copy_env="false"
  if [[ "${1:-}" == "--copy-env" ]]; then
    copy_env="true"
    shift
  fi

  local target_ref="${1:-}"
  local requested_slug="${2:-}"

  if [[ -z "$target_ref" ]]; then
    echo "Error: target ref required" >&2
    usage >&2
    exit 1
  fi

  if ! detect_worktree_facts; then
    echo "Error: cannot isolate ref; detection failed reason_code=$DETECT_REASON_CODE" >&2
    return 1
  fi
  case "$DETECT_STATE" in
    ordinary-checkout|submodule|linked-worktree) ;;
    *)
      echo "Error: cannot isolate ref; unknown detection state=$DETECT_STATE reason_code=$DETECT_REASON_CODE" >&2
      return 1
      ;;
  esac
  init_worktree_paths_from_detect

  local checkout_ref="$target_ref"
  local branch_name=""
  local worktree_slug="${requested_slug:-}"
  local add_mode="ref"

  case "$target_ref" in
    pr:[0-9]*)
      branch_name="pr-${target_ref#pr:}"
      checkout_ref="$branch_name"
      worktree_slug="${worktree_slug:-$branch_name}"
      add_mode="branch"
      ;;
    \#[0-9]*)
      branch_name="pr-${target_ref#\#}"
      checkout_ref="$branch_name"
      worktree_slug="${worktree_slug:-$branch_name}"
      add_mode="branch"
      ;;
  esac

  if [[ -n "$branch_name" ]]; then
    local existing_checkout
    existing_checkout=$(checked_out_path_for_branch "$branch_name")
    if [[ -n "$existing_checkout" ]]; then
      report_already_checked_out "$branch_name" "$existing_checkout"
      return 0
    fi
    if ! git fetch origin "pull/${branch_name#pr-}/head:refs/heads/$branch_name" --quiet; then
      echo "Error: could not fetch PR ${branch_name#pr-} from origin" >&2
      return 1
    fi
  elif git show-ref --verify --quiet "refs/heads/$target_ref"; then
    branch_name="$target_ref"
    checkout_ref="$target_ref"
    worktree_slug="${worktree_slug:-$(slugify_ref "$target_ref")}"
    add_mode="branch"
    local existing_checkout
    existing_checkout=$(checked_out_path_for_branch "$branch_name")
    if [[ -n "$existing_checkout" ]]; then
      report_already_checked_out "$branch_name" "$existing_checkout"
      return 0
    fi
  elif git rev-parse --verify "origin/$target_ref" >/dev/null 2>&1; then
    branch_name="$target_ref"
    checkout_ref="origin/$target_ref"
    worktree_slug="${worktree_slug:-$(slugify_ref "$target_ref")}"
    add_mode="remote-branch"
    local existing_checkout
    existing_checkout=$(checked_out_path_for_branch "$branch_name")
    if [[ -n "$existing_checkout" ]]; then
      report_already_checked_out "$branch_name" "$existing_checkout"
      return 0
    fi
  elif git rev-parse --verify "$target_ref^{commit}" >/dev/null 2>&1; then
    checkout_ref="$target_ref"
    worktree_slug="${worktree_slug:-$(slugify_ref "$target_ref")}"
    add_mode="detached"
  else
    echo "Error: target ref does not resolve: $target_ref" >&2
    return 1
  fi

  if [[ "$DETECT_STATE" == "linked-worktree" ]]; then
    if [[ -n "$branch_name" && "${DETECT_BRANCH:-}" == "$branch_name" ]]; then
      echo "already_checked_out branch=$branch_name path=$DETECT_WORKTREE_ROOT"
      return 0
    fi
    echo "Already in an isolated worktree; checking out $target_ref in place."
    git checkout "$checkout_ref"
    echo "Worktree ready: $DETECT_WORKTREE_ROOT"
    return 0
  fi

  validate_worktree_slug "$worktree_slug" || exit 1
  local worktree_path="$WORKTREE_DIR/$worktree_slug"
  if [[ -d "$worktree_path" ]]; then
    echo "Error: worktree already exists at $worktree_path" >&2
    echo "Use 'cd $worktree_path' to switch, or 'git worktree remove' first." >&2
    exit 1
  fi

  echo "Isolating $target_ref at $worktree_path"

  mkdir -p "$WORKTREE_DIR"
  ensure_gitignore

  case "$add_mode" in
    branch)
      git worktree add "$worktree_path" "$checkout_ref"
      ;;
    remote-branch)
      git worktree add -b "$branch_name" "$worktree_path" "$checkout_ref"
      ;;
    detached)
      git worktree add --detach "$worktree_path" "$checkout_ref"
      ;;
    *)
      git worktree add "$worktree_path" "$checkout_ref"
      ;;
  esac

  echo "Environment files:"
  if [[ "$copy_env" == "true" ]]; then
    copy_env_files "$worktree_path"
  else
    echo "  Not copied by default. Re-run isolate with --copy-env to opt in."
  fi

  echo "Dev tool trust:"
  local default_branch trust_ref
  default_branch=$(get_default_branch)
  trust_ref="origin/$default_branch"
  if git rev-parse --verify "$trust_ref" &>/dev/null; then
    trust_dev_tools "$worktree_path" "$trust_ref" "false"
  else
    echo "  Skipped: $trust_ref not available locally"
  fi

  echo ""
  echo "Worktree ready: $worktree_path"
  echo "Switch with: cd $worktree_path"
}

main() {
  local command="${1:-}"
  shift || true
  case "$command" in
    detect) detect_command "$@" ;;
    create) create_worktree "$@" ;;
    isolate) isolate_existing_ref "$@" ;;
    ""|help|-h|--help) usage ;;
    *)
      echo "Error: unknown command '$command'" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
