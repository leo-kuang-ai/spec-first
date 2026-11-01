"""隔离源码probe：不执行转写/ffmpeg/网络，所有临时输入自动清理。"""
import contextlib, io, json, tempfile, types
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py'
m = types.ModuleType('riffrec_probe')
exec(compile(SOURCE.read_text(), str(SOURCE), 'exec'), m.__dict__)
results = {}
events = [{'type': 'click', 't': i, 'element': {'id': str(i)}} for i in range(12)]
events.append({'type': 'network_request', 't': 90, 'status': 500, 'url': '/checkout'})
selected = m.select_moments(events, '', 100, 12)
results['late_failure_selection'] = {'selected_count': len(selected), 'failure_selected': any('failed network' in x['reason'] for x in selected), 'findings': m.summarize_candidate_findings(selected, '')}
console = m.select_moments([{'type': 'console_error', 't': 1, 'message': 'exception'}], '', 10, 12)
results['console_error_findings'] = {'moments': console, 'findings': m.summarize_candidate_findings(console, '')}
with tempfile.TemporaryDirectory(prefix='riffrec-review-') as temporary:
    root = Path(temporary)
    media = root / 'voice.webm'; media.write_bytes(b'fake-not-real-media')
    original_transcribe = m.transcribe_media
    m.shutil.which = lambda _: '/fixture/ffmpeg'
    def fake_run(command, **kwargs):
        Path(command[-1]).write_bytes(b'fixture')
        return SimpleNamespace(returncode=0, stdout='', stderr='')
    m.subprocess.run = fake_run
    replies = iter([{'status': 'ok', 'text': 'first half', 'provider_request_sent': True}, {'status': 'failed', 'text': '', 'provider_request_sent': True}])
    m.transcribe_media = lambda *args: next(replies)
    results['partial_chunks'] = m.transcribe_media_chunks(media, 'fixture', root / 'chunks', 840, 'explicit-cli-flag')
    m.transcribe_media = lambda *args: {'status': 'failed', 'text': '', 'reason': 'input_too_large', 'provider_request_sent': True, 'transcription_egress_authorization': 'explicit-cli-flag', 'provider': 'openai-audio-transcriptions'}
    m.shutil.which = lambda _: None
    capture = root / 'capture'; capture.mkdir()
    (capture / 'session.json').write_text('{}'); (capture / 'events.json').write_text('[]')
    (capture / 'voice.webm').write_bytes(b'fixture')
    output = root / 'output'
    m.parse_args = lambda: SimpleNamespace(source_path=capture, output_dir=output, transcribe=True, topic='fixture', model='fixture', max_moments=12)
    with contextlib.redirect_stdout(io.StringIO()):
        exit_code = m.main()
    analysis = json.loads((output / 'analysis.json').read_text())
    results['initial_egress_lost_on_chunk_fallback'] = {'exit': exit_code, 'first_mock_request_sent': True, 'receipt': analysis['transcription_egress_receipt'], 'transcript_status': analysis['transcript']['status'], 'reason': analysis['transcript'].get('reason')}
print(json.dumps(results, ensure_ascii=False, indent=2))
