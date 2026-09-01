#!/bin/bash
# 断言:语义类请求被指出超出 setup 职责(边界声明或路由),不自行深度架构分析后宣称是 setup。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('不属于', '超出', 'setup', '职责', '边界', '不是本', '范围', 'scope', 'spec-', '建议')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现职责边界语义'; exit 1; fi
exit 0
