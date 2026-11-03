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
    // 语言由当前项目与用户要求决定；phase owner 的契约是可达性和触发条件。
  }
  expect(entry).not.toMatch(/\p{Script=Han}/u);
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

test('final review reconciles cross-set pairs that content checks cannot catch', () => {
  const review = read('references/final-review.md');
  const sections = read('references/plan-sections.md');
  expect(review).toContain('**Cross-set reconciliation (mechanical, producer-owned).**');
  expect(review).toContain('a unit whose verification has no plan-level command is a producer gap');
  expect(review).toContain('governance, byte-budget, ordering, and projection contracts often assert on files they never import');
  expect(sections).toContain('Two closure duties: list the repo contract tests that assert on the files');
  expect(sections).toContain('risk is enumerated rather than judged in a single guess');
});
