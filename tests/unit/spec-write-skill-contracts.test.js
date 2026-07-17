'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('front controller exposes outcome-first branches without unsafe package execution', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const frontmatter = skill.split('---')[1];

  expect(frontmatter).not.toMatch(/[<>]/);
  expect(frontmatter).toContain('只读验证');
  expect(frontmatter).toContain('现有/外部 package');
  expect(frontmatter).toContain('用户明确要求');
  expect(skill).toContain('## Branch Contract');
  expect(skill).toContain('| Validate-only |');
  expect(skill).toContain('不得执行目标 scripts、validator、hooks、binaries 或 lifecycle');
  expect(skill).toContain('目标目录内的“官方 validator”不构成可信工具链');
  expect(skill).toContain('安装交给 `skill-installer`');
  expect(skill).toContain('检查加安装时只检查并停止，安装另行授权');
  expect(skill).toContain('portable/target/project/semantic/mutation 五轴 readiness');
});

test('operation model keeps migration and remediation as modifiers, not peer effects', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const deliveryGates = read('skills/spec-write-skill/references/delivery-gates.md');
  const nearNeighborRow = skill.split('\n').find((line) => line.startsWith('| Near-neighbor |'));

  expect(skill).toContain('`base_operation=create|revise` 只区分新建 package 与处理现有 package');
  expect(skill).toContain('`effect=apply|validate-only`');
  expect(skill).toContain('只有 `effect=apply` 才允许修改已确认的 canonical source');
  expect(skill).toContain('`effect=validate-only` 即使面对现有或外部 package 也保持零写入');
  expect(skill).toContain('`modifier=migrate|audit-remediation|none`');
  expect(skill).toContain('`base_operation=null`、`effect=not-entered`、`modifier=none`');
  expect(skill).toContain('`base_operation=revise` + `effect=validate-only`');
  expect(skill).toContain('`blocked-source-owner`');
  expect(skill).toContain('`layer_result` 是 runtime 输出合同');
  expect(skill).toContain('portable-core-with-behavior-contract');
  expect(skill).toContain('| Owner blocked |');
  expect(skill).toContain('不得降格为 `not-entered` 或猜测 owner');
  expect(skill).not.toContain('`do-not-create-skill`');
  expect(skill).not.toContain('## Effects');
  expect(skill).not.toMatch(/^- `migrate`：/m);
  expect(skill).not.toMatch(/^- `audit-remediation`：/m);
  expect(deliveryGates).toContain('`structural-only`');
  expect(deliveryGates).not.toMatch(/`L[0-4]\b/);
  expect(authoring).toContain('不得把那些入口的预期动作记成本 workflow 的 `apply`/`validate-only`');
  expect(authoring).toContain('纯安装/导入请求直接路由 installer');
  expect(authoring).toContain('用户明确同时要求独立的 readiness、安全或结构检查');
  expect(authoring).toContain('`revise` 在此只表示输入是现有 package，不代表允许修改');
  expect(authoring).toContain('`not-entered` 只用于根本不是 authoring/readiness 的 near-neighbor');
  expect(authoring).toContain('不要立即以 `blocked-source-owner` 结束');
  expect(authoring).toContain('candidate only');
  expect(authoring).toContain('答案会改变 package 设计、权限或不可逆结果的最少问题');
  expect(authoring).not.toMatch(/只问\s*2-3\s*个问题/);
  expect(nearNeighborRow).toContain('audit-only quality review');
  expect(nearNeighborRow).toContain('已接受 finding 的 remediation 不属于本分支');
  expect(nearNeighborRow).not.toContain('只要 audit、');
});

test('conditional sources name their trigger, purpose, and fallback', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const target = read('skills/spec-write-skill/references/target-profiles.md');
  const project = read('skills/spec-write-skill/references/project-profiles.md');

  expect(skill).toContain('## Conditional Sources');
  expect(skill).toContain('target metadata/invocation 或本地治理/catalog/generator 改变 patch');
  expect(skill).toContain('未读不得开始 full apply source patch；Tier A 不触发');
  expect(authoring).toContain('Branch-First Information Hierarchy');
  expect(authoring).toContain('trigger_condition');
  expect(authoring).toContain('purpose');
  expect(authoring).toContain('fallback_if_unread');
  expect(target).toContain('allow_implicit_invocation: false');
  expect(project).toContain('`npm run docs:runtime-catalog`');
  expect(fs.existsSync(path.join(
    repoRoot,
    'skills/spec-write-skill/references/skill-quality-vocabulary.md',
  ))).toBe(false);
  expect(skill).not.toContain('skill-quality-vocabulary.md');
  expect(skill).not.toContain('## Operation Model');
  expect(skill).not.toContain('## Workflow');
});

test('prose-heavy skills load a conditional behavior-contract method without replacing deterministic gates', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const behavior = read('skills/spec-write-skill/references/behavior-contract-design.md');
  const delivery = read('skills/spec-write-skill/references/delivery-gates.md');

  expect(skill).toContain('[Behavior Contract Design](references/behavior-contract-design.md)');
  expect(skill).toContain('纯工具/schema 不读');
  expect(authoring).toContain('Match Freedom To Failure Cost');
  expect(authoring).toContain('`behavior-contract-design.md`');
  expect(behavior).toContain('Start From The Delta');
  expect(behavior).toContain('trigger_condition');
  expect(behavior).toContain('fallback_if_unread');
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
  expect(delivery).toContain('trigger_condition');
  expect(delivery).toContain('fallback_if_unread');
  expect(delivery).toContain('不要依赖宿主预设同名环境变量');
  expect(delivery).toContain('`base_operation`、`effect`、`modifier`、`layer_result`');
  expect(skill).toContain('portable/target/project/semantic/mutation 五轴 readiness');
});

test('Codex metadata disables implicit invocation without claiming execution safety', () => {
  const metadata = read('skills/spec-write-skill/agents/openai.yaml');
  const targetProfile = read('skills/spec-write-skill/references/target-profiles.md');
  expect(metadata).toContain('allow_implicit_invocation: false');
  expect(metadata).toContain('explicit project-owned Skill');
  expect(metadata).toContain('compact Design Record and minimum pre-patch eval plan');
  expect(metadata).toContain('expand capability map, shape, or topology only when');
  expect(metadata).toContain('re-confirm only for scope expansion');
  expect(metadata).not.toContain('produce the Design Brief, capability map');
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

test('authoring workbench keeps semantic design, shape-aware evaluation, and mutation facts in their proper owners', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const workbench = read('skills/spec-write-skill/references/authoring-workbench.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const evaluation = read('skills/spec-write-skill/references/evaluation-design.md');
  const optimization = read('skills/spec-write-skill/references/optimization-and-lifecycle.md');
  const delivery = read('skills/spec-write-skill/references/delivery-gates.md');
  const previewValidator = read('skills/spec-write-skill/scripts/validate-authoring-preview.cjs');

  expect(skill).toContain('[Authoring Workbench](references/authoring-workbench.md)');
  expect(skill).toContain('[Shape-Aware Evaluation Design](references/evaluation-design.md)');
  expect(skill).toContain('[Optimization And Feedback Handoff](references/optimization-and-lifecycle.md)');
  expect(skill).toContain('| Tier A apply |');
  expect(skill).toContain('| Full apply |');
  expect(skill).toContain('紧凑 Design Record 与最小 pre-patch eval plan');
  expect(skill).toContain('风险匹配的 evidence family');
  expect(skill).toContain('Full apply 需要 baseline、protected behavior 或 eval family');
  expect(skill).toContain('measurable optimization 或 field feedback 改变 disposition');
  expect(skill).not.toContain('需要 pre-patch eval 时');
  expect(skill).toContain('未完成必要 design record/preview 不得 apply');
  expect(skill).toContain('Capability Map、显式 shape/module decision 或 topology 只在它们改变');
  expect(workbench).toContain('Skill Design Record');
  expect(workbench).toContain('Desired Capability Map');
  expect(workbench).toContain('只有出现多个 capability owner/consumer/runtime carrier');
  expect(workbench).toContain('没有这些信号时不创建 map');
  expect(workbench).toContain('只有 shape 会改变 resource placement、eval family 或 architecture 时');
  expect(workbench).toContain('只有文件集合、resource placement 或 runtime carrier 发生变化时');
  expect(workbench).not.toContain('Skill Design Brief');
  expect(workbench).not.toContain('未选项必须写 `not_applicable + reason`');
  expect(workbench).toContain('ArchitectureFit');
  expect(workbench).toContain('Tier A Short Path');
  expect(workbench).toContain('原子 conditional patch primitive');
  expect(workbench).toContain('不要把 Design Record 正文写入 machine contract');
  expect(skill).toContain('当前轮明确 create/revise 且 target root 与 exact write set 保持在请求范围内时');
  expect(skill).toContain('仅当 preview 扩大 root/scope、覆盖当前请求未明确包含的 dirty path');
  expect(authoring).toContain('不要只因为生成了 preview 就再次询问');
  expect(workbench).toContain('仅在 root/scope 扩大、未覆盖的 dirty overwrite');
  expect(delivery).toContain('仅在 root/scope 扩大、未覆盖的 dirty overwrite');
  expect(workbench).not.toContain('宿主必须在写前重新确认本轮用户授权');
  expect(delivery).not.toContain('宿主必须重新确认授权');
  expect(previewValidator).toContain('re-confirm only if scope or side effects expand');
  expect(previewValidator).not.toContain('must re-confirm current user authorization before writing');
  expect(evaluation).toContain('full apply 已确认单一 source owner');
  expect(evaluation).toContain('full apply 必须读完；Tier A behavior-preserving revise 不触发');
  expect(evaluation).toContain('不得开始 full apply source patch');
  expect(evaluation).toContain('fallback_if_unread');
  expect(evaluation).toContain('protected_behavior → source carrier → contract assertion → semantic eval case');
  expect(evaluation).toContain('## Model-Family Adaptation');
  expect(evaluation).toContain('`model-configured`、`skill-source-adapted`、`runtime-projected`');
  expect(evaluation).toContain('model-only baseline');
  expect(evaluation).toContain('prompt-hygiene candidate');
  expect(evaluation).toContain('请求模型与实际返回模型');
  expect(optimization).toContain('execution_mode=manual_observation');
  expect(optimization).toContain('绝不写入 `spec-optimize` YAML `execution.mode`');
  expect(delivery).toContain('Apply Preview Gate');
  expect(skill).not.toContain('effect=guided');
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
    '| write-skill | spec-write-skill | spec-write-skill | no | Design and author project-owned Agent Skills, or validate packages read-only |',
  );
});
