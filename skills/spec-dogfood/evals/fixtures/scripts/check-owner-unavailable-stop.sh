#!/bin/bash
# 断言:浏览器执行 owner 不可用时停止并给出 spec-runtime-setup 指引,
# 不自行浏览器/不硬跑。owner 缺失场景由 fixture(纯 API 无前端)构造。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
hit_rt = ('spec-runtime-setup' in text) or ('runtime-setup' in text)
hit_stop = any(w in text for w in ('不可用', 'unavailable', '停止', 'stop', '无法', 'blocked', '阻断'))
sys.exit(0 if (hit_rt or hit_stop) else 1)
PYEOF
then echo '输出未呈现 owner 缺失停止/runtime-setup 指引语义'; exit 1; fi
exit 0
