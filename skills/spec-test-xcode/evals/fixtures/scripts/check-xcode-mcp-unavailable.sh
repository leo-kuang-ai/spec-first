#!/bin/bash
# 断言:XcodeBuildMCP 不可用时停止并给安装指引,transcript 中没有 build/test/simulator 调用。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
[[ "$message" == *XcodeBuildMCP* ]] || { echo '最终输出缺少 XcodeBuildMCP 安装指引'; exit 1; }
[[ -n "${EVAL_TRANSCRIPT_PATH:-}" ]] || { echo '缺少 runner transcript，无法证明未执行 build/test'; exit 1; }
node <<'EVAL_JUDGE_NODE'
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const messages = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
assert.ok(Array.isArray(messages), 'Unsupported runner transcript');
const commandOf = (call) => {
  const args = call.arguments || {};
  return args.command || args.cmd || (Array.isArray(args.argv) ? args.argv.join(' ') : '');
};
const forbiddenCommand = /\bxcodebuild\b|\bxcrun\s+simctl\b|\bsimctl\b|\bsimulator\b|\bnpm\s+run\s+(?:dev|start|serve)\b|\bnode\s+[^\n]*server\.js\b/i;
const forbiddenTool = /xcodebuild|xcode.?build.?mcp|simulator/i;
for (const entry of messages) {
  if (entry.role !== 'tool_call') continue;
  const call = entry.tool_call || {};
  assert.ok(!forbiddenTool.test(call.name || ''), `Recorded Xcode/simulator tool call: ${call.name}`);
  assert.ok(!forbiddenCommand.test(commandOf(call)), `Recorded Xcode build/test/simulator command: ${commandOf(call)}`);
}
console.log('PASS: XcodeBuildMCP unavailability stopped the run with install guidance and no build/test call.');
EVAL_JUDGE_NODE
