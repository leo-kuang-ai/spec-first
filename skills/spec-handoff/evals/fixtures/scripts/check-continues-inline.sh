#!/bin/bash
# 断言:普通续问被就地继续(询问下一步/继续语义),不产交接文档。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('继续', '下一步', 'handoff', '不需要', '无需', '当前会话', '刚才', '直接')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现就地继续语义'; exit 1; fi
exit 0
