#!/bin/bash
# install-helpers.sh - Install or verify required non-MCP helper tooling.

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo '错误：jq 是必需依赖，请先安装 jq' >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCP_TOOLS_JSON="$(cd "$SCRIPT_DIR/.." && pwd)/mcp-tools.json"
source "$SCRIPT_DIR/lib-helper-registry.sh"
source "$SCRIPT_DIR/lib-template.sh"
require_mcp_tools_schema_version 7 "$MCP_TOOLS_JSON"

MODE="install"
REQUIREMENT_WORKSPACE="${SPEC_FIRST_PROVIDER_GRAPHIFY_REQUIREMENT_WORKSPACE:-${SPEC_FIRST_REQUIREMENT_WORKSPACE:-}}"
GRAPHIFY_REFRESH_REQUESTED="${SPEC_FIRST_PROVIDER_GRAPHIFY_REFRESH:-false}"
DEFAULT_STAGE_TIMEOUT_SECONDS="${SPEC_FIRST_STAGE_TIMEOUT_SECONDS:-900}"
PROBE_TIMEOUT_SECONDS="${SPEC_FIRST_PROBE_TIMEOUT_SECONDS:-30}"

NPM_MIRROR_ENDPOINT="https://registry.npmmirror.com"
UV_MIRROR_ENDPOINT="https://mirrors.tuna.tsinghua.edu.cn/pypi/simple"
CHROME_MIRROR_ENDPOINT="https://npmmirror.com/mirrors/chrome-for-testing"
LAST_INSTALL_SOURCE="official"
LAST_INSTALL_MIRROR_USED="false"
BROWSER_HELPER_OPT_IN_ACTION='set SPEC_FIRST_BROWSER_HELPER_REQUIRED=1 and rerun the host setup workflow (`$spec-mcp-setup` or `/spec:mcp-setup`)'
export NPM_MIRROR_ENDPOINT UV_MIRROR_ENDPOINT CHROME_MIRROR_ENDPOINT

reset_install_provenance() {
  LAST_INSTALL_SOURCE="official"
  LAST_INSTALL_MIRROR_USED="false"
}

write_install_provenance() {
  if [ -n "${LAST_INSTALL_PROVENANCE_FILE:-}" ]; then
    printf 'install_source=%s\nmirror_used=%s\n' "$LAST_INSTALL_SOURCE" "$LAST_INSTALL_MIRROR_USED" >"$LAST_INSTALL_PROVENANCE_FILE" 2>/dev/null || true
  fi
}

load_install_provenance() {
  local provenance_file="$1"
  local key value
  [ -s "$provenance_file" ] || return 0
  while IFS='=' read -r key value; do
    case "$key" in
      install_source) LAST_INSTALL_SOURCE="$value" ;;
      mirror_used) LAST_INSTALL_MIRROR_USED="$value" ;;
    esac
  done <"$provenance_file"
}

# run_with_mirror_fallback <mirror_env_pairs...> -- <cmd...>
# mirror_env_pairs: KEY=VALUE entries injected on the second attempt only.
run_with_mirror_fallback() {
  local -a mirror_env=()
  while [ $# -gt 0 ]; do
    if [ "$1" = "--" ]; then
      shift
      break
    fi
    mirror_env+=("$1")
    shift
  done

  if "$@"; then
    LAST_INSTALL_SOURCE="official"
    LAST_INSTALL_MIRROR_USED="false"
    write_install_provenance
    return 0
  fi

  if [ ${#mirror_env[@]} -eq 0 ]; then
    LAST_INSTALL_SOURCE="both-failed"
    LAST_INSTALL_MIRROR_USED="false"
    write_install_provenance
    return 1
  fi

  local pair key value rc=0
  local -a saved_keys_set=()
  local -a saved_values_set=()
  local -a saved_keys_unset=()
  for pair in "${mirror_env[@]}"; do
    key="${pair%%=*}"
    value="${pair#*=}"
    if [ -n "${!key+x}" ]; then
      saved_keys_set+=("$key")
      saved_values_set+=("${!key}")
    else
      saved_keys_unset+=("$key")
    fi
    export "$key=$value"
  done
  "$@" || rc=$?
  local i
  for ((i=0; i<${#saved_keys_set[@]}; i++)); do
    export "${saved_keys_set[$i]}=${saved_values_set[$i]}"
  done
  for key in "${saved_keys_unset[@]}"; do
    unset "$key"
  done

  if [ "$rc" -eq 0 ]; then
    LAST_INSTALL_SOURCE="mirror"
    LAST_INSTALL_MIRROR_USED="true"
    write_install_provenance
    return 0
  fi

  LAST_INSTALL_SOURCE="both-failed"
  LAST_INSTALL_MIRROR_USED="true"
  write_install_provenance
  return 1
}

npm_mirror_env_pairs() {
  printf '%s\n' "npm_config_registry=${NPM_MIRROR_ENDPOINT}" "NPM_CONFIG_REGISTRY=${NPM_MIRROR_ENDPOINT}"
}

external_dependency_field() {
  local dependency_id="$1" field="$2"
  jq -r --arg id "$dependency_id" --arg field "$field" '
    (first((.external_dependencies // [])[]? | select(.id == $id)) // {})[$field] // empty
  ' "$MCP_TOOLS_JSON"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install)
      MODE="install"
      shift
      ;;
    --verify-only)
      MODE="verify-only"
      shift
      ;;
    --requirement-workspace)
      REQUIREMENT_WORKSPACE="${2:-}"
      shift 2
      ;;
    --refresh|--refresh-graphify)
      GRAPHIFY_REFRESH_REQUESTED=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

stage_log() {
  local stage="$1"
  local message="$2"
  printf 'spec-mcp-setup: [helpers/%s] %s\n' "$stage" "$message" >&2
}

run_with_timeout() {
  local timeout_seconds="$1"
  shift
  python3 - "$timeout_seconds" "$@" <<'PY'
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
}

GLOBAL_AGENT_BROWSER_SKILL="$HOME/.agents/skills/agent-browser/SKILL.md"
GLOBAL_AST_GREP_SKILL="$HOME/.agents/skills/ast-grep/SKILL.md"
AGENT_BROWSER_INSTALL_MARKER="$HOME/.agent-browser/spec-first-install.json"
HELPER_JSON='{}'
PROVIDER_JSON='[]'
PARALLEL_TASK_PIDS=()
PARALLEL_TASK_LABELS=()
AGENT_BROWSER_BROWSER_INSTALL_EXIT_CODE=""
AGENT_BROWSER_SKILL_INSTALL_EXIT_CODE=""
AST_GREP_SKILL_INSTALL_EXIT_CODE=""
PROVIDER_REPO_ROOT="${SPEC_FIRST_PROVIDER_REPO_ROOT:-$PWD}"
PROVIDER_TOOL_ROOT="${SPEC_FIRST_PROVIDER_TOOL_ROOT:-$PROVIDER_REPO_ROOT/.spec-first/tools}"
PROVIDER_CACHE_ROOT="${SPEC_FIRST_PROVIDER_CACHE_ROOT:-$PROVIDER_REPO_ROOT/.spec-first/cache}"
GRAPHIFY_ARTIFACT_ROOT_DEFAULT="${SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT:-graphify-out}"
GRAPHIFY_PACKAGE="${SPEC_FIRST_PROVIDER_GRAPHIFY_PACKAGE:-$(external_dependency_field graphify package)}"
GRAPHIFY_VERSION_PIN="${SPEC_FIRST_PROVIDER_GRAPHIFY_VERSION_PIN:-$(external_dependency_field graphify version)}"
[ -n "$GRAPHIFY_PACKAGE" ] || { echo '错误：mcp-tools.json 缺少 graphify package pin' >&2; exit 1; }
[ -n "$GRAPHIFY_VERSION_PIN" ] || { echo '错误：mcp-tools.json 缺少 graphify version pin' >&2; exit 1; }
GRAPHIFY_ORIGINAL_PATH="${PATH:-}"
GRAPHIFY_RESOLVED_COMMAND=""
GRAPHIFY_RESOLVED_ON_PATH=""
export SPEC_FIRST_PROVIDER_ORIGINAL_PATH="${SPEC_FIRST_PROVIDER_ORIGINAL_PATH:-$GRAPHIFY_ORIGINAL_PATH}"
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PROVIDER_TOOL_ROOT:$PATH"

detect_os() {
  local os
  os="$(uname -s 2>/dev/null || echo "unknown")"
  case "$os" in
    Darwin) echo "macos" ;;
    Linux) echo "linux" ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *) echo "unknown" ;;
  esac
}

run_with_optional_sudo() {
  if [ "$(id -u 2>/dev/null || echo 1)" = "0" ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo -n "$@"
  else
    return 1
  fi
}

run_npm_global_install_attempt() {
  local npm_env=()
  if [ -n "${NPM_CONFIG_REGISTRY:-}" ]; then
    npm_env+=("NPM_CONFIG_REGISTRY=$NPM_CONFIG_REGISTRY")
  fi
  if [ -n "${npm_config_registry:-}" ]; then
    npm_env+=("npm_config_registry=$npm_config_registry")
  fi
  if [ -n "${HTTPS_PROXY:-}" ]; then
    npm_env+=("HTTPS_PROXY=$HTTPS_PROXY")
  fi
  if [ -n "${https_proxy:-}" ]; then
    npm_env+=("https_proxy=$https_proxy")
  fi
  if [ -n "${HTTP_PROXY:-}" ]; then
    npm_env+=("HTTP_PROXY=$HTTP_PROXY")
  fi
  if [ -n "${http_proxy:-}" ]; then
    npm_env+=("http_proxy=$http_proxy")
  fi
  if [ -n "${NO_PROXY:-}" ]; then
    npm_env+=("NO_PROXY=$NO_PROXY")
  fi
  if [ -n "${no_proxy:-}" ]; then
    npm_env+=("no_proxy=$no_proxy")
  fi

  if CI=true npm install -g "$@" --no-audit --no-fund --loglevel=error --fetch-timeout=30000 --fetch-retries=1; then
    return 0
  fi
  command -v sudo >/dev/null 2>&1 || return 1
  sudo -n env CI=true "${npm_env[@]}" npm install -g "$@" --no-audit --no-fund --loglevel=error --fetch-timeout=30000 --fetch-retries=1
}

run_npm_global_install_with_optional_sudo() {
  local mirror_pairs=()
  while IFS= read -r pair; do
    mirror_pairs+=("$pair")
  done < <(npm_mirror_env_pairs)
  run_with_mirror_fallback "${mirror_pairs[@]}" -- run_npm_global_install_attempt "$@"
}

run_brew_latest_install() {
  local pkg="$1"
  brew update >/dev/null 2>&1 || true
  if brew list --formula "$pkg" >/dev/null 2>&1; then
    brew upgrade -q "$pkg" || true
  else
    brew install -q "$pkg"
  fi
}

run_winget_latest_install() {
  local package_id="$1"
  winget upgrade --id "$package_id" -e --silent --accept-package-agreements --accept-source-agreements \
    || winget install --id "$package_id" -e --silent --accept-package-agreements --accept-source-agreements
}

run_linux_package_install() {
  local apt_pkg="$1"
  local dnf_pkg="$2"
  local yum_pkg="$3"
  local pacman_pkg="$4"
  local apk_pkg="$5"

  if command -v apt-get >/dev/null 2>&1; then
    run_with_optional_sudo apt-get update
    run_with_optional_sudo apt-get install -y "$apt_pkg"
  elif command -v dnf >/dev/null 2>&1; then
    run_with_optional_sudo dnf upgrade -y "$dnf_pkg" || run_with_optional_sudo dnf install -y "$dnf_pkg"
  elif command -v yum >/dev/null 2>&1; then
    run_with_optional_sudo yum update -y "$yum_pkg" || run_with_optional_sudo yum install -y "$yum_pkg"
  elif command -v pacman >/dev/null 2>&1; then
    run_with_optional_sudo pacman -Syu --needed --noconfirm "$pacman_pkg"
  elif command -v apk >/dev/null 2>&1; then
    run_with_optional_sudo apk update
    run_with_optional_sudo apk add --upgrade "$apk_pkg"
  else
    return 1
  fi
}

install_command_for() {
  local name="$1"
  local os="$2"
  # agent-browser 的展示命令是真实安装命令(本脚本是 installer);其余 helper 委派到
  # lib-helper-registry.sh 的共享展示生成器,消除与 check-health 的双份维护漂移。
  if [ "$name" = "agent-browser" ]; then
    if [ "$os" = "linux" ]; then
      echo "CI=true npm install -g agent-browser@latest --no-audit --no-fund --loglevel=error && agent-browser install --with-deps && npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y"
    else
      echo "CI=true npm install -g agent-browser@latest --no-audit --no-fund --loglevel=error && agent-browser install && npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y"
    fi
    return 0
  fi
  helper_registry_install_command_display "$name" "$os"
}

run_install_command() {
  local name="$1"
  local os="$2"
  case "$name" in
    gh)
      if [ "$os" = "windows" ]; then run_winget_latest_install "GitHub.cli"; elif [ "$os" = "linux" ]; then run_linux_package_install gh gh gh github-cli github-cli; else run_brew_latest_install "gh"; fi
      ;;
    jq)
      if [ "$os" = "windows" ]; then run_winget_latest_install "jqlang.jq"; elif [ "$os" = "linux" ]; then run_linux_package_install jq jq jq jq jq; else run_brew_latest_install "jq"; fi
      ;;
    vhs)
      if [ "$os" = "linux" ] || [ "$os" = "windows" ]; then command -v go >/dev/null 2>&1 && go install github.com/charmbracelet/vhs@latest; else run_brew_latest_install "vhs"; fi
      ;;
    silicon)
      if [ "$os" = "linux" ] || [ "$os" = "windows" ]; then command -v cargo >/dev/null 2>&1 && cargo install silicon --force; else run_brew_latest_install "silicon"; fi
      ;;
    ffmpeg)
      if [ "$os" = "windows" ]; then run_winget_latest_install "Gyan.FFmpeg"; elif [ "$os" = "linux" ]; then run_linux_package_install ffmpeg ffmpeg ffmpeg ffmpeg ffmpeg; else run_brew_latest_install "ffmpeg"; fi
      ;;
    ast-grep)
      if [ "$os" = "windows" ]; then run_npm_global_install_with_optional_sudo @ast-grep/cli@latest; elif [ "$os" = "linux" ]; then if command -v cargo >/dev/null 2>&1; then cargo install ast-grep --locked --force; elif command -v npm >/dev/null 2>&1; then run_npm_global_install_with_optional_sudo @ast-grep/cli@latest; else return 1; fi; else run_brew_latest_install "ast-grep"; fi
      ;;
    ast-grep-skill)
      local mirror_pairs=()
      while IFS= read -r pair; do
        mirror_pairs+=("$pair")
      done < <(npm_mirror_env_pairs)
      run_with_mirror_fallback "${mirror_pairs[@]}" -- npx -y skills@latest add ast-grep/agent-skill -g -y
      ;;
    *)
      return 1
      ;;
  esac
}

