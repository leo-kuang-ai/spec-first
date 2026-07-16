'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skillPath = path.join(repoRoot, 'skills/using-spec-first/SKILL.md');
const routeMapPath = path.join(
  repoRoot,
  'skills/using-spec-first/references/public-route-map.md',
);
const boundaryPath = path.join(
  repoRoot,
  'skills/using-spec-first/references/conditional-routing-boundaries.md',
);
const governancePath = path.join(
  repoRoot,
  'src/cli/contracts/dual-host-governance/skills-governance.json',
);
const skill = fs.readFileSync(skillPath, 'utf8');
const routeMap = fs.readFileSync(routeMapPath, 'utf8');
const boundary = fs.readFileSync(boundaryPath, 'utf8');
const packageText = `${skill}\n${routeMap}\n${boundary}`;
const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8'));
const records = Array.isArray(governance) ? governance : governance.skills;

describe('using-spec-first entry-governor contracts', () => {
  test('keeps a lean front controller and reports the target as an advisory footprint proxy', () => {
    const footprint = Buffer.byteLength(skill, 'utf8');

    expect(skill).not.toMatch(/^## (?:Flow Map|Route Map|Routing Rules)$/m);
    expect(footprint).toBeLessThanOrEqual(4800);
    expect(skill).toMatch(/^name: using-spec-first$/m);
    expect(skill).toContain('standalone entry governor');
    expect(skill).toContain('selects one next entrypoint and yields control');
    expect(skill).toContain('not a rigid state machine');

    if (footprint > 4200) {
      console.warn(
        `using-spec-first Front Controller is ${footprint} bytes; the 4,200-byte target is advisory, not a token or behavior proof.`,
      );
    }
  });

  test('keeps active-worker and Direct Lane admission in the Front Controller', () => {
    expect(skill).toContain('Continue an active public workflow');
    expect(skill).toContain('Direct Lane only');
    expect(skill).toContain('document review/critique');
    expect(skill).toContain('explicit workflow name');
    expect(skill).toContain('unresolved build goal');
    expect(skill).toContain('Direct Lane task expands');
  });

  test('uses one reachable public-route reference for public roster coverage', () => {
    const publicRecords = records.filter((record) =>
      ['workflow_command', 'standalone_skill'].includes(record.entry_surface)
        && record.skill_name !== 'using-spec-first',
    );

    expect(skill.match(/\[Public Route Map\]\(references\/public-route-map\.md\)/g)).toHaveLength(1);
    expect(fs.existsSync(routeMapPath)).toBe(true);
    expect(routeMap).toContain('## Main Flow: Intent -> Governed Change');
    expect(routeMap).toContain('`runtime-maintenance`');

    for (const record of publicRecords) {
      expect(routeMap).toContain(`\`${record.skill_name}\``);
    }
  });

  test('keeps public route selection, recommendation-only behavior, and special handoff semantics', () => {
    expect(skill).toContain('Select exactly one entrypoint');
    expect(skill).toContain('at most one route-changing question');
    expect(skill).toContain('Recommended entrypoint: <spec-*, standalone skill, or terminal command>');
    expect(skill).toContain("Use the repository's configured user language");
    expect(skill).toContain('Enter the recommendation only after the user asks to continue');
    expect(skill).toContain('If a standalone skill is user-invoked only, recommend it and wait.');
    expect(routeMap).toContain('`spec-explain`');
    expect(routeMap).toContain('Direct Lane');
    expect(routeMap).toContain('`spec-write-skill`');
    expect(routeMap).toContain('bounded source review');
    expect(routeMap).toContain('`runtime-maintenance`');
    expect(routeMap).toContain('source-revision request');
  });

  test('keeps five exit gates and two explicit reference triggers', () => {
    expect(skill).toContain('mutation, verification claims, source/runtime, handoff/context reset, and knowledge promotion');
    expect(skill).toContain('A route match never authorizes an exit');
    expect(skill).toContain('Never claim verification or completion without traceable evidence');
    expect(skill).toContain('never fabricate tests, refreshes, evals, or routing evidence');
    expect(skill).toContain('Modify source-of-truth surfaces, never generated host runtime');
    expect(skill).toContain('scripts/tools prepare deterministic facts while LLMs judge semantic adequacy');
    expect(skill).toContain('outside the fast paths, and to validate an explicit public route or answer “what next?”');
    expect(skill).toContain('handoff/context reset, knowledge promotion');
    expect(skill.match(/\[Conditional Routing Boundaries\]\(references\/conditional-routing-boundaries\.md\)/g)).toHaveLength(1);
    expect(fs.existsSync(boundaryPath)).toBe(true);
    expect(boundary).toContain('## Runtime Maintenance');
    expect(boundary).toContain('## Scenario Fingerprints');
    expect(boundary).toContain('## Codex Dispatch And Startup Reminder');
    expect(boundary).toContain('## Parent Multi-Repo Scope');
    expect(boundary).toContain('## Handoff And Knowledge Promotion');
    expect(boundary).toContain('## Ordinary Context Exclusions');
    expect(boundary).toContain('handoff/context reset, knowledge promotion');
  });

  test('keeps source/runtime, evidence, dispatch, and parent-repo boundaries in the package', () => {
    expect(boundary).toContain('generated runtime');
    expect(boundary).toContain('source skill package');
    expect(boundary).toContain('routing-policy source of truth');
    expect(boundary).toContain('Advisory facts cannot support');
    expect(boundary).toContain('dispatch_authorization_missing');
    expect(boundary).toContain('target_repo');
    expect(boundary).toContain('routing match alone never authorizes');
    for (const handoffCue of ['summary', 'source refs', 'freshness', 'limitations']) {
      expect(boundary).toContain(handoffCue);
    }
    for (const knowledgeCue of ['verified', 'reusable', 'scoped', 'invalidation condition']) {
      expect(boundary).toContain(knowledgeCue);
    }
  });

  test('hides internal-only skills from every user-readable routing source', () => {
    const internalRecords = records.filter((record) => record.entry_surface === 'internal_only');

    for (const record of internalRecords) {
      expect(packageText).not.toContain(record.skill_name);
    }
    expect(routeMap).not.toContain('`using-spec-first`');
  });

  test('does not restore legacy host-specific workflow spellings', () => {
    expect(packageText).not.toMatch(/(?:\/spec:|\$spec-)/);
  });
});
