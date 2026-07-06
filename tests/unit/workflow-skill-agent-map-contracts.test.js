'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const MAP_PATH = path.join(ROOT, 'docs', 'workflow-skill-agent-map.md');
const GOVERNANCE_PATH = path.join(
  ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);

// 公开 workflow 的权威真相源:skills-governance.json 中 entry_surface=workflow_command 的 skill。
// docs/workflow-skill-agent-map.md 是人读的治理导航地图;它的第二章映射表必须覆盖每个
// 公开 workflow,否则下游会基于不完整导航做决策(P1-2 漂移根因)。
function publicWorkflowSkills() {
  const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
  return governance.skills
    .filter((skill) => skill.entry_surface === 'workflow_command')
    .map((skill) => skill.skill_name)
    .sort((a, b) => a.localeCompare(b));
}

function workflowEntrypointFor(skillName) {
  return skillName;
}

describe('workflow-skill-agent-map coverage', () => {
  test('每个公开 workflow 都出现在 map 第二章映射表中', () => {
    const mapContent = fs.readFileSync(MAP_PATH, 'utf8');
    const missing = publicWorkflowSkills()
      .map(workflowEntrypointFor)
      .filter((command) => !mapContent.includes(`\`${command}\``));

    expect(missing).toEqual([]);
  });

  test('map 不暴露 governance 之外的退役 workflow', () => {
    const mapContent = fs.readFileSync(MAP_PATH, 'utf8');
    const allowed = new Set(publicWorkflowSkills().map(workflowEntrypointFor));
    const commands = Array.from(mapContent.matchAll(/`(spec-[a-z0-9-]+)`/g), (match) => match[1])
      .filter((command) => command !== 'spec-first');
    const unexpected = [...new Set(commands)]
      .filter((command) => !allowed.has(command))
      .sort((a, b) => a.localeCompare(b));

    expect(unexpected).toEqual([]);
    expect(mapContent).not.toContain('/spec:update');
    expect(mapContent).not.toContain('/spec:');
    expect(mapContent).not.toContain('$spec-');
  });

  test('回归锚点:此前漏掉的三个 workflow 现已收录', () => {
    const mapContent = fs.readFileSync(MAP_PATH, 'utf8');
    for (const command of ['spec-compound-refresh', 'spec-release-notes', 'spec-polish-beta']) {
      expect(mapContent).toContain(`\`${command}\``);
    }
  });
});