run_install_command_with_timeout() {
  local name="$1"
  local os="$2"
  local stage="$3"
  local exit_code=0
  stage_log "$stage" "start"
  if run_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" bash -c 'run_install_command "$1" "$2"' _ "$name" "$os" >/dev/null 2>&1; then
    stage_log "$stage" "done (exit 0)"
    return 0
  fi
  exit_code="$?"
  if [ "$exit_code" -eq 124 ]; then
    stage_log "$stage" "timed out after ${DEFAULT_STAGE_TIMEOUT_SECONDS}s"
  else
    stage_log "$stage" "done (exit $exit_code)"
  fi
  return "$exit_code"
}

export -f run_winget_latest_install
export -f run_linux_package_install
export -f run_brew_latest_install
export -f run_with_optional_sudo
export -f run_npm_global_install_with_optional_sudo
export -f run_npm_global_install_attempt
export -f run_with_mirror_fallback
export -f reset_install_provenance
export -f write_install_provenance
export -f load_install_provenance
export -f npm_mirror_env_pairs
export -f run_install_command

add_helper_fact() {
  local id="$1"
  local type="$2"
  local dependency_status="$3"
  local install_status="$4"
  local skill_status="$5"
  local result="$6"
  local next_action="$7"
  local baseline_blocking="${8:-true}"
  local install_source="${9:-official}"
  local mirror_used="${10:-false}"
  local browser_capability_demand_signals="${11:-[]}"
  local profile required safety_result reason_code

  profile="$(helper_registry_profile "$id" 2>/dev/null || echo "minimal")"
  required="$(jq -r --arg id "$id" '.helpers[] | select(.id == $id) | .required // true' "$(helper_registry_path)" 2>/dev/null || echo "true")"
  safety_result="$(helper_registry_safety_result "$id" 2>/dev/null || echo "unknown")"
  case "$result" in
    ready) reason_code="ready" ;;
    skipped) reason_code="optional-skipped" ;;
    degraded) reason_code="optional-capability-degraded" ;;
    action-required) reason_code="required-runtime-action-required" ;;
    *) reason_code="unknown" ;;
  esac

  HELPER_JSON="$(jq \
    --arg id "$id" \
    --arg type "$type" \
    --arg dependency_status "$dependency_status" \
    --arg install_status "$install_status" \
    --arg skill_status "$skill_status" \
    --arg result "$result" \
    --arg next_action "$next_action" \
    --argjson baseline_blocking "$baseline_blocking" \
    --arg profile "$profile" \
    --argjson required_json "$required" \
    --arg safety_result "$safety_result" \
    --arg reason_code "$reason_code" \
    --arg install_source "$install_source" \
    --argjson mirror_used "$mirror_used" \
    --argjson browser_capability_demand_signals "$browser_capability_demand_signals" \
    '. + {($id): {
      required: $required_json,
      baseline_blocking: $baseline_blocking,
      profile: $profile,
      kind: $type,
      type: $type,
      dependency_status: $dependency_status,
      configured_status: "not-applicable",
      host_config_status: "not-applicable",
      allowed: "not-applicable",
      install_status: $install_status,
      safety: $safety_result,
      skill_status: $skill_status,
      project_status: "not-applicable",
      result: $result,
      reason_code: $reason_code,
      next_action: $next_action,
      install_source: $install_source,
      mirror_used: $mirror_used,
      browser_capability_demand_signals: $browser_capability_demand_signals
    }}' <<<"$HELPER_JSON")"
}

