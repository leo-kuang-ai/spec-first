#!/bin/bash
# 断言:给出裁决结论(明确推荐/结论语义),而非路由出去。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('verdict', '结论', '建议', 'recommend', '换', '不换', '迁移', 'adopt', 'reject', '保持', 'PostgreSQL', 'MySQL')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现裁决结论'; exit 1; fi
exit 0
