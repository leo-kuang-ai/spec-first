#!/bin/bash
# 断言:通用音视频请求被指出不属 Riffrec 分析(边界语义),不硬跑 Riffrec 流程。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('Riffrec', '不是', '不适', '不属于', '不匹配', '通用', 'generic', '反馈', 'feedback', '转写')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现边界语义'; exit 1; fi
exit 0
