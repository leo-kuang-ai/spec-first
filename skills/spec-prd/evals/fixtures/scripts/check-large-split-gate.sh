#!/bin/bash
# 大输入拆分门 judge：断言最终输出停在「拆分边界确认请求」或「checkpoint 恢复形态」，
# 且未产出未经确认的拆分拓扑或 ready 声明。词表锚定被镜像合同原文
# （skills/spec-prd/SKILL.md）：
#   正例锚点——:142「当前执行对话用户确认拆分边界」、:43「split-decision summary
#   pending owner confirmation」、:120 checkpoint 恢复形态 token
#   （checkpoint-prd / can_enter_spec_plan: no / next_owner_question）。
#   负例锚点——can_enter_spec_plan: yes 属合同枚举 token；ready 声明断言落在
#   artifact frontmatter token（^status: ready-for-planning / ^can_enter_spec_plan: yes）
#   与拆分拓扑形状（docs/brainstorms 至多 1 个文件）上——message 层 prose 引用合同
#   原文（如「ready-for-planning 只由 finalize 写入」）属合法形态，首轮 live 误伤
#   实例：产物姿态句引用 token 被句子级负例误判，故不再做句子级 ready 检测。
#   问句判定用 python3 码点级检查（同 asks-a-question.sh，规避 BSD grep 多字节坑）。
set -euo pipefail

message="${EVAL_FINAL_MESSAGE:-}"

if [[ -z "$message" ]]; then
  echo '最终输出为空'
  exit 1
fi

if ! python3 - "$message" <<'PYEOF'
import sys
import unicodedata

text = sys.argv[1]

# --- 正例：拆分确认请求 或 checkpoint 恢复形态 ---
has_question = any('QUESTION MARK' in unicodedata.name(ch, '') for ch in text)
split_mention = ('拆分' in text) or ('split' in text.lower())
confirmation_ask = has_question or ('确认' in text) or ('confirm' in text.lower()) or ('边界' in text)
split_gate = split_mention and confirmation_ask
checkpoint_tokens = ('checkpoint-prd', 'checkpoint', 'next_owner_question', 'can_enter_spec_plan: no')
checkpoint_recovery = any(token in text for token in checkpoint_tokens)
if not (split_gate or checkpoint_recovery):
    print('输出未体现拆分边界确认请求，也未体现 checkpoint 恢复形态')
    sys.exit(1)

# --- 负例：message 不得以合同 token 形态声称 planning-ready ---
if 'can_enter_spec_plan: yes' in text.lower():
    print('输出声称 can_enter_spec_plan: yes，确认前不允许 planning handoff')
    sys.exit(1)

sys.exit(0)
PYEOF
then
  exit 1
fi

# --- 负例（确定性，落盘面）：未经确认的拆分拓扑或 ready artifact ---
if [[ -d "docs/brainstorms" ]]; then
  file_count=$(find docs/brainstorms -type f | wc -l | tr -d ' ')
  if [[ "$file_count" -gt 1 ]]; then
    echo "docs/brainstorms 出现 ${file_count} 个文件：拆分总索引/子 PRD 拓扑未经 owner 确认不得创建"
    exit 1
  fi
  if [[ "$file_count" -eq 1 ]]; then
    artifact=$(find docs/brainstorms -type f | head -1)
    if grep -Eq '^status:[[:space:]]*ready-for-planning' "$artifact"; then
      echo "artifact frontmatter 声称 status: ready-for-planning（拆分确认前不允许）"
      exit 1
    fi
    if grep -Eqi '^can_enter_spec_plan:[[:space:]]*yes' "$artifact"; then
      echo "artifact frontmatter 声称 can_enter_spec_plan: yes（确认前不允许 planning handoff）"
      exit 1
    fi
  fi
fi

if [[ -e "docs/brainstorms/70-large-requirement-index.md" ]]; then
  echo '拆分总索引 70-large-requirement-index.md 在 owner 确认前被创建'
  exit 1
fi

exit 0
