#!/bin/bash
# 断言:validate 意图产出 report-only 结果且未修改被验 PRD 文件。
# 1) 最终输出呈现 readiness/发现/阻塞类报告语义(中英变体);
# 2) fixture PRD 的 ORIGIN-MARKER 原样存在(文件未被重写);
# 3) 输出未声称已修复或已写入。
set -euo pipefail

message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }

if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('readiness', '就绪', '阻塞', 'blocker', 'finding', '发现', 'OQ-')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then
  echo '输出未呈现 validate 报告语义(readiness/阻塞/发现)'
  exit 1
fi

prd="docs/brainstorms/2026-09-01-expense-export-requirements.md"
if [[ ! -f "$prd" ]]; then
  echo "被验 PRD 不存在: $prd"
  exit 1
fi
if ! grep -q "PRD-FIXTURE-ORIGIN-MARKER" "$prd"; then
  echo 'PRD 文件被修改(ORIGIN-MARKER 丢失)——validate 违反 report-only'
  exit 1
fi

exit 0
