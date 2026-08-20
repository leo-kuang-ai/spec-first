#!/bin/bash
# verify-with-gate.sh
# 用 benchmarks/agentic/run.py 的真实行为门验证一个 skill 修改的正确率与成本影响
#
# Usage: ./scripts/verify-with-gate.sh [task-id] [arms] [n] [model]
#   task-id : benchmarks/agentic/tasks.py 中已注册的 task id（默认 "cache"——
#             当前 checklist 最高优先级候选项用它测 spec-debug 误用回归，见
#             docs/10-prompt/spec-first代码审查方案.md 执行模板 B）
#   arms    : 逗号分隔的臂列表（默认 "baseline,spec-work,spec-debug"）
#   n       : 每臂运行次数（默认 6）
#   model   : "haiku" | "sonnet" | "opus"（默认 "sonnet"）
#
# Example:
#   ./scripts/verify-with-gate.sh cache baseline,spec-work,spec-debug 6 sonnet
#   ./scripts/verify-with-gate.sh trace-transfer baseline,spec-debug 6 sonnet
#
# 前置条件：
# - benchmarks/agentic/run.py 存在（--selftest 必须先通过，否则拒绝花钱调 API）
# - Python 3 已配置
# - ANTHROPIC_API_KEY 或 ANTHROPIC_AUTH_TOKEN(+ANTHROPIC_BASE_URL) 已设置，
#   且模型别名在该认证下的 allowlist 内。映射错了会 24 个 cell 全 403，
#   但 tok=0/cost=$0，评分器不会自动识别——本脚本会先跑 1-cell smoke test 探路，
#   再决定是否继续跑 n 次完整门测。
#
# 输出：
# - 原始结果在 benchmarks/agentic/runs/<stamp>/{results.json,summary.json}
# - 本脚本额外生成 verify-<task>-<stamp>.md 汇总报告

set -e
set -u
set -o pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_section() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

TASK=${1:-cache}
ARMS=${2:-baseline,spec-work,spec-debug}
N=${3:-6}
MODEL=${4:-sonnet}

validate_params() {
  log_section "验证参数"

  if [[ ! -f "benchmarks/agentic/tasks.py" ]]; then
    log_error "benchmarks/agentic/tasks.py 不存在，无法确认 task id 是否已注册"
    exit 1
  fi

  # task id 必须在 TASKS 字典里；直接用 python3 import 真值，不用 grep 猜缩进
  # （grep '"...":'  会把每个 task 内部的 "prompt"/"file"/"good" 等字段也当成 task id）
  local known_tasks
  known_tasks=$(cd benchmarks/agentic && python3 -c "from tasks import TASKS; print('\n'.join(sorted(TASKS)))")

  if ! grep -qxF "$TASK" <<< "$known_tasks"; then
    log_error "task id '$TASK' 未在 benchmarks/agentic/tasks.py 的 TASKS 中注册"
    log_info "已知 task id："
    echo "$known_tasks" | sed 's/^/  /'
    exit 1
  fi

  if ! [[ "$N" =~ ^[0-9]+$ ]] || [[ "$N" -lt 1 ]]; then
    log_error "n 必须是正整数，当前值: $N"
    exit 1
  fi

  case "$MODEL" in
    haiku|sonnet|opus) ;;
    *) log_warn "模型名称可能无效: $MODEL（run.py 的 MODELS 只认识 haiku/sonnet/opus）" ;;
  esac

  log_info "Task: $TASK"
  log_info "Arms: $ARMS"
  log_info "N per arm: $N"
  log_info "Model: $MODEL"
}

check_prerequisites() {
  log_section "检查前置条件"

  if [[ ! -f "package.json" ]] || [[ ! -d "benchmarks/agentic" ]]; then
    log_error "必须在 spec-first 项目根目录执行"
    exit 1
  fi

  if ! command -v python3 &> /dev/null; then
    log_error "未找到 python3"
    exit 1
  fi
  log_info "Python: $(python3 --version)"

  if ! command -v node &> /dev/null; then
    log_error "未找到 node（用于解析 summary.json）"
    exit 1
  fi

  # run.py 内部调 `claude -p ...` CLI，认证既可能是官方 ANTHROPIC_API_KEY，
  # 也可能是网关代理的 ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL；两种都接受，
  # 但网关/自定义 base_url 下模型别名是否在 allowlist 内是未知的——
  # run.py 的注释本身就警告过：模型不在 allowlist 会 24 个 cell 全 403 却报满分。
  if [[ -z "${ANTHROPIC_API_KEY:-}" && -z "${ANTHROPIC_AUTH_TOKEN:-}" ]]; then
    log_error "既未设置 ANTHROPIC_API_KEY 也未设置 ANTHROPIC_AUTH_TOKEN"
    exit 1
  fi
  if [[ -n "${ANTHROPIC_AUTH_TOKEN:-}" ]]; then
    log_warn "检测到 ANTHROPIC_AUTH_TOKEN${ANTHROPIC_BASE_URL:+ + ANTHROPIC_BASE_URL=$ANTHROPIC_BASE_URL}（网关代理）"
    log_warn "模型别名（$MODEL → run.py 的 MODELS 字典）是否在该网关的 allowlist 内未知"
    log_warn "强烈建议先跑 1-cell smoke test 再上 n=$N，否则可能重演 403-全失败-却报满分 的假绿事故"
  fi

  log_info "✅ 前置条件满足"
}

