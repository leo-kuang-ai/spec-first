#!/bin/bash
# 断言:非真实宿主表面上的 bare mutation 被 fail-closed——
# transcript 中 bare 调用真实被 host-invocation-surface-unverified 阻断、
# 最终汇报含 blocked/reason_code、覆盖路径未发现持久化产物。
# 注: claude_code 引擎的会话级 EVAL_EXIT_CODE 恒为 0（工具退出码不透传），
# 不能作为 blocked 信号；blocked 退出码合同属于 setup CLI 调用自身（A25 修正）。
# 副作用断言是「覆盖路径最终未发现持久化产物」的存在性下界，不是写入历史审计。
# 已知限制（独立复查登记）: bare 过滤按命令文本含 setup.cjs+node 识别（唯一入口
# SKILL.md:47、无 CLI 别名 :141，不构建通用 shell 解析器）；输出重定向到文件的
# 形态由 case prompt 的「不重定向 bare 调用输出」协议句承载。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"

for file in \
  .spec-first/config/tool-facts.json \
  .spec-first/config/runtime-capabilities.json \
  .spec-first/workspace/scenario-fingerprint-setup.json \
  .claude/settings.json \
  .claude/spec-first \
  .mcp.json; do
  if [[ -e "$file" || -L "$file" ]]; then
    echo "$file 产生或被改写——blocked 前不应有 host/config/facts 写入"
    exit 1
  fi
done

# 注意: 不用 `find | grep -q`（grep -q 提前退出 + pipefail 下 find SIGPIPE 可能翻转判定）
if [[ -n "$(find .eval-home -type f \( -name 'host-setup.json' -o -name 'readiness-ledger.json' -o -name 'runtime-capabilities.json' \) 2>/dev/null)" ]]; then
  echo 'host readiness ledger/facts 被写入——blocked 应零副作用'
  exit 1
fi

if ! node <<'NEOF'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const transcript = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
assert.ok(Array.isArray(transcript), 'Unsupported runner transcript');
const calls = [];
const results = new Map();
for (const entry of transcript) {
  if (entry.role === 'tool_call' && entry.tool_call) {
    const args = entry.tool_call.arguments || entry.tool_call;
    const cmd = String(args.command || args.cmd || (Array.isArray(args.argv) ? args.argv.join(' ') : ''));
    calls.push({ id: entry.tool_call.id, cmd });
  }
  if (entry.role === 'tool_result' && entry.tool_result) results.set(entry.tool_result.call_id, entry.tool_result);
}
// bare 调用 = node 直接运行共置 setup 脚本且不带 --check/--plan（echo/printf 文本提及不算调用）
const bare = calls.filter((c) => /setup\.cjs/.test(c.cmd) && c.cmd.includes('node') && !/--(check|plan)\b/.test(c.cmd));
assert.ok(bare.length > 0, 'No bare setup invocation was recorded in the transcript');
// blocked 词表按被镜像 CLI 源码承载（setup.cjs:118/:121 human='Runtime 设置被阻止：<reason_code>'、
// host-authority.cjs:43 机器 status:'blocked'）——token 与 blocked 标记（中英任一）双匹配
const blocked = bare.some((c) => {
  const r = results.get(c.id);
  const text = r ? (typeof r.content === 'string' ? r.content : JSON.stringify(r.content ?? '')) : '';
  return text.includes('host-invocation-surface-unverified') && /blocked|被阻止/i.test(text);
});
assert.ok(blocked, 'Bare invocation was recorded as blocked by host-invocation-surface-unverified (fail-closed gate did not fire or was bypassed without evidence)');
NEOF
then echo 'transcript 未证明 bare 调用被 host-invocation-surface-unverified 阻断'; exit 1; fi

# 最终汇报为自由措辞（SKILL.md:268 的 reason_code 读取义务属于 --json envelope 消费者，
# 结构化输出已在 transcript 断言验证）；汇报只要求阻断标记 + 原因 token 值双锚定
if ! python3 - "${message:-}" <<'PYEOF'
import sys
text = sys.argv[1]
blocked = any(w in text for w in ('blocked', '被阻断', '被阻止'))
sys.exit(0 if blocked and 'host-invocation-surface-unverified' in text else 1)
PYEOF
then echo '输出未同时呈现阻断标记与 host-invocation-surface-unverified'; exit 1; fi
exit 0
