'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const runner = path.resolve('docs/validation/skill-evals/routing-audit-20260902/run_routing.py');
const python = ['python3', 'python'].find((command) => (
  spawnSync(command, ['--version'], { encoding: 'utf8' }).status === 0
));
if (!python) throw new Error('Python runtime is required for routing runner regression tests');

function replay(responses, options = {}) {
  const result = spawnSync(python, ['-c', String.raw`
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('routing_eval', sys.argv[1])
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
config = json.load(sys.stdin)
calls = []
responses = iter(config['responses'])
def engine(*args, **kwargs):
    calls.append(args[0])
    response = next(responses)
    if 'error' in response:
        raise OSError(response['error'])
    return response.get('out', ''), response.get('dur', 1.0), response.get('rc', 0)

with tempfile.TemporaryDirectory() as root:
    m.OUT = root
    os.makedirs(os.path.join(root, 'raw'))
    case = m.CASES[0]
    output = {}
    with patch.object(m, 'call_engine', side_effect=engine):
        if config.get('main'):
            with patch.object(m, 'CASES', [case]), patch.object(sys, 'argv', ['run_routing.py', 'claude', '1']), contextlib.redirect_stdout(io.StringIO()):
                try:
                    m.main()
                except Exception as exc:
                    output['error'] = type(exc).__name__ + ': ' + str(exc)
        else:
            output['record'] = m.run_one('claude', case, 1)
    output['files'] = {str(p.relative_to(root)): p.read_text() for p in Path(root).rglob('*') if p.is_file()}
    output['calls'] = len(calls)
    output['reports'] = [json.loads(value) for name, value in output['files'].items() if Path(name).name.startswith('results') and name.endswith('.json')]
    print(json.dumps(output))
`, runner], {
    encoding: 'utf8',
    input: JSON.stringify({ responses, ...options }),
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    timeout: 10000,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || String(result.error));
  return JSON.parse(result.stdout);
}

const correct = 'ENTRY: spec-debug\nREASON: failure investigation';
const wrong = 'ENTRY: spec-plan\nREASON: planning';

function probe(source) {
  const result = spawnSync(python, ['-c', String.raw`
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('routing_eval', sys.argv[1])
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
` + source, runner], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    timeout: 10000,
  });
  if (result.status !== 0) throw new Error(result.stderr || String(result.error));
  return JSON.parse(result.stdout);
}

