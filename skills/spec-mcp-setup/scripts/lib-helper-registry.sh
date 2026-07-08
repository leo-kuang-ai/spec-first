#!/bin/bash

helper_registry_path() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  printf '%s\n' "$(dirname "$script_dir")/helper-tools.json"
}

helper_registry_read_node() {
  local query="$1"
  shift
  node - "$(helper_registry_path)" "$query" "$@" <<'NODE'
const fs = require('node:fs');

const [registryPath, query, ...args] = process.argv.slice(2);
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const helpers = Array.isArray(registry.helpers) ? registry.helpers : [];

function helperById(id) {
  return helpers.find((helper) => helper && helper.id === id) || {};
}

function writeLines(values) {
  const filtered = values.filter((value) => value !== undefined && value !== null && String(value).length > 0);
  if (filtered.length > 0) {
    process.stdout.write(`${filtered.map(String).join('\n')}\n`);
  }
}

function writeScalar(value, fallback = '') {
  if (value === undefined || value === null) {
    process.stdout.write(`${fallback}\n`);
    return;
  }
  process.stdout.write(`${String(value)}\n`);
}

switch (query) {
  case 'ids':
    writeLines(helpers.map((helper) => helper.id));
    break;
  case 'cli_ids':
    writeLines(helpers
      .filter((helper) => helper.kind === 'cli' || helper.kind === 'browser-helper')
      .map((helper) => helper.id));
    break;
  case 'skill_ids':
    writeLines(helpers
      .filter((helper) => helper.kind === 'global-skill')
      .map((helper) => helper.id));
    break;
  case 'baseline_blocking':
    writeScalar(helperById(args[0]).baseline_blocking);
    break;
  case 'kind':
    writeScalar(helperById(args[0]).kind);
    break;
  case 'skill_name':
    writeScalar((helperById(args[0]).detection || {}).skill_name);
    break;
  case 'profile': {
    const profiles = helperById(args[0]).profiles;
    writeScalar(Array.isArray(profiles) ? profiles[0] : undefined, 'minimal');
    break;
  }
  case 'source_repo':
    writeScalar((helperById(args[0]).safety || {}).source_repo);
    break;
  case 'install_command': {
    const helper = helperById(args[0]);
    const platform = args[1] || '';
    writeScalar(((helper.installation || {}).commands || {})[platform]);
    break;
  }
  default:
    process.exit(2);
}
NODE
}

helper_registry_ids() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.helpers[].id' "$(helper_registry_path)"
  else
    helper_registry_read_node ids
  fi
}

helper_registry_cli_ids() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.helpers[] | select(.kind == "cli" or .kind == "browser-helper") | .id' "$(helper_registry_path)"
  else
    helper_registry_read_node cli_ids
  fi
}

helper_registry_skill_ids() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.helpers[] | select(.kind == "global-skill") | .id' "$(helper_registry_path)"
  else
    helper_registry_read_node skill_ids
  fi
}

helper_registry_baseline_blocking() {
  local id="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg id "$id" '.helpers[] | select(.id == $id) | .baseline_blocking' "$(helper_registry_path)"
  else
    helper_registry_read_node baseline_blocking "$id"
  fi
}

helper_registry_kind() {
  local id="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg id "$id" '.helpers[] | select(.id == $id) | .kind' "$(helper_registry_path)"
  else
    helper_registry_read_node kind "$id"
  fi
}

helper_registry_skill_name() {
  local id="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg id "$id" '.helpers[] | select(.id == $id) | .detection.skill_name // empty' "$(helper_registry_path)"
  else
    helper_registry_read_node skill_name "$id"
  fi
}

helper_registry_profile() {
  local id="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg id "$id" '.helpers[] | select(.id == $id) | (.profiles[0] // "minimal")' "$(helper_registry_path)"
  else
    helper_registry_read_node profile "$id"
  fi
}

helper_registry_source_repo() {
  local id="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg id "$id" '.helpers[] | select(.id == $id) | .safety.source_repo // empty' "$(helper_registry_path)"
  else
    helper_registry_read_node source_repo "$id"
  fi
}

# ---- 展示用安装命令生成器(单一真相源)----
# install-helpers.sh 与 check-health 历史上各维护一份几乎逐行相同的展示命令生成器,
# 与 registry 的静态 installation.commands 三方漂移。这里收敛为共享函数:
# 两脚本的 install_command_for / build_install_command 对「非 agent-browser」helper
# 一律委派到 helper_registry_install_command_display(agent-browser 因 browser runtime / global skill
# 组合命令语义不同,保留各脚本自有分支)。命令措辞统一为 `A || B` 形式(与历史 install-helpers 一致)。
# 注意:这是「展示/审批近似命令」,真正执行真相源是 install-helpers.sh 的 run_install_command。

helper_registry_linux_package_install_command() {
  local apt_pkg="$1"
  local dnf_pkg="$2"
  local yum_pkg="$3"
  local pacman_pkg="$4"
  local apk_pkg="$5"

  if command -v apt-get >/dev/null 2>&1; then
    echo "sudo apt-get update && sudo apt-get install -y $apt_pkg"
  elif command -v dnf >/dev/null 2>&1; then
    echo "sudo dnf upgrade -y $dnf_pkg || sudo dnf install -y $dnf_pkg"
  elif command -v yum >/dev/null 2>&1; then
    echo "sudo yum update -y $yum_pkg || sudo yum install -y $yum_pkg"
  elif command -v pacman >/dev/null 2>&1; then
    echo "sudo pacman -Syu --needed $pacman_pkg"
  elif command -v apk >/dev/null 2>&1; then
    echo "sudo apk update && sudo apk add --upgrade $apk_pkg"
  else
    echo ""
  fi
}

