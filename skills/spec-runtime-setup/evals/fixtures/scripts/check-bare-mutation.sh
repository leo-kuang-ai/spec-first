#!/bin/bash
# 断言:非真实宿主表面上的 bare mutation 被 fail-closed——
# transcript 中 bare 调用真实被 host-invocation-surface-unverified 阻断、
# 最终汇报含 blocked/reason_code、覆盖路径未发现持久化产物。
# 注: claude_code 引擎的会话级 EVAL_EXIT_CODE 恒为 0（工具退出码不透传），
# 不能作为 blocked 信号；blocked 退出码合同属于 setup CLI 调用自身（A25 修正）。
# 副作用断言是「覆盖路径最终未发现持久化产物」的存在性下界，不是写入历史审计。
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
const pending = new Set();
let blocked = false;
for (const entry of transcript) {
  const call = entry.tool_call;
  if (entry.role === 'tool_call' && ['Bash', 'bash'].includes(call?.name)) {
    const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
    const match = /^(?:MCP_SETUP_HOST=claude\s+)?HOME="\$PWD\/\.eval-home"\s+node\s+(?:"([^"$`\\]+)"|'([^']+)'|([\w./-]+))(?:\s+--json)?$/.exec(String(args?.command || '').trim());
    assert.ok(match && /(?:^|\/)spec-runtime-setup\/scripts\/setup\.cjs$/.test(match[1] || match[2] || match[3]), 'Expected a bare invocation with the fixture HOME');
    assert.ok(typeof call.id === 'string' && call.id && !pending.has(call.id), 'Missing or ambiguous call ID');
    pending.add(call.id);
  }
  const result = entry.tool_result;
  if (entry.role !== 'tool_result' || !pending.delete(result?.call_id)) continue;
  if (result.exit_code !== undefined) assert.equal(result.exit_code, 2);
  const text = String(result.content || '').replace(/^Exit code 2\s*\n/, '').trim();
  if (text.startsWith('{')) {
    const payload = JSON.parse(text);
    assert.equal(payload.status, 'blocked');
    assert.equal(payload.reason_code, 'host-invocation-surface-unverified');
  } else {
    assert.match(text, /^Runtime 设置被阻止：host-invocation-surface-unverified$/m);
  }
  blocked = true;
}
assert.ok(blocked && !pending.size, 'Missing bare call or matching denial');
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
