const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const runners = [
  'skills/spec-code-review/scripts/peer-job-runner.py',
  'skills/spec-doc-review/scripts/peer-job-runner.py',
  'skills/spec-pov/scripts/peer-job-runner.py',
];

describe('peer job runner source parity', () => {
  test('all activated Skill-local runners are byte-identical', () => {
    const sources = runners.map((file) => fs.readFileSync(path.join(repoRoot, file)));
    expect(sources[1].equals(sources[0])).toBe(true);
    expect(sources[2].equals(sources[0])).toBe(true);
  });

  test('brainstorm and plan do not receive orphan peer runtimes', () => {
    for (const skill of ['spec-brainstorm', 'spec-plan']) {
      expect(fs.existsSync(path.join(
        repoRoot,
        'skills',
        skill,
        'scripts',
        'peer-job-runner.py',
      ))).toBe(false);
    }
  });

  test('Windows reap carries the PID-reuse identity guard', () => {
    const runner = fs.readFileSync(path.join(repoRoot, runners[0]), 'utf8');
    expect(runner).toContain('def _win_process_identity(');
    expect(runner).toContain('def _win_process_identity_matches(');
    expect(runner).toContain('def _pre_reuse_descendant_pids(');
    expect(runner).toContain('worker_identity');
    expect(runner).toContain('expected_identity');
    // Never terminate this process or a pid whose recorded identity differs.
    expect(runner).toMatch(/if pid <= 0 or pid == os\.getpid\(\):\s*return False/);
    expect(runner).toMatch(/_win_process_identity_matches\(\s*root_pid, expected_identity/);
    // Identity matching fails closed on a MISSING identity as well (an
    // unproven, possibly recycled pid must never be treated as proven ours;
    // pre-upgrade dirs and start-time probe failures carry no identity).
    expect(runner).not.toMatch(/if not recorded:\s*\n\s*return True/);
    expect(runner).toMatch(/if not recorded:\s*\n\s*return False/);
    // Both consumers route through the identity gate: the kill-tree leader
    // decision AND the cmd_reap supervisor gate.
    expect(runner).toMatch(/_win_process_identity_matches\(\s*root_pid, expected_identity/);
    expect(runner).toMatch(/_win_process_identity_matches\(\s*sup_pid, supervisor_identity/);
  });
});
