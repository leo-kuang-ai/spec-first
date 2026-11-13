'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skillsRoot = path.join(repoRoot, 'skills');
const governancePath = path.join(
  repoRoot,
  'src/cli/contracts/dual-host-governance/skills-governance.json',
);
const contractPath = path.join(repoRoot, 'docs/contracts/project-graph-consumption.md');
const boundaryPath = path.join(
  repoRoot,
  'skills/using-spec-first/references/conditional-routing-boundaries.md',
);
const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8'));
const roster = (Array.isArray(governance) ? governance : governance.skills)
  .map((record) => record.skill_name)
  .sort();

const CLASSIFICATION = {
  H: [
    'autoresearch',
    'spec-app-consistency-audit',
    'spec-code-review',
    'spec-compound',
    'spec-compound-refresh',
    'spec-debug',
    'spec-plan',
    'spec-prd',
    'spec-project-rules',
    'spec-rule-miner',
    'spec-work',
  ],
  I: [
    'spec-brainstorm',
    'spec-dogfood',
    'spec-explain',
    'spec-ideate',
    'spec-optimize',
    'spec-pov',
    'spec-resolve-pr-feedback',
    'spec-simplify-code',
    'spec-sweep',
    'spec-write-skill',
  ],
  O: [
    'spec-handoff',
    'spec-lfg',
    'spec-runtime-setup',
    'spec-worktree',
    'using-spec-first',
  ],
  N: [
    'spec-commit',
    'spec-commit-push-pr',
    'spec-doc-review',
    'spec-polish',
    'spec-product-pulse',
    'spec-promote',
    'spec-prototype',
    'spec-riffrec-feedback-analysis',
    'spec-strategy',
    'spec-test-browser',
    'spec-test-xcode',
    'spec-write-tasks',
  ],
};

const H_ANCHOR_TOKENS = [
  'provider_untrusted',
  'current source',
  'empty',
];

function readSkill(name) {
  return fs.readFileSync(path.join(skillsRoot, name, 'SKILL.md'), 'utf8');
}

describe('project intelligence consumption contract', () => {
  test('keeps the shared semantic owner and task-shaped boundary', () => {
    const contract = fs.readFileSync(contractPath, 'utf8');
    const boundary = fs.readFileSync(boundaryPath, 'utf8');

    expect(contract).toContain('This contract belongs to the Evidence Harness map');
    expect(contract).toContain('not a call-priority order');
    expect(contract).toContain('has no negative authority');
    expect(contract).toContain('Root instructions and SessionStart hooks are entry pointers');
    expect(contract).toContain('hook success never proves');
    expect(boundary).toContain('## Project Intelligence');
    expect(boundary).toContain('not a mandatory first step');
    expect(boundary).toContain('provider_untrusted');
    expect(boundary).toContain('never-blocking for ordinary workflows');
  });

  test('classifies the current governance roster exactly once', () => {
    const classified = Object.values(CLASSIFICATION).flat();
    expect(new Set(classified).size).toBe(classified.length);
    expect(classified.slice().sort()).toEqual(roster);
    expect(classified).toHaveLength(38);
    expect(CLASSIFICATION.H).toHaveLength(11);
    expect(CLASSIFICATION.I).toHaveLength(10);
    expect(CLASSIFICATION.O).toHaveLength(5);
    expect(CLASSIFICATION.N).toHaveLength(12);
  });

  test('requires a short candidate-to-source ceiling for every H consumer', () => {
    for (const skillName of CLASSIFICATION.H) {
      const source = readSkill(skillName);
      for (const token of H_ANCHOR_TOKENS) {
        expect(source).toContain(token);
      }
      expect(source).toMatch(/(?:direct|bounded) (?:reads?|source)/i);
      expect(source).toMatch(/(?:never|cannot|not)\s+[^.\n]{0,60}(?:proof|become|prove|set|establish)/i);
    }
  });

  test('does not copy provider lifecycle commands into non-setup consumer prose', () => {
    const providerCommandPattern = /\b(?:graphify|codegraph)\s+(?:query|path|explain|extract|update|init|serve|status|sync|index)\b/i;
    for (const skillName of [...CLASSIFICATION.H, ...CLASSIFICATION.I, ...CLASSIFICATION.N]) {
      expect(readSkill(skillName)).not.toMatch(providerCommandPattern);
    }
  });

  test('keeps classification as a test-only map', () => {
    expect(typeof CLASSIFICATION).toBe('object');
    expect(Object.keys(CLASSIFICATION)).toEqual(['H', 'I', 'O', 'N']);
  });

  test('projects every H anchor through the current adapter registry', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-project-graph-projection-'));
    try {
      for (const platform of getSupportedPlatforms()) {
        const { plan } = plugin.planBundledAssetSync(projectRoot, getAdapter(platform));
        for (const skillName of CLASSIFICATION.H) {
          const operation = plan.operations.find((candidate) =>
            candidate.path.endsWith(`/${skillName}/SKILL.md`)
          );
          expect(operation).toBeDefined();
          for (const token of H_ANCHOR_TOKENS) {
            expect(operation.contents).toContain(token);
          }
        }
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
