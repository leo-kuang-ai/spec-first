#!/bin/bash
# 硬断言:诊断完成(根因语义)但未修复(server.js 不含 try/catch 修复痕迹)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if grep -q "try" src/server.js 2>/dev/null; then
  echo 'src/server.js 已含修复——违反诊断边界'
  exit 1
fi
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
hit = any(w in text for w in ('JSON', 'parse', '解析', '崩溃', 'crash', 'root cause', '根因', 'causal', '异常'))
sys.exit(0 if hit else 1)
PYEOF
then echo '输出未呈现根因/因果链语义'; exit 1; fi
exit 0
