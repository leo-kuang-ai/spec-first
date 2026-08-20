#!/bin/bash
# verify-phase-1a.sh
# 验证 Phase 1A（共享 reference 同步治理）的 source/projection 完整性
#
# Usage: ./scripts/verify-phase-1a.sh
#
# 前置条件：
# - 在 spec-first 项目根目录执行
# - 已运行 sync-shared-references（或没有 drift 待同步）
#
# 验证内容（均为 deterministic，不涉及模型运行）：
# 1. shared source -> package-local projection 的 SHA-256 parity
# 2. skill entrypoint lint
# 3. eval fixture contract tests
# 4. requirements-rendering-parity / plugin-modules 单测
# 5. ce-localization inventory（--verify-only，不落盘）
#
# 注意：本脚本只验证"没有破坏现有 source/projection/consumer 关系"，
# 不产生行数节省的收益声明——净删行数不是 Phase 1A 的目标（见方案文档 §核心原则）。

set -e
set -u
set -o pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_section() {
  echo ""
  echo "========================================"
  echo "  $1"
  echo "========================================"
  echo ""
}

check_project_root() {
  if [[ ! -f "package.json" ]] || [[ ! -d "skills" ]]; then
    log_error "必须在 spec-first 项目根目录执行此脚本"
    exit 1
  fi
  if ! grep -q '"name": "spec-first"' package.json 2>/dev/null; then
    log_error "当前目录的 package.json 不是 spec-first（name 字段不匹配）"
    exit 1
  fi
}

check_dependencies() {
  if [[ ! -d "node_modules" ]]; then
    log_warn "node_modules 不存在，正在安装依赖..."
    npm install
  fi
}

# 1. shared source -> package-local projection parity
run_shared_reference_check() {
  log_section "1. shared-references SHA-256 parity"
  if npm run check:shared-references; then
    log_info "✅ 共享源与 package-local 副本一致，无 drift"
    return 0
  else
    log_error "❌ 检测到 drift：某个 package-local 副本与 skills/_shared/references/ 的共享源不一致"
    log_error "修复方式：先改 skills/_shared/references/<name>.md，再在明确授权下运行 npm run sync:shared-references"
    return 1
  fi
}

# 2. skill entrypoint lint
run_entrypoint_lint() {
  log_section "2. skill entrypoint lint"
  if npm run lint:skill-entrypoints; then
    log_info "✅ 所有 skill 入口通过 lint"
    return 0
  else
    log_error "❌ skill entrypoint lint 失败"
    return 1
  fi
}

# 3. eval fixture contract tests
run_eval_fixtures() {
  log_section "3. eval fixture contract tests"
  if npm run test:eval-fixtures; then
    log_info "✅ eval fixture contract tests 全部通过"
    return 0
  else
    log_error "❌ eval fixture contract tests 失败"
    log_error "这表明某个 examples.json 引用的文件不可达，或 schema 校验失败"
    return 1
  fi
}

# 4. requirements-rendering-parity / plugin-modules 单测
run_focused_unit_tests() {
  log_section "4. requirements-rendering-parity / plugin-modules 单测"
  if npx jest --runInBand tests/unit/requirements-rendering-parity.test.js tests/unit/plugin-modules.test.js; then
    log_info "✅ focused 单测通过"
    return 0
  else
    log_error "❌ focused 单测失败"
    return 1
  fi
}

# 5. ce-localization inventory（只读校验，不落盘写入）
run_localization_inventory_check() {
  log_section "5. ce-localization inventory（--verify-only）"
  if [[ ! -f "scripts/check-ce-localization-review.cjs" ]]; then
    log_warn "⚠️  scripts/check-ce-localization-review.cjs 不存在，跳过此项"
    return 0
  fi
  if node scripts/check-ce-localization-review.cjs --verify-only; then
    log_info "✅ inventory 一致，未发现未记录的 package path 变化"
    return 0
  else
    log_error "❌ inventory 校验失败：存在未记录的 package path / manifest 变化"
    return 1
  fi
}

generate_report() {
  log_section "生成验证报告"
  local report_file="verify-phase-1a-$(date +%Y%m%d-%H%M%S).txt"

  {
    echo "Phase 1A 验证报告"
    echo "================="
    echo ""
    echo "执行时间: $(date)"
    echo "执行目录: $(pwd)"
    echo ""
    echo "验证结果:"
    echo "--------"
    echo "check:shared-references: ${SHARED_REF_RESULT:-UNKNOWN}"
    echo "lint:skill-entrypoints: ${LINT_RESULT:-UNKNOWN}"
    echo "test:eval-fixtures: ${EVAL_RESULT:-UNKNOWN}"
    echo "focused unit tests: ${UNIT_RESULT:-UNKNOWN}"
    echo "ce-localization inventory: ${INVENTORY_RESULT:-UNKNOWN}"
    echo ""
    echo "Git 信息:"
    echo "--------"
    git log -1 --oneline 2>/dev/null || echo "Not in git repo"
  } > "$report_file"

  log_info "验证报告已保存: $report_file"
}

main() {
  log_section "Phase 1A 验证开始"

  check_project_root
  check_dependencies

  local all_passed=true

  if run_shared_reference_check; then SHARED_REF_RESULT="PASSED"; else SHARED_REF_RESULT="FAILED"; all_passed=false; fi
  if run_entrypoint_lint; then LINT_RESULT="PASSED"; else LINT_RESULT="FAILED"; all_passed=false; fi
  if run_eval_fixtures; then EVAL_RESULT="PASSED"; else EVAL_RESULT="FAILED"; all_passed=false; fi
  if run_focused_unit_tests; then UNIT_RESULT="PASSED"; else UNIT_RESULT="FAILED"; all_passed=false; fi
  if run_localization_inventory_check; then INVENTORY_RESULT="PASSED"; else INVENTORY_RESULT="FAILED"; all_passed=false; fi

  generate_report

  log_section "最终结果"

  if $all_passed; then
    log_info "✅ Phase 1A 验证通过"
    log_info "可以生成 review handoff；删除/提交/提 PR 仍需另行授权（见方案文档 §退出条件）"
    return 0
  else
    log_error "❌ Phase 1A 验证失败"
    log_error "保持 source 不变，先分析失败原因"
    return 1
  fi
}

main "$@"
