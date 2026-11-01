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
  test.each([23, -9, '23', '-9'])('skeleton preserves structured Codex exit %s without legacy output', (code) => {
    const input = JSON.stringify({ type: 'event_msg', payload: { type: 'exec_command_end', command: ['bash', '-lc', 'verify'], exit_code: code, aggregated_output: '' } });
    expect(runScript('extract-skeleton.py', input)).toContain(`error(exit ${code})`);
    expect(runScript('extract-errors.py', input)).toContain(`exit=${code}`);
  });

  test('skeleton distinguishes missing exit evidence from a confirmed zero', () => {
    const event = { type: 'event_msg', payload: { type: 'exec_command_end', command: ['bash', '-lc', 'verify'], aggregated_output: '' } };
    expect(runScript('extract-skeleton.py', JSON.stringify(event))).toContain('-> unknown');
    event.payload.exit_code = 0;
    expect(runScript('extract-skeleton.py', JSON.stringify(event))).toContain('-> ok');
  });

  test('collapsed Claude tools retain unknown results and reject mismatched result identities', () => {
    const calls = { type: 'assistant', message: { content: ['a', 'b', 'c'].map((id) => ({ type: 'tool_use', id, name: 'Read', input: { file_path: id + '.md' } })) } };
    const result = (id) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: 'ok' }] } });
    const output = runScript('extract-skeleton.py', [calls, result('a'), result('unrelated')].map(JSON.stringify).join('\n'));
    expect(output).toContain('1 ok, 0 error, 2 unknown');
    expect(output).not.toContain('all ok');
    const all = runScript('extract-skeleton.py', [calls, result('a'), result('b'), result('c')].map(JSON.stringify).join('\n'));
    expect(all).toContain('all ok');
  });

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

describe('metadata bounded discovery', () => {
  const fs = require('node:fs'); const os = require('node:os');
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'metadata-boundary-')); });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  function batch(files) {
    const result = spawnSync('python3', [path.join(scriptsRoot, 'extract-metadata.py'), ...files], { encoding: 'utf8' });
    expect(result.status).toBe(0); return result.stdout.trim().split('\n').map(JSON.parse);
  }
  test.each([25, 26, 200, 201])('metadata at line %i obeys the 200-line boundary', (line) => {
    const file = path.join(root, 'session.jsonl');
    fs.writeFileSync(file, [...Array(line - 1).fill('{"type":"progress"}'), JSON.stringify({ type: 'user', gitBranch: 'feature', sessionId: 'fixture' })].join('\n'));
    const rows = batch([file]);
    if (line <= 200) expect(rows[0]).toMatchObject({ platform: 'claude', branch: 'feature' });
    else expect(rows).toHaveLength(1);
    expect(rows.at(-1).parse_errors).toBe(0);
    if (line > 200) expect(rows.at(-1).files_without_metadata).toBe(1);
  });
  test('empty, malformed, valid and missing files keep read failures separate', () => {
    const files = ['empty.jsonl', 'malformed.jsonl', 'valid.jsonl'].map((f) => path.join(root, f));
    fs.writeFileSync(files[0], ''); fs.writeFileSync(files[1], 'not json\nnull\n');
    fs.writeFileSync(files[2], '{"type":"session_meta","payload":{"cwd":"/fixture","id":"one"}}\n');
    const rows = batch([...files, path.join(root, 'missing.jsonl')]);
    expect(rows[0]).toMatchObject({ platform: 'codex', session: 'one' });
    expect(rows.at(-1)).toMatchObject({ files_processed: 4, parse_errors: 1, files_without_metadata: 2 });
  });
});
