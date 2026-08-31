#!/bin/bash
# 通用断言:输出体现了"向用户提问"的行为(半角或全角问号至少其一)。
# 用于 gate 类场景(vague subject / context-substance / surprise-me 无素材),
# 语言中立——中文全角 ? 与英文半角 ? 均算命中。
set -euo pipefail

message="${EVAL_FINAL_MESSAGE:-}"

if [[ -z "$message" ]]; then
  echo '最终输出为空'
  exit 1
fi

if ! printf '%s' "$message" | grep -Eq '[??]'; then
  echo '输出未包含任何问句(半角/全角问号均未出现),未体现提问行为'
  exit 1
fi

exit 0
