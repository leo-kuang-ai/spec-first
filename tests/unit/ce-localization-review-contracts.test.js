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

    expect(inventory.skill_count).toBe(36);
    expect(inventory.package_path_count).toBe(571);
    expect(inventory.files).toContainEqual(expect.objectContaining({
      skill_id: 'spec-promote',
      owning_skill: 'spec-promote',
      path: promoteProbePath,
      path_role: 'deterministic-helper',
      evidence_role: 'local-contract',
      terminal_disposition: 'included-canonical-skill-source',
    }));
    expect(inventory.excluded_paths).toContainEqual(expect.objectContaining({
      path: 'skills/autoresearch',
      terminal_disposition: 'excluded-host-owned-local-source',
    }));
    expect(coverage.coverage_summary.missing_path_count).toBe(0);
    expect(coverage.coverage_summary.direct_support_unique_path_count).toBe(186);
    expect(coverage.coverage_summary.direct_support_relation_count).toBe(392);
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
