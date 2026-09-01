#!/bin/bash
# 断言:反向 mismatch 被报告而非硬闯——输出呈现不一致/mismatch/需 owner 判定语义。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('mismatch', '不一致', '已存在', 'already', '冲突', 'conflict', 'owner', '所有者', '确认', '计划所有', 'stale', '过期', '漂移', 'drift')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现 mismatch 报告语义'; exit 1; fi
exit 0
