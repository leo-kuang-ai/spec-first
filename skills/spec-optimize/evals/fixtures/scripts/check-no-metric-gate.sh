#!/bin/bash
# 断言:无度量目标的模糊优化请求被 gate(拒绝/要求先定义指标),不进入实验循环。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
import unicodedata

text = sys.argv[1]
lower = text.lower()
metric = ('指标', '度量', '基线', '目标', 'metric', 'baseline', 'goal')
request = ('请', '需要', '先提供', '先定义', '先确认', '指定', '提供', '定义', '确认', '补充')
refusal = ('无法', '不能', '不会', '拒绝', '暂停', 'blocked')
missing = ('没有', '缺少', '无指标', '未定义', 'not defined', 'missing')
completion = ('已完成', '已经完成', '完成优化', '优化完成', '指标已提高', '指标提高',
              '指标已提升', '指标提升', '提升完成', 'completed', 'improved')
has_metric = any(word in lower for word in metric)
has_question = any('QUESTION MARK' in unicodedata.name(ch, '') for ch in text)
claimed_done = any(word in lower for word in completion)
if claimed_done:
    sys.exit(1)
if has_metric and has_question:
    sys.exit(0)
if has_metric and any(word in lower for word in request):
    sys.exit(0)
if has_metric and any(word in lower for word in refusal) and any(word in lower for word in missing):
    sys.exit(0)
sys.exit(1)
PYEOF
then echo '输出未呈现指标/基线 gate 语义，或宣称了无证据的优化完成'; exit 1; fi
exit 0
