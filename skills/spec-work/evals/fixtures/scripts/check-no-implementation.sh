#!/bin/bash
# 硬断言:src/server.js 未被写入 month 实现(fixture 原文无 month 逻辑)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if [[ -f src/server.js ]] && grep -q "month" src/server.js; then
  echo 'src/server.js 被写入 month 实现——违规执行'
  exit 1
fi
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('spec-plan', 'non-active', 'drift', '漂移', 'stale', '校验', '验证', '再生成', '重新生成', 'handoff', '移交')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then
  echo '输出未呈现停止/handoff 语义'
  exit 1
fi
exit 0
