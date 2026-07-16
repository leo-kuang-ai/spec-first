'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('scenario capability high-risk consumer contracts', () => {
  const matrix = read('docs/contracts/workflows/scenario-capability-matrix.md');
  const highRiskSkills = [
    read('skills/spec-work/SKILL.md'),
    read('skills/spec-debug/SKILL.md'),
    read('skills/spec-code-review/SKILL.md'),
  ];

  test('matrix remains advisory and keeps the three high-risk overrides', () => {
    expect(matrix).toContain('Scripts prepare the fingerprint facts; LLM workflows decide');
    expect(matrix).toContain('This matrix is advisory. It is not a hard gate');
    expect(matrix).toContain('`foreign-residual-workspace` or non-empty `foreign_residual_indicators[]`');
    expect(matrix).toContain('optional external-tool evidence unavailable');
    expect(matrix).toContain('`non-git-build-workspace` with `git_alignment_broken=true`');
  });

  test('work, debug, and review declare the same concise high-risk posture', () => {
    for (const skill of highRiskSkills) {
      expect(skill).toContain('## Scenario Capability');
      expect(skill).toContain('docs/contracts/workflows/scenario-capability-matrix.md');
      expect(skill).toContain('Overrides: high-risk');
      expect(skill).toContain('`foreign-residual-workspace` -> `blocked-action-required`');
      expect(skill).toContain('optional external-tool evidence unavailable -> `fallback-only`');
      expect(skill).toContain('`non-git-build-workspace` coverage gaps -> `partial`');
      expect(skill).toMatch(/direct source.*test.*log.*evidence/is);
    }
  });
});
