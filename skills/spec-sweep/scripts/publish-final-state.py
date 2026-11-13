#!/usr/bin/env python3
"""Publish a caller-committed final sweep state; never write state or rebase."""
import argparse
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('sweep_state', Path(__file__).with_name('sweep-state.py'))
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


class Stop(Exception):
    pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('repo', 'state', 'remote', 'branch', 'writer', 'timestamp', 'outcome', 'counts', 'lease-commit', 'candidate-commit', 'topology'):
        parser.add_argument('--' + name, required=True)
    parser.add_argument('--branch-authorized', action='store_true')
    parser.add_argument('--landing-authorized', action='store_true')
    args = parser.parse_args()
    result = {'status': 'blocked', 'push_attempted': False, 'release_confirmed': False,
              'writer': args.writer, 'candidate_sha': args.candidate_commit,
              'observed_remote_sha': None}
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    env.update({'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1'})

    def git(*argv, required=True):
        try:
            proc = subprocess.run(['git', '-C', args.repo, *argv], env=env, capture_output=True, text=True, timeout=30)
        except (OSError, subprocess.TimeoutExpired):
            raise Stop('git-outcome-unavailable')
        if required and proc.returncode != 0:
            raise Stop('git-read-failed')
        return proc

    def read_state(commit):
        text = git('show', f'{commit}:{args.state}').stdout
        try:
            data = engine.parse_document(text)
            if type(data.get('schema_version')) is not int or data['schema_version'] != engine.SCHEMA_VERSION:
                raise ValueError()
            if not isinstance(data.get('sources'), dict) or not isinstance(data.get('items'), dict):
                raise ValueError()
        except (ValueError, TypeError, AttributeError, KeyError):
            raise Stop('committed-state-invalid')
        return text, data

    def remote_head():
        output = git('ls-remote', '--refs', args.remote, ref).stdout.splitlines()
        matches = [line.split('\t')[0] for line in output if line.endswith('\t' + ref)]
        if len(matches) != 1 or not re.fullmatch(r'[0-9a-f]{40}|[0-9a-f]{64}', matches[0]):
            raise Stop('remote-head-unavailable')
        sha = matches[0]
        result['observed_remote_sha'] = sha
        git('fetch', '--no-tags', '--no-write-fetch-head', '--recurse-submodules=no', args.remote, sha)
        return sha

    try:
        if args.topology != 'pushed-shared-branch':
            raise Stop('shared-topology-required')
        if not args.branch_authorized or not args.landing_authorized:
            raise Stop('publication-authorization-missing')
        if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', args.remote):
            raise Stop('invalid-remote-name')
        if not args.writer or not engine._parse_iso(args.timestamp) or args.outcome not in ('completed', 'partial', 'failed'):
            raise Stop('invalid-run-identity')
        try:
            counts = json.loads(args.counts)
            if not isinstance(counts, dict):
                raise ValueError()
        except ValueError:
            raise Stop('invalid-counts')
        expected = {'writer': args.writer, 'timestamp': args.timestamp, 'outcome': args.outcome, 'counts': counts}
        for sha in (args.lease_commit, args.candidate_commit):
            if not re.fullmatch(r'[0-9a-f]{40}|[0-9a-f]{64}', sha):
                raise Stop('full-commit-identity-required')
        relative = Path(args.state)
        if relative.is_absolute() or '..' in relative.parts or not relative.parts or args.state.startswith(('-', ':')):
            raise Stop('invalid-state-path')
        if args.state.startswith(('.git/', '.spec-first/workflows/spec-sweep/')) or args.state == '.git':
            raise Stop('committed-state-required')
        root = Path(git('rev-parse', '--show-toplevel').stdout.strip()).resolve()
        if Path(args.repo).resolve() != root:
            raise Stop('repository-root-required')
        ref = 'refs/heads/' + args.branch
        if git('check-ref-format', ref, required=False).returncode != 0:
            raise Stop('invalid-branch')
        fetch_urls = git('remote', 'get-url', '--all', args.remote).stdout.splitlines()
        push_urls = git('remote', 'get-url', '--push', '--all', args.remote).stdout.splitlines()
        if len(fetch_urls) != 1 or push_urls != fetch_urls:
            raise Stop('remote-endpoint-mismatch')
        lease_text, lease_state = read_state(args.lease_commit)
        if engine.current_lease(lease_state) is None or lease_state['lease'].get('writer') != args.writer:
            raise Stop('lease-identity-mismatch')
        final_text, final_state = read_state(args.candidate_commit)
        if final_state.get('lease') or final_state.get('last_run') != expected:
            raise Stop('candidate-state-mismatch')
        if git('merge-base', '--is-ancestor', args.lease_commit, args.candidate_commit, required=False).returncode != 0:
            raise Stop('candidate-ancestry-mismatch')
        changed = set()
        for commit in git('rev-list', f'{args.lease_commit}..{args.candidate_commit}').stdout.splitlines():
            changed.update(git('diff-tree', '--root', '--no-commit-id', '-r', '-m', '--name-only', '-z', commit, '--').stdout.rstrip('\0').split('\0'))
        changed.discard('')
        if not changed.issubset({args.state, 'docs/plans/feedback-sweep-plan.md'}):
            raise Stop('candidate-scope-mismatch')
        observed = remote_head()
        if observed != args.candidate_commit:
            if observed != args.lease_commit:
                raise Stop('remote-state-advanced')
            # The remote still has this exact published lease; use a normal FF push.
            result['push_attempted'] = True
            result['status'] = 'pending'
            try:
                result['push_exit_code'] = git('push', '--no-follow-tags', '--no-mirror', '--recurse-submodules=no', args.remote, f'{args.candidate_commit}:{ref}', required=False).returncode
            except Stop:
                result['push_exit_code'] = None
            observed = remote_head()
        if observed != args.candidate_commit:
            raise Stop('final-publication-unconfirmed')
        observed_text, observed_state = read_state(observed)
        if observed_text != final_text or observed_state.get('lease') or observed_state.get('last_run') != expected:
            raise Stop('remote-final-state-mismatch')
        result.update(status='published', release_confirmed=True, reason_code='exact-final-state-readback', observed_at=datetime.now(timezone.utc).isoformat())
        code = 0
    except Stop as error:
        result['reason_code'] = str(error)
        code = 1
    print(json.dumps(result, sort_keys=True))
    return code


if __name__ == '__main__':
    raise SystemExit(main())
