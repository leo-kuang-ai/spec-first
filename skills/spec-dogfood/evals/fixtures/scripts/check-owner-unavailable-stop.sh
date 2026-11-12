#!/bin/bash
# 断言:浏览器执行 owner 不可用时停止并给出 spec-runtime-setup 指引,
# 不自行运行浏览器/服务。SUP-28：停止语义与 runtime-setup 指引必须同时成立，
# 且「我没有停止，已自行运行浏览器」这类反向声明不能冒充停止。
# 调用事实由 runner transcript 校验；缺少 transcript 时不能确认未自行执行，直接失败。
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


# 1) 必须给出 runtime-setup 指引（owner 缺失后的修复路径）
if 'spec-runtime-setup' not in text and 'runtime-setup' not in text:
    sys.exit('输出未给出 spec-runtime-setup 指引')

# 2) 必须呈现停止/阻断语义，且不是「没有停止」这类否定
STOP_WORDS = ('不可用', 'unavailable', '停止', 'stop', '无法', 'blocked', '阻断', '中止', '未执行', 'not run', 'cannot')
if not has_affirmed(text, STOP_WORDS):
    sys.exit('输出未呈现停止/阻断语义（或仅以否定形式出现）')

# 3) 不得声明已自行运行浏览器或服务（否定形式如「未运行浏览器」允许）
SELF_RUN = (
    '自行运行浏览器', '自行启动浏览器', '自行执行浏览器', '直接运行浏览器',
    '已运行浏览器', '已启动浏览器', '已打开浏览器',
    'I ran the browser', 'I launched the browser', 'I started the browser',
    '已启动 dev server', '已运行 dev server', 'I started the dev server',
)
if has_affirmed(text, SELF_RUN):
    sys.exit('输出声明已自行运行浏览器/服务，违反 owner 缺失停止合同')

# 4) 调用轨迹：本次运行不得出现浏览器或服务启动命令
transcript_path = os.environ.get('EVAL_TRANSCRIPT_PATH', '').strip()
if not transcript_path:
    sys.exit('缺少 runner 轨迹，无法确认未自行执行浏览器')
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
  echo '输出未满足 owner 缺失停止 + runtime-setup 指引 + 未自行执行浏览器的合同'
  exit 1
fi
exit 0
