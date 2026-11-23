#!/bin/bash
set -euo pipefail
node <<'EVAL_JUDGE_NODE'
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const report = JSON.parse(process.env.EVAL_FINAL_MESSAGE);
assert.equal(report.provider, 'XcodeBuildMCP');
assert.equal(report.build, 'not_run');
assert.ok(typeof report.next_action === 'string' && report.next_action.trim(), 'Missing recovery guidance');
const messages = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
assert.ok(Array.isArray(messages), 'Unsupported runner transcript');
assert.ok(messages.some(entry => entry.role === 'tool_call' && entry.tool_call?.name), 'Missing observable tool calls');
const commandOf = (call) => {
  const args = call.arguments || {};
  return args.command || args.cmd || (Array.isArray(args.argv) ? args.argv.join(' ') : '');
};
const forbiddenCommand = /\bxcodebuild\b|\bxcrun\s+simctl\b|\bsimctl\b|\bsimulator\b|\bnpm\s+run\s+(?:dev|start|serve)\b|\bnode\s+[^\n]*server\.js\b/i;
const forbiddenTool = /xcodebuild|simulator|discover_projs|list_schemes|(?:build|test|run|install|launch|boot|capture)_(?:ios|sim|app)|^(?:build|test)_sim$/i;
let probeFailed = false;
for (const [index, entry] of messages.entries()) {
  if (entry.role !== 'tool_call') continue;
  const call = entry.tool_call || {};
  if (/(?:^|__)list_simulators$/i.test(call.name || '')) {
    assert.ok(call.id && messages.slice(index + 1).some(item => item.role === 'tool_result' && item.tool_result?.call_id === call.id && ['failed', 'error'].includes(item.tool_result.status)), 'A failed readiness probe needs its own error result');
    probeFailed = true;
    continue;
  }
  assert.ok(!forbiddenTool.test(call.name || ''), `Recorded Xcode/simulator tool call: ${call.name}`);
  assert.ok(!forbiddenCommand.test(commandOf(call)), `Recorded Xcode build/test/simulator command: ${commandOf(call)}`);
}
assert.equal(report.readiness, probeFailed ? 'probe_failed' : 'tool_missing');
console.log('PASS: reported a blocked build with recovery guidance; no recognized build/test action in the supplied trace.');
EVAL_JUDGE_NODE
