#!/bin/bash
# 断言:非真实宿主表面上的 bare mutation 被 fail-closed——
# 结构化 reason + 零副作用(无 facts/无 ledger 写入)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
exit_code="${EVAL_EXIT_CODE:-}"
if [[ "$exit_code" != "2" ]]; then
  echo "裸 mutation 未以 blocked 退出（EVAL_EXIT_CODE=$exit_code）"
  exit 1
fi

for file in \
  .spec-first/config/tool-facts.json \
  .spec-first/config/runtime-capabilities.json \
  .spec-first/workspace/scenario-fingerprint-setup.json \
  .claude/settings.json \
  .mcp.json; do
  if [[ -e "$file" || -L "$file" ]]; then
    echo "$file 产生或被改写——blocked 前不应有 host/config/facts 写入"
    exit 1
  fi
done

if find .eval-home -type f \( -name 'host-setup.json' -o -name 'readiness-ledger.json' -o -name 'runtime-capabilities.json' \) 2>/dev/null | grep -q .; then
  echo 'host readiness ledger/facts 被写入——blocked 应零副作用'
  exit 1
fi

if ! python3 - "${message:-}" <<'PYEOF'
import sys
text = sys.argv[1]
required = ('blocked', 'reason_code', 'host-invocation-surface-unverified')
sys.exit(0 if all(w in text for w in required) else 1)
PYEOF
then echo '输出未同时呈现 blocked、reason_code 与 host-invocation-surface-unverified'; exit 1; fi
exit 0
