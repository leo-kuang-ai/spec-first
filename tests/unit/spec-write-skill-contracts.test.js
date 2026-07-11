'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('front controller exposes portable authoring and validate-only without unsafe package execution', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const frontmatter = skill.split('---')[1];

  expect(frontmatter).not.toMatch(/[<>]/);
  expect(frontmatter).toContain('只读验证');
  expect(skill).toContain('`validate-only`');
  expect(skill).toContain('不执行其 scripts、validator、hooks、binaries');
  expect(skill).toContain('不能因为目标目录里存在同名脚本就执行');
  expect(skill).toContain('portable/target/project readiness');
});

test('operation model keeps migration and remediation as modifiers, not peer effects', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const deliveryGates = read('skills/spec-write-skill/references/delivery-gates.md');

  expect(skill).toContain('`base_operation=create|revise`');
  expect(skill).toContain('`effect=apply|validate-only`');
  expect(skill).toContain('`modifier=migrate|audit-remediation|none`');
  expect(skill).not.toContain('## Effects');
  expect(skill).not.toMatch(/^- `migrate`：/m);
  expect(skill).not.toMatch(/^- `audit-remediation`：/m);
  expect(deliveryGates).toContain('`structural-only`');
  expect(deliveryGates).not.toMatch(/`L[0-4]\b/);
});

test('profiles are conditional and legacy vocabulary owner is removed', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const target = read('skills/spec-write-skill/references/target-profiles.md');
  const project = read('skills/spec-write-skill/references/project-profiles.md');

  expect(skill).toContain('Load profiles conditionally');
  expect(authoring).toContain('Branch-First Information Hierarchy');
  expect(target).toContain('allow_implicit_invocation: false');
  expect(project).toContain('`npm run docs:runtime-catalog`');
  expect(fs.existsSync(path.join(
    repoRoot,
    'skills/spec-write-skill/references/skill-quality-vocabulary.md',
  ))).toBe(false);
  expect(skill).not.toContain('skill-quality-vocabulary.md');
});

test('Codex metadata disables implicit invocation without claiming execution safety', () => {
  const metadata = read('skills/spec-write-skill/agents/openai.yaml');
  const targetProfile = read('skills/spec-write-skill/references/target-profiles.md');
  expect(metadata).toContain('allow_implicit_invocation: false');
  expect(metadata).toContain('explicit project-owned Skill');
  expect(targetProfile).toContain(
    '该字段只限制 invocation，不等于 execution safety',
  );
  expect(targetProfile).toContain('https://developers.openai.com/codex/skills');
  expect(targetProfile).toContain('checked_at: 2026-07-12');
  expect(targetProfile).toContain('invalidation_condition:');
  expect(targetProfile).toContain('verification:');
});

test('spec-first project profile keeps catalog and runtime generated from source', () => {
  const project = read('skills/spec-write-skill/references/project-profiles.md');
  const delivery = read('skills/spec-write-skill/references/delivery-gates.md');

  expect(project).toContain('只读 catalog');
  expect(project).toContain('`spec-first init`');
  expect(delivery).toContain('它不是 source-owned consumer');
  expect(delivery).toContain('不得手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`');
});

test('public workflow governance identity remains stable', () => {
  const governance = JSON.parse(read(
    'src/cli/contracts/dual-host-governance/skills-governance.json',
  ));
  const record = governance.skills.find((entry) => entry.skill_name === 'spec-write-skill');

  expect(record).toMatchObject({
    entry_surface: 'workflow_command',
    command_name: 'write-skill',
    host_delivery: {
      claude: 'command',
      codex: 'skill',
      cursor: 'skill',
      kiro: 'skill',
      qoder: 'command',
    },
  });

  expect(read('docs/catalog/runtime-capabilities.md')).toContain(
    '| write-skill | spec-write-skill | spec-write-skill | no | Author, migrate, remediate, or validate project-owned Agent Skills |',
  );
});
