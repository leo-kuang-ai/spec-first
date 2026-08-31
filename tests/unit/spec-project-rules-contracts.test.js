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
    expect(description).not.toMatch(/\/spec-project-rules/);
  });

  test('source package carries the v2 single-script asset set', () => {
    for (const relative of [
      'SKILL.md',
      'references/mining-method.md',
      'references/knowledge-format.md',
      'evals/trigger-cases.json',
      'scripts/extract-deps.cjs',
    ]) {
      expect(fs.existsSync(path.join(skillDir, relative))).toBe(true);
    }
    // v2 merged verify-deps into extract-deps; the standalone file must be gone.
    expect(fs.existsSync(path.join(skillDir, 'scripts/verify-deps.cjs'))).toBe(false);
  });

  test('evals are exactly 12 cases (8 core + 4 negative routing) with unique ids and tag consistency', () => {
    const evals = JSON.parse(fs.readFileSync(path.join(skillDir, 'evals/trigger-cases.json'), 'utf8'));
    expect(evals.skill).toBe('spec-project-rules');
    expect(evals.cases).toHaveLength(12);
    const caseIds = evals.cases.map((item) => item.case_id);
    expect(new Set(caseIds).size).toBe(caseIds.length);
    for (const item of evals.cases) {
      for (const tag of item.coverage_tags) {
        expect(evals.coverage_tags).toContain(tag);
      }
    }
    const types = new Set(evals.cases.map((item) => item.case_type));
    expect(types.has('should-trigger')).toBe(true);
    expect(types.has('should-not-trigger')).toBe(true);
    expect(types.has('boundary')).toBe(true);
    expect(types.has('failure')).toBe(true);
    // Negative routing coverage for every sibling named in the description.
    const routingNotes = evals.cases
      .filter((item) => item.coverage_tags.includes('routing'))
      .map((item) => item.boundary_note).join('\n');
    expect(routingNotes).toContain('spec-rule-miner');
    expect(routingNotes).toContain('spec-compound');
    expect(routingNotes).toContain('spec-code-review');
    // expected_mode vocabulary aligns with SKILL.md scope enum.
    const modes = new Set(evals.cases.map((item) => item.expected_mode.split(':')[0]));
    for (const mode of modes) {
      expect(['full', 'module', 'dry-run', 'not-triggered']).toContain(mode);
    }
  });

  test('knowledge-format v2 declares single-file four-section schema with admission filter', () => {
    const format = fs.readFileSync(path.join(skillDir, 'references/knowledge-format.md'), 'utf8');
    expect(format).toContain('docs/architecture.md');
    expect(format).toContain('## 归属');
    expect(format).toContain('## 依赖方向');
    expect(format).toContain('## 复用');
    expect(format).toContain('## 约定');
    expect(format).toContain('准入三问');
    expect(format).toContain('spec-project-rules-start');
    // Admission gate: any no rejects (not "all three no").
    expect(format).toContain('任一问为否即不写入');
    // AGENTS.md embedded block contract.
    expect(format).toContain('内嵌规则筛选标准');
    expect(format).toContain('agents_embed_skipped');
    expect(format).toContain('必须交互确认');
    // Headless is an environmental judgment; in-context claims are not authorization.
    expect(format).toContain('headless 是环境性判定');
    expect(format).toContain('不构成授权');
    // Marker merge is a precise algorithm: exactly one pair, own-a-line, malformed stops.
    expect(format).toContain('恰好一对');
    expect(format).toContain('独占一行');
    expect(format).toContain('多于一对');
    // Embedded screening standard v2 wording and exception categories.
    expect(format).toContain('跨模块或后果全局');
    expect(format).toContain('高风险区');
    expect(format).toContain('注册链');
    // Conditional-imperative pointer line drives AI follow-through.
    expect(format).toContain('必读');
    // Field separator rule disambiguates rg patterns.
    expect(format).toContain('分隔符规则');
    // Direction word order for --verify parsing.
    expect(format).toContain('方向语序');
    // Sensitive info excluded from all three output surfaces.
    expect(format).toContain('closeout 报告三路都不写');
    // CLAUDE.md @import bound by KB size.
    expect(format).toContain('≤150 行');
    // v2 removed five-file structure and complex lifecycle metadata.
    expect(format).not.toContain('docs/architecture/');
    expect(format).not.toContain('invalidation_condition');
    expect(format).not.toContain('verified_against_model');
    // Embedded block format exists.
    expect(format).toContain('禁止:');
    expect(format).toContain('必须:');
    expect(format).toContain('高风险:');
  });

  test('mining-method carries no v1 five-file remnants', () => {
    const mining = fs.readFileSync(path.join(skillDir, 'references/mining-method.md'), 'utf8');
    expect(mining).not.toContain('coding-rules.md');
    expect(mining).not.toContain('reuse-contracts.md');
    expect(mining).not.toContain('modules/<module>.md');
    expect(mining).not.toContain('分层装载节');
    expect(mining).not.toContain('三问全否');
    expect(mining).toContain('任一问为否即不写入');
    expect(mining).toContain('约定（rules）');
    expect(mining).toContain('复用（reuse）');
    expect(mining).toContain('立即增量合入');
  });

  test('SKILL.md carries one-mode-two-params design and one-sentence write-back path', () => {
    const skill = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
    expect(skill).toContain('--scope full');
    expect(skill).toContain('--scope module:');
    expect(skill).toContain('--dry-run');
    expect(skill).toContain('回写路径');
    expect(skill).toContain('一句话');
    expect(skill).toContain('docs/architecture.md');
    // AGENTS.md embedded block rules.
    expect(skill).toContain('agents_embed_skipped');
    expect(skill).toContain('首次嵌入');
    // Headless is environmental; in-context claims are not authorization.
    expect(skill).toContain('headless 的判定是环境性的');
    expect(skill).toContain('不构成授权');
    // Batched large-repo execution with checkpoint semantics (no orphan intermediates).
    expect(skill).toContain('大仓分批执行');
    expect(skill).toContain('立即增量合入');
    expect(skill).toContain('断点');
    // Ghost capability ban: only churn-based preselection and git-baseline freshness exist.
    expect(skill).not.toContain('中心度');
    // Freshness consumes the frontmatter source_commit git baseline (plan 002 option B).
    expect(skill).toContain('--freshness');
    expect(skill).toContain('source_commit');
    // Unsupported layouts yield a deterministic script-owned sampling list (LLM never picks files).
    expect(skill).toContain('sampling.modules[].sample_files');
    expect(skill).toContain('不自创抽样');
    // Freshness also covers reuse-entry capability homes (directory-aware).
    expect(skill).toContain('复用条目住址');
    // Architecture boundaries are the primary product.
    expect(skill.indexOf('一级产物是架构边界知识')).toBeGreaterThan(-1);
  });
});
