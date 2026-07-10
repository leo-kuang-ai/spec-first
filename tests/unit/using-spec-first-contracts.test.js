'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skillPath = path.join(repoRoot, 'skills/using-spec-first/SKILL.md');
const governancePath = path.join(
  repoRoot,
  'src/cli/contracts/dual-host-governance/skills-governance.json',
);
const skill = fs.readFileSync(skillPath, 'utf8');
const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8'));
const records = Array.isArray(governance) ? governance : governance.skills;

describe('using-spec-first entry-governor contracts', () => {
  test('keeps one lean functional map instead of duplicate routing tables', () => {
    const routeMapHeadings = skill.match(/^## (?:Flow Map|Route Map|Routing Rules)$/gm) || [];

    expect(routeMapHeadings).toEqual(['## Flow Map']);
    expect(skill.split('\n').length).toBeLessThanOrEqual(140);
    expect(skill).toContain('selects one next entrypoint and yields control');
    expect(skill).toContain('not a rigid state machine');
  });

  test('maps every governed user-reachable skill and hides internal-only skills', () => {
    const publicRecords = records.filter((record) =>
      ['workflow_command', 'standalone_skill'].includes(record.entry_surface),
    );
    const internalRecords = records.filter((record) => record.entry_surface === 'internal_only');

    for (const record of publicRecords) {
      expect(skill).toContain(`\`${record.skill_name}\``);
    }

    for (const record of internalRecords) {
      expect(skill).not.toContain(`\`${record.skill_name}\``);
    }
  });

  test('keeps direct, guide, workflow, standalone, and terminal outcomes distinct', () => {
    expect(skill).toContain('### Direct Lane');
    expect(skill).toContain('### Standalone Skills');
    expect(skill).toContain(
      'Recommended entrypoint: <spec-*, standalone skill, or terminal command>',
    );
    expect(skill).toContain("Use the repository's configured user language");
    expect(skill).toContain('If a standalone skill is user-invoked only');
    expect(skill).toContain('Enter it only after the user explicitly asks to continue');
    expect(skill).toContain('spec-first doctor --<host>');
    expect(skill).toContain('spec-first update');
  });

  test('preserves source/runtime, evidence, dispatch, and parent-repo boundaries', () => {
    expect(skill).toContain('generated runtime, not source fixes');
    expect(skill).toContain('Advisory facts cannot support “complete” or “passed” claims');
    expect(skill).toContain('dispatch_authorization_missing');
    expect(skill).toContain('target_repo');
    expect(skill).toContain('merely because routing matched');
  });

  test('does not restore legacy host-specific workflow spellings', () => {
    expect(skill).not.toMatch(/(?:\/spec:|\$spec-)/);
  });
});
