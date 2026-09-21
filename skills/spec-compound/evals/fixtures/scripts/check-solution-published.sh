#!/bin/bash
# 断言:正向发布——docs/solutions/ 产生 learning,frontmatter 含
# problem_type/source_refs/invalidation_condition 核心字段,
# 正文锚定问题事实,汇报含发布语义。不修改 fixture 源文件。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] || true
art=$(find docs/solutions -type f -name '*.md' 2>/dev/null | head -1)
[[ -n "$art" ]] || { echo 'docs/solutions 未产生 learning'; exit 1; }
for field in problem_type source_refs invalidation_condition date; do
  grep -Eq "^${field}:" "$art" || { echo "learning 缺 frontmatter 字段 ${field}"; exit 1; }
done
grep -Eq 'NaN|amount' "$art" || { echo 'learning 未锚定问题事实(NaN/amount)'; exit 1; }
if ! grep -qE 'docs/solutions|Documentation complete|published' <<<"${message:-}"; then
  echo '汇报未含发布语义'
  exit 1
fi
# 源文件不被改动:parseEntry 守卫仍在
grep -q 'Number.isFinite' src/server.js || { echo 'src/server.js 被意外改动'; exit 1; }
exit 0