describe('routing evaluator result evidence', () => {
  test('nonzero engine exit cannot pass by echoing a correct answer', () => {
    const { record } = replay([{ out: correct, rc: 1 }]);
    expect(record.ok).toBe(false);
    expect(record.env_error).toBe(true);
  });

  test('both unparsed attempts contribute duration and raw evidence', () => {
    const { record, files, calls } = replay([
      { out: 'first incomplete result', dur: 1 },
      { out: 'second incomplete result', dur: 2 },
    ]);
    expect(calls).toBe(2);
    expect(record.dur_s).toBe(3);
    expect(Object.values(files).join('\n')).toContain('second incomplete result');
    expect(record.attempts).toHaveLength(2);
  });

  test('successful retry retains the first failure and its identity', () => {
    const { record, files } = replay([{ out: 'first incomplete result' }, { out: correct }]);
    expect(record.ok).toBe(true);
    expect(Object.values(files).join('\n')).toContain('first incomplete result');
    expect(record.attempts).toHaveLength(2);
    expect(record.rep).toBe(1);
    expect(record.attempts[0].raw_path).not.toBe(record.attempts[1].raw_path);
  });

  test('engine exceptions retain the planned task and produce a summary', () => {
    const result = replay([{ error: 'fixture engine missing' }], { main: true });
    expect(result.error).toBeUndefined();
    expect(result.reports).toHaveLength(1);
    const report = result.reports[0];
    expect(report.records[0]).toMatchObject({ case: 'p-debug-stack', group: 'P', ok: false });
    expect(report.summary.claude.planned_n).toBe(1);
    expect(report.summary.claude.task_success_rate).toBe(0);
  });

  test.each([[correct, true], [wrong, false]])('normal completed answer is scored without retry: %s', (out, ok) => {
    const result = replay([{ out }]);
    expect(result.record.ok).toBe(ok);
    expect(result.record.env_error).toBe(false);
    expect(result.calls).toBe(1);
  });

  test.each([
    ['429 prompt echo', '429 Too Many Requests\nENTRY: <spec-<name> or direct>', 1],
    ['non-429 engine error', 'Unauthorized: fixture authentication unavailable', 1],
    ['timeout', '[TIMEOUT]', -1],
  ])('%s is an environment failure with no synthetic score', (_name, out, rc) => {
    const result = replay([{ out, rc }]);
    expect(result.record).toMatchObject({ ok: false, env_error: true });
    expect(result.calls).toBe(1);
  });

  test('empty output remains unknown after the bounded retry', () => {
    const { record, calls } = replay([{ out: '' }, { out: '' }]);
    expect(calls).toBe(2);
    expect(record).toMatchObject({ got: '[unparsed]', ok: false });
    expect(record.status).toBe('empty-output');
  });

  test('a transcript containing ENTRY is not a final two-line answer', () => {
    const out = `request log\n${correct}\ngateway diagnostic`;
    const { record } = replay([{ out }, { out }]);
    expect(record.ok).toBe(false);
    expect(record.got).toBe('[unparsed]');
  });

  test('a category with no planned sample is unknown rather than zero accuracy', () => {
    const { reports } = replay([{ out: correct }], { main: true });
    expect(reports).toHaveLength(1);
    expect(reports[0].summary.claude.by_group.N).toMatchObject({ n: 0, correct: 0, acc: null });
    expect(reports[0].summary.claude).toMatchObject({ planned_n: 1, attempted_n: 1, correct_n: 1 });
  });

  test('new results retain the legacy reader fields and mark unknown cost', () => {
    const { reports } = replay([{ out: correct }], { main: true });
    const report = reports[0];
    expect(report.schema_version).toBe('spec-first-routing-eval/v2');
    expect(report.records[0]).toMatchObject({
      engine: 'claude', case: 'p-debug-stack', group: 'P', expected: 'spec-debug',
      got: 'spec-debug', ok: true, env_error: false, dur_s: 1, cost_usd: null,
    });
    expect(report.summary.claude).toMatchObject({
      overall_acc: 1, valid_n: 1, env_errors: 0, unparsed: 0,
      avg_dur_s: 1, total_cost_usd: null, task_success_rate: 1, answer_accuracy: 1,
    });
  });

  test('Codex scores only the final-message file, retaining the read-only invocation', () => {
    const result = probe(String.raw`
captured = {}
def run(cmd, **kwargs):
    captured['cmd'] = cmd
    captured['cwd'] = kwargs['cwd']
    Path(cmd[cmd.index('--output-last-message') + 1]).write_text('ENTRY: spec-debug\nREASON: final answer')
    return SimpleNamespace(stdout='ENTRY: spec-plan\nREASON: prompt echo', stderr='', returncode=0)
with patch.object(m.subprocess, 'run', side_effect=run):
    out, dur, rc = m.call_engine('codex', 'fixture')
print(json.dumps({'out': out, 'rc': rc, **captured}))
`);
    expect(result.out).toBe('ENTRY: spec-debug\nREASON: final answer');
    expect(result.cmd.slice(result.cmd.indexOf('--sandbox'), result.cmd.indexOf('--sandbox') + 2))
      .toEqual(['--sandbox', 'read-only']);
    expect(result.cwd).toBe(path.resolve('.'));
  });

  test('Codex missing final output never falls back to a transcript', () => {
    const result = probe(String.raw`
with patch.object(m.subprocess, 'run', return_value=SimpleNamespace(stdout='ENTRY: spec-debug\nREASON: echo', stderr='', returncode=0)):
    out, dur, rc = m.call_engine('codex', 'fixture')
print(json.dumps({'out': out, 'rc': rc}))
`);
    expect(result).toEqual({ out: '', rc: 0 });
  });

  test('timeout keeps partial stdout and stderr for the attempt evidence', () => {
    const result = probe(String.raw`
error = subprocess.TimeoutExpired(['fixture'], 1, output=b'partial stdout', stderr=b'partial stderr')
with patch.object(m.subprocess, 'run', side_effect=error):
    out, dur, rc = m.call_engine('claude', 'fixture')
print(json.dumps({'out': out, 'rc': rc}))
`);
    expect(result.rc).toBe(-1);
    expect(result.out).toContain('[TIMEOUT]');
    expect(result.out).toContain('partial stdout');
    expect(result.out).toContain('partial stderr');
  });

  test('new summary preserves legacy observations without inventing verified attempts', () => {
    const result = probe(String.raw`
records = [{'case': 'p-debug-stack', 'got': 'spec-debug', 'ok': True, 'env_error': False, 'dur_s': 2},
           {'case': 'p-debug-stack', 'got': '[error]', 'ok': False, 'err': 'fixture'}]
print(json.dumps(m.summarize_records(records, [m.CASES[0]], 2)))
`);
    expect(result).toMatchObject({
      overall_acc: 0.5, legacy_n: 2, compatibility_status: 'legacy-unverified',
      task_success_rate: null, answer_accuracy: null, attempted_n: null, attempt_n: null, avg_dur_s: null,
    });
  });

  test('unknown result schema is rejected instead of being treated as compatible', () => {
    const result = probe(String.raw`
try:
    m.summarize_records([{'schema_version': 'future/v99'}], [m.CASES[0]], 1)
except ValueError as exc:
    print(json.dumps({'error': str(exc)}))
`);
    expect(result.error).toBe('unsupported-result-schema');
  });

  test('missing tasks stay in the planned denominator and have no answer accuracy', () => {
    const result = probe('print(json.dumps(m.summarize_records([], [m.CASES[0]], 3)))');
    expect(result).toMatchObject({
      planned_n: 3, recorded_n: 0, missing_n: 3, not_run_n: 3,
      attempted_n: 0, task_success_rate: 0, answer_accuracy: null,
    });
  });

  test.each(['attempt', 'final'])('%s evidence write failure retains known attempts and prevents success', (failure) => {
    const result = probe(String.raw`
import builtins
real_open = builtins.open
failure = '${failure}'
def write_failure(file, mode='r', *args, **kwargs):
    name = str(file)
    if mode == 'x' and ((failure == 'attempt' and '-a2.txt' in name) or (failure == 'final' and name.endswith('-r1.txt'))):
        raise OSError('fixture evidence disk unavailable')
    return real_open(file, mode, *args, **kwargs)
with tempfile.TemporaryDirectory() as root:
    m.OUT = root
    with patch.object(m, 'CASES', [m.CASES[0]]), patch.object(m, 'call_engine', side_effect=[('incomplete', 1, 0), ('ENTRY: spec-debug\nREASON: fixture', 2, 0)]), patch.object(sys, 'argv', ['runner', 'claude', '1']), patch('builtins.open', side_effect=write_failure), contextlib.redirect_stdout(io.StringIO()):
        m.main()
    report = json.loads(next(Path(root, 'runs').rglob('results.json')).read_text())
    report['saved_raw'] = [p.read_text() for p in Path(root, 'runs').rglob('*.txt')]
    print(json.dumps(report))
`);
    expect(result.records[0]).toMatchObject({ status: 'harness-error', ok: false, env_error: true, dur_s: 3 });
    expect(result.records[0].attempts).toHaveLength(2);
    expect(result.records[0].evidence_errors).toHaveLength(1);
    expect(result.saved_raw).toContain('incomplete');
    if (failure === 'attempt') {
      expect(result.records[0].attempts[1]).toMatchObject({
        raw_path: null, raw_output: 'ENTRY: spec-debug\nREASON: fixture', exit_code: 0,
      });
    } else {
      expect(result.saved_raw).toContain('ENTRY: spec-debug\nREASON: fixture');
      expect(result.records[0].raw_path).toBeNull();
    }
    expect(result.summary.claude).toMatchObject({ attempted_n: 1, attempt_n: 2, task_success_rate: 0 });
    expect(result.run_status).toBe('degraded');
  });

  test.each(['duplicate', 'unknown-case', 'out-of-range-rep', 'mixed-engine'])('invalid %s records cannot contaminate the planned denominator', (invalid) => {
    const result = probe(String.raw`
with tempfile.TemporaryDirectory() as root:
    m.OUT = root
    with patch.object(m, 'call_engine', return_value=('ENTRY: spec-debug\nREASON: fixture', 1, 0)):
        record = m.run_one('claude', m.CASES[0], 1)
    records = [record]
    invalid = '${invalid}'
    if invalid == 'duplicate':
        records.append(dict(record))
    elif invalid == 'unknown-case':
        record['case'] = 'not-planned'
    elif invalid == 'out-of-range-rep':
        record['rep'] = 2
    else:
        records.append({**record, 'engine': 'codex'})
    try:
        result = m.summarize_records(records, [m.CASES[0]], 1)
        print(json.dumps({'summary': result}))
    except ValueError as exc:
        print(json.dumps({'error': str(exc)}))
`);
    expect(result.error).toMatch(/^invalid-result-identity:/);
  });

  test('repeated runs do not overwrite historical reports or earlier attempts', () => {
    const result = probe(String.raw`
with tempfile.TemporaryDirectory() as root:
    m.OUT = root
    historical = Path(root, 'results.json')
    historical.write_text('historical sentinel')
    with patch.object(m, 'CASES', [m.CASES[0]]), patch.object(m, 'call_engine', return_value=('ENTRY: spec-debug\nREASON: fixture', 1, 0)), patch.object(sys, 'argv', ['runner', 'claude', '1']), contextlib.redirect_stdout(io.StringIO()):
        m.main()
        m.main()
    reports = list(Path(root, 'runs').rglob('results.json'))
    print(json.dumps({'historical': historical.read_text(), 'report_count': len(reports), 'parents': [str(p.parent) for p in reports]}))
`);
    expect(result.historical).toBe('historical sentinel');
    expect(result.report_count).toBe(2);
    expect(new Set(result.parents).size).toBe(2);
  });
});
