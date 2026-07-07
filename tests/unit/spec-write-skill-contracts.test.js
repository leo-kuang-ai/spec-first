'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const { syncBundledAssets } = require('../../src/cli/plugin');

const REPO_ROOT = path.join(__dirname, '..', '..');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readAbsolute(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-write-skill contract', () => {
  test('defines a public authoring workflow without replacing audit or ordinary work', () => {
    const skill = read('skills/spec-write-skill/SKILL.md');
    const vocabulary = read('skills/spec-write-skill/references/skill-quality-vocabulary.md');
    const authoringMethod = read('skills/spec-write-skill/references/authoring-method.md');
    const deliveryGates = read('skills/spec-write-skill/references/delivery-gates.md');

    expect(skill).toContain('name: spec-write-skill');
    expect(skill).toContain('公开 workflow：编写、改写、迁移或按 audit findings 修复 spec-first source skill');
    expect(skill).toContain('明确、值得复用的 skill authoring 目标');
    expect(skill).toContain('落到 `skills/<name>/` source patch');
    expect(skill).toContain('普通实现、调试、评审或文档导出走对应 `spec-*` workflow 或直接回答');
    expect(skill).toContain('资格判断');
    expect(skill).toContain('Source of truth 是 `skills/`');
    expect(skill).toContain('src/cli/contracts/dual-host-governance/skills-governance.json');
    expect(skill).toContain('[Authoring Method](references/authoring-method.md)');
    expect(skill).toContain('[Skill Quality Vocabulary](references/skill-quality-vocabulary.md)');
    expect(skill).toContain('[Delivery Gates](references/delivery-gates.md)');
    expect(skill).toContain('STOP Reference Trigger Map');
    expect(skill).toContain('if unread, do not create or rewrite source yet');
    expect(skill).toContain('conceptual SSOT for resource placement');
    expect(skill).toContain('record `not_checked_with_reason`');
    expect(skill).toContain('描述是 trigger contract');
    expect(skill).toContain('先列真实 branch');
    expect(skill).toContain('context pointer 的读取条件');
    expect(skill).toContain('completion criterion');
    expect(skill).toContain('clarity(done/not done) 与 demand');
    expect(skill).toContain('sentence-level no-op pruning');
    expect(skill).toContain('至少 1 个 should-trigger 示例');
    expect(skill).toContain('forward-testing');
    expect(skill).toContain('`do-not-create-skill`');
    expect(skill).toContain('`scaffold`');
    expect(skill).toContain('`production`');
    expect(skill).toContain('`library`');
    expect(skill).toContain('`governed`');
    expect(skill).toContain('不照搬 `yao-meta-skill` 的完整 SkillOps 平台');
    expect(skill).toContain('新增 skill 必须更新 `skills-governance.json`');
    expect(skill).toContain('不要手改 `.claude/`、`.codex/` 或 `.agents/skills/`');
    for (const snippet of [
      'Description As Trigger Contract',
      'Information Hierarchy',
      'Context Pointer Wording',
      'Completion Criteria',
      'Branch',
      'Sentence-Level No-Op',
      'Pruning',
      'Co-location',
      'Leading Words',
      'Failure Mode:',
      'Spec-First Closeout Checklist',
    ]) {
      expect(vocabulary).toContain(snippet);
    }

    for (const snippet of [
      'Qualification',
      'Evidence Matrix Readiness',
      '`implementation_permission: ready`',
      'do-not-create-skill',
      'Intent Dialogue',
      'Reference Scan',
      'Branch And Pointer Design',
      'Skill Creator Compatibility',
      'frontmatter `name`、治理记录和 runtime catalog 必须一致',
      'frontmatter 只放 `name` 和 `description`',
      '$CODEX_HOME/skills',
      'weak-context-pointer',
      'vague-completion-criterion',
      'Anti-Pattern Families',
      'one-off-vs-reusable',
      'document-export-vs-agent-skill',
      'future-outline-vs-build',
    ]) {
      expect(authoringMethod).toContain(snippet);
    }

    for (const snippet of [
      'Quality Tiers',
      '`scaffold`',
      '`production`',
      '`library`',
      '`governed`',
      'Resource Boundary',
      'Gate Selection',
      'branch / context pointer / information hierarchy',
      'Packaging Readiness',
      'Skill Quality Eval Boundary',
      'Output Eval Boundary',
      'Forward Testing Boundary',
      'not_checked_with_reason',
      'eval_adequacy',
      'boundary_result',
    ]) {
      expect(deliveryGates).toContain(snippet);
    }
    expect(authoringMethod).toContain('## Contents');
    expect(vocabulary).toContain('## Contents');
  });

  test('declares trigger and boundary eval coverage for maintainer validation', () => {
    const cases = JSON.parse(read('skills/spec-write-skill/evals/trigger-cases.json'));

    expect(cases.schema_version).toBe('spec-first.spec-write-skill-trigger-cases.v1');
    expect(cases.skill).toBe('spec-write-skill');
    expect(cases.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-write-skill/SKILL.md',
      'skills/spec-write-skill/references/authoring-method.md',
      'skills/spec-write-skill/references/delivery-gates.md',
      'skills/spec-write-skill/references/skill-quality-vocabulary.md',
    ]));
    expect(cases.cases.map((entry) => entry.expected_result)).toEqual(expect.arrayContaining([
      'should-trigger',
      'should-not-trigger',
      'near-neighbor',
      'boundary',
    ]));
    expect(JSON.stringify(cases)).toContain('generated-runtime-not-source');
    expect(JSON.stringify(cases)).toContain('one-off-vs-reusable');
    expect(JSON.stringify(cases)).toContain('explain-not-package');
    expect(JSON.stringify(cases)).toContain('document-export-vs-agent-skill');
    expect(JSON.stringify(cases)).toContain('future-outline-vs-build');
    expect(JSON.stringify(cases)).toContain('weak-context-pointer');
    expect(JSON.stringify(cases)).toContain('branch-first-information-hierarchy');
    expect(JSON.stringify(cases)).toContain('vague-completion-criterion');
    expect(JSON.stringify(cases)).toContain('over-split-granularity');
    expect(JSON.stringify(cases)).toContain('leading-word-no-op');

    const tags = [...new Set(cases.cases.flatMap((entry) => entry.coverage_tags))];
    expect(tags).toEqual(expect.arrayContaining(['failure', 'expected']));
  });

  test('governance registers the skill as dual-host workflow command delivery', () => {
    const governance = JSON.parse(readAbsolute(GOVERNANCE_PATH));
    const record = governance.skills.find((candidate) =>
      candidate.skill_name === 'spec-write-skill',
    );

    expect(record).toEqual({
      skill_name: 'spec-write-skill',
      entry_surface: 'workflow_command',
      command_name: 'write-skill',
      host_scope: 'dual_host',
      owner_host: null,
      host_delivery: {
        claude: 'command',
        codex: 'skill',
        cursor: 'skill',
        kiro: 'skill',
        qoder: 'command',
      },
    });
  });

  test('runtime sync delivers the workflow command and package-local references to both hosts', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-skill-runtime-'));

    try {
      for (const [adapter, runtimeSkillRoot, runtimeCommandPath] of [
        [
          new ClaudeAdapter(),
          path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-write-skill'),
          path.join(projectRoot, '.claude', 'commands', 'spec-write-skill.md'),
        ],
        [
          new CodexAdapter(),
          path.join(projectRoot, '.agents', 'skills', 'spec-write-skill'),
          null,
        ],
      ]) {
        syncBundledAssets(projectRoot, adapter);

        const runtimeSkill = readAbsolute(path.join(runtimeSkillRoot, 'SKILL.md'));
        const runtimeAuthoring = readAbsolute(path.join(runtimeSkillRoot, 'references', 'authoring-method.md'));
        const runtimeDelivery = readAbsolute(path.join(runtimeSkillRoot, 'references', 'delivery-gates.md'));
        const runtimeVocabulary = readAbsolute(path.join(runtimeSkillRoot, 'references', 'skill-quality-vocabulary.md'));

        expect(runtimeSkill).toContain('name: spec-write-skill');
        expect(runtimeSkill).toContain('明确、值得复用的 skill authoring 目标');
        expect(runtimeAuthoring).toContain('Skill Creator Compatibility');
        expect(runtimeDelivery).toContain('Forward Testing Boundary');
        expect(runtimeVocabulary).toContain('Description As Trigger Contract');
        if (runtimeCommandPath) {
          const runtimeCommand = readAbsolute(runtimeCommandPath);
          expect(runtimeCommand).toContain('Write, revise, migrate, or remediate spec-first source skills');
          expect(runtimeCommand).toContain('明确、值得复用的 skill authoring 目标');
        }
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
