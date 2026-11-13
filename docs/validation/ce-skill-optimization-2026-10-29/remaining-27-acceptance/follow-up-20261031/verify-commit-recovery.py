from pathlib import Path
import hashlib
import json
import os
import subprocess
import tempfile


BASE = Path(__file__).resolve().parent
MODES = ['normal', 'rejecting-hook', 'branch-drift', 'index-drift', 'hook-drift',
         'lost-commit-result', 'index-drift-after-commit']
OLD = "exports.acceptAmount = amount => amount >= 0;\nexports.label = 'Ledger';\n"
OWNED = OLD.replace('>= 0', '> 0')
WORKING = OWNED.replace("'Ledger'", "'User renamed ledger'")
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
results = []

for mode in MODES:
    calls = []
    with tempfile.TemporaryDirectory(prefix='ceopt-commit-recovery-') as scratch:
        scratch = Path(scratch)
        repo = scratch / 'repo'
        repo.mkdir()
        home = scratch / 'home'
        home.mkdir()
        env = {k: v for k, v in os.environ.items() if not k.upper().startswith('GIT_')}
        env.update(HOME=str(home), USERPROFILE=str(home), GIT_CONFIG_NOSYSTEM='1',
                   GIT_CONFIG_GLOBAL=os.devnull, CEOPT_HOOK_LOG=str(scratch / 'hook.log'))

        def git(*args, alternate=False, check=True, stdin=None):
            current = dict(env)
            if alternate:
                current['GIT_INDEX_FILE'] = str(scratch / 'alternate-index')
            run = subprocess.run(['git', *args], cwd=repo, env=current, input=stdin,
                                 text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            calls.append({'argv': list(args), 'alternate_index': alternate,
                          'exit_code': run.returncode, 'stdout': run.stdout, 'stderr': run.stderr})
            if check and run.returncode:
                raise AssertionError(calls[-1])
            return run

        git('init', '-q', '-b', 'feature/owned')
        git('config', 'user.name', 'Fixture')
        git('config', 'user.email', 'fixture@example.invalid')
        git('config', 'commit.gpgsign', 'false')
        (repo / 'ledger.js').write_text(OLD)
        git('add', '--', 'ledger.js')
        git('commit', '-m', 'baseline', '-m', 'Co-authored-by: Prior <prior@example.invalid>')
        (repo / 'ledger.js').write_text(WORKING)
        (repo / 'unrelated.txt').write_text('User-owned staged work.\n')
        git('add', '--', 'unrelated.txt')
        (repo / 'untracked.txt').write_text('User-owned untracked work.\n')
        hook = repo / '.git/hooks/pre-commit'
        hook.write_text('#!/bin/sh\nprintf "%s\\n" called >> "$CEOPT_HOOK_LOG"\n' +
                        ('exit 1\n' if mode == 'rejecting-hook' else 'exit 0\n'))
        hook.chmod(0o700)
        git('config', '--show-origin', '--get', 'core.hooksPath', check=False)
        git('rev-parse', '--git-path', 'hooks')
        default_probe = git('rev-parse', '--abbrev-ref', 'origin/HEAD', check=False)
        assert default_probe.returncode != 0
        before_head = git('rev-parse', 'HEAD').stdout.strip()
        before_index = git('ls-files', '--stage').stdout
        before_branch = git('branch', '--show-current').stdout.strip()
        before_hook = sha(hook)
        protected = {name: sha(repo / name) for name in ['ledger.js', 'unrelated.txt', 'untracked.txt']}
        prior_commit = git('cat-file', 'commit', before_head).stdout
        git('read-tree', 'HEAD', alternate=True)
        blob = git('hash-object', '-w', '--stdin', stdin=OWNED).stdout.strip()
        git('update-index', '--add', '--cacheinfo', '100644', blob, 'ledger.js', alternate=True)
        assert git('diff', '--cached', '--name-only', alternate=True).stdout == 'ledger.js\n'
        assert git('show', ':ledger.js', alternate=True).stdout == OWNED
        if mode == 'branch-drift':
            git('checkout', '-q', '-b', 'feature/other')
        elif mode == 'index-drift':
            (repo / 'concurrent.txt').write_text('New staged work.\n')
            git('add', '--', 'concurrent.txt')
        elif mode == 'hook-drift':
            hook.write_text('#!/bin/sh\nexit 9\n')
        preflight = {'head': git('rev-parse', 'HEAD').stdout.strip(),
                     'branch': git('branch', '--show-current').stdout.strip(),
                     'index': git('ls-files', '--stage').stdout, 'hook_sha256': sha(hook)}
        admitted = (preflight['head'] == before_head and preflight['branch'] == before_branch
                    and preflight['index'] == before_index and preflight['hook_sha256'] == before_hook)
        commit_sha = None
        commit_exit = None
        recovery = 'not-applicable'
        expected_index = preflight['index']
        if not admitted:
            outcome = 'stopped-before-commit-on-drift'
        else:
            message = scratch / 'message.txt'
            message.write_text('fix(fixture): reject zero amount\n')
            commit = git('commit', '-F', str(message), alternate=True, check=False)
            result_discarded = mode == 'lost-commit-result'
            if result_discarded:
                # The caller loses the command response before inspecting its status or HEAD.
                commit = None
                commit_exit = None
            else:
                commit_exit = commit.returncode
            actual_head = git('rev-parse', 'HEAD').stdout.strip()
            if mode == 'rejecting-hook':
                assert commit_exit != 0 and actual_head == before_head
                assert git('ls-files', '--stage').stdout == before_index
                outcome = 'hook-rejected-no-commit'
            else:
                # Recover from pre-operation intent, not a previously accepted commit result.
                assert actual_head != before_head
                assert git('rev-parse', actual_head + '^').stdout.strip() == before_head
                assert git('show', actual_head + ':ledger.js').stdout == OWNED
                assert git('diff-tree', '--no-commit-id', '--name-only', '-r', actual_head).stdout == 'ledger.js\n'
                assert git('log', '-1', '--format=%B', actual_head).stdout.strip() == 'fix(fixture): reject zero amount'
                commit_sha = actual_head
                assert git('ls-files', '--stage').stdout == before_index
                if mode == 'index-drift-after-commit':
                    (repo / 'concurrent.txt').write_text('New staged work after commit.\n')
                    git('add', '--', 'concurrent.txt')
                    expected_index = git('ls-files', '--stage').stdout
                # Read back the intended commit before any reconciliation or retry.
                recovered_head = git('rev-parse', 'HEAD').stdout.strip()
                recovered_index = git('ls-files', '--stage').stdout
                assert recovered_head == commit_sha
                if recovered_index != before_index:
                    outcome = 'commit-created-reconciliation-blocked'
                    recovery = 'preserved-new-index-no-retry'
                else:
                    git('update-index', '--cacheinfo', '100644', blob, 'ledger.js')
                    outcome = 'owned-commit-reconciled'
                    recovery = 'readback-before-reconciliation-no-duplicate'
                    assert git('diff', '--cached', '--name-only').stdout == 'unrelated.txt\n'
                    assert git('show', ':ledger.js').stdout == OWNED
                    # Repeated observation of the completed result performs no commit.
                    assert git('rev-list', '--count', before_head + '..HEAD').stdout.strip() == '1'
        after_index = git('ls-files', '--stage').stdout
        assert all(sha(repo / name) == digest for name, digest in protected.items())
        assert git('cat-file', 'commit', before_head).stdout == prior_commit
        assert git('show', ':unrelated.txt').stdout == 'User-owned staged work.\n'
        if outcome != 'owned-commit-reconciled':
            assert after_index == expected_index
        assert git('ls-files', '--others', '--exclude-standard').stdout == 'untracked.txt\n'
        if not admitted or mode == 'rejecting-hook':
            assert git('rev-parse', 'HEAD').stdout.strip() == before_head
        hook_ran = (scratch / 'hook.log').exists()
        assert hook_ran == admitted
        row = {'case': mode, 'caller_target': 'feature/owned', 'default_branch_probe_exit': default_probe.returncode,
               'preflight': preflight, 'preflight_admitted': admitted, 'commit_exit': commit_exit,
               'commit_sha': commit_sha, 'outcome': outcome, 'recovery': recovery,
               'protected_worktree_hashes': protected, 'protected_bytes_preserved': True,
               'prior_commit_preserved': True, 'unrelated_staged_preserved': True,
               'hook_ran': hook_ran, 'calls': calls}
        if mode == 'lost-commit-result':
            row['injection'] = 'Caller discards the command response before reading its status or HEAD; expected parent/tree/message drive recovery. No process kill or network ambiguity.'
            row['command_response_discarded_before_readback'] = result_discarded and commit is None and commit_exit is None
            assert row['command_response_discarded_before_readback']
    row['scratch_removed_after_context_exit'] = not repo.exists()
    assert row['scratch_removed_after_context_exit']
    results.append(row)

payload = {'scope': 'Parent-executed disposable Git procedure; not autonomous Skill execution or atomic/race-proof recovery.',
           'source_refs': ['skills/spec-commit/SKILL.md', 'skills/spec-commit-push-pr/references/commit-and-push.md'],
           'results': results,
           'limitations': ['No real repository commit or external write.',
                          'Preflight comparisons do not provide atomic exclusion against a later concurrent writer.',
                          'Hook readiness covers these inspected fixture hooks, not arbitrary hook behavior.',
                          'Alternate-index metadata/filesystem guarantees outside observed bytes and index entries are untested.']}
(BASE / 'commit-recovery-results.json').write_text(json.dumps(payload, indent=2) + '\n')
print(json.dumps({'cases': len(results), 'outcomes': {r['case']: r['outcome'] for r in results},
                  'cleanup': all(r['scratch_removed_after_context_exit'] for r in results)}, indent=2))