write_agent_browser_install_marker() {
  local install_command="$1"
  local marker_dir
  marker_dir="$(dirname "$AGENT_BROWSER_INSTALL_MARKER")"
  mkdir -p "$marker_dir"
  local tmp
  tmp="$(mktemp "${marker_dir}/spec-first-install.XXXXXX")"
  chmod 600 "$tmp"
  jq -n \
    --arg installed_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg install_command "$install_command" \
    --arg source "spec-mcp-setup" \
    '{schema_version:"agent-browser-install.v1",installed_by:$source,installed_at:$installed_at,install_command:$install_command}' > "$tmp"
  mv "$tmp" "$AGENT_BROWSER_INSTALL_MARKER"
}

global_skill_installed() {
  local skill_name="$1"
  [ -f "$HOME/.agents/skills/$skill_name/SKILL.md" ] || [ -f "$HOME/.claude/skills/$skill_name/SKILL.md" ] || [ -f "$HOME/.codex/skills/$skill_name/SKILL.md" ] || [ -f "$HOME/.kiro/skills/$skill_name/SKILL.md" ] || [ -f "$HOME/.qoder/skills/$skill_name/SKILL.md" ]
}

browser_helper_required() {
  case "${SPEC_FIRST_BROWSER_HELPER_REQUIRED:-}" in
    1|true|TRUE|True|yes|YES|Yes) return 0 ;;
    *) return 1 ;;
  esac
}

collect_browser_demand_signals_json() {
  local -a signals=()
  if [ -f package.json ]; then
    local package_signals
    package_signals="$(jq -r '
      def deps: ((.dependencies // {}) + (.devDependencies // {}) + (.optionalDependencies // {}));
      [
        (deps | keys[]? | select(test("(@playwright/test|playwright|cypress|puppeteer|storybook|@storybook/)")) | "package.json:dependency:" + .),
        (.scripts // {} | to_entries[]? | select((.key + " " + (.value|tostring)) | test("playwright|cypress|puppeteer|storybook|vite|next|nuxt|astro|remix|svelte-kit|sveltekit")) | "package.json:scripts." + .key)
      ][]' package.json 2>/dev/null || true)"
    if [ -n "$package_signals" ]; then
      while IFS= read -r signal; do
        [ -n "$signal" ] && signals+=("$signal")
      done <<<"$package_signals"
    fi
  fi

  local file
  for file in next.config.js next.config.mjs vite.config.js vite.config.ts nuxt.config.js nuxt.config.ts astro.config.mjs remix.config.js svelte.config.js config/routes.rb manage.py mix.exs artisan storybook.config.js .storybook/main.js .storybook/main.ts; do
    [ -e "$file" ] && signals+=("config-file:$file")
  done

  local dir
  for dir in src/app pages app/views templates public storybook .storybook; do
    if [ -d "$dir" ] && find "$dir" -mindepth 1 -maxdepth 1 2>/dev/null | read -r _; then
      signals+=("dir:$dir")
    fi
  done

  if [ "${#signals[@]}" -eq 0 ]; then
    printf '[]'
    return
  fi

  printf '%s\n' "${signals[@]}" | sort -u | jq -R -s 'split("\n") | map(select(length > 0))'
}

queue_parallel_task() {
  local label="$1"
  shift
  stage_log "$label" "start (parallel)"
  (
    "$@" >/dev/null 2>&1
  ) &
  PARALLEL_TASK_PIDS+=("$!")
  PARALLEL_TASK_LABELS+=("$label")
}

wait_for_parallel_tasks() {
  local index
  local pid
  local label
  local exit_code

  for index in "${!PARALLEL_TASK_PIDS[@]}"; do
    pid="${PARALLEL_TASK_PIDS[$index]}"
    label="${PARALLEL_TASK_LABELS[$index]}"
    if wait "$pid"; then
      exit_code=0
    else
      exit_code="$?"
    fi

    case "$label" in
      agent-browser-browser-install)
        AGENT_BROWSER_BROWSER_INSTALL_EXIT_CODE="$exit_code"
        ;;
      agent-browser-skill-install)
        AGENT_BROWSER_SKILL_INSTALL_EXIT_CODE="$exit_code"
        ;;
      ast-grep-skill-install)
        AST_GREP_SKILL_INSTALL_EXIT_CODE="$exit_code"
        ;;
    esac

    if [ "$exit_code" -eq 124 ]; then
      stage_log "$label" "timed out after ${DEFAULT_STAGE_TIMEOUT_SECONDS}s"
    else
      stage_log "$label" "done (exit $exit_code)"
    fi
  done

  PARALLEL_TASK_PIDS=()
  PARALLEL_TASK_LABELS=()
}

process_cli_helper() {
  local name="$1"
  local os="$2"
  local baseline_blocking="${3:-true}"
  local status="ready"
  local dependency_status="ready"
  local install_status="ready"
  local next_action=""
  local install_command
  local install_source="official"
  local mirror_used="false"

  if ! command -v "$name" >/dev/null 2>&1; then
    dependency_status="missing"
    install_status="action-required"
    install_command="$(install_command_for "$name" "$os")"
    if [ "$name" = "ast-grep" ] && command -v rg >/dev/null 2>&1 && [ "$MODE" != "install" ]; then
      status="degraded"
      next_action="ast-grep missing; falling back to rg. Install via: ${install_command:-install ast-grep manually}"
      add_helper_fact "$name" "helper" "$dependency_status" "$install_status" "not-applicable" "$status" "$next_action" "false" "$install_source" "$mirror_used"
      return
    fi
    if [ "$MODE" = "install" ]; then
      local provenance_file
      local install_succeeded="false"
      provenance_file="$(mktemp 2>/dev/null || echo /tmp/spec-first-helper-prov.$$)"
      : >"$provenance_file" 2>/dev/null || true
      reset_install_provenance
      if LAST_INSTALL_PROVENANCE_FILE="$provenance_file" run_install_command_with_timeout "$name" "$os" "install:$name"; then
        install_succeeded="true"
        load_install_provenance "$provenance_file"
      fi
      rm -f "$provenance_file" 2>/dev/null || true
      if [ "$install_succeeded" = "true" ] && command -v "$name" >/dev/null 2>&1; then
        dependency_status="ready"
        install_status="ready"
        status="ready"
        next_action=""
        install_source="$LAST_INSTALL_SOURCE"
        mirror_used="$LAST_INSTALL_MIRROR_USED"
      else
        if [ "$baseline_blocking" = "false" ]; then
          status="degraded"
          next_action="optional helper for feature-video skill; install via: ${install_command:-install $name manually}"
        else
          status="action-required"
          next_action="${install_command:-install $name manually}"
        fi
      fi
    else
      if [ "$baseline_blocking" = "false" ]; then
        status="degraded"
        next_action="optional helper for feature-video skill; install via: ${install_command:-install $name manually}"
      else
        status="action-required"
        next_action="${install_command:-install $name manually}"
      fi
    fi
  fi

  add_helper_fact "$name" "helper" "$dependency_status" "$install_status" "not-applicable" "$status" "$next_action" "$baseline_blocking" "$install_source" "$mirror_used"
}

