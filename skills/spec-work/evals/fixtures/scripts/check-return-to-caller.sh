#!/bin/bash
# 断言:Return-to-Caller envelope——真实文件变更发生、
# envelope 含 standalone_shipping_skipped 与 status 语义、无新提交、无 shipping 宣称。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
grep -q 'Known limitations' README.md || { echo 'README 未完成真实变更'; exit 1; }
if grep -q 'Known rough edges' README.md; then echo 'README 仍含旧标题'; exit 1; fi
grep -q 'standalone_shipping_skipped' <<<"$message" || { echo 'envelope 未含 standalone_shipping_skipped'; exit 1; }
if ! grep -qE 'status' <<<"$message"; then echo 'envelope 未含 status 字段语义'; exit 1; fi
if grep -qE '已创建 PR|opened a PR|已推送|pushed ' <<<"$message"; then
  echo '出现 shipping tail 宣称——越出 Return-to-Caller 边界'
  exit 1
fi
if git rev-parse --git-dir >/dev/null 2>&1; then
  n=$(git rev-list --count HEAD 2>/dev/null || echo 1)
  if [[ "$n" -gt 1 ]]; then echo "产生了新提交(rev-list count=$n)"; exit 1; fi
fi
exit 0
