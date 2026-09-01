#!/bin/bash
# 断言:拒绝 mirror patch,输出指向 source 路径(skills/)与 runtime 刷新路径。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
src = 'skills/' in text or 'source' in text.lower() or '源' in text
refuse = any(w in text for w in ('refuse', '拒绝', '不能直接', '不该直接', 'runtime', '镜像', 'mirror', 'init'))
sys.exit(0 if (src and refuse) else 1)
PYEOF
then echo '输出未呈现 mirror 拒绝+source 指引语义'; exit 1; fi
exit 0
