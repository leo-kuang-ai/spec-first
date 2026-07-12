'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skillPath = path.join(repoRoot, 'skills/using-spec-first/SKILL.md');
const referencePath = path.join(
  repoRoot,
  'skills/using-spec-first/references/conditional-routing-boundaries.md',
);
const governancePath = path.join(
  repoRoot,
  'src/cli/contracts/dual-host-governance/skills-governance.json',
);
const skill = fs.readFileSync(skillPath, 'utf8');
const reference = fs.readFileSync(referencePath, 'utf8');
const packageText = `${skill}\n${reference}`;
const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8'));
const records = Array.isArray(governance) ? governance : governance.skills;

describe('using-spec-first entry-governor contracts', () => {
  test('keeps one lean functional map instead of duplicate routing tables', () => {
    const routeMapHeadings = skill.match(/^## (?:Flow Map|Route Map|Routing Rules)$/gm) || [];

    expect(routeMapHeadings).toEqual(['## Flow Map']);
    expect(skill.split('\n').length).toBeLessThanOrEqual(100);
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
      expect(packageText).not.toContain(`\`${record.skill_name}\``);
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
    expect(skill).toContain('Enter the recommendation only after the user asks to continue');
    expect(skill).toContain('spec-first doctor --<host>');
    expect(skill).toContain('spec-first update');
  });

  test('distinguishes package readiness validation from an audit-only neighbor', () => {
    expect(skill).toContain('validate package structure/readiness for a source skill** -> `spec-write-skill`');
    expect(skill).toContain('without package readiness -> bounded source review');
    expect(skill).toContain('Direct patch or regeneration request for a generated runtime mirror** -> `runtime-maintenance`');
    expect(skill).toContain('this is the selected route/handoff label even when the unsafe mirror patch is refused');
    expect(skill).toContain('require a separate source-revision request before entering `spec-write-skill`');
    expect(skill).toContain('a lightweight one-off “how should X be written?” explanation stays in the Direct Lane');
  });

  test('preserves source/runtime, evidence, dispatch, and parent-repo boundaries', () => {
    expect(skill).toContain('Modify source-of-truth surfaces, never generated host runtime');
    expect(reference).toContain('generated runtime, not source fixes');
    expect(reference).toContain('Advisory facts cannot support “complete” or “passed” claims');
    expect(reference).toContain('dispatch_authorization_missing');
    expect(reference).toContain('target_repo');
    expect(reference).toContain('A routing match alone never authorizes');
  });

  test('loads conditional governance through one explicit context pointer', () => {
    expect(skill).toContain(
      '[Conditional Routing Boundaries](references/conditional-routing-boundaries.md)',
    );
    expect(skill).toContain(
      'Before runtime maintenance, scenario-fingerprint interpretation, Codex dispatch',
    );
    expect(skill).toContain('parent multi-repo write/test/autofix/commit');
    expect(reference.split('\n').length).toBeLessThanOrEqual(60);
    expect(reference).toContain('## Runtime Maintenance');
    expect(reference).toContain('## Scenario Fingerprints');
    expect(reference).toContain('## Codex Dispatch And Startup Reminder');
    expect(reference).toContain('## Parent Multi-Repo Scope');
    expect(reference).toContain('## Ordinary Context Exclusions');
  });

  test('does not restore legacy host-specific workflow spellings', () => {
    expect(skill).not.toMatch(/(?:\/spec:|\$spec-)/);
  });
});
