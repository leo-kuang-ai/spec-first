#!/bin/bash
# 断言:纯报告语义且未宣称已修复/已应用(文件级断言因 prepare 非确定而降级,
# 回改证据由 transcript 人工核验)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
bad = ('修复已验证', '已修复', '工作树现已', 'fix applied', '已应用修复')
sys.exit(1 if any(w in text for w in bad) else 0)
PYEOF
then echo '输出宣称已执行修复——违反 report-only'; exit 1; fi
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('审查', 'review', 'finding', '发现', 'P0', '租户', 'tenant')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现审查报告语义'; exit 1; fi
exit 0
