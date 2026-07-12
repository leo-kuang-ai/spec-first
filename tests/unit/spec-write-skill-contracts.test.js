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
  expect(frontmatter).toContain('现有/外部 package');
  expect(frontmatter).toContain('用户明确要求');
  expect(skill).toContain('`validate-only`');
  expect(skill).toContain('不执行其 scripts、validator、hooks、binaries');
  expect(skill).toContain('不能因为目标目录里存在同名脚本就执行');
  expect(skill).toContain('纯安装/导入请求直接路由 `skill-installer`');
  expect(skill).toContain('用户同时明确要求检查与安装');
  expect(skill).toContain('portable/target/project/semantic/mutation 五轴 readiness');
});

test('operation model keeps migration and remediation as modifiers, not peer effects', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const deliveryGates = read('skills/spec-write-skill/references/delivery-gates.md');

  expect(skill).toContain('`base_operation=create|revise`');
  expect(skill).toContain('`effect=apply|validate-only`');
  expect(skill).toContain('`modifier=migrate|audit-remediation|none`');
  expect(skill).toContain('`base_operation=null`、`effect=not-entered`、`modifier=none`');
  expect(skill).toContain('`base_operation=revise` + `effect=validate-only`');
  expect(skill).toContain('`layer_result=blocked-source-owner`');
  expect(skill).toContain('`layer_result`：终态分支使用');
  expect(skill).toContain('portable-core-with-behavior-contract');
  expect(skill).not.toContain('`do-not-create-skill`');
  expect(skill).not.toContain('## Effects');
  expect(skill).not.toMatch(/^- `migrate`：/m);
  expect(skill).not.toMatch(/^- `audit-remediation`：/m);
  expect(deliveryGates).toContain('`structural-only`');
  expect(deliveryGates).not.toMatch(/`L[0-4]\b/);
  expect(authoring).toContain('不得把那些入口的预期动作记成本 workflow 的 `apply`/`validate-only`');
  expect(authoring).toContain('纯安装/导入请求直接路由 installer');
  expect(authoring).toContain('用户明确同时要求独立的 readiness、安全或结构检查');
  expect(authoring).toContain('`not-entered` 只用于根本不是 authoring/readiness 的 near-neighbor');
  expect(authoring).toContain('不要立即以 `blocked-source-owner` 结束');
  expect(authoring).toContain('candidate only');
  expect(authoring).toContain('答案会改变 package 设计、权限或不可逆结果的最少问题');
  expect(authoring).not.toMatch(/只问\s*2-3\s*个问题/);
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

test('prose-heavy skills load a conditional behavior-contract method without replacing deterministic gates', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const behavior = read('skills/spec-write-skill/references/behavior-contract-design.md');
  const delivery = read('skills/spec-write-skill/references/delivery-gates.md');

  expect(skill).toContain('[Behavior Contract Design](references/behavior-contract-design.md)');
  expect(skill).toContain('不要把它加载到纯工具/schema 型 Skill');
  expect(authoring).toContain('Match Freedom To Failure Cost');
  expect(authoring).toContain('`behavior-contract-design.md`');
  expect(behavior).toContain('Start From The Delta');
  expect(behavior).toContain('Criteria Before Enumeration');
  expect(behavior).toContain('good / bad / why');
  expect(behavior).toContain('过去的协助不构成本轮 mutation');
  expect(behavior).toContain('authoritative instruction source');
  expect(behavior).toContain('- bad：');
  expect(behavior).toContain('- good：');
  expect(behavior).toContain('- why：');
  expect(behavior).toContain('不要要求输出隐藏推理');
  expect(behavior).toContain('固定工具配额');
  expect(delivery).toContain('不接受“我已遵守指令”');
  expect(delivery).toContain('不要依赖宿主预设同名环境变量');
  expect(delivery).toContain('`base_operation`、`effect`、`modifier`、`layer_result`');
  expect(skill).toContain('portable/target/project/semantic/mutation 五轴 readiness');
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
    '| write-skill | spec-write-skill | spec-write-skill | no | Author project-owned Agent Skills or validate packages read-only |',
  );
});
