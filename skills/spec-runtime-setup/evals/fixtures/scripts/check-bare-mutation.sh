#!/bin/bash
# 断言:非真实宿主表面上的 bare mutation 被 fail-closed——
# transcript 中 bare 调用真实被 host-invocation-surface-unverified 阻断、
# 最终汇报含 blocked/reason_code、零副作用（无 facts/ledger/surface 伪造写入）。
# 注: claude_code 引擎的会话级 EVAL_EXIT_CODE 恒为 0（工具退出码不透传），
# 不能作为 blocked 信号；blocked 退出码合同属于 setup CLI 调用自身（A25 修正）。
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

if find .eval-home -type f \( -name 'host-setup.json' -o -name 'readiness-ledger.json' -o -name 'runtime-capabilities.json' \) 2>/dev/null | grep -q .; then
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
// bare 调用 = 运行共置 setup 脚本且不带 --check/--plan
const bare = calls.filter((c) => /setup\.cjs/.test(c.cmd) && !/--(check|plan)\b/.test(c.cmd));
assert.ok(bare.length > 0, 'No bare setup invocation was recorded in the transcript');
const blocked = bare.some((c) => {
  const r = results.get(c.id);
  const text = r ? (typeof r.content === 'string' ? r.content : JSON.stringify(r.content ?? '')) : '';
  return text.includes('host-invocation-surface-unverified');
});
assert.ok(blocked, 'Bare invocation was recorded as blocked by host-invocation-surface-unverified (fail-closed gate did not fire or was bypassed without evidence)');
NEOF
then echo 'transcript 未证明 bare 调用被 host-invocation-surface-unverified 阻断'; exit 1; fi

if ! python3 - "${message:-}" <<'PYEOF'
import sys
text = sys.argv[1]
required = ('blocked', 'reason_code', 'host-invocation-surface-unverified')
sys.exit(0 if all(w in text for w in required) else 1)
PYEOF
then echo '输出未同时呈现 blocked、reason_code 与 host-invocation-surface-unverified'; exit 1; fi
exit 0
