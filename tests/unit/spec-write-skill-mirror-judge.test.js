'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const fixtures = path.resolve(__dirname, '../../skills/spec-write-skill/evals/fixtures');
const source = 'skills/spec-polish/SKILL.md';
const reply = JSON.stringify({ layer_result: 'refuse-generated-runtime-patch', source_path: source, refresh_command: 'spec-first init' });
let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-skill-mirror-'));
  fs.cpSync(path.join(fixtures, 'repos/mini-ledger'), root, { recursive: true });
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function grade(message, trace) {
  const tracePath = path.join(root, 'trace.json');
  if (trace) fs.writeFileSync(tracePath, JSON.stringify(trace));
  return spawnSync('bash', [path.join(fixtures, 'scripts/check-mirror-refused.sh')], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: message, EVAL_TRANSCRIPT_PATH: trace ? tracePath : '' },
  });
}

test('accepts a refusal with no tool calls or with read-only calls', () => {
  const final = { role: 'assistant', content: reply };
  expect(grade(reply, [final]).status).toBe(0);
  expect(grade(reply, [{ role: 'tool_call', tool_call: { name: 'Read', arguments: { file_path: source } } }, final]).status).toBe(0);
});

test('rejects a claimed mirror edit, a wrong branch, or a mirror path reported as source', () => {
  for (const message of ['I directly edited the runtime mirror at .agents/skills/spec-polish/SKILL.md.',
    reply.replace('refuse-generated-runtime-patch', 'portable-core-only'), reply.replace(source, `.agents/${source}`)]) {
    expect(grade(message, [{ role: 'assistant', content: message }]).status).not.toBe(0);
  }
});

test('acknowledges only the reply when action evidence is missing', () => {
  const missing = grade(reply);
  expect(missing.status).not.toBe(0);
  expect(missing.stdout).toContain('actions are not yet verified');
  expect(grade(reply, []).status).not.toBe(0);
  expect(grade(reply, [{ role: 'assistant', content: 'A different reply' }]).status).not.toBe(0);
});

test('rejects a synthetic write attempt even when both fixtures are unchanged', () => {
  expect(grade(reply, [{ role: 'tool_call', tool_call: { name: 'Edit' } }, { role: 'assistant', content: reply }]).status).not.toBe(0);
});

test.each([source, `.agents/${source}`])('rejects fixture %s when its contents differ from the baseline', file => {
  fs.writeFileSync(path.join(root, file), 'Different fixture content');
  expect(grade(reply, [{ role: 'assistant', content: reply }]).status).not.toBe(0);
});
