'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('mutation authority baseline contracts', () => {
  test('code-review classification assets never grant apply authority', () => {
    const skill = read('skills/spec-code-review/SKILL.md');
    const rubric = read('skills/spec-code-review/references/action-class-rubric.md');

    expect(skill).toContain('mutation_policy: report-only | apply-fixes');
    expect(rubric).toContain('mutation_policy');
    expect(rubric).toMatch(/classification.*not.*permission/is);
    expect(rubric).toMatch(/report-only.*default/is);
    expect(rubric).not.toMatch(/default.*interactive.*appl(?:y|ies).*safe fixes/is);
  });

  test('spec-polish separates branch, local fix, commit, and landing authority', () => {
    const skill = read('skills/spec-polish/SKILL.md');

    for (const fact of [
      'branch_mutation_authorization',
      'local_fix_authorization',
      'commit_authorization',
      'landing_authorization',
    ]) {
      expect(skill).toContain(fact);
    }
    expect(skill).toMatch(/PR number or branch name.*scope.*does not authorize checkout/is);
    expect(skill).toMatch(/done.*completion signal.*not commit authorization/is);
    expect(skill).toContain('commit_status: not-created');
    expect(skill).toMatch(/without landing authorization.*do not push.*do not open a PR/is);
  });

  test('spec-dogfood can fix without forcing checkout or commit', () => {
    const skill = read('skills/spec-dogfood/SKILL.md');
    const reportTemplate = read('skills/spec-dogfood/references/dogfood-report-template.md');

    for (const fact of [
      'branch_mutation_authorization',
      'local_fix_authorization',
      'commit_authorization',
      'landing_authorization',
    ]) {
      expect(skill).toContain(fact);
    }
    expect(skill).toContain('branch-selection-is-not-authorization');
    expect(skill).toContain('fix_authorization_missing');
    expect(skill).toContain('commit_authorization_missing');
    expect(skill).toMatch(/without landing authorization.*do not push.*do not open a PR/is);
    expect(skill).toContain('The three `Blocked` states are **not** auto-runnable');
    expect(skill).toMatch(/terminal `Blocked` state.*fix authorization.*human decision.*needs human verify/is);
    expect(reportTemplate).toContain('<commit-or-uncommitted>');
    expect(reportTemplate).toContain('uncommitted');
  });
});
