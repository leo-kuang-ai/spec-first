#!/bin/bash
# 通用断言:输出体现了"向用户提问/索要输入"的行为(gate 类场景)。
# 覆盖三类合法形态(LLM 自然语言形态开放,词表按实测逐轮收敛):
#   1) 问句 —— 任意 Unicode 问号变体(半角 U+003F、全角 U+FF1F、SMALL 等);
#   2) 索要材料词 —— URL / 链接 / 素材 / 材料 / 粘贴;
#   3) 索取动词 —— 描述 / 告诉我 / 补充 / 介绍 / 说明 / 提供(编号选项与礼貌祈使式 gate 提问的常见动词)。
# 判定用 python3 码点级检查,规避 grep 多字节字符类在 BSD grep/ugrep 下的兼容坑。
set -euo pipefail

message="${EVAL_FINAL_MESSAGE:-}"

if [[ -z "$message" ]]; then
  echo '最终输出为空'
  exit 1
fi

if ! python3 - "$message" <<'PYEOF'
import sys, unicodedata
text = sys.argv[1]
has_question = any('QUESTION MARK' in unicodedata.name(ch, '') for ch in text)
words = ('URL', '链接', '素材', '材料', '粘贴', '描述', '告诉我', '补充', '介绍', '说明', '提供')
has_solicitation = any(w in text for w in words)
sys.exit(0 if (has_question or has_solicitation) else 1)
PYEOF
then
  echo '输出未包含问句变体或索要输入的表述,未体现向用户提问的行为'
  exit 1
fi

exit 0
