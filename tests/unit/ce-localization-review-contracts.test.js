'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const producer = require('../../scripts/check-ce-localization-review.cjs');

describe('CE localization deterministic review producer', () => {
  test('freezes every canonical Skill package and explicit support relation', () => {
    const { inventory, coverage } = producer.buildArtifacts();
    const promoteProbePath = [
      'skills',
      'spec-promote',
      'scripts',
      'check-spiral-auth.cjs',
    ].join('/');

    expect(inventory.skill_count).toBe(38);
    // 692 = 676 + spec-ideate/using-spec-first eval 资产与断言脚本进入 inventory 源集（2026-08-31 批次）
    // 1029 = 692 + autoresearch 收编为 canonical skill 源（2026-09-04 批次，01fad369，+337 包路径）
    expect(inventory.package_path_count).toBe(1029);
    expect(inventory.files).toContainEqual(expect.objectContaining({
      skill_id: 'spec-promote',
      owning_skill: 'spec-promote',
      path: promoteProbePath,
      path_role: 'deterministic-helper',
      evidence_role: 'local-contract',
      terminal_disposition: 'included-canonical-skill-source',
    }));
    // 2026-09-04（01fad369）：autoresearch 从 host-owned 排除清单收编进 canonical
    // inventory（excluded_paths 归零，37→38），断言随之移位到 files 侧。
    expect(inventory.files).toContainEqual(expect.objectContaining({
      skill_id: 'autoresearch',
      owning_skill: 'autoresearch',
      path: 'skills/autoresearch/SKILL.md',
      terminal_disposition: 'included-canonical-skill-source',
    }));
    expect(coverage.coverage_summary.missing_path_count).toBe(0);
    // 2026-08-21: 186 -> 187 / 392 -> 393 after adding
    // tests/unit/spec-prd-finding-schema-freeze.test.js, which the coverage
    // producer picks up as one additional spec-prd `focused-test-name` relation.
    // 2026-08-28: 187 -> 189 / 393 -> 402 after adding skills/spec-project-rules
    // (new focused test + shared governance/project-graph relations);
    // 189 -> 190 / 402 -> 403 after adding its deterministic scripts test.
    // 2026-08-29: 575 -> 617 after adding skill-up eval assets; 617 -> 616 after v2 removed verify-deps.cjs
    // (eval.yaml + 3 cases + 2 fixture repos + 3 judge scripts); 616 -> 612 after the review-hardening
    // pass retired the five-file fixture KB into single-file docs/architecture.md (net -4);
    // 612 -> 650 after the darwin/governance rounds expanded behavior evals to 9 cases
    // (+6 case yamls, +6 judge scripts, single-end fixture, generated large-repo fixture,
    // multi-end-embedded fixture, evals/README);
    // 650 -> 676 after committing exposed previously-untracked sources to the
    // inventory (2 plans, 3 review deltas, spec-project-rules validation reports).
    // 2026-09-04 (01fad369): 190 -> 191 / 403 -> 405 after adopting autoresearch
    // into the canonical inventory (its package + eval relations);
    // 191 -> 192 / 405 -> 406 after this fix batch added the explicit autoresearch
    // source refs below (a new direct-support path: this very test file, carrying
    // two focused-test-explicit-source-ref relations). Note: the extractor scans
    // quoted skill paths anywhere in this file, comments included — do not cite
    // skill paths in comments here or the frozen count drifts.
    // 2026-09-05 (pi host): 192 -> 193 / 406 -> 407 — the new direct-support path
    // is the pi adapter test file itself (its runtime-setup transform fixture's
    // frontmatter names that skill, incidentally matching the focused-test
    // relation); the adapter source file carries no relation of its own.
    expect(coverage.coverage_summary.direct_support_unique_path_count).toBe(193);
    expect(coverage.coverage_summary.direct_support_relation_count).toBe(407);
    expect(coverage.direct_support).toContainEqual(expect.objectContaining({
      skill_id: 'spec-promote',
      owning_skill: 'spec-promote',
      path: 'tests/unit/spec-promote-auth-probe.test.js',
      evidence_role: 'behavior-eval',
      terminal_disposition: 'included-direct-support',
      relation_types: expect.arrayContaining(['focused-test-name']),
    }));
    expect(coverage.direct_support).toContainEqual(expect.objectContaining({
      skill_id: 'spec-write-tasks',
      path: 'templates/claude/commands/spec/write-tasks.md',
      relation_types: expect.arrayContaining(['template-owner']),
    }));
    expect(coverage.direct_support).toContainEqual(expect.objectContaining({
      skill_id: 'spec-dogfood',
      path: 'tests/unit/ce-localization-round-1-remediation-contracts.test.js',
      relation_types: expect.arrayContaining(['focused-test-explicit-source-ref']),
    }));
  });

  test('refresh and verify use byte-identical canonical JSON', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-localization-review-'));
    const inventoryPath = path.join(tempRoot, 'skill-inventory.json');
    const coveragePath = path.join(tempRoot, 'source-coverage.json');
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      expect(producer.main([
        '--refresh', '--inventory', inventoryPath, '--coverage', coveragePath,
      ])).toBe(0);
      expect(producer.main([
        '--inventory', inventoryPath, '--coverage', coveragePath,
      ])).toBe(0);
      const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
      expect(inventory.producer).toBe('scripts/check-ce-localization-review.cjs');
    } finally {
      stdout.mockRestore();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
