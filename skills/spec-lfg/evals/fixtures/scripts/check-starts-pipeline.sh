#!/bin/bash
# 断言:显式 spec-lfg 请求后管线已启动(两种合法形态任一):
#   阻塞报告(下游未安装表格,含 spec-plan)或真跑 envelope(plan_path/docs/plans)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
hit = ('spec-plan' in text) or ('docs/plans' in text) or ('plan_path' in text)
sys.exit(0 if hit else 1)
PYEOF
then
  echo '输出未呈现管线 step1 启动证据(spec-plan/docs/plans/plan_path)'
  exit 1
fi
exit 0