process_agent_browser() {
  local status="ready"
  local dependency_status="ready"
  local install_status="ready"
  local skill_status="ready"
  local next_action=""
  local baseline_blocking="false"
  local os="${OS:-$(detect_os)}"
  local agent_browser_install_command="agent-browser install"
  local agent_browser_install_args=(agent-browser install)
  local browser_install_queued="no"
  local skill_install_queued="no"
  local install_source="official"
  local mirror_used="false"
  local browser_required="no"
  local demand_signals_json
  demand_signals_json="$(collect_browser_demand_signals_json)"
  if browser_helper_required; then
    browser_required="yes"
  fi

  if [ "$os" = "linux" ]; then
    agent_browser_install_command="agent-browser install --with-deps"
    agent_browser_install_args=(agent-browser install --with-deps)
  fi

  if ! command -v agent-browser >/dev/null 2>&1; then
    dependency_status="missing"
    install_status="action-required"
    status="skipped"
    next_action="$BROWSER_HELPER_OPT_IN_ACTION"
  fi

  if ! global_skill_installed "agent-browser"; then
    skill_status="action-required"
    if [ "$browser_required" = "yes" ]; then
      status="degraded"
      if [ "$MODE" = "install" ]; then
        skill_install_queued="yes"
        queue_parallel_task "agent-browser-skill-install" run_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y
      fi
    else
      status="skipped"
      next_action="$BROWSER_HELPER_OPT_IN_ACTION"
    fi
  fi

  if [ "$dependency_status" = "missing" ] && [ "$MODE" = "install" ] && [ "$browser_required" = "yes" ]; then
    stage_log "agent-browser" "installing CLI via npm"
    local npm_install_exit_code=0
    local provenance_file
    provenance_file="$(mktemp 2>/dev/null || echo /tmp/spec-first-ab-prov.$$)"
    : >"$provenance_file" 2>/dev/null || true
    if LAST_INSTALL_PROVENANCE_FILE="$provenance_file" run_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" bash -c 'run_npm_global_install_with_optional_sudo agent-browser@latest' >/dev/null 2>&1; then
      npm_install_exit_code=0
    else
      npm_install_exit_code="$?"
    fi
    if [ -s "$provenance_file" ]; then
      while IFS='=' read -r key value; do
        case "$key" in
          install_source) install_source="$value" ;;
          mirror_used) mirror_used="$value" ;;
        esac
      done <"$provenance_file"
    fi
    rm -f "$provenance_file" 2>/dev/null || true
    if [ "$npm_install_exit_code" -eq 0 ] && command -v agent-browser >/dev/null 2>&1; then
      dependency_status="ready"
      install_status="ready"
      status="ready"
      next_action=""
      stage_log "agent-browser" "CLI install finished"
    else
      status="degraded"
      install_status="action-required"
      if [ "$npm_install_exit_code" -eq 124 ]; then
        next_action="agent-browser CLI install timed out after ${DEFAULT_STAGE_TIMEOUT_SECONDS}s"
        stage_log "agent-browser" "CLI install timed out after ${DEFAULT_STAGE_TIMEOUT_SECONDS}s"
      else
        next_action="agent-browser CLI not found after npm install"
        stage_log "agent-browser" "CLI install did not produce an executable"
      fi
    fi
  fi

  if [ "$dependency_status" = "ready" ] && [ ! -f "$AGENT_BROWSER_INSTALL_MARKER" ]; then
    install_status="action-required"
    if [ "$browser_required" = "yes" ]; then
      status="degraded"
      if [ "$MODE" = "verify-only" ]; then
        next_action="$BROWSER_HELPER_OPT_IN_ACTION"
      else
        next_action="run ${agent_browser_install_command} or set AGENT_BROWSER_EXECUTABLE_PATH to an existing Chrome/Chromium/Brave executable"
      fi
    else
      status="skipped"
      next_action="$BROWSER_HELPER_OPT_IN_ACTION"
    fi
  fi

  if [ "$MODE" = "verify-only" ] && [ "$dependency_status" = "ready" ] && [ "$skill_status" = "action-required" ]; then
    if [ "$browser_required" = "yes" ]; then
      status="degraded"
      next_action="$BROWSER_HELPER_OPT_IN_ACTION"
    else
      status="skipped"
      next_action="$BROWSER_HELPER_OPT_IN_ACTION"
    fi
  fi

  if [ "$MODE" = "install" ] && [ "$browser_required" = "yes" ] && [ "$dependency_status" = "ready" ] && [ ! -f "$AGENT_BROWSER_INSTALL_MARKER" ]; then
    install_status="action-required"
    status="degraded"
    browser_install_queued="yes"
    queue_parallel_task "agent-browser-browser-install" run_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" "${agent_browser_install_args[@]}"
  fi

  AGENT_BROWSER_INSTALL_COMMAND="$agent_browser_install_command"
  AGENT_BROWSER_OS="$os"
  AGENT_BROWSER_DEPENDENCY_STATUS="$dependency_status"
  AGENT_BROWSER_INSTALL_STATUS="$install_status"
  AGENT_BROWSER_SKILL_STATUS="$skill_status"
  AGENT_BROWSER_RESULT="$status"
  AGENT_BROWSER_NEXT_ACTION="$next_action"
  AGENT_BROWSER_BASELINE_BLOCKING="$baseline_blocking"
  AGENT_BROWSER_BROWSER_INSTALL_QUEUED="$browser_install_queued"
  AGENT_BROWSER_SKILL_INSTALL_QUEUED="$skill_install_queued"
  AGENT_BROWSER_INSTALL_SOURCE="$install_source"
  AGENT_BROWSER_MIRROR_USED="$mirror_used"
  AGENT_BROWSER_DEMAND_SIGNALS_JSON="$demand_signals_json"

  if [ "$browser_install_queued" = "no" ] && [ "$skill_install_queued" = "no" ]; then
    add_helper_fact "agent-browser" "helper" "$dependency_status" "$install_status" "$skill_status" "$status" "$next_action" "$baseline_blocking" "$install_source" "$mirror_used" "$demand_signals_json"
  fi
}

finalize_agent_browser() {
  local os="$1"
  local dependency_status="$2"
  local install_status="$3"
  local skill_status="$4"
  local status="$5"
  local next_action="$6"
  local browser_install_queued="$7"
  local skill_install_queued="$8"
  local baseline_blocking="$9"
  local install_source="${10:-official}"
  local mirror_used="${11:-false}"
  local demand_signals_json="${12:-[]}"
  local browser_failed="no"
  local install_command="${AGENT_BROWSER_INSTALL_COMMAND:-agent-browser install}"

  if [ "$MODE" = "install" ]; then
    if [ "$dependency_status" != "ready" ] && command -v agent-browser >/dev/null 2>&1; then
      dependency_status="ready"
    fi

    if [ "$browser_install_queued" = "yes" ]; then
      if [ "${AGENT_BROWSER_BROWSER_INSTALL_EXIT_CODE:-1}" -eq 0 ] && command -v agent-browser >/dev/null 2>&1; then
        write_agent_browser_install_marker "$install_command"
        install_status="ready"
      else
        install_status="action-required"
        browser_failed="yes"
        status="degraded"
        baseline_blocking="false"
        next_action="agent-browser browser runtime install failed; browser automation may be unavailable. Rerun ${install_command} or set AGENT_BROWSER_EXECUTABLE_PATH to an existing Chrome/Chromium/Brave executable."
      fi
    fi

    if [ "$skill_install_queued" = "yes" ]; then
      if [ "${AGENT_BROWSER_SKILL_INSTALL_EXIT_CODE:-1}" -eq 0 ] && global_skill_installed "agent-browser"; then
        skill_status="ready"
      else
        skill_status="action-required"
        status="degraded"
        baseline_blocking="false"
        if [ "$browser_failed" != "yes" ] && [ "$dependency_status" = "ready" ]; then
          next_action="install global agent-browser skill manually"
        fi
      fi
    fi

    if [ "$dependency_status" = "ready" ] && [ "$install_status" = "ready" ] && [ "$skill_status" = "ready" ]; then
      status="ready"
      baseline_blocking="false"
      next_action=""
    fi
  fi

  add_helper_fact "agent-browser" "helper" "$dependency_status" "$install_status" "$skill_status" "$status" "$next_action" "$baseline_blocking" "$install_source" "$mirror_used" "$demand_signals_json"
}

process_global_skill() {
  local skill_name="$1"
  local helper_id="$2"
  local status="ready"
  local dependency_status="ready"
  local install_status="ready"
  local skill_status="ready"
  local next_action=""
  local install_queued="no"

  if ! global_skill_installed "$skill_name"; then
    dependency_status="missing"
    install_status="action-required"
    skill_status="action-required"
    status="action-required"
    next_action="$(install_command_for "${skill_name}-skill" "$(detect_os)")"
    if [ "$MODE" = "install" ]; then
      install_queued="yes"
      queue_parallel_task "ast-grep-skill-install" run_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" npx -y skills@latest add ast-grep/agent-skill -g -y
    fi
  fi

  AST_GREP_SKILL_DEPENDENCY_STATUS="$dependency_status"
  AST_GREP_SKILL_INSTALL_STATUS="$install_status"
  AST_GREP_SKILL_SKILL_STATUS="$skill_status"
  AST_GREP_SKILL_RESULT="$status"
  AST_GREP_SKILL_NEXT_ACTION="$next_action"
  AST_GREP_SKILL_INSTALL_QUEUED="$install_queued"

  if [ "$install_queued" = "no" ]; then
    add_helper_fact "$helper_id" "global-skill" "$dependency_status" "$install_status" "$skill_status" "$status" "$next_action"
  fi
}

provider_consent_approved() {
  local provider="$1"
  local env_name value
  env_name="SPEC_FIRST_PROVIDER_${provider}_CONSENT"
  value="${!env_name:-}"
  case "$value" in
    approved|APPROVED|yes|YES|true|TRUE|1) return 0 ;;
    *) return 1 ;;
  esac
}

truthy_value() {
  case "${1:-}" in
    approved|APPROVED|yes|YES|true|TRUE|1) return 0 ;;
    *) return 1 ;;
  esac
}

graphify_refresh_requested() {
  truthy_value "$GRAPHIFY_REFRESH_REQUESTED"
}

set_graphify_first_generation_fact() {
  local status="$1"
  local workspace_path="${2:-}"
  local artifact_root="${3:-}"
  local artifact_ref="${4:-}"
  local next_action="${5:-}"
  export SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_STATUS="$status"
  if [ -n "$workspace_path" ]; then
    export SPEC_FIRST_PROVIDER_GRAPHIFY_REQUIREMENT_WORKSPACE_PATH="$workspace_path"
  fi
  if [ -n "$artifact_root" ]; then
    export SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT="$artifact_root"
  fi
  if [ -n "$artifact_ref" ]; then
    export SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_REF="$artifact_ref"
  fi
  if [ -n "$next_action" ]; then
    export SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_NEXT_ACTION="$next_action"
  fi
}

