#!/bin/bash
# 断言:非真实宿主表面上的 bare mutation 被 fail-closed——
# 结构化 reason + 零副作用(无 facts/无 ledger 写入)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] || true
if [[ -f .spec-first/config/tool-facts.json ]]; then
  echo '.spec-first/config 产生——blocked 前不应有 facts 写入'
  exit 1
fi
if find .eval-home -type f -name 'host-setup.json' 2>/dev/null | grep -q .; then
  echo 'host readiness ledger 被写入——blocked 应零副作用'
  exit 1
fi
if ! python3 - "${message:-}" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('host-invocation-surface-unverified', 'blocked', 'reason_code',
         'fail', 'fail-closed', '未验证', '阻断')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现 fail-closed 结构化语义'; exit 1; fi
exit 0
