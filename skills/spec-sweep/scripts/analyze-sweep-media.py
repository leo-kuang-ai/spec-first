#!/usr/bin/env python3
"""Bind a Sweep media command to its caller-supplied run/item authorization."""
import argparse
import contextlib
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import sys
import tempfile

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('sweep_analyzer', Path(__file__).with_name('analyze_riffrec_zip.py'))
analyzer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyzer)
PROVIDER = 'openai-audio-transcriptions'


def run(packet):
    result = {'run_id': packet.get('run_id'), 'item_id': packet.get('item_id'),
              'status': 'blocked', 'provider': PROVIDER, 'provider_request_sent': False,
              'attempts': [], 'covered_intervals': [], 'missing_intervals': []}
    snapshot = None
    started = False
    allowed = False
    previous_argv = sys.argv
    try:
        for key in ('run_id', 'item_id', 'scratch_root', 'media_path', 'media_sha256', 'output_dir'):
            if not isinstance(packet.get(key), str) or not packet[key]:
                raise ValueError('invalid-media-packet')
        if type(packet.get('sensitive')) is not bool:
            raise ValueError('sensitivity-unresolved')
        root = Path(packet['scratch_root'])
        if not root.is_absolute() or root.is_symlink() or root.resolve() != root:
            raise ValueError('invalid-private-scratch')
        mode = root.stat()
        if not stat.S_ISDIR(mode.st_mode) or mode.st_mode & 0o077 or (hasattr(os, 'geteuid') and mode.st_uid != os.geteuid()):
            raise ValueError('invalid-private-scratch')
        media = Path(packet['media_path'])
        output = Path(packet['output_dir'])
        if not media.is_absolute() or media.resolve() != media or not media.is_relative_to(root):
            raise ValueError('media-outside-private-scratch')
        if not output.is_absolute() or output.parent.resolve() != root or output.exists() or output.is_symlink():
            raise ValueError('fresh-item-output-required')
        # Freeze only bytes actually checked against the caller's scope identity.
        if not hasattr(os, 'O_NOFOLLOW'):
            raise ValueError('snapshot-nofollow-unavailable')
        with os.fdopen(os.open(media, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK), 'rb') as source:
            info = os.fstat(source.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
                raise ValueError('media-regular-file-required')
            with tempfile.NamedTemporaryFile(prefix='sweep-media-', suffix=media.suffix, dir=root, delete=False) as target:
                snapshot = Path(target.name)
                digest = hashlib.sha256()
                while True:
                    block = source.read(1024 * 1024)
                    if not block:
                        break
                    digest.update(block)
                    target.write(block)
        if digest.hexdigest() != packet['media_sha256']:
            raise ValueError('media-bytes-changed')
        auth = packet.get('authorization')
        allowed = (not packet['sensitive'] and isinstance(auth, dict)
                   and auth.get('status') == 'authorized'
                   and isinstance(auth.get('source_ref'), str) and bool(auth['source_ref'].strip())
                   and auth.get('run_id') == packet['run_id']
                   and auth.get('item_id') == packet['item_id']
                   and auth.get('media_sha256') == packet['media_sha256']
                   and auth.get('provider') == PROVIDER)
        reason = 'scope-matched' if allowed else ('sensitive_transcription_unsupported' if packet['sensitive'] else 'transcription_egress_authorization_missing_or_mismatched')
        result.update(transcription_egress_authorization='authorized' if allowed else 'missing', authorization_reason=reason, media_sha256=digest.hexdigest())
        sys.argv = [str(Path(__file__).with_name('analyze_riffrec_zip.py')), str(snapshot), '--output-dir', str(output), '--transcribe' if allowed else '--no-transcribe']
        started = True
        with contextlib.redirect_stdout(sys.stderr):
            exit_code = analyzer.main()
        result['analyzer_exit_code'] = exit_code
        evidence = output / 'analysis.json'
        if exit_code != 0 or not evidence.is_file() or evidence.is_symlink():
            raise ValueError('analysis-receipt-unavailable')
        data = json.loads(evidence.read_text(encoding='utf-8'))
        receipt = data.get('transcription_egress_receipt', {})
        transcript = data.get('transcript', {})
        result.update(status='analyzed', receipt_ref=str(evidence),
                      provider_request_sent=receipt.get('provider_request_sent'),
                      attempts=receipt.get('attempts', []),
                      transcript_status=transcript.get('status', 'unknown'),
                      covered_intervals=transcript.get('covered_intervals', []),
                      missing_intervals=transcript.get('missing_intervals', []))
        if result['provider_request_sent'] is not None and type(result['provider_request_sent']) is not bool:
            result['provider_request_sent'] = None
        if not allowed and result['provider_request_sent'] is True:
            result.update(status='failed', reason_code='unexpected-provider-egress')
    except (OSError, ValueError, RuntimeError, TypeError) as error:
        result.update(status='failed' if started else 'blocked', reason_code=str(error) if isinstance(error, ValueError) else 'media-analysis-failed')
        # Once an authorized analyzer starts, absence of a receipt is not proof of no egress.
        if started and allowed:
            result['provider_request_sent'] = None
    finally:
        sys.argv = previous_argv
        if snapshot is not None:
            snapshot.unlink(missing_ok=True)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--packet', required=True)
    args = parser.parse_args()
    try:
        packet = json.loads(Path(args.packet).read_text(encoding='utf-8'))
        if not isinstance(packet, dict):
            raise ValueError()
    except (OSError, ValueError):
        print(json.dumps({'status': 'blocked', 'reason_code': 'invalid-media-packet', 'provider_request_sent': False}))
        return 1
    result = run(packet)
    print(json.dumps(result, sort_keys=True))
    return 0 if result['status'] == 'analyzed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