resolve_requirement_workspace_json() {
  local repo_root="$1"
  local candidate="$2"
  local artifact_candidate="$3"
  python3 - "$repo_root" "$candidate" "$artifact_candidate" <<'PY'
import json
import os
import pathlib
import sys

repo = pathlib.Path(sys.argv[1]).resolve()
raw = sys.argv[2]
artifact_raw = sys.argv[3]

def fail(reason):
    print(json.dumps({"ok": False, "reason_code": reason}))
    sys.exit(0)

if not raw or raw.strip() == "":
    candidate = pathlib.PurePosixPath(".")
else:
    candidate = pathlib.PurePosixPath(raw.replace("\\", "/"))
    if candidate.is_absolute():
        fail("requirement-workspace-absolute")
    if any(part == ".." for part in candidate.parts):
        fail("requirement-workspace-escape")

workspace = (repo / pathlib.Path(*candidate.parts)).resolve(strict=False)
try:
    workspace.relative_to(repo)
except ValueError:
    fail("requirement-workspace-escape")

if not workspace.exists() or not workspace.is_dir():
    fail("requirement-workspace-missing")

artifact_candidate = pathlib.PurePosixPath((artifact_raw or "graphify-out").replace("\\", "/"))
if artifact_candidate.is_absolute():
    fail("graphify-artifact-root-absolute")
if any(part == ".." for part in artifact_candidate.parts):
    fail("graphify-artifact-root-escape")

artifact_root = (repo / pathlib.Path(*artifact_candidate.parts)).resolve(strict=False)
try:
    artifact_root.relative_to(repo)
except ValueError:
    fail("graphify-artifact-root-escape")

rel = pathlib.PurePosixPath(os.path.relpath(workspace, repo).replace(os.sep, "/")).as_posix()
artifact_rel = pathlib.PurePosixPath(os.path.relpath(artifact_root, repo).replace(os.sep, "/")).as_posix()
print(json.dumps({
    "ok": True,
    "workspace_abs": str(workspace),
    "workspace_rel": rel,
    "artifact_abs": str(artifact_root),
    "artifact_rel": artifact_rel,
}))
PY
}

install_graphify_cli() {
  if resolve_graphify_cli_matching_pin >/dev/null 2>&1; then
    return 0
  fi

  if command -v npm >/dev/null 2>&1; then
    if run_npm_global_install_with_optional_sudo "$GRAPHIFY_PACKAGE@$GRAPHIFY_VERSION_PIN" >/dev/null 2>&1; then
      hash -r 2>/dev/null || true
      reset_graphify_resolver
      resolve_graphify_cli_matching_pin >/dev/null 2>&1 && return 0
    fi
  fi

  return 1
}

reset_graphify_resolver() {
  GRAPHIFY_RESOLVED_COMMAND=""
  GRAPHIFY_RESOLVED_ON_PATH=""
  unset SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_COMMAND
  unset SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_ON_PATH
}

resolve_graphify_on_original_path() {
  local found=""
  found="$(PATH="${SPEC_FIRST_PROVIDER_ORIGINAL_PATH:-$GRAPHIFY_ORIGINAL_PATH}" command -v graphify 2>/dev/null || true)"
  if [ -n "$found" ]; then
    printf '%s' "$found"
    return 0
  fi
  return 1
}

graphify_known_cli_candidates() {
  printf '%s\n' \
    "$HOME/.local/bin/graphify" \
    "$HOME/.local/bin/graphify.exe" \
    "$HOME/.local/bin/graphify.cmd"
  if command -v npm >/dev/null 2>&1; then
    local npm_prefix
    npm_prefix="$(npm prefix -g 2>/dev/null || true)"
    if [ -n "$npm_prefix" ]; then
      printf '%s\n' \
        "$npm_prefix/bin/graphify" \
        "$npm_prefix/bin/graphify.exe" \
        "$npm_prefix/bin/graphify.cmd"
    fi
  fi
}

resolve_graphify_cli() {
  if [ -n "$GRAPHIFY_RESOLVED_COMMAND" ]; then
    printf '%s' "$GRAPHIFY_RESOLVED_COMMAND"
    return 0
  fi

  local candidate
  candidate="$(resolve_graphify_on_original_path || true)"
  if [ -n "$candidate" ]; then
    GRAPHIFY_RESOLVED_COMMAND="$candidate"
    GRAPHIFY_RESOLVED_ON_PATH="true"
    export SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_COMMAND="$GRAPHIFY_RESOLVED_COMMAND"
    export SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_ON_PATH="$GRAPHIFY_RESOLVED_ON_PATH"
    printf '%s' "$GRAPHIFY_RESOLVED_COMMAND"
    return 0
  fi

  while IFS= read -r candidate; do
    if [ -f "$candidate" ] && [ -x "$candidate" ]; then
      GRAPHIFY_RESOLVED_COMMAND="$candidate"
      GRAPHIFY_RESOLVED_ON_PATH="false"
      export SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_COMMAND="$GRAPHIFY_RESOLVED_COMMAND"
      export SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_ON_PATH="$GRAPHIFY_RESOLVED_ON_PATH"
      printf '%s' "$GRAPHIFY_RESOLVED_COMMAND"
      return 0
    fi
  done < <(graphify_known_cli_candidates)

  return 1
}

graphify_command_version_matches_pin() {
  local command_path="$1"
  local output
  output="$(run_with_timeout 30 "$command_path" --version 2>/dev/null || true)"
  grep -Eq "(^|[^0-9A-Za-z.])${GRAPHIFY_VERSION_PIN//./\\.}([^0-9A-Za-z.]|$)" <<<"$output"
}

resolve_graphify_cli_matching_pin() {
  reset_graphify_resolver

  local candidate
  candidate="$(resolve_graphify_on_original_path || true)"
  if [ -n "$candidate" ] && graphify_command_version_matches_pin "$candidate"; then
    GRAPHIFY_RESOLVED_COMMAND="$candidate"
    GRAPHIFY_RESOLVED_ON_PATH="true"
    export SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_COMMAND="$GRAPHIFY_RESOLVED_COMMAND"
    export SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_ON_PATH="$GRAPHIFY_RESOLVED_ON_PATH"
    printf '%s' "$GRAPHIFY_RESOLVED_COMMAND"
    return 0
  fi

  while IFS= read -r candidate; do
    if [ -f "$candidate" ] && [ -x "$candidate" ] && graphify_command_version_matches_pin "$candidate"; then
      GRAPHIFY_RESOLVED_COMMAND="$candidate"
      GRAPHIFY_RESOLVED_ON_PATH="false"
      export SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_COMMAND="$GRAPHIFY_RESOLVED_COMMAND"
      export SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_ON_PATH="$GRAPHIFY_RESOLVED_ON_PATH"
      printf '%s' "$GRAPHIFY_RESOLVED_COMMAND"
      return 0
    fi
  done < <(graphify_known_cli_candidates)

  return 1
}

run_graphify_with_timeout() {
  local timeout_seconds="$1"
  shift
  local graphify_command
  graphify_command="$(resolve_graphify_cli)" || return 127
  run_with_timeout "$timeout_seconds" "$graphify_command" "$@"
}

GRAPHIFY_RUN_OUTPUT=""
GRAPHIFY_RUN_DIAGNOSTIC=""
GRAPHIFY_RUN_EXIT_CODE=0

run_graphify_capture() {
  local timeout_seconds="$1"
  shift
  local graphify_command stdout_file stderr_file combined had_errexit=false
  graphify_command="$(resolve_graphify_cli)" || {
    GRAPHIFY_RUN_OUTPUT=""
    GRAPHIFY_RUN_DIAGNOSTIC="graphify CLI not found"
    GRAPHIFY_RUN_EXIT_CODE=127
    return 127
  }
  stdout_file="$(mktemp "${TMPDIR:-/tmp}/spec-graphify-stdout.XXXXXX")"
  stderr_file="$(mktemp "${TMPDIR:-/tmp}/spec-graphify-stderr.XXXXXX")"

  case "$-" in
    *e*) had_errexit=true ;;
  esac
  set +e
  run_with_timeout "$timeout_seconds" "$graphify_command" "$@" >"$stdout_file" 2>"$stderr_file"
  GRAPHIFY_RUN_EXIT_CODE=$?
  if [ "$had_errexit" = "true" ]; then
    set -e
  else
    set +e
  fi

  GRAPHIFY_RUN_OUTPUT="$(cat "$stdout_file")"
  combined="$(cat "$stderr_file" "$stdout_file" | tr '\n' ' ' | cut -c 1-1000)"
  GRAPHIFY_RUN_DIAGNOSTIC="$combined"
  rm -f "$stdout_file" "$stderr_file"
  return "$GRAPHIFY_RUN_EXIT_CODE"
}

graphify_output_requests_force_overwrite() {
  local output="$1"
  grep -qi "Refusing to overwrite" <<<"$output" || return 1
  grep -qi -- "--force" <<<"$output" || return 1
  return 0
}

