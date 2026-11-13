'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

function run(script, body) {
  const source = String.raw`
import importlib.util, json, os, pathlib, subprocess, sys, tempfile
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('analyzer', sys.argv[1])
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
` + body;
  const result = spawnSync('python3', ['-B', '-c', source, script], { encoding: 'utf8', timeout: 10000 });
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' });
  return JSON.parse(result.stdout);
}

describe.each(['spec-riffrec-feedback-analysis', 'spec-sweep'])('%s media evidence', (skill) => {
  const script = path.resolve(__dirname, `../../skills/${skill}/scripts/analyze_riffrec_zip.py`);

  test.each(['complete', 'silence', 'failed'])('chunk coverage preserves the %s control', (outcome) => {
    const payload = run(script, String.raw`
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    media = root / 'media.webm'
    media.write_bytes(b'fixture')
    def fake_run(command, **kwargs):
        pathlib.Path(command[-1]).write_bytes(b'chunk')
        return subprocess.CompletedProcess(command, 0, '', '')
    result = {'status': 'failed', 'text': '', 'provider_request_sent': True} if ${JSON.stringify(outcome)} == 'failed' else {'status': 'ok', 'text': '' if ${JSON.stringify(outcome)} == 'silence' else 'hello', 'provider_request_sent': True}
    with patch.object(m.shutil, 'which', return_value='/fixture/tool'), patch.object(m.subprocess, 'run', side_effect=fake_run), patch.object(m, 'transcribe_media', return_value=result):
        receipt = m.transcribe_media_chunks(media, 'fixture-model', root / 'chunks', 600, 'explicit-cli-flag')
    print(json.dumps(receipt))
`);
    expect(payload.status).toBe(outcome === 'failed' ? 'failed' : 'ok');
    expect(payload.covered_intervals).toHaveLength(outcome === 'failed' ? 0 : 2);
    expect(payload.missing_intervals).toHaveLength(outcome === 'failed' ? 2 : 0);
  });

  test.each(['extraction', 'provider'])('missing chunk after %s failure is partial with exact intervals', (failure) => {
    const payload = run(script, String.raw`
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    media = root / 'media.webm'
    media.write_bytes(b'fixture')
    calls = []
    def fake_run(command, **kwargs):
        calls.append(command[0])
        if command[0] == 'ffmpeg':
            second = command[command.index('-ss') + 1] == '420'
            if second and ${JSON.stringify(failure)} == 'extraction':
                return subprocess.CompletedProcess(command, 1, '', 'decode failed')
            pathlib.Path(command[-1]).write_bytes(b'chunk')
            return subprocess.CompletedProcess(command, 0, '', '')
        second = any('002-' in arg for arg in command)
        text = '{"error":"provider unavailable"}' if second else '{"text":"hello"}'
        return subprocess.CompletedProcess(command, 0, text, '')
    with patch.object(m.shutil, 'which', return_value='/fixture/tool'), patch.object(m.subprocess, 'run', side_effect=fake_run), patch.dict(os.environ, {'OPENAI_API_KEY': 'fixture-key'}):
        result = m.transcribe_media_chunks(media, 'fixture-model', root / 'chunks', 600, 'explicit-cli-flag')
    print(json.dumps({'result': result, 'calls': calls}))
`);
    expect(payload.result).toMatchObject({ status: 'partial', provider_request_sent: true, degraded: true });
    expect(payload.result.covered_intervals).toEqual([{ start_seconds: 0, end_seconds: 420 }]);
    expect(payload.result.missing_intervals).toEqual([{ start_seconds: 420, end_seconds: 600 }]);
    expect(payload.calls.filter((c) => c === 'curl')).toHaveLength(failure === 'extraction' ? 1 : 2);
  });

  test('the CLI retains an earlier sent request when chunk fallback cannot run', () => {
    const payload = run(script, String.raw`
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    media = root / 'media.webm'
    media.write_bytes(b'fixture')
    output = root / 'output'
    source = {'source_kind': 'video', 'session': {'duration_seconds': 600}, 'events': [], 'duration': 600, 'notes_transcript': None, 'transcription_path': media, 'recording_path': None}
    def fake_run(command, **kwargs):
        return subprocess.CompletedProcess(command, 0, '{"error":"input_too_large"}', '')
    with patch.object(m, 'prepare_source', return_value=source), patch.object(m.shutil, 'which', side_effect=lambda name: '/fixture/curl' if name == 'curl' else None), patch.object(m.subprocess, 'run', side_effect=fake_run), patch.dict(os.environ, {'OPENAI_API_KEY': 'fixture-key'}), patch.object(sys, 'argv', [str(sys.argv[1]), str(media), '--output-dir', str(output), '--transcribe']), patch('builtins.print'):
        code = m.main()
    result = json.loads((output / 'analysis.json').read_text())
    print(json.dumps({'code': code, 'result': result}))
`);
    expect(payload.code).toBe(0);
    expect(payload.result.transcript.status).toBe('failed');
    expect(payload.result.transcription_egress_receipt.provider_request_sent).toBe(true);
    expect(payload.result.transcript.attempts.map((a) => a.provider_request_sent)).toEqual([true, false]);
  });

  test('both transcription entry functions perform zero subprocess calls without authorization', () => {
    const payload = run(script, String.raw`
with tempfile.TemporaryDirectory() as directory:
    media = pathlib.Path(directory) / 'media.webm'
    media.write_bytes(b'fixture')
    with patch.object(m.subprocess, 'run', side_effect=AssertionError('unauthorized call')) as calls, patch.object(m.shutil, 'which', return_value='/fixture/tool'), patch.dict(os.environ, {'OPENAI_API_KEY': 'fixture-key'}):
        direct = m.transcribe_media(media, 'fixture-model')
        chunked = m.transcribe_media_chunks(media, 'fixture-model', media.parent / 'chunks', 600)
    print(json.dumps({'direct': direct, 'chunked': chunked, 'calls': calls.call_count}))
`);
    expect(payload.calls).toBe(0);
    for (const receipt of [payload.direct, payload.chunked]) {
      expect(receipt).toMatchObject({ status: 'skipped', provider_request_sent: false });
    }
  });

  test('CLI findings include late request and console failures beyond the screenshot budget', () => {
    const payload = run(script, String.raw`
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    capture = root / 'capture'
    capture.mkdir()
    (capture / 'session.json').write_text(json.dumps({'duration_seconds': 90}))
    events = [{'type': 'click', 't': i, 'element': {'id': str(i)}} for i in range(1, 14)]
    events += [{'type': 'network_request', 't': 80, 'status': 500, 'url': '/checkout'}, {'type': 'console_error', 't': 85, 'message': 'late error'}]
    (capture / 'events.json').write_text(json.dumps(events))
    output = root / 'output'
    with patch.object(sys, 'argv', [str(sys.argv[1]), str(capture), '--output-dir', str(output), '--no-transcribe']), patch('builtins.print'):
        code = m.main()
    result = json.loads((output / 'analysis.json').read_text())
    print(json.dumps({'code': code, 'result': result, 'analysis': (output / 'analysis.md').read_text()}))
`);
    expect(payload.code).toBe(0);
    expect(payload.result.moments).toHaveLength(12);
    expect(payload.result.event_moments).toHaveLength(15);
    const findings = payload.result.candidate_findings;
    expect(findings.some((f) => f.title.includes('network'))).toBe(true);
    expect(findings.some((f) => f.title.includes('Console'))).toBe(true);
    expect(payload.analysis).toContain('M15');
    expect(payload.analysis).not.toContain('No obvious failure');
  });

  test('a quiet capture does not create a product requirement or button acceptance example', () => {
    const payload = run(script, String.raw`
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    findings = m.summarize_candidate_findings([], '')
    target = root / 'requirements.md'
    m.write_requirements_kickoff(target, 'quiet', {}, findings, [], root)
    print(json.dumps({'findings': findings, 'text': target.read_text()}))
`);
    expect(payload.findings).toEqual([]);
    expect(payload.text).toContain('No confirmed product requirements');
    expect(payload.text).not.toMatch(/R3|button is weird|produced evidence of product friction/);
  });

  test('all text consumers show partial transcription and missing coverage', () => {
    const payload = run(script, String.raw`
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    transcript = {'status': 'partial', 'text': 'known words', 'missing_intervals': [{'start_seconds': 420, 'end_seconds': 600}]}
    m.write_analysis_md(root / 'analysis.md', root / 'media', 'video', {}, [], transcript, [], [], root)
    m.write_problem_analysis(root / 'problem.md', transcript, [], [], root)
    m.write_review_prompt(root / 'review.md', transcript, [], root)
    print(json.dumps([file.read_text() for file in [root / 'analysis.md', root / 'problem.md', root / 'review.md']]))
`);
    for (const content of payload) {
      expect(content).toContain('partial');
      expect(content).toContain('420');
      expect(content).toContain('600');
    }
  });
});
