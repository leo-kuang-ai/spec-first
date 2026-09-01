#!/bin/bash
# 断言:拒绝沉淀未解决问题(语义呈现),且 docs/solutions 未创建(expect 已断言)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('未解决', '还没有解决', 'not solved', '解决后', '证据', 'evidence', '先解决', '拒绝', '不能')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现未解决不沉淀语义'; exit 1; fi
exit 0
