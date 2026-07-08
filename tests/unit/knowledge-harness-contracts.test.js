'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readPlanSurface() {
  return [
    read('skills/spec-plan/SKILL.md'),
    read('skills/spec-plan/references/governance-boundaries.md'),
  ].join('\n');
}

describe('knowledge harness contract', () => {
  test('defines six layers, v1.15 scope, and recall trust boundaries', () => {
    const contract = read('docs/contracts/knowledge/knowledge-harness.md');

    for (const layer of [
      'L1 Project Context',
      'L2 Context Budget',
      'L3 Code Intelligence',
      'L4 Memory / Prior Decisions',
      'L5 Skill / Tool Capability',
      'L6 Evidence / Promotion',
    ]) {
      expect(contract).toContain(layer);
    }

    expect(contract).toContain('L1 已由现有 `spec-prd`/host docs 覆盖');
    expect(contract).toContain('L3 归 v1.16 capability-aware 协同');
    expect(contract).toContain('L2/L4/L6 是 v1.15 completion gate');
    expect(contract).toContain('L5 是 advisory follow-up');
    expect(contract).toContain('recall 命中是 advisory candidate');
    expect(contract).toContain('必须回源到 source/test/doc 确认后才可升为 confirmed');
    expect(contract).toContain('不依赖模型自评');
    expect(contract).toContain('source_refs');
    expect(contract).toContain('legacy_unstructured_advisory');
    expect(contract).toContain('file-first');
    expect(contract).toContain('不引入向量库、SQLite 或外部 memory 平台作为默认 source truth');
    expect(contract).toContain('promotion gate 的定位是噪声/质量控制，不是反注入防御');
  });

  test('records resolved open questions without creating new schemas or enums', () => {
    const contract = read('docs/contracts/knowledge/knowledge-harness.md');

    for (const oq of ['OQ-1', 'OQ-2', 'OQ-3', 'OQ-4']) {
      expect(contract).toContain(oq);
    }

    expect(contract).toContain('summary 缺少下游所需的 requirement/task/finding/evidence detail');
    expect(contract).toContain('互依赖任务');
    expect(contract).toContain('不实现 hybrid');
    expect(contract).toContain('语义近但用词不同');
    expect(contract).toContain('复用 `provider_untrusted` advisory 语义');
    expect(contract).toContain('不新建 `docs/contracts/knowledge/solution-promotion.md`');
    expect(fs.existsSync(path.join(REPO_ROOT, 'docs/contracts/knowledge/solution-promotion.schema.json'))).toBe(false);
    expect(fs.existsSync(path.join(REPO_ROOT, 'docs/contracts/knowledge/solution-promotion.md'))).toBe(false);
  });
});

