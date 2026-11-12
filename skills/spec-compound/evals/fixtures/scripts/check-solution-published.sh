#!/bin/bash
# 断言:正向发布——docs/solutions/ 产生 learning,frontmatter 含
# problem_type/source_refs/invalidation_condition 核心字段,
# 正文锚定问题事实,汇报含发布语义。不修改 fixture 源文件。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] || true
art=$(find docs/solutions -type f -name '*.md' 2>/dev/null | head -1)
[[ -n "$art" ]] || { echo 'docs/solutions 未产生 learning'; exit 1; }

# SUP-29 fix: 使用正式的 frontmatter promotion validator，
# 检查 frontmatter 结构、source_refs 非空数组、invalidation_condition 非空
validator="$EVAL_SKILL_DIR/scripts/validate-frontmatter.py"
if [[ ! -x "$validator" ]]; then
  echo "SUP-29: validator 不可执行，降级为字段存在性检查" >&2
  for field in problem_type source_refs invalidation_condition date; do
    grep -Eq "^${field}:" "$art" || { echo "learning 缺 frontmatter 字段 ${field}"; exit 1; }
  done
else
  # 调用 promotion 模式校验器，检查确定性晋升底线
  if ! python3 "$validator" --promotion "$art" 2>&1; then
    echo "learning frontmatter 未通过 promotion 校验"
    exit 1
  fi
  # 补充检查 problem_type 和 date 字段存在（promotion 模式只检查 source_refs 和 invalidation_condition）
  for field in problem_type date; do
    grep -Eq "^${field}:" "$art" || { echo "learning 缺 frontmatter 字段 ${field}"; exit 1; }
  done
fi

grep -Eq 'NaN|amount' "$art" || { echo 'learning 未锚定问题事实(NaN/amount)'; exit 1; }
if ! grep -qE 'docs/solutions|Documentation complete|published' <<<"${message:-}"; then
  echo '汇报未含发布语义'
  exit 1
fi
# 源文件不被改动:parseEntry 守卫仍在
grep -q 'Number.isFinite' src/server.js || { echo 'src/server.js 被意外改动'; exit 1; }
exit 0