repair_graphify_hook_path_visibility() {
  local repo_root="$1"
  [ "${SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_ON_PATH:-}" = "false" ] || return 0

  local graphify_command graphify_bin_dir hooks_dir
  graphify_command="$(resolve_graphify_cli)" || return 0
  graphify_bin_dir="$(dirname "$graphify_command")"
  [ -d "$graphify_bin_dir" ] || return 0

  hooks_dir="$repo_root/.git/hooks"
  [ -d "$hooks_dir" ] || return 0

  GRAPHIFY_BIN_DIR="$graphify_bin_dir" python3 - "$hooks_dir/post-commit" "$hooks_dir/post-checkout" <<'PY'
import os
import sys
from pathlib import Path

bin_dir = os.environ["GRAPHIFY_BIN_DIR"]
quoted_bin_dir = bin_dir.replace("'", "'\\''")
repair_block = (
    "# spec-first graphify path repair start\n"
    f"export PATH='{quoted_bin_dir}':\"$PATH\"\n"
    "# spec-first graphify path repair end\n"
)

for raw_path in sys.argv[1:]:
    path = Path(raw_path)
    if not path.is_file():
        continue
    text = path.read_text(encoding="utf-8")
    if "Installed by: graphify hook install" not in text:
        continue
    if "# spec-first graphify path repair start" in text and "# spec-first graphify path repair end" in text:
        before = text.split("# spec-first graphify path repair start", 1)[0]
        after = text.split("# spec-first graphify path repair end", 1)[1]
        new_text = before + repair_block + after.lstrip("\n")
    else:
        lines = text.splitlines(keepends=True)
        insert_at = 1 if lines and lines[0].startswith("#!") else 0
        new_text = "".join(lines[:insert_at]) + repair_block + "".join(lines[insert_at:])
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
PY
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_PATH_REPAIRED=true
}

graphify_cli_version_matches_pin() {
  local graphify_command
  graphify_command="$(resolve_graphify_cli)" || return 1
  graphify_command_version_matches_pin "$graphify_command"
}

graphify_project_platform() {
  case "${SPEC_FIRST_PROVIDER_HOST:-}" in
    claude|codex|kiro|qoder) printf '%s' "$SPEC_FIRST_PROVIDER_HOST" ;;
    *) printf 'codex' ;;
  esac
}

graphify_instruction_file_for_platform() {
  case "$1" in
    claude|windows) printf 'CLAUDE.md' ;;
    *) printf 'AGENTS.md' ;;
  esac
}

render_graphify_instruction_section() {
  case "$1" in
    claude|windows)
      cat <<'EOF'
## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- Use Graphify as exploration-tier orientation for architecture relationships, cross-file relationships, impact analysis, broad codebase navigation, or questions about how one project area connects to another, when `graphify-out/graph.json` exists and a Graphify CLI is runtime-visible. A useful Graphify candidate may decide where to inspect next; reading source first is always valid. Resolve the command as `graphify` from `PATH`, or `$HOME/.local/bin/graphify` (`.exe`/`.cmd` on Windows) when that executable exists. Use `query` for broad orientation; use `path "<A>" "<B>"` for relationships and `explain "<concept>"` for focused concepts. These return a scoped candidate subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Do not use Graphify by default for simple factual Q&A, current conversation or context summaries, user-provided single-document summarization/editing, or already-scoped file reads; answer directly, use `rg`, or perform bounded source reads.
- If `graphify-out/graph.json` exists but no Graphify CLI is visible, do not treat the artifact as runtime readiness. Use bounded direct source reads and mention `/spec:mcp-setup --only graphify` as the setup repair path when Graphify would help.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- Treat Graphify/code-graph output as `provider_untrusted` advisory navigation; confirm important conclusions from source/test/log/doc evidence and record limitations when confirmation is unavailable.
- Ordinary workflows do not refresh project graphs after code changes. Treat graph freshness as a setup/readiness advisory from `docs/contracts/project-graph-consumption.md`; confirm conclusions from source/test/log evidence and use `/spec:mcp-setup --only graphify` when setup repair would help.
EOF
      ;;
    *)
      cat <<'EOF'
## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- Use Graphify as exploration-tier orientation for architecture relationships, cross-file relationships, impact analysis, broad codebase navigation, or questions about how one project area connects to another, when `graphify-out/graph.json` exists and a Graphify CLI is runtime-visible. A useful Graphify candidate may decide where to inspect next; reading source first is always valid. Resolve the command as `graphify` from `PATH`, or `$HOME/.local/bin/graphify` (`.exe`/`.cmd` on Windows) when that executable exists. Use `query` for broad orientation; use `path "<A>" "<B>"` for relationships and `explain "<concept>"` for focused concepts. These return a scoped candidate subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Do not use Graphify by default for simple factual Q&A, current conversation or context summaries, user-provided single-document summarization/editing, or already-scoped file reads; answer directly, use `rg`, or perform bounded source reads.
- If `graphify-out/graph.json` exists but no Graphify CLI is visible, do not treat the artifact as runtime readiness. Use bounded direct source reads and mention `$spec-mcp-setup --only graphify` as the setup repair path when Graphify would help.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- Treat Graphify/code-graph output as `provider_untrusted` advisory navigation; confirm important conclusions from source/test/log/doc evidence and record limitations when confirmation is unavailable.
- Ordinary workflows do not refresh project graphs after code changes. Treat graph freshness as a setup/readiness advisory from `docs/contracts/project-graph-consumption.md`; confirm conclusions from source/test/log evidence and use `$spec-mcp-setup --only graphify` when setup repair would help.
EOF
      ;;
  esac
}

normalize_graphify_instruction_section() {
  local repo_root="$1"
  local platform="$2"
  local instruction_file target section
  instruction_file="$(graphify_instruction_file_for_platform "$platform")"
  target="$repo_root/$instruction_file"
  [ -f "$target" ] || return 0
  section="$(render_graphify_instruction_section "$platform")"
  GRAPHIFY_SECTION="$section" python3 - "$target" <<'PY'
import os
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
section = os.environ["GRAPHIFY_SECTION"].rstrip() + "\n"
content = path.read_text(encoding="utf-8")
pattern = re.compile(r"\n*## graphify\n.*?(?=\n## |\n<!-- spec-first:[^>]+:start -->|\Z)", re.DOTALL)

if "## graphify" in content:
    def replace(match):
        prefix = "" if match.start() == 0 else "\n\n"
        return prefix + section
    new_content = pattern.sub(replace, content, count=1)
else:
    separator = "" if content.endswith("\n") else "\n"
    new_content = f"{content}{separator}\n{section}"

if new_content != content:
    path.write_text(new_content, encoding="utf-8")
PY
}

graphify_project_skill_configured() {
  local repo_root="$1"
  local platform
  platform="$(graphify_project_platform)"
  case "$platform" in
    claude|windows)
      [ -f "$repo_root/.claude/skills/graphify/SKILL.md" ]
      ;;
    kiro)
      [ -f "$repo_root/.kiro/skills/graphify/SKILL.md" ]
      ;;
    qoder)
      [ -f "$repo_root/.qoder/skills/graphify/SKILL.md" ]
      ;;
    *)
      [ -f "$repo_root/.codex/skills/graphify/SKILL.md" ] || [ -f "$repo_root/.agents/skills/graphify/SKILL.md" ]
      ;;
  esac
}

ensure_graphify_project_skill() {
  local repo_root="$1"
  local platform
  platform="$(graphify_project_platform)"
  if graphify_project_skill_configured "$repo_root"; then
    normalize_graphify_instruction_section "$repo_root" "$platform" \
      || stage_log "provider:graphify" "instruction normalization skipped"
    export SPEC_FIRST_PROVIDER_GRAPHIFY_CONFIGURED=true
    stage_log "provider:graphify" "project skill verified"
    return 0
  fi
  install_graphify_project_skill "$repo_root"
}

install_graphify_project_skill() {
  local repo_root="$1"
  local platform
  platform="$(graphify_project_platform)"
  pushd "$repo_root" >/dev/null
  if run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" install --project --platform "$platform" >/dev/null 2>&1; then
    popd >/dev/null
    normalize_graphify_instruction_section "$repo_root" "$platform" \
      || stage_log "provider:graphify" "instruction normalization skipped"
    export SPEC_FIRST_PROVIDER_GRAPHIFY_CONFIGURED=true
    return 0
  fi
  popd >/dev/null
  export SPEC_FIRST_PROVIDER_GRAPHIFY_CONFIGURED=false
  export SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_NEXT_ACTION="graphify-project-skill-install-failed"
  return 1
}

verify_graphify_hook_status_if_available() {
  local repo_root="$1"
  pushd "$repo_root" >/dev/null
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" hook status >/dev/null 2>&1; then
      export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED=true
      export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED=true
      export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS="verified"
      popd >/dev/null
      return 0
    fi
    popd >/dev/null
    return 1
  fi
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED=false
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED=false
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS="skipped"
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_SKIPPED_REASON="not-a-git-repo"
  popd >/dev/null
  return 0
}

install_graphify_hook_if_available() {
  local repo_root="$1"
  pushd "$repo_root" >/dev/null
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" hook install >/dev/null 2>&1; then
      repair_graphify_hook_path_visibility "$repo_root" || stage_log "provider:graphify" "hook PATH repair skipped"
      export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED=true
      if run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" hook status >/dev/null 2>&1; then
        export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED=true
        export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS="verified"
      else
        export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED=false
        export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS="failed"
        export SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_NEXT_ACTION="${SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_NEXT_ACTION:-graphify-hook-status-failed}"
        popd >/dev/null
        return 1
      fi
      popd >/dev/null
      return 0
    fi
    export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED=false
    export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED=false
    export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS="failed"
    export SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_NEXT_ACTION="${SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_NEXT_ACTION:-graphify-hook-install-failed}"
    popd >/dev/null
    return 1
  fi
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED=false
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED=false
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS="skipped"
  export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_SKIPPED_REASON="not-a-git-repo"
  popd >/dev/null
  return 0
}

