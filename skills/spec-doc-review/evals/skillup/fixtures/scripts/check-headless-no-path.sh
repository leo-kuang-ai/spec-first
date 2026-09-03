#!/bin/bash
# 断言:headless 缺路径时输出固定回执(机器契约原文或等价中文语义),
# 且未派发 personas(以无 persona 裁决类输出为弱代理)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import re, sys
text = sys.argv[1]
exact = 'headless mode requires a document path'
zh = re.search(r'headless\s*模式.{0,6}(需要|缺少|要求).{0,6}(文档)?路[径径]', text) \
     or re.search(r'headless.{0,20}(需要|缺少|requires?).{0,12}(路径|path)', text)
sys.exit(0 if (exact in text or zh) else 1)
PYEOF
then echo '未输出 headless 缺路径回执(SKILL.md 契约原文或等价中文语义)'; exit 1; fi
exit 0
