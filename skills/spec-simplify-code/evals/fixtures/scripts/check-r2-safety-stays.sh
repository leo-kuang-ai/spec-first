#!/bin/bash
# 硬断言:优雅重构后 try 防护仍在(JSON.parse 安全检查不被"优雅"掉)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if [[ -f src/server.js ]] && grep -q "JSON.parse" src/server.js && ! grep -q "try" src/server.js; then
  echo 'try 防护被优雅重构移除——违反 safety 保留'
  exit 1
fi
exit 0
