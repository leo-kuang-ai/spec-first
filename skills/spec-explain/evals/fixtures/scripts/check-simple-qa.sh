#!/bin/bash
# 断言:简单问答被直接回答(含主题词),未产教学文档(expect 已断言目录)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
hit = any(w in text.lower() for w in ('stream', 'buffer', '流', '缓冲', '轻量', '简单说说', '不生成', '直接'))
sys.exit(0 if hit else 1)
PYEOF
then echo '输出未直接回答问题'; exit 1; fi
exit 0
