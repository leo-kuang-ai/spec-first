'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { phaseFiles } = require('../helpers/plan-contract');
const root = path.resolve(__dirname, '../../skills/spec-plan');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const entry = read('SKILL.md');

test('phase owners remain reachable from the entrypoint with explicit triggers', () => {
  for (const file of phaseFiles) {
    expect(entry).toContain(`references/${file}`);
    expect(read(`references/${file}`)).toContain('**Trigger:**');
  }
  expect(entry).toContain('before source discovery or bootstrap');
  expect(entry).toContain('before research or dispatch');
  expect(entry).toContain('before the pre-write review or plan write');
});

test('resume fast path loads final review without bypassing the mandatory tail', () => {
  const gate = entry.slice(entry.indexOf('#### 5.3 Confidence'));
  expect(gate).toContain('read `references/final-review.md`');
  expect(gate).toContain('arriving directly from an eligible Phase 0.1');
  expect(gate).toContain('Load `references/plan-handoff.md`');
  expect(gate).toContain('mutation:apply-fixes');
  expect(gate).toContain('mutation:report-only');
  expect(gate).toContain('at most two producer-owned full recompose');
});

test('research uses current source and does not require worker prompts for inline fallback', () => {
  const research = read('references/research.md');
  expect(research).toContain('current-tree orientation');
  expect(research).toContain('Read an exact version fresh from its owning manifest');
  expect(research).not.toContain('cached project profile');
  expect(research).toContain('do not preload their full worker prompts');
  expect(research).toContain('Missing authorization forbids discovery');
});

test('调研清单不扩大工具授权，缺能力时保留证据缺口', () => {
  const boundaries = read('references/planning-evidence-boundaries.md');
  expect(boundaries).toContain('调研要求不是工具授权');
  expect(boundaries).toContain('只读用途不豁免显式命令限制');
  expect(boundaries).toContain('当前已授权且实际可用的等价工具');
  expect(boundaries).toContain('不得把读取失败等同于目录或文件不存在');
  expect(boundaries).toContain('立即停止该类动作');
  expect(boundaries).toContain('不需要再发起工具调用');
  expect(read('references/research.md')).toContain('orientation requirements do not authorize additional commands');
});

test('终审检查验证所需状态可构造，而非只枚举预期结果', () => {
  const review = read('references/final-review.md');
  expect(review).toContain('所需测试数据、时间或外部状态如何通过现有接口或计划内测试接缝构造');
  expect(review).toContain('不能把未实现的构造条件视为已有能力');
  expect(review).toContain('判断该缺口是否阻断对应验证和 readiness');
});

test('pipeline invalidation stops the write without inventing a replacement decision', () => {
  const review = read('references/final-review.md');
  expect(review).toContain('settled-decision-invalidated');
  expect(review).toContain('do not write the plan or silently choose a replacement');
  expect(review).toContain('only after the product-blocker checks have cleared');
});

test('bounded execution retains decision owners without duplicating product truth', () => {
  const review = read('references/final-review.md');
  const structure = read('references/structure.md');
  expect(review).toContain('Reverse-resolve its `Governs R...` links');
  expect(review).toContain('`KTD<N>` for a planning decision');
  expect(review).toContain('do not mirror it into a KTD');
  expect(review).toContain('missing links are a producer-owned gap');
  expect(structure).toContain('cite governing R-IDs and KTD-IDs');
  expect(structure).toContain('Product Contract `### Success Criteria`');
  expect(structure).toContain('never appear here as well');
});

test('goal composition belongs to the handoff and carries linked product decisions', () => {
  const handoff = read('references/plan-handoff.md');
  expect(entry).toContain('Do not reconstruct a second objective in this entrypoint');
  expect(handoff).toContain('whose exact `Governs R...` links name that unit\'s cited R-IDs');
  expect(handoff).toContain('**Deletion test:**');
  expect(handoff).toContain('`spec-work` does **not** also run');
  expect(read('references/output-mode.md')).toContain('Commented template examples are not settings');
});

test('交付路径以 caller 协议为先，默认展示规则由 handoff 单点拥有', () => {
  const handoff = read('references/plan-handoff.md');
  expect(handoff).toContain('当前用户或 caller 明确指定的交付协议优先于默认展示格式');
  expect(handoff).toContain('计划正文中的引用仍使用仓库相对路径');
  expect(entry).toContain('`plan-handoff.md` 的 Path format');
  expect(entry).not.toContain('Report the absolute plan path');
  expect(read('references/final-review.md')).toContain('不覆盖 caller 的结构化返回协议');
});

test('final review reconciles cross-set pairs that content checks cannot catch', () => {
  const review = read('references/final-review.md');
  const sections = read('references/plan-sections.md');
  expect(review).toContain('**Cross-set reconciliation (mechanical, producer-owned).**');
  expect(review).toContain('a unit whose verification has no plan-level command is a producer gap');
  expect(review).toContain('governance, byte-budget, ordering, and projection contracts often assert on files they never import');
  expect(sections).toContain('Two closure duties: list the repo contract tests that assert on the files');
  expect(sections).toContain('risk is enumerated rather than judged in a single guess');
});
