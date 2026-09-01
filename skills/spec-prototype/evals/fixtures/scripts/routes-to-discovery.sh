#!/bin/bash
# 断言:输出把 product-discovery 类请求指向 ideate/brainstorm 目的地(中英变体)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys, re
text = sys.argv[1]
hit = bool(re.search(r'spec-(ideate|brainstorm)', text))
sys.exit(0 if hit else 1)
PYEOF
then
  echo '输出未点名 spec-ideate/spec-brainstorm 路由目的地'
  exit 1
fi
exit 0
