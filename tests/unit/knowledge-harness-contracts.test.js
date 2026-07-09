'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
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

  test('context bundle keeps source read requirements in referenced summaries', () => {
    const contract = read('docs/contracts/context-bundle.md');

    expect(contract).toContain('`context-bundle.v1` 本身只承载 `summary_ref` / paths');
    expect(contract).toContain('不新增 `source_reads_required` 字段');
    expect(contract).toContain('referenced summary 或上游 evidence summary 提供 `source_reads_required`');
    expect(contract).toContain('不得把 summary 当 confirmed source fact');
  });

  test('learnings researcher returns source-confirmed advisory recall guidance', () => {
    const agent = read('skills/spec-plan/references/agents/learnings-researcher.md');

    expect(agent).toContain('When a learning\'s claim conflicts with what you can observe in the current code or docs');
    expect(agent).toContain('Research agents can be confidently wrong');
    expect(agent).toContain('never let a past learning silently override present evidence');
    expect(agent).toContain('Problem Type');
    expect(agent).toContain('Relevance');
    expect(agent).toContain('Key Insight');
  });
});

describe('solution promotion schema contract', () => {
  test('keeps CE-first spec-compound schema without structured recall fields', () => {
    const schema = read('skills/spec-compound/references/schema.yaml');
    const reference = read('skills/spec-compound/references/yaml-schema.md');

    for (const field of [
      'domain:',
      'rejected_alternatives:',
      'applicable_versions:',
      'invalidation_condition:',
      'source_refs:',
    ]) {
      expect(schema).not.toContain(field);
      expect(reference).not.toContain(field.replace(':', ''));
    }
    expect(schema).not.toMatch(/^\s{2}pattern:/m);
    expect(reference).not.toMatch(/`pattern`/);

    expect(schema).not.toContain('new_promote_required_fields');
    expect(schema).not.toContain('legacy_unstructured_advisory');
    expect(schema).toContain('architecture_pattern');
    expect(schema).toContain('tooling_decision');
    expect(reference).toContain('Knowledge Track Fields');
    expect(reference).toContain('architecture_pattern');
  });

  test('knowledge contract owns structured promotion gate while refresh reuses CE-aligned documentation contracts', () => {
    const contract = read('docs/contracts/knowledge/knowledge-harness.md');
    const refresh = [
      read('skills/spec-compound-refresh/SKILL.md'),
      read('skills/spec-compound-refresh/references/per-action-flows.md'),
    ].join('\n');

    expect(contract).toContain('source_refs');
    expect(contract).toContain('legacy_unstructured_advisory');
    expect(contract).toContain('new promote required 字段');
    expect(contract).toContain('`invalidation_condition` 和 `source_refs`');

    expect(refresh).not.toContain('Structured Promotion Gate');
    expect(refresh).not.toContain('legacy_unstructured_advisory');
    expect(refresh).toContain('references/schema.yaml');
    expect(refresh).toContain('validate frontmatter and cited claims');
    expect(refresh).toContain('Replace');
    expect(fs.existsSync(path.join(REPO_ROOT, 'docs/contracts/knowledge/solution-promotion.schema.json'))).toBe(false);
  });
});
