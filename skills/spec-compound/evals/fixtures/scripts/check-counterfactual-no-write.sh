#!/bin/bash
# 断言:counterfactual bar——可恢复的学习 write nothing。
# docs/solutions 不产生;输出说明理由(bar/可恢复/不值得)。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if find docs/solutions -type f -name '*.md' 2>/dev/null | grep -q .; then
  echo '产出了 docs/solutions learning——违反 counterfactual bar'
  exit 1
fi
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('counterfactual', '可恢复', 'recoverable', '不值得', '无需沉淀',
         'write nothing', '没有合格', 'no learning', '未沉淀', '跳过',
         '直接从代码', 'bar', '不满足')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未说明不沉淀的理由'; exit 1; fi
exit 0
