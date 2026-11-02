#!/bin/bash
# 只验证机械边界；语义移交是否充分由独立审查判断。
set -euo pipefail
bash "$(dirname "$0")/check-readonly-verify.sh" --scope-only
node <<'NODE'
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
assert.ok(process.env.EVAL_TRANSCRIPT_PATH, '缺少 runner 轨迹，不能确认调用边界');
const trace = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
assert.ok(Array.isArray(trace) && trace.length > 0, '空或不支持的轨迹');
assert.ok(trace.some(entry => entry.role === 'assistant' && typeof entry.content === 'string' && entry.content.trim()), '缺少助手输出证据');
for (const entry of trace) {
  assert.ok(entry && typeof entry === 'object' && !Array.isArray(entry), '不支持的轨迹事件');
  assert.ok(entry.content === undefined || typeof entry.content === 'string', '不支持的原生 content 事件，需人工核验');
  assert.ok(['system', 'user', 'assistant', 'tool_call', 'tool_result'].includes(entry.role), '未知轨迹角色，需人工核验');
  // 只接受 runner 标准化的独立 tool_call，嵌套/原生事件不得静默漏检。
  assert.ok(!entry.tool_calls && !entry.function_call, '不支持的嵌套调用轨迹');
  if (entry.role !== 'tool_call') {
    assert.ok(!entry.tool_call, '调用未按 runner 协议标记');
    continue;
  }
  const call = entry.tool_call;
  assert.ok(call && typeof call.name === 'string', '缺少工具身份');
  // 这是本维护用例的保守准入，不是运行时授权器或通用shell解析器。
  // shell即使声称只cat也不自动放行；此类样本交人工核验，避免隐藏复合命令。
  if (call.name === 'Skill') {
    const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
    assert.equal(args?.skill, 'spec-runtime-setup', '调用其他workflow需要独立审查');
    assert.deepEqual(Object.keys(args), ['skill'], '带额外参数的 Skill 调用不能认定仅加载');
    continue;
  }
  assert.ok(['Read', 'read_file', 'Glob', 'Grep'].includes(call.name), '执行/写入/派发或未知工具，机械边界未通过');
}
console.log('mechanical-boundary-only: semantic-review-required；不证明语义移交正确或全局无副作用');
NODE