graphify_first_generation_ready_for_hook() {
  [ "${SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_STATUS:-}" = "completed" ] || return 1
  local repo_root="$PROVIDER_REPO_ROOT"
  local artifact_root="${SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT:-graphify-out}"
  local artifact_ref="${SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_REF:-}"
  if [ -n "$artifact_ref" ] && [ -f "$repo_root/$artifact_ref" ]; then
    return 0
  fi
  [ -f "$repo_root/$artifact_root/graph.json" ] || [ -f "$repo_root/$artifact_root/GRAPH_REPORT.md" ]
}

probe_graphify_query_if_available() {
  local repo_root="$1"
  local artifact_abs="$2"
  local graph_json="$artifact_abs/graph.json"
  [ -f "$graph_json" ] || return 0
  pushd "$repo_root" >/dev/null
  if run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" query "spec-first setup readiness" --graph "$graph_json" >/dev/null 2>&1; then
    export SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED=true
  else
    export SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED=false
  fi
  popd >/dev/null
}

probe_graphify_query_for_existing_artifact_if_available() {
  [ -z "${SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED+x}" ] || return 0
  local repo_root="${SPEC_FIRST_PROVIDER_REPO_ROOT:-$PWD}"
  local artifact_root="${SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT:-graphify-out}"
  local artifact_abs="$repo_root/$artifact_root"
  [ -f "$artifact_abs/graph.json" ] || return 0
  resolve_graphify_cli_matching_pin >/dev/null 2>&1 || return 0
  DEFAULT_STAGE_TIMEOUT_SECONDS="$PROBE_TIMEOUT_SECONDS" probe_graphify_query_if_available "$repo_root" "$artifact_abs" || true
}

graphify_artifact_ref() {
  local repo_root="$1"
  local artifact_rel="$2"
  if [ -f "$repo_root/$artifact_rel/graph.json" ]; then
    printf '%s' "$artifact_rel/graph.json"
    return 0
  fi
  if [ -f "$repo_root/$artifact_rel/GRAPH_REPORT.md" ]; then
    printf '%s' "$artifact_rel/GRAPH_REPORT.md"
    return 0
  fi
  return 1
}

setup_graphify_existing_artifact_if_available() {
  graphify_refresh_requested && return 1

  local repo_root="$PROVIDER_REPO_ROOT"
  local resolved_json workspace_rel artifact_abs artifact_rel artifact_ref_rel

  resolved_json="$(resolve_requirement_workspace_json "$repo_root" "$REQUIREMENT_WORKSPACE" "$GRAPHIFY_ARTIFACT_ROOT_DEFAULT")"
  if [ "$(jq -r '.ok' <<<"$resolved_json")" != "true" ]; then
    return 1
  fi

  workspace_rel="$(jq -r '.workspace_rel' <<<"$resolved_json")"
  artifact_abs="$(jq -r '.artifact_abs' <<<"$resolved_json")"
  artifact_rel="$(jq -r '.artifact_rel' <<<"$resolved_json")"
  artifact_ref_rel="$(graphify_artifact_ref "$repo_root" "$artifact_rel" || true)"
  [ -n "$artifact_ref_rel" ] || return 1

  stage_log "provider:graphify" "existing artifact detected; verifying install state"
  if ! ensure_graphify_project_skill "$repo_root"; then
    stage_log "provider:graphify" "project skill install failed"
    set_graphify_first_generation_fact "skipped" "$workspace_rel" "$artifact_rel" "$artifact_ref_rel" "graphify-project-skill-install-failed"
    return 0
  fi

  DEFAULT_STAGE_TIMEOUT_SECONDS="$PROBE_TIMEOUT_SECONDS" probe_graphify_query_if_available "$repo_root" "$artifact_abs" || true
  set_graphify_first_generation_fact "skipped" "$workspace_rel" "$artifact_rel" "$artifact_ref_rel" "graphify-refresh-recommended"

  if verify_graphify_hook_status_if_available "$repo_root"; then
    stage_log "provider:graphify" "hook verified"
  else
    install_graphify_hook_if_available "$repo_root" || true
  fi
  return 0
}

run_graphify_code_only_fallback() {
  local repo_root="$1"
  local workspace_rel="$2"
  [ "$workspace_rel" = "." ] || return 1
  pushd "$repo_root" >/dev/null
  run_graphify_capture "$DEFAULT_STAGE_TIMEOUT_SECONDS" update .
  local update_status=$?
  popd >/dev/null
  return "$update_status"
}

run_graphify_force_overwrite_repair() {
  local repo_root="$1"
  local workspace_rel="$2"
  [ "$workspace_rel" = "." ] || return 1
  pushd "$repo_root" >/dev/null
  run_graphify_capture "$DEFAULT_STAGE_TIMEOUT_SECONDS" update . --force
  local force_status=$?
  popd >/dev/null
  return "$force_status"
}

run_graphify_first_generation_if_requested() {
  provider_consent_approved "GRAPHIFY" || return 0

  local repo_root="$PROVIDER_REPO_ROOT"
  local resolved_json reason workspace_abs workspace_rel artifact_abs artifact_rel artifact_ref_rel

  resolved_json="$(resolve_requirement_workspace_json "$repo_root" "$REQUIREMENT_WORKSPACE" "$GRAPHIFY_ARTIFACT_ROOT_DEFAULT")"
  if [ "$(jq -r '.ok' <<<"$resolved_json")" != "true" ]; then
    reason="$(jq -r '.reason_code' <<<"$resolved_json")"
    set_graphify_first_generation_fact "skipped" "" "" "" "$reason"
    stage_log "provider:graphify" "first generation skipped ($reason)"
    return 0
  fi

  if ! resolve_graphify_cli >/dev/null 2>&1; then
    set_graphify_first_generation_fact "skipped" "" "" "" "graphify-cli-required"
    stage_log "provider:graphify" "first generation skipped (graphify-cli-required)"
    return 0
  fi

  workspace_abs="$(jq -r '.workspace_abs' <<<"$resolved_json")"
  workspace_rel="$(jq -r '.workspace_rel' <<<"$resolved_json")"
  artifact_abs="$(jq -r '.artifact_abs' <<<"$resolved_json")"
  artifact_rel="$(jq -r '.artifact_rel' <<<"$resolved_json")"
  if graphify_refresh_requested && [ "$workspace_rel" = "." ]; then
    stage_log "provider:graphify" "incremental refresh start"
    set +e
    run_graphify_code_only_fallback "$repo_root" "$workspace_rel"
    refresh_status=$?
    set -e
    if [ "$refresh_status" -eq 0 ]; then
      artifact_ref_rel="$(graphify_artifact_ref "$repo_root" "$artifact_rel" || true)"
      if [ -n "$artifact_ref_rel" ]; then
        probe_graphify_query_if_available "$repo_root" "$artifact_abs"
        set_graphify_first_generation_fact "completed" "$workspace_rel" "$artifact_rel" "$artifact_ref_rel" "graphify-refresh-used"
        stage_log "provider:graphify" "incremental refresh done (exit 0)"
        return 0
      fi
    elif graphify_output_requests_force_overwrite "$GRAPHIFY_RUN_DIAGNOSTIC"; then
      stage_log "provider:graphify" "graphify incremental refresh refused overwrite; trying graphify update . --force once"
      set +e
      run_graphify_force_overwrite_repair "$repo_root" "$workspace_rel"
      local force_status=$?
      set -e
      if [ "$force_status" -eq 0 ]; then
        artifact_ref_rel="$(graphify_artifact_ref "$repo_root" "$artifact_rel" || true)"
        if [ -n "$artifact_ref_rel" ]; then
          probe_graphify_query_if_available "$repo_root" "$artifact_abs"
          set_graphify_first_generation_fact "completed" "$workspace_rel" "$artifact_rel" "$artifact_ref_rel" "graphify-refresh-force-overwrite-used"
          stage_log "provider:graphify" "force-overwrite refresh repair done (exit 0)"
          return 0
        fi
      fi
      set_graphify_first_generation_fact "failed" "$workspace_rel" "$artifact_rel" "" "graphify-refresh-force-overwrite-failed"
      stage_log "provider:graphify" "force-overwrite refresh repair failed (exit $force_status)"
      return 0
    fi

    set_graphify_first_generation_fact "failed" "$workspace_rel" "$artifact_rel" "" "graphify-refresh-failed"
    stage_log "provider:graphify" "incremental refresh done (exit $refresh_status)"
    return 0
  fi

  stage_log "provider:graphify" "first generation start"
  set +e
  if [ "$workspace_rel" = "." ]; then
    pushd "$repo_root" >/dev/null
    run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" extract . >/dev/null 2>&1
    extract_status=$?
    popd >/dev/null
  else
    run_graphify_with_timeout "$DEFAULT_STAGE_TIMEOUT_SECONDS" extract "$workspace_abs" --out "$repo_root" >/dev/null 2>&1
    extract_status=$?
  fi
  set -e
  if [ "$extract_status" -eq 0 ]; then
    artifact_ref_rel="$(graphify_artifact_ref "$repo_root" "$artifact_rel" || true)"
    probe_graphify_query_if_available "$repo_root" "$artifact_abs"
    set_graphify_first_generation_fact "completed" "$workspace_rel" "$artifact_rel" "$artifact_ref_rel" ""
    stage_log "provider:graphify" "first generation done (exit 0)"
    return 0
  fi

  local exit_code="$extract_status"
  if [ "$workspace_rel" = "." ]; then
    stage_log "provider:graphify" "extract failed; trying code-only fallback via graphify update ."
    set +e
    run_graphify_code_only_fallback "$repo_root" "$workspace_rel"
    local fallback_status=$?
    set -e
    if [ "$fallback_status" -eq 0 ]; then
      artifact_ref_rel="$(graphify_artifact_ref "$repo_root" "$artifact_rel" || true)"
      if [ -n "$artifact_ref_rel" ]; then
        probe_graphify_query_if_available "$repo_root" "$artifact_abs"
        set_graphify_first_generation_fact "completed" "$workspace_rel" "$artifact_rel" "$artifact_ref_rel" "graphify-code-only-fallback-used"
        stage_log "provider:graphify" "code-only first generation fallback done (exit 0)"
        return 0
      fi
    elif graphify_output_requests_force_overwrite "$GRAPHIFY_RUN_DIAGNOSTIC"; then
      stage_log "provider:graphify" "graphify update refused overwrite; trying graphify update . --force once"
      set +e
      run_graphify_force_overwrite_repair "$repo_root" "$workspace_rel"
      local force_status=$?
      set -e
      if [ "$force_status" -eq 0 ]; then
        artifact_ref_rel="$(graphify_artifact_ref "$repo_root" "$artifact_rel" || true)"
        if [ -n "$artifact_ref_rel" ]; then
          probe_graphify_query_if_available "$repo_root" "$artifact_abs"
          set_graphify_first_generation_fact "completed" "$workspace_rel" "$artifact_rel" "$artifact_ref_rel" "graphify-force-overwrite-used"
          stage_log "provider:graphify" "force-overwrite first generation repair done (exit 0)"
          return 0
        fi
      fi
      exit_code="$force_status"
      set_graphify_first_generation_fact "failed" "$workspace_rel" "$artifact_rel" "" "graphify-force-overwrite-failed"
      stage_log "provider:graphify" "force-overwrite first generation repair failed (exit $force_status)"
      return 0
    fi
  fi

  set_graphify_first_generation_fact "failed" "$workspace_rel" "$artifact_rel" "" "graphify-first-generation-failed"
  if [ "$exit_code" -eq 124 ]; then
    stage_log "provider:graphify" "first generation timed out after ${DEFAULT_STAGE_TIMEOUT_SECONDS}s"
  else
    stage_log "provider:graphify" "first generation done (exit $exit_code)"
  fi
  return 0
}

