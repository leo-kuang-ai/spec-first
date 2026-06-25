'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const { syncSkills } = require('../../src/cli/plugin');

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
  test('defines a standalone authoring workflow without becoming a public command', () => {
    const skill = read('skills/spec-write-skill/SKILL.md');
    const vocabulary = read('skills/spec-write-skill/references/skill-quality-vocabulary.md');
    const authoringMethod = read('skills/spec-write-skill/references/authoring-method.md');
    const deliveryGates = read('skills/spec-write-skill/references/delivery-gates.md');

    expect(skill).toContain('name: spec-write-skill');
    expect(skill).toContain('写 skill 的 standalone skill');
    expect(skill).toContain('先判断是否值得做成 skill');
    expect(skill).toContain('不是公开 Claude `/spec:*` 或 Codex `$spec-*` workflow');
    expect(skill).toContain('Source of truth 是 `skills/`');
    expect(skill).toContain('src/cli/contracts/dual-host-governance/skills-governance.json');
    expect(skill).toContain('[Authoring Method](references/authoring-method.md)');
    expect(skill).toContain('[Skill Quality Vocabulary](references/skill-quality-vocabulary.md)');
    expect(skill).toContain('[Delivery Gates](references/delivery-gates.md)');
    expect(skill).toContain('描述是 trigger contract');
    expect(skill).toContain('先列真实 branch');
    expect(skill).toContain('context pointer 何时读取');
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
    expect(skill).not.toContain('/spec:write-skill');
    expect(skill).not.toContain('$spec-write-skill');

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
    ]) {
      expect(deliveryGates).toContain(snippet);
    }
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

  test('governance registers the skill as dual-host standalone delivery', () => {
    const governance = JSON.parse(readAbsolute(GOVERNANCE_PATH));
    const record = governance.skills.find((candidate) =>
      candidate.skill_name === 'spec-write-skill',
    );

    expect(record).toEqual({
      skill_name: 'spec-write-skill',
      entry_surface: 'standalone_skill',
      command_name: null,
      host_scope: 'dual_host',
      owner_host: null,
      host_delivery: {
        claude: 'skill',
        codex: 'skill',
      },
    });
  });

  test('runtime sync delivers the standalone skill and package-local reference to both hosts', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-skill-runtime-'));

    try {
      for (const [adapter, runtimeSkillRoot] of [
        [new ClaudeAdapter(), path.join(projectRoot, '.claude', 'skills', 'spec-write-skill')],
        [new CodexAdapter(), path.join(projectRoot, '.agents', 'skills', 'spec-write-skill')],
      ]) {
        syncSkills(projectRoot, adapter);

        const runtimeSkill = readAbsolute(path.join(runtimeSkillRoot, 'SKILL.md'));
        const runtimeAuthoring = readAbsolute(path.join(runtimeSkillRoot, 'references', 'authoring-method.md'));
        const runtimeDelivery = readAbsolute(path.join(runtimeSkillRoot, 'references', 'delivery-gates.md'));
        const runtimeVocabulary = readAbsolute(path.join(runtimeSkillRoot, 'references', 'skill-quality-vocabulary.md'));

        expect(runtimeSkill).toContain('name: spec-write-skill');
        expect(runtimeSkill).toContain('不是公开 Claude `/spec:*` 或 Codex `$spec-*` workflow');
        expect(runtimeAuthoring).toContain('Skill Creator Compatibility');
        expect(runtimeDelivery).toContain('Forward Testing Boundary');
        expect(runtimeVocabulary).toContain('Description As Trigger Contract');
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
