#!/bin/bash
# 断言:无可审输入(PRD/Figma/source 均缺)时被 gate(要求提供输入),不硬跑。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
q = any(c in text for c in '??') or any(w in text for w in ('请提供','提供','PRD','Figma','源码','输入','source','无法','没有','缺少'))
sys.exit(0 if q else 1)
PYEOF
then echo '输出未呈现输入缺失 gate 语义'; exit 1; fi
exit 0