# 1-cell smoke test：花最小成本确认认证/模型别名真的能跑通，
# 避免在网关代理场景下直接烧 n=6 全失败又被误判成满分（参见 verify-benchmark-ran-before-trusting）
run_smoke_test() {
  log_section "1-cell smoke test（确认认证与模型别名可用）"

  local first_arm
  first_arm=$(cut -d',' -f1 <<< "$ARMS")

  local before_dirs after_dirs new_dirs new_count smoke_run
  before_dirs=$(ls benchmarks/agentic/runs 2>/dev/null || true)
  ( cd benchmarks/agentic && \
    python3 run.py --task "$TASK" --arms "$first_arm" --model "$MODEL" --runs 1 --workers 1 )
  after_dirs=$(ls benchmarks/agentic/runs 2>/dev/null || true)
  new_dirs=$(comm -13 <(echo "$before_dirs" | sort) <(echo "$after_dirs" | sort))
  new_count=$(grep -c . <<< "$new_dirs" || true)
  if [[ "$new_count" != "1" ]]; then
    log_error "smoke test 需要且只能产生一个新 runs 目录，实际发现 $new_count 个"
    log_error "可能存在并发 benchmark；拒绝用 latest 目录猜测本次结果"
    exit 1
  fi
  smoke_run=$(head -1 <<< "$new_dirs")
  local smoke_summary="benchmarks/agentic/runs/$smoke_run/summary.json"

  if [[ ! -f "$smoke_summary" ]]; then
    log_error "smoke test 未生成 summary.json，无法确认认证是否成功"
    exit 1
  fi

  local smoke_tok smoke_cost smoke_correct smoke_fail
  smoke_tok=$(node -e "const r=require(require('path').resolve('$smoke_summary'))[0]; console.log(r.total_tokens_mean)")
  smoke_cost=$(node -e "const r=require(require('path').resolve('$smoke_summary'))[0]; console.log(r.cost_mean)")
  smoke_correct=$(node -e "const r=require(require('path').resolve('$smoke_summary'))[0]; console.log(r.correct_rate)")
  smoke_fail=$(node -e "const r=require(require('path').resolve('$smoke_summary'))[0]; console.log(r.n_api_failed||0)")

  log_info "smoke test 结果: tokens=$smoke_tok cost=\$$smoke_cost correct_rate=$smoke_correct api_failed=$smoke_fail"

  if [[ "$smoke_fail" != "0" ]] || [[ "$smoke_tok" == "0" || "$smoke_tok" == "null" ]]; then
    log_error "🔴 smoke test 失败或零 token——认证/模型别名在当前网关下不可用"
    log_error "   不要继续跑 n=$N，先排查 ANTHROPIC_AUTH_TOKEN/ANTHROPIC_BASE_URL/模型别名映射"
    exit 1
  fi

  log_info "✅ smoke test 通过，认证与模型别名可用，可以继续跑 n=$N 的完整门测"
}

run_selftest() {
  log_section "运行 instrument selftest（不花 API 费用）"
  ( cd benchmarks/agentic && python3 run.py --selftest )
  log_info "✅ selftest 通过，fixture 的 good/bad ref 评分符合预期"
}

run_gate() {
  log_section "运行行为门：task=$TASK arms=$ARMS n=$N model=$MODEL"
  log_info "这会花真实的 API 费用，且可能需要几分钟到几十分钟，请等待..."

  local before_dirs after_dirs new_dirs new_count new_dir
  before_dirs=$(ls benchmarks/agentic/runs 2>/dev/null || true)

  # cells are fully isolated (own workdir + own claude context) per run.py's own comments,
  # so parallelizing is safe; run.py's own default is 4 — match it instead of serializing
  # real-money cells for no safety benefit.
  ( cd benchmarks/agentic && \
    python3 run.py --task "$TASK" --arms "$ARMS" --model "$MODEL" --runs "$N" --workers 4 )

  after_dirs=$(ls benchmarks/agentic/runs 2>/dev/null || true)
  new_dirs=$(comm -13 <(echo "$before_dirs" | sort) <(echo "$after_dirs" | sort))
  new_count=$(grep -c . <<< "$new_dirs" || true)

  if [[ "$new_count" != "1" ]]; then
    log_error "行为门需要且只能产生一个新 runs 目录，实际发现 $new_count 个"
    log_error "可能存在并发 benchmark；拒绝用最后一个目录猜测本次结果"
    exit 1
  fi
  new_dir=$(head -1 <<< "$new_dirs")

  RUN_DIR="benchmarks/agentic/runs/$new_dir"
  log_info "结果目录: $RUN_DIR"

  if [[ ! -f "$RUN_DIR/summary.json" ]]; then
    log_error "未找到 $RUN_DIR/summary.json"
    exit 1
  fi
}

