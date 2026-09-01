#!/bin/bash
# 断言:无度量目标的模糊优化请求被 gate(拒绝/要求先定义指标),不进入实验循环。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('metric', '指标', '度量', '测量', 'measure', 'goal', '目标', '量化', 'baseline', '基线')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现指标/度量 gate 语义'; exit 1; fi
exit 0
