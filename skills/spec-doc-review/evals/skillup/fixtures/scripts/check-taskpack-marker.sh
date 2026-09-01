#!/bin/bash
# 通用断言:输出呈现 review 报告语义,且 fixture 文档的 MARKER 原样存在(未被写入)。
# 用法场景:report-only 类 case。MARKER 文件路径通过环境变量 MARKER_FILE 注入不可行
# (script judge 只传 EVAL_FINAL_MESSAGE),故按 case 复制本脚本并替换 MARKER_FILE 默认值。
set -euo pipefail

message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }

MARKER_FILE="${MARKER_FILE:-docs/plans/2026-09-01-monthly-summary-tasks.md}"

if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('finding', 'coverage', '发现', '覆盖', '建议', 'recommendation', 'review')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then
  echo '输出未呈现 review 报告语义(findings/coverage/建议)'
  exit 1
fi

if [[ ! -f "$MARKER_FILE" ]]; then
  echo "目标文档不存在: $MARKER_FILE"
  exit 1
fi
if ! grep -q "DOC-REVIEW-FIXTURE-MARKER" "$MARKER_FILE"; then
  echo "文档被写入(MARKER 丢失)——违反 report-only: $MARKER_FILE"
  exit 1
fi

exit 0