helper_registry_brew_latest_install_command() {
  local pkg="$1"
  echo "brew update && if brew list --formula $pkg >/dev/null 2>&1; then brew upgrade -q $pkg; else brew install -q $pkg; fi"
}

helper_registry_winget_latest_install_command() {
  local package_id="$1"
  echo "winget upgrade --id $package_id -e --silent --accept-package-agreements --accept-source-agreements || winget install --id $package_id -e --silent --accept-package-agreements --accept-source-agreements"
}

# 非 agent-browser helper 的展示命令派发。agent-browser 由各脚本自行处理(返回空串)。
helper_registry_install_command_display() {
  local name="$1"
  local os="$2"
  local linux_cmd
  case "$name" in
    gh)
      if [ "$os" = "windows" ]; then
        helper_registry_winget_latest_install_command "GitHub.cli"
      elif [ "$os" = "linux" ]; then
        linux_cmd="$(helper_registry_linux_package_install_command gh gh gh github-cli github-cli)"
        echo "${linux_cmd:-Install gh from https://cli.github.com}"
      else
        helper_registry_brew_latest_install_command "gh"
      fi
      ;;
    jq)
      if [ "$os" = "windows" ]; then
        helper_registry_winget_latest_install_command "jqlang.jq"
      elif [ "$os" = "linux" ]; then
        linux_cmd="$(helper_registry_linux_package_install_command jq jq jq jq jq)"
        echo "${linux_cmd:-Install jq from https://jqlang.github.io/jq/}"
      else
        helper_registry_brew_latest_install_command "jq"
      fi
      ;;
    vhs)
      if [ "$os" = "linux" ] || [ "$os" = "windows" ]; then
        if command -v go >/dev/null 2>&1; then echo "go install github.com/charmbracelet/vhs@latest"; else echo "Install vhs from https://github.com/charmbracelet/vhs"; fi
      else
        helper_registry_brew_latest_install_command "vhs"
      fi
      ;;
    silicon)
      if [ "$os" = "linux" ] || [ "$os" = "windows" ]; then
        if command -v cargo >/dev/null 2>&1; then echo "cargo install silicon --force"; else echo "Install silicon from https://github.com/Aloxaf/silicon"; fi
      else
        helper_registry_brew_latest_install_command "silicon"
      fi
      ;;
    ffmpeg)
      if [ "$os" = "windows" ]; then
        helper_registry_winget_latest_install_command "Gyan.FFmpeg"
      elif [ "$os" = "linux" ]; then
        linux_cmd="$(helper_registry_linux_package_install_command ffmpeg ffmpeg ffmpeg ffmpeg ffmpeg)"
        echo "${linux_cmd:-Install ffmpeg from https://ffmpeg.org/download.html}"
      else
        helper_registry_brew_latest_install_command "ffmpeg"
      fi
      ;;
    ast-grep)
      if [ "$os" = "windows" ]; then
        echo "npm install -g @ast-grep/cli@latest"
      elif [ "$os" = "linux" ]; then
        if command -v cargo >/dev/null 2>&1; then echo "cargo install ast-grep --locked --force"; elif command -v npm >/dev/null 2>&1; then echo "npm install -g @ast-grep/cli@latest"; else echo "Install ast-grep from https://ast-grep.github.io"; fi
      else
        helper_registry_brew_latest_install_command "ast-grep"
      fi
      ;;
    ast-grep-skill)
      echo "npx -y skills@latest add ast-grep/agent-skill -g -y"
      ;;
    *)
      echo ""
      ;;
  esac
}

# setup-plan-renderer.cjs 一次性算出全部 helper 的 install plan（含 safety_result）。
# 为避免按 helper 重复 fork node，caller 应在主循环前于父 shell 调用
# helper_registry_prewarm_install_plan 预热全局 SETUP_INSTALL_PLAN_JSON；
# helper_registry_safety_result 优先从该全局变量用 jq 查表（jq fork ~8ms ≪ node 冷启 ~38ms）。
# 注意：命令替换 $(...) 子 shell 无法回写父 shell 变量，故预热必须发生在父 shell 主流程，
# 而非依赖 lib 内惰性赋值。未预热时回退单次 node（兜底，仍正确但较慢）。bash 3.2 兼容。
SETUP_INSTALL_PLAN_JSON=""

helper_registry_prewarm_install_plan() {
  SETUP_INSTALL_PLAN_JSON="$(node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setup-plan-renderer.cjs" 2>/dev/null || printf '{"planned_operations":[]}')"
}

helper_registry_safety_result() {
  local id="$1"
  local plan_json="$SETUP_INSTALL_PLAN_JSON"
  if [ -z "$plan_json" ]; then
    plan_json="$(node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setup-plan-renderer.cjs" 2>/dev/null || printf '{"planned_operations":[]}')"
  fi
  printf '%s' "$plan_json" \
    | jq -r --arg id "$id" '.planned_operations[] | select(.id == $id) | .safety_result // "unknown"'
}
