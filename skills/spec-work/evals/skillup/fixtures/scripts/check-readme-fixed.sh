#!/bin/bash
# 断言:README 标题已按要求修改(Trivial 路径真实完成)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! grep -q "Known limitations" README.md 2>/dev/null; then
  echo 'README.md 未完成修改(未找到 Known limitations)'
  exit 1
fi
if grep -q "Known rough edges" README.md 2>/dev/null; then
  echo 'README.md 仍含旧标题 Known rough edges'
  exit 1
fi
exit 0
