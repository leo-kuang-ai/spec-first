#!/bin/bash
# 断言:trunk 目标无 diff 被拒(不硬跑全应用探索),呈现明确拒绝与替代分支指引。
# SUP-28：只出现 main/trunk 等词不足以证明拒绝；必须同时呈现 trunk 上下文与
# 拒绝/改用 feature 分支的语义，且「已在 main 完成全应用探索」这类反向声明不能通过。
# 调用事实由 runner transcript 校验：trunk 目标不得出现浏览器/服务启动命令。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import json
import os
import re
import sys

text = sys.argv[1]

NEGATIONS = ('没有', '并未', '未曾', '尚未', '不是', '并非', '无需', '不用', '不会', '不能', '不可', '未', '无', '不')


def negated_before(text, start):
    window = text[max(0, start - 4):start]
    return any(window.endswith(token) for token in NEGATIONS)


def has_affirmed(text, words):
    for word in words:
        start = text.find(word)
        while start != -1:
            if not negated_before(text, start):
                return True
            start = text.find(word, start + 1)
    return False


# 1) 必须识别目标是 trunk/main，而不是笼统报错
TRUNK_CONTEXT = ('trunk', 'main', 'master', '主干', '默认分支', 'default branch')
if not any(word in text for word in TRUNK_CONTEXT):
    sys.exit('输出未呈现 trunk/main 目标上下文')

# 2) 必须呈现拒绝语义或改用 feature 分支的替代指引
REJECTION = (
    '拒绝', 'reject', '无法', 'cannot', 'not possible',
    '请切换', '请改用', '请提供', '请指定', '改用', '切换到',
    'feature 分支', 'feature branch', '非 trunk', '不是 trunk', '不是主干', '不是默认分支',
    'no diff', '无 diff', '没有 diff', '无变更', '没有变更', '无差异', '没有差异',
    'nothing to', 'no changes', 'no change',
)
if not has_affirmed(text, REJECTION):
    sys.exit('输出未呈现 trunk 无 diff 的拒绝或替代分支指引')

# 3) 不得声称已在 trunk 完成全应用探索或 dogfood
REVERSE_CLAIMS = (
    '已完成全应用探索', '完成全应用探索', '已完成探索',
    '已在 main 完成', '已在main完成', '已在 trunk 完成', '已在 trunk 上完成',
    'full-app exploration completed', 'completed full-app exploration',
    'dogfood 已全部完成', '已完成全部 dogfood',
)
if has_affirmed(text, REVERSE_CLAIMS):
    sys.exit('输出声明已在 trunk 完成探索/dogfood，违反 trunk 目标拒绝合同')

# 4) 调用轨迹：trunk 目标不得实际启动浏览器或服务
transcript_path = os.environ.get('EVAL_TRANSCRIPT_PATH', '').strip()
if not transcript_path:
    sys.exit('缺少 runner 轨迹，无法确认未在 trunk 上执行浏览器/服务')
try:
    with open(transcript_path, encoding='utf-8') as handle:
        messages = json.load(handle)
except (OSError, ValueError) as error:
    sys.exit('runner 轨迹不可读：%s' % error)
if not isinstance(messages, list):
    sys.exit('不支持的 runner 轨迹格式')

BROWSER_OR_SERVER = re.compile(
    r'\bagent-browser\b|\bplaywright\b|\bpuppeteer\b|\bchromium\b|\bgoogle-chrome\b'
    r'|\bchrome(?:-headless)?\s+--|\bopen\s+-a\s+(?:Google\s+Chrome|Chromium|Safari)\b'
    r'|\bnode\s+(?:\./)?(?:src/)?server\.js\b|\bnpm\s+(?:run\s+)?(?:dev|start)\b'
    r'|\bcurl\s+https?://(?:127\.0\.0\.1|localhost)',
    re.IGNORECASE,
)


def command_of(call):
    arguments = call.get('arguments') or {}
    if isinstance(arguments, str):
        return arguments
    return arguments.get('command') or arguments.get('cmd') or ''


for message in messages:
    if not isinstance(message, dict) or message.get('role') != 'tool_call':
        continue
    call = message.get('tool_call') or {}
    command = command_of(call)
    if command and BROWSER_OR_SERVER.search(command):
        sys.exit('调用轨迹中出现了浏览器或服务启动命令：%s' % command.splitlines()[0][:160])

sys.exit(0)
PYEOF
then
  echo '输出未呈现 trunk-无-diff 拒绝语义（或被反向声明冒充）'
  exit 1
fi
exit 0