install_graphify_provider_if_requested() {
  [ "$MODE" = "install" ] || return 0
  provider_consent_approved "GRAPHIFY" || return 0

  if ! install_graphify_cli; then
    stage_log "provider:graphify" "CLI install failed; skipping Graphify project setup"
    set_graphify_first_generation_fact "skipped" "" "" "" "graphify-cli-install-failed"
    return 0
  fi

  stage_log "provider:graphify" "CLI ready"
  if setup_graphify_existing_artifact_if_available; then
    return 0
  fi

  if graphify_refresh_requested; then
    stage_log "provider:graphify" "incremental refresh requested"
  fi

  if ! ensure_graphify_project_skill "$PROVIDER_REPO_ROOT"; then
    stage_log "provider:graphify" "project skill install failed"
    set_graphify_first_generation_fact "skipped" "" "" "" "graphify-project-skill-install-failed"
    return 0
  fi

  run_graphify_first_generation_if_requested
  if graphify_first_generation_ready_for_hook; then
    install_graphify_hook_if_available "$PROVIDER_REPO_ROOT" || true
  else
    export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED=false
    export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED=false
    export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS="skipped"
    export SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_SKIPPED_REASON="first-generation-not-completed"
    stage_log "provider:graphify" "hook install skipped (first-generation-not-completed)"
  fi
}

finalize_global_skill() {
  local helper_id="$1"
  local skill_name="$2"
  local status="${AST_GREP_SKILL_RESULT:-ready}"
  local dependency_status="${AST_GREP_SKILL_DEPENDENCY_STATUS:-ready}"
  local install_status="${AST_GREP_SKILL_INSTALL_STATUS:-ready}"
  local skill_status="${AST_GREP_SKILL_SKILL_STATUS:-ready}"
  local next_action="${AST_GREP_SKILL_NEXT_ACTION:-}"

  if [ "${AST_GREP_SKILL_INSTALL_QUEUED:-no}" = "yes" ]; then
    if [ "${AST_GREP_SKILL_INSTALL_EXIT_CODE:-1}" -eq 0 ] && global_skill_installed "$skill_name"; then
      dependency_status="ready"
      install_status="ready"
      skill_status="ready"
      status="ready"
      next_action=""
    else
      dependency_status="missing"
      install_status="action-required"
      skill_status="action-required"
      status="action-required"
      if [ "${AST_GREP_SKILL_INSTALL_EXIT_CODE:-1}" -eq 124 ]; then
        next_action="global ${skill_name}-skill install timed out after ${DEFAULT_STAGE_TIMEOUT_SECONDS}s"
      else
        next_action="${next_action:-install global $skill_name skill manually}"
      fi
    fi
  fi

  add_helper_fact "$helper_id" "global-skill" "$dependency_status" "$install_status" "$skill_status" "$status" "$next_action"
}

OS="$(detect_os)"
# 父 shell 预热 install plan，使后续每个 helper 的 safety 查询只走 jq 查表、
# 避免在 add_helper_fact 内按 helper 重复 fork node（详见 lib-helper-registry.sh）。
helper_registry_prewarm_install_plan
process_agent_browser
while IFS= read -r helper; do
  [ "$helper" != "agent-browser" ] || continue
  baseline_blocking="$(helper_registry_baseline_blocking "$helper")"
  process_cli_helper "$helper" "$OS" "$baseline_blocking"
done < <(helper_registry_cli_ids)
# 注意:本机制假定 registry 中恰好一个 global-skill(当前为 ast-grep-skill)。
# process_global_skill 用单一 AST_GREP_SKILL_* 全局命名空间 + 硬编码 install label,
# 末尾 finalize_global_skill 也只对 ast-grep-skill 调用一次。若未来 registry 新增第二个
# kind=global-skill,需把 AST_GREP_SKILL_* 改为按 id 索引并让 finalize 走循环,否则第二个
# skill 的 fact 会被覆盖/丢失。新增 global-skill 时必须同步改造此处。
while IFS= read -r helper_id; do
  skill_name="$(helper_registry_skill_name "$helper_id")"
  [ -n "$skill_name" ] || continue
  process_global_skill "$skill_name" "$helper_id"
done < <(helper_registry_skill_ids)
wait_for_parallel_tasks
finalize_agent_browser \
  "$AGENT_BROWSER_OS" \
  "$AGENT_BROWSER_DEPENDENCY_STATUS" \
  "$AGENT_BROWSER_INSTALL_STATUS" \
  "$AGENT_BROWSER_SKILL_STATUS" \
  "$AGENT_BROWSER_RESULT" \
  "$AGENT_BROWSER_NEXT_ACTION" \
  "$AGENT_BROWSER_BROWSER_INSTALL_QUEUED" \
  "$AGENT_BROWSER_SKILL_INSTALL_QUEUED" \
  "$AGENT_BROWSER_BASELINE_BLOCKING" \
  "${AGENT_BROWSER_INSTALL_SOURCE:-official}" \
  "${AGENT_BROWSER_MIRROR_USED:-false}" \
  "${AGENT_BROWSER_DEMAND_SIGNALS_JSON:-[]}"
finalize_global_skill "ast-grep-skill" "ast-grep"
install_graphify_provider_if_requested
probe_graphify_query_for_existing_artifact_if_available
PROVIDER_JSON="$(node "$SCRIPT_DIR/provider-readiness-renderer.cjs" --source helper --repo-root "${SPEC_FIRST_PROVIDER_REPO_ROOT:-$PWD}" 2>/dev/null || printf '[]')"

jq -n \
  --argjson helper_tools "$HELPER_JSON" \
  --argjson provider_readiness "$PROVIDER_JSON" \
  --arg npm_mirror "$NPM_MIRROR_ENDPOINT" \
  --arg uv_mirror "$UV_MIRROR_ENDPOINT" \
  --arg chrome_mirror "$CHROME_MIRROR_ENDPOINT" \
  '{
    helper_tools: $helper_tools,
    provider_readiness: $provider_readiness,
    mirror_endpoints: {
      npm: $npm_mirror,
      uv: $uv_mirror,
      chrome: $chrome_mirror
    },
    recommended_environment_variables: {
      npm: { npm_config_registry: $npm_mirror },
      uv: { UV_INDEX_URL: $uv_mirror }
    }
  }'