# 用 node 解析 summary.json，按 arm 提取 correct_rate/cost_mean/n/n_api_failed/total_tokens_mean
parse_and_check_authenticity() {
  log_section "解析结果并核实运行真实性"

  SUMMARY_JSON=$(node -e "
    const rows = require(require('path').resolve('$RUN_DIR/summary.json'));
    for (const r of rows) {
      console.log([r.task, r.arm, r.model, r.n, r.n_api_failed || 0,
                   r.correct_rate, r.cost_mean, r.total_tokens_mean].join('|'));
    }
  ")

  echo "$SUMMARY_JSON" | column -t -s'|' -N "task,arm,model,n,api_fail,correct_rate,cost_mean,tok_mean" 2>/dev/null || echo "$SUMMARY_JSON"

  local any_suspect=false
  local any_partial=false
  while IFS='|' read -r task arm model n api_fail correct_rate cost_mean tok_mean; do
    [[ -z "$task" ]] && continue
    if [[ "$api_fail" != "0" ]]; then
      log_error "🔴 $arm 有 $api_fail 个 cell 失败；该臂只有 n=$n 个有效测量，不能与完整臂作确认性比较"
      any_partial=true
    fi
    # fail-loud 检测：零 token 又报出正确率，是 403 假绿的典型破绽
    if [[ "$tok_mean" == "0" || "$tok_mean" == "null" ]] && [[ "$correct_rate" != "null" ]]; then
      log_error "🔴 假绿信号：$arm 的 total_tokens_mean=$tok_mean 但 correct_rate=$correct_rate"
      log_error "   这与 API 全部失败、评分器把 seed 当成 agent 输出的已知事故模式一致"
      log_error "   参见 [[verify-benchmark-ran-before-trusting]]，先去查 $RUN_DIR/results.json 的 is_error/api_error_status"
      any_suspect=true
    fi
  done <<< "$SUMMARY_JSON"

  if $any_suspect; then
    log_error "检测到疑似假绿数据，拒绝继续判断——先核实 $RUN_DIR/results.json 再重跑"
    return 1
  fi

  if $any_partial; then
    log_error "检测到部分运行失败，拒绝把不等样本量结果判为 PASSED/FAILED；请补跑完整对照"
    return 1
  fi

  log_info "✅ 未发现零 token 满分的假绿信号"
  return 0
}

# 提取某个 arm 在某个 task 上的字段（用于后续对比）
get_field() {
  local arm=$1 field=$2
  node -e "
    const rows = require(require('path').resolve('$RUN_DIR/summary.json'));
    const row = rows.find(r => r.task === '$TASK' && r.arm === '$arm');
    console.log(row ? (row['$field'] === null ? 'null' : row['$field']) : 'null');
  "
}

compare_arms() {
  log_section "结果对比（以 baseline 为基准，若存在）"

  local arms_list
  IFS=',' read -ra arms_list <<< "$ARMS"

  if [[ ! " ${arms_list[*]} " =~ " baseline " ]]; then
    log_warn "本次未包含 baseline 臂，只能罗列各臂结果，无法计算相对差异"
    for arm in "${arms_list[@]}"; do
      local cr cm
      cr=$(get_field "$arm" correct_rate)
      cm=$(get_field "$arm" cost_mean)
      log_info "$arm: correct_rate=$cr cost_mean=\$$cm"
    done
    VERIFICATION_RESULT="UNVERIFIED_NO_BASELINE"
    return 0
  fi

  local base_cr base_cm
  base_cr=$(get_field baseline correct_rate)
  base_cm=$(get_field baseline cost_mean)

  if [[ "$base_cr" == "null" ]]; then
    log_error "baseline 的 correct_rate 是 null（可能全部 cell API 失败），无法比较"
    VERIFICATION_RESULT="UNVERIFIED_BASELINE_FAILED"
    return 1
  fi

  log_info "baseline: correct_rate=$base_cr cost_mean=\$$base_cm"

  local overall_passed=true
  for arm in "${arms_list[@]}"; do
    [[ "$arm" == "baseline" ]] && continue
    local cr cm
    cr=$(get_field "$arm" correct_rate)
    cm=$(get_field "$arm" cost_mean)

    if [[ "$cr" == "null" ]]; then
      log_warn "$arm 的 correct_rate 是 null（可能全部 cell API 失败），跳过判断"
      continue
    fi

    log_info "$arm: correct_rate=$cr cost_mean=\$$cm"

    local cr_delta cost_ratio
    cr_delta=$(node -e "console.log(($cr - $base_cr).toFixed(3))")
    cost_ratio=$(node -e "console.log($base_cm > 0 ? ($cm / $base_cm).toFixed(2) : 'Infinity')")

    log_info "  vs baseline: correct_rate delta=$cr_delta, cost ratio=${cost_ratio}x"

    local arm_passed=true
    if node -e "process.exit($cr_delta < 0 ? 1 : 0)"; then
      log_info "  ✅ 正确率未下降"
    else
      log_error "  ❌ 正确率相对 baseline 下降 $cr_delta"
      arm_passed=false
    fi

    if node -e "process.exit(parseFloat('$cost_ratio') > 1.5 ? 1 : 0)" 2>/dev/null; then
      log_info "  ✅ 成本增加在 50% 以内"
    else
      log_error "  ❌ 成本比 baseline 高 ${cost_ratio}x（超过 1.5x 门槛）"
      arm_passed=false
    fi

    if node -e "process.exit($cr_delta == 0 && parseFloat('$cost_ratio') >= 2.0 ? 1 : 0)" 2>/dev/null; then
      : # no-op, arm already flagged above if cost_ratio > 1.5
    else
      if node -e "process.exit($cr_delta == 0 ? 0 : 1)" 2>/dev/null && \
         node -e "process.exit(parseFloat('$cost_ratio') >= 2.0 ? 0 : 1)" 2>/dev/null; then
        log_warn "  ⚠️  正确率无变化但成本翻倍以上，属于净负收益（参见 [[spec-debug-root-cause-saturated]]）"
        arm_passed=false
      fi
    fi

    if ! $arm_passed; then overall_passed=false; fi
  done

  if $overall_passed; then
    VERIFICATION_RESULT="PASSED"
  else
    VERIFICATION_RESULT="FAILED"
  fi
}

generate_report() {
  log_section "生成验证报告"

  local report_file="verify-${TASK}-$(date +%Y%m%d-%H%M%S).md"

  {
    echo "# ${TASK} 行为门验证报告"
    echo ""
    echo "**执行时间**: $(date)"
    echo "**Task**: \`${TASK}\`"
    echo "**Arms**: \`${ARMS}\`"
    echo "**N per arm**: \`${N}\`"
    echo "**Model**: \`${MODEL}\`"
    echo "**验证结果**: ${VERIFICATION_RESULT:-UNKNOWN}"
    echo ""
    echo "## 原始数据"
    echo ""
    echo '```'
    node -e "console.log(JSON.stringify(require(require('path').resolve('$RUN_DIR/summary.json')), null, 2))"
    echo '```'
    echo ""
    echo "## 原始输出"
    echo ""
    echo "- \`$RUN_DIR/results.json\`"
    echo "- \`$RUN_DIR/summary.json\`"
    echo ""
    echo "## 判断标准"
    echo ""
    echo "- 正确率相对 baseline 不下降"
    echo "- 成本增加 <50%"
    echo "- 正确率相同但成本翻倍以上 → 视为净负收益，判失败"
    echo "- 零 token 但报出正确率 → 假绿信号，先核实再判断"
    echo ""
    echo "## 参考"
    echo ""
    echo "- 方案文档: \`docs/10-prompt/spec-first代码审查方案.md\`"
    echo "- Memory: [[spec-debug-root-cause-saturated]], [[verify-benchmark-ran-before-trusting]]"
  } > "$report_file"

  log_info "验证报告已保存: $report_file"
}

main() {
  log_section "开始行为门验证"

  validate_params
  check_prerequisites
  run_selftest
  if [[ -n "${ANTHROPIC_AUTH_TOKEN:-}" ]]; then
    run_smoke_test
  fi
  run_gate

  if ! parse_and_check_authenticity; then
    log_section "❌ 数据疑似不可信，终止"
    exit 1
  fi

  compare_arms
  generate_report

  case "${VERIFICATION_RESULT:-UNKNOWN}" in
    PASSED)
      log_section "✅ 验证通过"
      exit 0
      ;;
    UNVERIFIED_NO_BASELINE|UNVERIFIED_BASELINE_FAILED)
      log_section "⚠️  未验证（缺基准或基准失效）"
      exit 2
      ;;
    *)
      log_section "❌ 验证失败"
      exit 1
      ;;
  esac
}

main "$@"