describe('knowledge harness workflow consumers', () => {
  test('plan work and review expose summary-first producer and consumer signals', () => {
    const workflowTexts = [
      readPlanSurface(),
      read('skills/spec-work/SKILL.md'),
      read('skills/spec-code-review/SKILL.md'),
    ];

    for (const text of workflowTexts) {
      expect(text).toContain('Summary-First Handoff');
      expect(text).toContain('artifact-summary.v1');
      expect(text).toContain('summary_missing');
      expect(text).toContain('full_artifact_read_reason');
      expect(text).toContain('full_artifact_read_triggers');
      expect(text).toContain('互依赖任务');
      expect(text).toContain('context-bundle.v1');
      expect(text).toContain('related_paths');
      expect(text).toContain('evidence_paths');
      expect(text).toContain('excluded_context');
      expect(text).not.toContain('included_context');
      expect(text).not.toContain('omitted_context');
    }
  });

  test('artifact-summary contract itself defines summary_missing and full_artifact_read_reason rules', () => {
    const contract = read('docs/contracts/artifact-summary.md');

    expect(contract).toContain('summary_missing');
    expect(contract).toContain('full_artifact_read_reason');
    expect(contract).toContain('full_artifact_read_triggers');
  });

  test('context-bundle contract does not introduce a second included/omitted schema', () => {
    const contract = read('docs/contracts/context-bundle.md');

    expect(contract).not.toContain('included_context');
    expect(contract).not.toContain('omitted_context');
  });

  test('plan and debug treat solution recall as advisory until source-confirmed', () => {
    const plan = readPlanSurface();
    const debug = read('skills/spec-debug/SKILL.md');

    for (const text of [plan, debug]) {
      expect(text).toContain('Recall Trust Boundary');
      expect(text).toContain('docs/solutions');
      expect(text).toContain('advisory candidate');
      expect(text).toContain('source_refs');
      expect(text).toContain('source_reads_required');
      expect(text).toContain('source/test/doc');
      expect(text).toContain('不依赖模型自评');
    }
  });

  test('work and code-review consume solution recall as advisory until source-confirmed', () => {
    const work = read('skills/spec-work/SKILL.md');
    const codeReview = read('skills/spec-code-review/SKILL.md');

    for (const text of [work, codeReview]) {
      expect(text).toContain('docs/solutions');
      expect(text).toContain('advisory candidate');
      expect(text).toContain('source_refs');
      expect(text).toContain('source_reads_required');
      expect(text).toContain('不依赖模型自评');
    }
    // spec-work declares the named Recall Trust Boundary section
    expect(work).toContain('Recall Trust Boundary');
    // spec-code-review guards recall inside its Learnings & Past Solutions step
    expect(codeReview).toContain('legacy_unstructured_advisory');
  });

  test('context bundle keeps source read requirements in referenced summaries', () => {
    const contract = read('docs/contracts/context-bundle.md');

    expect(contract).toContain('`context-bundle.v1` 本身只承载 `summary_ref` / paths');
    expect(contract).toContain('不新增 `source_reads_required` 字段');
    expect(contract).toContain('referenced summary 或上游 evidence summary 提供 `source_reads_required`');
    expect(contract).toContain('不得把 summary 当 confirmed source fact');
  });

  test('learnings researcher returns structured recall status and source-confirmation fields', () => {
    const agent = read('skills/spec-plan/references/agents/learnings-researcher.md');

    expect(agent).toContain('source_refs');
    expect(agent).toContain('invalidation_condition');
    expect(agent).toContain('structured recall candidate');
    expect(agent).toContain('legacy_unstructured_advisory');
    expect(agent).toContain('- **Recall Status**: [structured recall candidate | legacy_unstructured_advisory]');
    expect(agent).toContain('- **Invalidation Condition**: [frontmatter `invalidation_condition`, if present]');
    expect(agent).toContain('- **Source Refs**: [frontmatter `source_refs`, if present; otherwise note "missing — source confirmation required from current task evidence"]');
    expect(agent).toContain('source confirmation required from current task evidence');
  });
});

describe('solution promotion schema contract', () => {
  test('extends the canonical spec-compound schema with structured recall fields', () => {
    const schema = read('skills/spec-compound/references/schema.yaml');
    const reference = read('skills/spec-compound/references/yaml-schema.md');

    for (const field of [
      'domain:',
      'pattern:',
      'rejected_alternatives:',
      'applicable_versions:',
      'invalidation_condition:',
      'source_refs:',
    ]) {
      expect(schema).toContain(field);
      expect(reference).toContain(field.replace(':', ''));
    }

    expect(schema).toContain('new_promote_required_fields');
    expect(schema).toContain('legacy_unstructured_advisory');
    expect(schema).toContain('New promoted solution docs must include invalidation_condition and source_refs');
    expect(schema).toContain('Existing docs missing the new structured recall fields remain legacy_unstructured_advisory');
    expect(reference).toContain('new promote');
    expect(reference).toContain('legacy_unstructured_advisory');
  });

  test('compound and refresh route new durable knowledge through schema and verified gate', () => {
    const compound = read('skills/spec-compound/SKILL.md');
    const refresh = read('skills/spec-compound-refresh/SKILL.md');

    for (const text of [compound, refresh]) {
      expect(text).toContain('Structured Promotion Gate');
      expect(text).toContain('invalidation_condition');
      expect(text).toContain('source_refs');
      expect(text).toContain('verified learning');
      expect(text).toContain('legacy_unstructured_advisory');
      expect(text).toContain('references/schema.yaml');
    }
    expect(fs.existsSync(path.join(REPO_ROOT, 'docs/contracts/knowledge/solution-promotion.schema.json'))).toBe(false);
  });
});
