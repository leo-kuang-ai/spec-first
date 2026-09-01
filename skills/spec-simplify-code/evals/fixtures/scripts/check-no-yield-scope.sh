#!/bin/bash
# 断言:纯文档 scope 被 no-yield gate 拦下(nothing to simplify 语义),不改文件。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('nothing to simplify', '无需简化', '没有可简化', 'nothing', '跳过', 'skip')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现 no-yield 语义'; exit 1; fi
exit 0
