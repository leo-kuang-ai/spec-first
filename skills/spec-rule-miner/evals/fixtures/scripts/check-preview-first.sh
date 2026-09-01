#!/bin/bash
# 断言:交互场景先呈现 preview/规则内容并征求确认(而非静默直写)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('preview', '预览', '确认', '规则', 'rule', '建议', '如下', '草稿', 'draft')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现 preview/确认语义'; exit 1; fi
exit 0
