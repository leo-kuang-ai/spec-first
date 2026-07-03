'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  resolveTargetRepoRoot,
  validateOutputContainment,
  validateRepoRelativeField,
} = require('../../src/cli/helpers/target-repo');

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'target-repo-containment-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Spec First Test'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'spec-first-test@example.invalid'], { cwd: repo });
  return repo;
}

describe('target repo containment helpers', () => {
  test('resolves only a concrete Git repository root', () => {
    const repo = makeRepo();
    const nonGit = fs.mkdtempSync(path.join(os.tmpdir(), 'target-repo-nongit-'));
    try {
      const subdir = path.join(repo, 'packages', 'app');
      fs.mkdirSync(subdir, { recursive: true });

      expect(resolveTargetRepoRoot(repo)).toEqual({ ok: true, root: path.resolve(repo) });
      expect(resolveTargetRepoRoot(subdir).errors).toContain('target repo must be a Git repository root');
      expect(resolveTargetRepoRoot(nonGit).errors.join('\n')).toContain('target repo must be a Git repository root');
      expect(resolveTargetRepoRoot('').errors).toContain('target repo is required');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(nonGit, { recursive: true, force: true });
    }
  });

  test('accepts missing descendants but rejects existing symlink ancestors that escape the repo', () => {
    const repo = makeRepo();
    const outside = makeRepo();
    try {
      const safePath = path.join(repo, '.spec-first', 'workflows', 'spec-work', 'workspace-a', 'run-a', 'run.json');
      expect(validateOutputContainment(repo, safePath).errors).toEqual([]);

      fs.symlinkSync(outside, path.join(repo, '.spec-first'));
      const unsafePath = path.join(repo, '.spec-first', 'workflows', 'spec-work', 'workspace-a', 'run-a', 'run.json');
      expect(validateOutputContainment(repo, unsafePath).errors).toEqual(expect.arrayContaining([
        'artifact output ancestor escapes target repo: .spec-first',
      ]));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('enforces shared repo-relative path boundaries', () => {
    const errors = [];
    validateRepoRelativeField('/tmp/log.txt', 'field.absolute', errors);
    validateRepoRelativeField('.git/config', 'field.git', errors);
    validateRepoRelativeField('.env', 'field.secret', errors);
    validateRepoRelativeField('.claude/commands/spec/work.md', 'field.runtime', errors);
    validateRepoRelativeField('.kiro/skills/spec-work/SKILL.md', 'field.kiro_runtime', errors);
    validateRepoRelativeField('.kiro/specs/feature-a/requirements.md', 'field.kiro_specs', errors);
    validateRepoRelativeField('.spec-first/config/tool-facts.json', 'field.specfirst', errors);
    validateRepoRelativeField('.spec-first/workflows/spec-work/spec-first/run-1/run.json', 'field.workflow', errors, {
      allowSpecFirstWorkflows: true,
    });

    expect(errors).toEqual([
      'field.absolute must be a concrete repo-relative path',
      'field.git must not point at Git internals',
      'field.secret must not point at secret-denied paths',
      'field.runtime must not point at generated runtime mirrors',
      'field.kiro_runtime must not point at generated runtime mirrors',
      'field.specfirst uses unsupported .spec-first artifact path',
    ]);
  });
});
