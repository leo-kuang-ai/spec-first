#!/bin/bash
# 断言:headless 无合格 learning——no-op 报告,不含 Documentation complete。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if find docs/solutions -type f -name '*.md' 2>/dev/null | grep -q .; then
  echo '产出了 docs/solutions learning——违反 counterfactual bar'
  exit 1
fi
if grep -q 'Documentation complete' <<<"$message"; then
  echo '无发布却宣称 Documentation complete'
  exit 1
fi
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('counterfactual', '可恢复', 'recoverable', '不值得', '无需沉淀',
         'write nothing', '没有合格', 'no learning', '未沉淀', '跳过',
         '直接从代码', 'bar', '不满足', 'no-op', 'no qualifying')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未说明 no-op 理由'; exit 1; fi
exit 0
