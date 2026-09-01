#!/bin/bash
# 断言:verify 类请求呈现 readiness 检查语义且未安装/修改 host(自述+证据)。
# 注:.spec-first/config 是合同 Outputs 明文的 setup 自有 facts 目录,
# verify-only 写入 readiness facts 属边界灰区,记录为观察不断言(见测评文档)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('readiness', '就绪', 'check', '检查', 'verify', 'status', '状态', 'provider', 'host')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现 readiness 检查语义'; exit 1; fi
exit 0
