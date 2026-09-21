#!/bin/bash
# 断言:远程输入被拒绝,输出说明 local/source-owned 范围要求(中英变体)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('本地', 'local', 'source-owned', '远程', 'remote', '仓库根', 'repo')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then
  echo '输出未说明本地输入范围要求'
  exit 1
fi
exit 0
