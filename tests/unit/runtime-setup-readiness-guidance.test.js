'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const skillPath = path.join(repoRoot, 'skills', 'spec-runtime-setup', 'SKILL.md');

describe('Runtime Setup readiness handoff guidance', () => {
  test('shows the first-task template only after full readiness succeeds', () => {
    const skill = fs.readFileSync(skillPath, 'utf8');
    const handoff = skill.split('### Readiness Handoff')[1] || '';

    expect(handoff).toContain('Give a localized, copy-ready equivalent');
    expect(handoff).toContain('Please handle this task based on the current project: <describe your requirement or problem>.');
    expect(handoff).toContain("at most three nonblank lines in the user's language");
    expect(handoff).toContain('only when setup, every required dependency, and the generated runtime manifest are ready');
  });

  test('keeps every non-ready outcome in the repair and rerun loop', () => {
    const skill = fs.readFileSync(skillPath, 'utf8');
    const handoff = skill.split('### Readiness Handoff')[1] || '';

    expect(handoff).toContain('action-required, degraded, failed');
    expect(handoff).toContain('Do not display the above initial task template');
    expect(handoff).toContain('rerun `spec-runtime-setup` after performing the next action in the report');
    expect(handoff).toContain('Direct source evidence fallback');
    expect(handoff).toContain('nor does it permit the complete setup to be reported as ready');
    expect(handoff).toContain('Do not use `spec-first doctor` or additional `--verify-only` as the second verification in a normal ready path');
  });
});
