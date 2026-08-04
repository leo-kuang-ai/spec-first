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

  test('accepts missing descendants but rejects an existing symlink ancestor that escapes', () => {
    const repo = makeRepo();
    const outside = makeRepo();
    try {
      const safePath = path.join(repo, '.spec-first', 'workflows', 'spec-work', 'run-a', 'run.json');
      expect(validateOutputContainment(repo, safePath).errors).toEqual([]);

      fs.symlinkSync(outside, path.join(repo, '.spec-first'));
      const unsafePath = path.join(repo, '.spec-first', 'workflows', 'spec-work', 'run-a', 'run.json');
      expect(validateOutputContainment(repo, unsafePath).errors).toEqual(expect.arrayContaining([
        'artifact output ancestor escapes target repo: .spec-first',
      ]));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('rejects source writes into every current generated runtime surface', () => {
    const errors = [];
    const cases = [
      ['/tmp/log.txt', 'field.absolute'],
      ['.git/config', 'field.git'],
      ['.env', 'field.secret'],
      ['.claude/commands/spec-work.md', 'field.claude'],
      ['.codex/skills/spec-work/SKILL.md', 'field.codex'],
      ['.agents/skills/spec-work/SKILL.md', 'field.agents'],
      ['.cursor/skills/spec-work/SKILL.md', 'field.cursor_skill'],
      ['.cursor/spec-first/state.json', 'field.cursor_state'],
      ['.cursor/rules/spec-first.mdc', 'field.cursor_rule'],
      ['.cursor/mcp.json', 'field.cursor_mcp'],
      ['.kiro/skills/spec-work/SKILL.md', 'field.kiro_skill'],
      ['.kiro/agents/reviewer.md', 'field.kiro_agent'],
      ['.kiro/steering/spec-first.md', 'field.kiro_steering'],
      ['.qoder/commands/spec-work.md', 'field.qoder_command'],
      ['.qoder/rules/spec-first.md', 'field.qoder_rule'],
      ['.qoder/settings.json', 'field.qoder_settings'],
      ['.spec-first/config/tool-facts.json', 'field.specfirst'],
    ];

    for (const [value, field] of cases) validateRepoRelativeField(value, field, errors);
    validateRepoRelativeField(
      '.spec-first/workflows/spec-work/spec-first/run-1/run.json',
      'field.workflow',
      errors,
      { allowSpecFirstWorkflows: true },
    );

    expect(errors).toHaveLength(cases.length);
    expect(errors).toEqual(expect.arrayContaining([
      'field.absolute must be a concrete repo-relative path',
      'field.git must not point at Git internals',
      'field.secret must not point at secret-denied paths',
      'field.cursor_rule must not point at generated runtime mirrors',
      'field.kiro_steering must not point at generated runtime mirrors',
      'field.qoder_rule must not point at generated runtime mirrors',
      'field.qoder_settings must not point at generated runtime mirrors',
      'field.specfirst uses unsupported .spec-first artifact path',
    ]));
  });
});
