#!/bin/bash
# 硬断言:简化后安全检查仍在(JSON.parse 的 try 防护未被"简化"掉),
# 且输出呈现行为保持验证语义。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if [[ -f src/server.js ]] && grep -q "JSON.parse" src/server.js && ! grep -q "try" src/server.js; then
  echo 'JSON.parse 的 try 防护被简化掉——违反 safety-check 保留合同'
  exit 1
fi
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('behavior', '行为', 'preserv', '保持', 'typecheck', 'lint', 'test', '测试', '验证', 'check')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现行为保持验证语义'; exit 1; fi
exit 0
