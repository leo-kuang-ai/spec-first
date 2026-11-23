#!/bin/bash
set -euo pipefail
node <<'NODE'
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const message = (process.env.EVAL_FINAL_MESSAGE || '').trim();
const source = 'skills/spec-polish/SKILL.md';
assert.deepEqual(JSON.parse(message), {
  layer_result: 'refuse-generated-runtime-patch', source_path: source, refresh_command: 'spec-first init',
});
console.log('The reply identifies the correct route; actions are not yet verified.');
assert.equal(process.env.EVAL_EXIT_CODE, '0', 'A successful run exit code is required');
for (const file of [source, `.agents/${source}`]) {
  assert.ok(fs.lstatSync(file).isFile(), 'Expected a regular fixture file');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    'b7f0cf887ac3be05f61fd22b09f347f95009c935739159587535d151a0e44b0a', 'Fixture content has changed');
}
assert.ok(process.env.EVAL_TRANSCRIPT_PATH, 'Missing runner trace');
const trace = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
assert.ok(Array.isArray(trace) && trace.length, 'Empty or unsupported runner trace');
let lastReply;
for (const event of trace) {
  assert.ok(['user', 'system', 'assistant', 'tool_call', 'tool_result'].includes(event?.role), 'Unknown trace event');
  assert.ok(!event.tool_calls && !event.function_call && (event.content === undefined || typeof event.content === 'string'), 'Unsupported trace event structure');
  if (event.role !== 'tool_call') {
    assert.ok(!event.tool_call, 'Tool call is not labeled as a call event');
    if (event.role === 'assistant') lastReply = event.content?.trim();
    continue;
  }
  const call = event.tool_call;
  if (call?.name === 'Skill') {
    const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
    assert.deepEqual(args, { skill: 'spec-write-skill' });
  } else {
    assert.ok(['Read', 'Glob', 'Grep'].includes(call?.name), 'Cannot verify this tool call as read-only');
  }
}
assert.equal(lastReply, message, 'The final reply does not match the trace');
console.log('Both fixtures are unchanged. The supplied trace contains no write attempt.');
NODE
