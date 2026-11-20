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
  expect(frontmatter).toContain('read-only readiness checks');
  expect(frontmatter).toContain('existing or external packages');
  expect(frontmatter).toContain('explicitly requested');
  expect(skill).toContain('## Branch Contract');
  expect(skill).toContain('| Validate-only |');
  expect(skill).toContain('do not execute target scripts, validators, hooks, binaries, or lifecycle');
  expect(skill).toContain('Its own validator is not a trusted tool');
  expect(skill).toContain('Route installation to `skill-installer`');
  expect(skill).toContain('report the check and stop; installation requires separate authorization');
  expect(skill).toContain('portable/target/project/semantic/mutation 5-axis readiness');
});

test('operation model keeps migration and remediation as modifiers, not peer effects', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const deliveryGates = read('skills/spec-write-skill/references/delivery-gates.md');
  const nearNeighborRow = skill.split('\n').find((line) => line.startsWith('| Near-neighbor |'));

  expect(skill).toContain('`base_operation=create|revise` distinguishes between creating a new package and handling an existing package');
  expect(skill).toContain('`effect=apply|validate-only`');
  expect(skill).toContain('effect=apply');
  expect(skill).toContain('effect=validate-only');
  expect(skill).toContain('`modifier=migrate|audit-remediation|none`');
  expect(skill).toContain('`base_operation=null`, `effect=not-entered`, `modifier=none`');
  expect(skill).toContain('`base_operation=revise` + `effect=validate-only`');
  expect(skill).toContain('`blocked-source-owner`');
  expect(skill).toContain('`layer_result` is the runtime output contract: `near-neighbor-route|refuse-generated-runtime-patch|portable-core-only|portable-core-with-behavior-contract|portable-readiness-report|trust-preflight-blocked|blocked-source-owner|spec-first-project-profile`.');
  expect(skill).toContain('portable-core-with-behavior-contract');
  expect(skill).toContain('| Owner blocked |');
  expect(skill).toContain('shall not downgrade to `not-entered` or guess owner');
  expect(skill).not.toContain('`do-not-create-skill`');
  expect(skill).not.toContain('## Effects');
  expect(skill).not.toMatch(/^- `migrate`：/m);
  expect(skill).not.toMatch(/^- `audit-remediation`：/m);
  expect(deliveryGates).toContain('`structural-only`');
  expect(deliveryGates).not.toMatch(/`L[0-4]\b/);
  expect(authoring).toContain('shall not record the expected actions of those entry points as part of the workflow\'s `apply`/`validate-only` steps');
  expect(authoring).toContain('Direct installation/import requests are routed to the installer');
  expect(authoring).toContain('independent readiness, security, or structural checks');
  expect(authoring).toContain('revise');
  expect(authoring).toContain('not-entered');
  expect(authoring).toContain('Do not immediately conclude with `blocked-source-owner`');
  expect(authoring).toContain('candidate only');
  expect(authoring).toContain('minimum number of questions that could alter package design, permissions, or lead to irreversible outcomes');
  expect(authoring).not.toMatch(/只问\s*2-3\s*个问题/);
  expect(nearNeighborRow).toContain('a quality audit alone');
  expect(nearNeighborRow).toContain('Fixing an accepted finding is authoring work and does not take this branch');
  expect(nearNeighborRow).not.toContain('只要 audit、');
});

test('conditional sources name their trigger, purpose, and fallback', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const target = read('skills/spec-write-skill/references/target-profiles.md');
  const project = read('skills/spec-write-skill/references/project-profiles.md');

  expect(skill).toContain('## Conditional Sources');
  expect(skill).toContain('change in target metadata/invocation or local governance/catalog/generator patch');
  expect(skill).toContain('Unread not allowed to start; full apply source patch; Tier A does not trigger.');
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
  expect(skill).not.toMatch(/^## Workflow$/m);
});

test('prose-heavy skills load a conditional behavior-contract method without replacing deterministic gates', () => {
  const skill = read('skills/spec-write-skill/SKILL.md');
  const authoring = read('skills/spec-write-skill/references/authoring-method.md');
  const behavior = read('skills/spec-write-skill/references/behavior-contract-design.md');
  const delivery = read('skills/spec-write-skill/references/delivery-gates.md');

  expect(skill).toContain('[Behavior Contract Design](references/behavior-contract-design.md)');
  expect(skill).toContain('Pure tool/schema; does not read');
  expect(authoring).toContain('Match Freedom To Failure Cost');
  expect(authoring).toContain('`behavior-contract-design.md`');
  expect(behavior).toContain('Start From The Delta');
  expect(behavior).toContain('trigger_condition');
  expect(behavior).toContain('fallback_if_unread');
  expect(behavior).toContain('Criteria Before Enumeration');
  expect(behavior).toContain('good / bad / why');
  expect(behavior).toContain('prior assistance does not constitute authorization for current mutation');
  expect(behavior).toContain('authoritative instruction source');
  expect(behavior).toContain('- bad:');
  expect(behavior).toContain('- good:');
  expect(behavior).toContain('- why:');
  expect(behavior).toContain('Do not request hidden reasoning output');
  expect(behavior).toContain('fixed tool allocations');
  expect(delivery).toContain('Evaluation of complex prose outputs should verify whether the generated artifact/response meets the specified criteria; acceptance of statements such as "I have followed the instruction," hidden self-checks, or checkbox markings shall not constitute valid justification.');
  expect(delivery).toContain('trigger_condition');
  expect(delivery).toContain('fallback_if_unread');
  expect(delivery).toContain('do not rely on any host-predefined environment variable with the same name');
  expect(delivery).toContain('`base_operation`, `effect`, `modifier`, `layer_result`');
  expect(skill).toContain('portable/target/project/semantic/mutation 5-axis readiness');
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
    'This field only restricts invocation, not equal to execution safety',
  );
  expect(targetProfile).toContain('https://developers.openai.com/codex/skills');
  expect(targetProfile).toContain('checked_at: 2026-07-12');
  expect(targetProfile).toContain('invalidation_condition:');
  expect(targetProfile).toContain('verification:');
});

test('spec-first project profile keeps catalog and runtime generated from source', () => {
  const project = read('skills/spec-write-skill/references/project-profiles.md');
  const delivery = read('skills/spec-write-skill/references/delivery-gates.md');

  expect(project).toContain('read-only catalog');
  expect(project).toContain('`spec-first init`');
  expect(delivery).toContain('it is not a source-owned consumer');
  expect(delivery).toContain('Host runtime projects only via `spec-first init`; no manual modifications to `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, or `.qoder/`.');
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
  expect(skill).toContain('compact Design Record and minimal pre-patch eval plan');
  expect(skill).toContain('risk-matched evidence family');
  expect(skill).toContain('Full apply requires baseline, protected behavior, or eval family');
  expect(skill).toContain('measurable optimization or field feedback altering disposition');
  expect(skill).not.toContain('需要 pre-patch eval 时');
  expect(skill).toContain('without completing the necessary design record/preview');
  expect(skill).toContain('Capability Map, explicit shape/module decision, or topology is expanded only when there are changes to owner, consumer, resource/runtime carrier, architecture, or risk');
  expect(workbench).toContain('Skill Design Record');
  expect(workbench).toContain('Desired Capability Map');
  expect(workbench).toContain('A `Desired Capability Map` should only be developed when there are multiple capability owners/consumers/runtime carriers, resource extraction/ deletion/ addition trade-offs, or high-risk/TCO decision-making scenarios.');
  expect(workbench).toContain('No map is created');
  expect(workbench).toContain('change in resource placement, eval family, or architecture');
  expect(workbench).toContain('file sets, resource placement, or runtime carrier');
  expect(workbench).not.toContain('Skill Design Brief');
  expect(workbench).not.toContain('未选项必须写 `not_applicable + reason`');
  expect(workbench).toContain('ArchitectureFit');
  expect(workbench).toContain('Tier A Short Path');
  expect(workbench).toContain('atomic conditional patch primitive');
  expect(workbench).toContain('do not include the Design Record body in the machine contract');
  expect(skill).toContain('the current request explicitly creates or revises content and the target root, along with the exact write set, remains within the requested scope');
  expect(skill).toContain('preview expands the root/scope to include dirty paths not explicitly covered in the current request');
  expect(authoring).toContain('Do not re-ask merely because a preview has been generated');
  expect(workbench).toContain('re-verification is required only when the root/scope is expanded, an uncovered dirty overwrite occurs, or new external/network/high-risk side effects are introduced');
  expect(delivery).toContain('Host check whether the exact write set is still covered by the current round\'s explicit create/revise request; re-verify only if the root/scope is expanded, dirty overwrite remains uncovered, or new external/network/high-risk side effects are introduced.');
  expect(workbench).not.toContain('宿主必须在写前重新确认本轮用户授权');
  expect(delivery).not.toContain('宿主必须重新确认授权');
  expect(previewValidator).toContain('re-confirm only if scope or side effects expand');
  expect(previewValidator).not.toContain('must re-confirm current user authorization before writing');
  expect(evaluation).toContain('full apply has confirmed a single source owner');
  expect(evaluation).toContain('read fully for full apply; Tier A behavior-preserving revise does not trigger');
  expect(evaluation).toContain('do not begin a full apply source patch');
  expect(evaluation).toContain('fallback_if_unread');
  expect(evaluation).toContain('protected_behavior -> source carrier -> contract assertion -> semantic eval case');
  expect(evaluation).toContain('## Model-Family Adaptation');
  expect(evaluation).toContain('`model-configured`, `skill-source-adapted`, `runtime-projected`');
  expect(evaluation).toContain('model-only baseline');
  expect(evaluation).toContain('prompt-hygiene candidate');
  expect(evaluation).toContain('requested and returned model');
  expect(optimization).toContain('execution_mode=manual_observation');
  expect(optimization).toContain('nor should any side-channel experiment database/runner be established');
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
