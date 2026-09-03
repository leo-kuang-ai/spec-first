#!/bin/bash
# 断言:mode banner 合同——banner 是「第一输出」合同,允许出现在会话任意
# turn 的助手输出中(实时打印),因此优先检查完整 transcript($EVAL_TRANSCRIPT_PATH),
# 不可用时回退检查最终消息。
set -uo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
transcript="${EVAL_TRANSCRIPT_PATH:-}"
if python3 - "$message" "$transcript" <<'PYEOF'
import sys

message, transcript = sys.argv[1], sys.argv[2]
needle = "mode: classic"
if transcript:
    try:
        with open(transcript, "r", encoding="utf-8", errors="replace") as fh:
            if needle in fh.read():
                sys.exit(0)
    except OSError:
        pass
sys.exit(0 if needle in message else 1)
PYEOF
then
  exit 0
fi
echo 'transcript 与最终消息均未出现 `[autoresearch] mode: classic` banner'
exit 1
