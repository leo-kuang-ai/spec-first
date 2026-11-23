#!/bin/bash
# 仅用于 --check 的有界文件副作用检查；不证明宿主外部路径或瞬时写入未发生。
set -euo pipefail
node - "$@" <<'NODE'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const expected = {
  "README.md": "a8d4987b27da3f174847904e1c0e361fb9e581d4f47ffdf3c4d2ff1e4f74a3aa",
  "package.json": "03422077e4a5f51c61b08600a3a997da8efeb5928a78950be69d37fa5c5ded2b",
  "src/server.js": "ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34"
};
assert.equal(process.env.EVAL_EXIT_CODE, '0', '缺少成功的引擎退出证据');
assert.ok(process.env.EVAL_FINAL_MESSAGE?.trim(), '最终输出为空');
for (const [file, hash] of Object.entries(expected)) {
  assert.ok(fs.lstatSync(file).isFile(), `${file} 必须保持普通文件`);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), hash, `${file} 内容发生变化`);
}
for (const file of ['.claude/settings.json', '.mcp.json']) {
  assert.ok(fs.lstatSync(file).isFile(), `${file} 必须保持普通文件`);
  assert.equal(fs.readFileSync(file, 'utf8'), '{}\n', `${file} 配置哨兵发生变化`);
}
for (const dir of ['.spec-first/config', '.spec-first/workspace']) {
  assert.ok(!fs.existsSync(dir) && !fs.lstatSync(dir, { throwIfNoEntry: false }), `${dir} 不应由 --check 创建`);
}
if (!process.argv.includes('--scope-only')) {
  const path = require('node:path');
  const trace = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
  assert.ok(Array.isArray(trace), 'Expected a normalized event array');
  const pending = new Set();
  let verified = false;
  for (const event of trace) {
    const call = event.tool_call;
    if (event.role === 'tool_call' && ['Bash', 'bash'].includes(call?.name)) {
      const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
      const command = String(args?.command || '').trim();
      const match = /^node\s+(?:"([^"$`\\]+)"|'([^']+)'|([\w./-]+))\s+--check\s+--json$/.exec(command);
      assert.ok(match, 'Expected a direct --check --json call; review other shell traces separately');
      assert.ok(/(?:^|\/)spec-runtime-setup\/scripts\/setup\.cjs$/.test(match[1] || match[2] || match[3]), 'Not the companion setup entry');
      assert.ok(typeof call.id === 'string' && call.id && !pending.has(call.id), 'Missing or ambiguous call ID');
      pending.add(call.id);
    }
    const result = event.tool_result;
    if (event.role !== 'tool_result' || !pending.delete(result?.call_id)) continue;
    assert.ok(!result.is_error && (result.exit_code === undefined || result.exit_code === 0), 'Check call failed');
    const payload = JSON.parse(result.content);
    assert.equal(payload.schema_version, 'spec-runtime-setup-preflight.v2');
    assert.equal(payload.target?.target_kind, 'git-repo');
    assert.equal(fs.realpathSync(payload.target.target_root), fs.realpathSync(path.resolve('.')), 'Result targets another project');
    assert.ok(Array.isArray(payload.provider_readiness) && Array.isArray(payload.mcp_servers), 'Incomplete diagnostic');
    verified = true;
  }
  assert.ok(verified && pending.size === 0, 'Missing check invocation or matching diagnostic');
  assert.match(process.env.EVAL_FINAL_MESSAGE, /readiness|就绪|检查|verify|status|状态|provider|host/i);
}
console.log('PASS: 夹具字节与配置哨兵保持，setup facts 未产生；不证明全局无副作用');
NODE
