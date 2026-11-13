#!/bin/bash
# 断言:缺 target-origin 时 fail-closed,不推断端口、不启动 server、不调用浏览器。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
[[ "$message" == *target-origin-missing* ]] || { echo '最终输出缺少 target-origin-missing'; exit 1; }
[[ -n "${EVAL_TRANSCRIPT_PATH:-}" ]] || { echo '缺少 runner transcript，无法证明未启动 server/browser'; exit 1; }
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
const forbiddenCommand = /\bnpm\s+run\s+(?:dev|start|serve)\b|\bnode\s+[^\n]*server\.js\b|\b(?:vite|http-server|python3?\s+-m\s+http\.server)\b|\bagent-browser\b|\bplaywright\b|\bpuppeteer\b|\bcurl\b[^\n]*localhost/i;
const forbiddenTool = /browser|playwright|puppeteer/i;
for (const entry of messages) {
  if (entry.role !== 'tool_call') continue;
  const call = entry.tool_call || {};
  assert.ok(!forbiddenTool.test(call.name || ''), `Recorded browser tool call: ${call.name}`);
  assert.ok(!forbiddenCommand.test(commandOf(call)), `Recorded server/browser command: ${commandOf(call)}`);
}
console.log('PASS: missing target-origin stopped before any server or browser call.');
EVAL_JUDGE_NODE
