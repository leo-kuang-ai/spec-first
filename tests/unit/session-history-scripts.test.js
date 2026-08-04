'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const scriptsRoot = path.join(repoRoot, 'skills/spec-compound/scripts/session-history');

function runScript(name, input) {
  const result = spawnSync('python3', [path.join(scriptsRoot, name)], {
    cwd: repoRoot,
    input,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  expect(result.status).toBe(0);
  return String(result.stdout || '');
}

function metadata(output) {
  return JSON.parse(output.trim().split('\n').at(-1));
}

function codexEnd({ code, stderr = '' }) {
  return JSON.stringify({
    type: 'event_msg',
    timestamp: '2026-07-26T10:00:00Z',
    payload: {
      type: 'exec_command_end',
      command: ['sh', '-c', 'example'],
      stderr,
      aggregated_output: `Process exited with code ${code}\n`,
    },
  });
}

describe('session-history JSONL scripts', () => {
  test('extract-errors detects Codex records after arbitrary metadata and ignores successful stderr', () => {
    const input = [
      ...Array.from({ length: 12 }, () => JSON.stringify({ type: 'metadata' })),
      codexEnd({ code: 0, stderr: 'progress note\n' }),
      codexEnd({ code: 23, stderr: 'real failure\n' }),
    ].join('\n');

    const output = runScript('extract-errors.py', input);
    expect(output).toContain('exit=23');
    expect(output).not.toContain('exit=None');
    expect(metadata(output)).toMatchObject({ lines: 14, parse_errors: 0, errors_found: 1 });
  });

  test.each(['extract-errors.py', 'extract-skeleton.py'])('%s degrades malformed JSON shapes per line', (script) => {
    const input = [
      'null',
      '[]',
      '{"type":"event_msg","payload":{"type":"user_message","message":"this is a valid user message"}}',
    ].join('\n');
    const output = runScript(script, input);
    expect(metadata(output)).toMatchObject({ lines: 3, parse_errors: 2 });
  });

  test.each(['extract-errors.py', 'extract-skeleton.py'])('%s survives invalid UTF-8 input as a per-line degradation', (script) => {
    const input = Buffer.concat([
      Buffer.from('{"type":"metadata"}\n', 'utf8'),
      Buffer.from([0xff, 0xfe, 0x0a]),
      Buffer.from('{"type":"event_msg","payload":{"type":"user_message","message":"this is a valid user message"}}\n', 'utf8'),
    ]);
    const output = runScript(script, input);
    expect(metadata(output)).toMatchObject({ lines: 2, parse_errors: 1 });
  });
});
