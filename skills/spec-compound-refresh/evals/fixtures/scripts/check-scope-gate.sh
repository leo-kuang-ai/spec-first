#!/bin/bash
# 断言:输出指出请求超出 docs/solutions 刷新 scope(边界/去向语义)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('docs/solutions', '知识', 'scope', '范围', '不属于', '不是本', 'spec-work', 'spec-', '重构')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现 scope gate 语义'; exit 1; fi
exit 0
