'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const repoRoot = path.resolve(__dirname, '../..');

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

    // 独立枚举 Git 可见的正规 package 文件；不以 producer 自报数量证明完整性。
    const candidates = [...new Set(execFileSync('git', [
      '-C', repoRoot, 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'skills',
    ], { encoding: 'utf8' }).split('\0').filter(Boolean))].filter((name) => {
      try { return fs.lstatSync(path.join(repoRoot, name)).isFile(); } catch { return false; }
    });
    const skills = candidates.filter((name) => /^skills\/[^/]+\/SKILL\.md$/.test(name))
      .map((name) => name.split('/')[1]).sort();
    const expectedPaths = candidates.filter((name) => skills.includes(name.split('/')[1])).sort();
    expect(inventory.skills.map((entry) => entry.skill_id).sort()).toEqual(skills);
    expect(inventory.skill_count).toBe(skills.length);
    expect(inventory.files.map((entry) => entry.path).sort()).toEqual(expectedPaths);
    expect(inventory.package_path_count).toBe(expectedPaths.length);
    for (const entry of inventory.files) {
      const bytes = fs.readFileSync(path.join(repoRoot, entry.path));
      expect(entry.owning_skill).toBe(entry.path.split('/')[1]);
      expect(entry.sha256).toBe(crypto.createHash('sha256').update(bytes).digest('hex'));
      expect(entry.bytes).toBe(bytes.length);
    }
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
    const relations = coverage.direct_support.map((entry) => `${entry.skill_id}:${entry.path}`);
    expect(new Set(relations).size).toBe(relations.length);
    expect(coverage.coverage_summary.direct_support_relation_count).toBe(relations.length);
    expect(coverage.coverage_summary.direct_support_unique_path_count)
      .toBe(new Set(coverage.direct_support.map((entry) => entry.path)).size);
    const testPaths = execFileSync('git', [
      '-C', repoRoot, 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'tests',
    ], { encoding: 'utf8' }).split('\0').filter((name) => name.endsWith('.test.js') && fs.existsSync(path.join(repoRoot, name)));
    const governance = JSON.parse(fs.readFileSync(path.join(repoRoot,
      'src/cli/contracts/dual-host-governance/skills-governance.json'), 'utf8'));
    for (const skill of skills) {
      expect(relations).toContain(`${skill}:src/cli/contracts/dual-host-governance/skills-governance.json`);
      const command = governance.skills.find((entry) => entry.skill_name === skill).command_name;
      if (command) expect(relations).toContain(`${skill}:templates/claude/commands/spec/${command}.md`);
      for (const testPath of testPaths) {
        const content = fs.readFileSync(path.join(repoRoot, testPath), 'utf8');
        if (path.basename(testPath).startsWith(`${skill}-`) || content.includes(`skills/${skill}/`)) {
          expect(relations).toContain(`${skill}:${testPath}`);
        }
      }
    }
    // 独立检查所有正文中的明确跨包 root 路径，防止只验证 producer 返回的剩余关系。
    for (const name of expectedPaths.filter((entry) => entry.endsWith('.md'))) {
      const content = fs.readFileSync(path.join(repoRoot, name), 'utf8');
      const owner = name.split('/')[1];
      for (const match of content.matchAll(/(?:src|scripts|templates|tests|docs\/contracts)\/[A-Za-z0-9_./@-]+/g)) {
        const target = match[0].replace(/[.,;]+$/, '');
        try {
          if (!fs.lstatSync(path.join(repoRoot, target)).isFile()) continue;
        } catch { continue; }
        expect(relations).toContain(`${owner}:${target}`);
      }
    }
    for (const entry of coverage.direct_support) {
      expect(skills).toContain(entry.skill_id);
      expect(entry.owning_skill).toBe(entry.skill_id);
      expect(entry.relation_types.length).toBeGreaterThan(0);
      expect(entry.evidence.length).toBeGreaterThan(0);
      const bytes = fs.readFileSync(path.join(repoRoot, entry.path));
      expect(entry.sha256).toBe(crypto.createHash('sha256').update(bytes).digest('hex'));
    }
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
    const preflightPath = path.join(tempRoot, 'preflight.json');
    const matrixPath = path.join(tempRoot, 'matrix.json');
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      expect(producer.main([
        '--refresh', '--inventory', inventoryPath, '--coverage', coveragePath,
        '--preflight', preflightPath, '--matrix', matrixPath,
      ])).toBe(0);
      expect(producer.main([
        '--inventory', inventoryPath, '--coverage', coveragePath,
        '--preflight', preflightPath, '--matrix', matrixPath,
      ])).toBe(0);
      const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
      expect(inventory.producer).toBe('scripts/check-ce-localization-review.cjs');
    } finally {
      stdout.mockRestore();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
