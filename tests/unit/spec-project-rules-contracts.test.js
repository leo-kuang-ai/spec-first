'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');

function readGovernanceSkills() {
  const raw = JSON.parse(fs.readFileSync(path.join(
    REPO_ROOT,
    'src/cli/contracts/dual-host-governance/skills-governance.json',
  ), 'utf8'));
  return raw.skills;
}

describe('spec-project-rules governance and source contracts', () => {
  const skillDir = path.join(REPO_ROOT, 'skills', 'spec-project-rules');

  test('is registered as a dual-host standalone skill', () => {
    const entry = readGovernanceSkills().find((item) => item.skill_name === 'spec-project-rules');
    expect(entry).toBeDefined();
    expect(entry.entry_surface).toBe('standalone_skill');
    expect(entry.command_name).toBeNull();
    expect(entry.host_scope).toBe('dual_host');
    expect(entry.owner_host).toBeNull();
    expect(new Set(Object.values(entry.host_delivery))).toEqual(new Set(['skill']));
  });

  test('SKILL.md frontmatter matches governance identity and standalone routing language', () => {
    const text = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
    const match = text.match(/^---\n([\s\S]*?)\n---\n/);
    expect(match).not.toBeNull();
    const nameLine = match[1].split('\n').find((line) => line.startsWith('name:'));
    expect(nameLine).toBe('name: spec-project-rules');

    const description = text.match(/^description: "([\s\S]*?)"$/m)[1];
    expect(description).toContain('standalone skill');
    expect(description).toContain('Do not use for');
    // Standalone skills must not be advertised as slash-command entrypoints.
    expect(description).not.toMatch(/\/spec-project-rules/);
  });

  test('source package carries the declared reference and eval assets', () => {
    for (const relative of [
      'SKILL.md',
      'references/mining-method.md',
      'references/knowledge-format.md',
      'evals/trigger-cases.json',
      'scripts/extract-deps.cjs',
      'scripts/verify-deps.cjs',
    ]) {
      expect(fs.existsSync(path.join(skillDir, relative))).toBe(true);
    }

    const evals = JSON.parse(fs.readFileSync(path.join(skillDir, 'evals/trigger-cases.json'), 'utf8'));
    expect(evals.skill).toBe('spec-project-rules');
    const types = new Set(evals.cases.map((item) => item.case_type));
    for (const required of ['should-trigger', 'near-neighbor', 'should-not-trigger', 'boundary', 'failure']) {
      expect(types.has(required)).toBe(true);
    }
    // Deterministic helper scripts exist and are Node-syntax valid.
    for (const script of ['scripts/extract-deps.cjs', 'scripts/verify-deps.cjs']) {
      const scriptPath = path.join(skillDir, script);
      expect(fs.existsSync(scriptPath)).toBe(true);
    }
    // Near-neighbor routing must keep the boundary against the surviving spec-rule-miner.
    const nearNames = evals.cases.filter((item) => item.case_type === 'near-neighbor')
      .map((item) => item.expected_mode);
    expect(nearNames).toContain('spec-rule-miner');
  });

  test('knowledge base declares a marker-scoped, architecture-first write contract', () => {
    const skill = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
    expect(skill).toContain('spec-project-rules-start');
    expect(skill).toContain('docs/architecture/');
    // Layered loading contract: module-level KB files + module-dir entry pointers.
    expect(skill).toContain('modules/');
    // Architecture boundaries are the primary product; coding rules are a filtered secondary section.
    const purposeIndex = skill.indexOf('一级产物是架构边界知识');
    const codingIndex = skill.indexOf('编码约定是二级产物');
    expect(purposeIndex).toBeGreaterThan(-1);
    expect(codingIndex).toBeGreaterThan(purposeIndex);
  });
});
