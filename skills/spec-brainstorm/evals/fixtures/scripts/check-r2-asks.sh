#!/bin/bash
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo 'empty'; exit 1; }
python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('URL', '链接', '素材', '材料', '粘贴', '描述', '告诉我', '补充', '介绍', '说明', '提供', '请选', '选一个', '回复', '一个问题', '?', '?')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
