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
  expect(boundaries).toContain('research requirements do not involve tool authorization');
  expect(boundaries).toContain('read-only usage does not exempt from explicit command restrictions');
  expect(boundaries).toContain('currently authorized and actually available equivalent tools');
  expect(boundaries).toContain('do not equate read failures with the non-existence of directories or files');
  expect(boundaries).toContain('immediately halt the action');
  expect(boundaries).toContain('no further tool invocation is required');
  expect(read('references/research.md')).toContain('orientation requirements do not authorize additional commands');
});

test('终审检查验证所需状态可构造，而非只枚举预期结果', () => {
  const review = read('references/final-review.md');
  expect(review).toContain('required test data, timing, or external states can be constructed through existing interfaces or planned test seams');
  expect(review).toContain('do not treat unimplemented construction conditions as existing capabilities');
  expect(review).toContain('determine whether these gaps obstruct corresponding verification and readiness');
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
  expect(handoff).toContain('The delivery protocol explicitly specified by the current user or caller takes precedence over the default display format');
  expect(handoff).toContain('references in planned body content still use repository-relative paths');
  expect(entry).toContain('Path format rules in `plan-handoff.md`');
  expect(entry).not.toContain('Report the absolute plan path');
  expect(read('references/final-review.md')).toContain('does not override the caller\'s structured return protocol');
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
