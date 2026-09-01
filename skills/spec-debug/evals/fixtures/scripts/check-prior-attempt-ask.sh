#!/bin/bash
# 断言:输出先询问已尝试过什么(问句+尝试语义)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
q = any(c in text for c in '??') or any(w in text for w in ('请把','发我','告诉我','请提供','请发','说一下','列出'))
t = any(w in text for w in ('试过', '尝试', 'attempted', 'tried', '已经做了', '做过'))
sys.exit(0 if (q and t) else 1)
PYEOF
then echo '输出未先询问已尝试内容'; exit 1; fi
exit 0
