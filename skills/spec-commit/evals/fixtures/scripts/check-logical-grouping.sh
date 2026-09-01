#!/bin/bash
# 断言:输出呈现逻辑分组/提交决策语义(分组清单、逐一 stage、或提交结果)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('组', 'group', 'README', 'commit', '提交', 'stage', '分支', 'branch')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现逻辑分组/提交决策语义'; exit 1; fi
exit 0
