'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const checker = require('../../scripts/check-ce-upstream-reconciliation.cjs');
const crypto = require('node:crypto');

describe('CE reconciliation v2 contracts', () => {
  test('excludes CE localization review artifacts from target source freshness', () => {
    expect(checker.isRunOutput('docs/validation/ce-localization')).toBe(true);
    expect(checker.isRunOutput('docs/validation/ce-localization/review/round-2-findings.json')).toBe(true);
    expect(checker.isRunOutput('docs/validation/ce-localization/reports/final.md')).toBe(true);
    expect(checker.isRunOutput('docs/validation/other-confirmed-evidence.json')).toBe(false);
  });

  test('reconciler cannot synthesize semantic adjudication decisions', () => {
    expect(checker.buildAdjudicationArtifact).toBeUndefined();
  });

  test('v2 accepts only the four frozen target actions', () => {
    expect([...checker.V2_TARGET_ACTIONS]).toEqual([
      'implement-in-current-owner',
      'compose',
      'evidence-only',
      'out-of-scope-by-product-decision',
    ]);
  });

  test('target source snapshot covers script and test producers', () => {
    expect(checker.CANONICAL_SOURCE_ROOTS).toEqual(expect.arrayContaining(['scripts', 'tests']));
  });

  test('target source dirty manifest excludes evidence outside canonical source roots', () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-source-snapshot-'));
    try {
      fs.mkdirSync(path.join(repo, 'docs'), { recursive: true });
      fs.mkdirSync(path.join(repo, 'benchmarks/agentic/runs/example'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'docs/source.md'), 'before\n');
      fs.writeFileSync(path.join(repo, 'benchmarks/agentic/runs/example/results.json'), '{}\n');
      execFileSync('git', ['init', '-q'], { cwd: repo });
      execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
      execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
      execFileSync('git', ['add', 'docs/source.md', 'benchmarks/agentic/runs/example/results.json'], { cwd: repo });
      execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: repo });

      fs.writeFileSync(path.join(repo, 'docs/source.md'), 'after\n');
      fs.writeFileSync(path.join(repo, 'benchmarks/agentic/runs/example/results.json'), '{"done":true}\n');
      const snapshot = checker.buildTargetSourceSnapshot(repo, { files: [] });

      expect(snapshot.dirty_paths).toEqual(['docs/source.md']);
      expect(snapshot.dirty).toBe(true);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('parses a dynamic audit count and requires an explicit target action', () => {
    const records = checker.parseAudit([
      '### F001. `skills/example/SKILL.md`',
      '- **spec-first owner / 裁决：** spec-example；`证据使用`。',
      '- **目标动作：** `evidence-only`',
      '- **理由与验证面：** focused contract test',
      '',
    ].join('\n'), 1);

    expect(records.get('skills/example/SKILL.md')).toMatchObject({
      target_action: 'evidence-only',
    });
  });

  test('parses the new-window evidence schema without changing target_action', () => {
    const records = checker.parseAudit([
      '| F001 | M | `skills/example/SKILL.md` | base | head | 1/1 | spec-example | compose | anchor | compose | confirmed | `skills/spec-example/SKILL.md` | `tests/unit/spec-example.test.js` | `runtime boundary` |',
    ].join('\n'), 1);

    expect(records.get('skills/example/SKILL.md')).toMatchObject({
      target_action: 'compose',
      evidence_status: 'confirmed',
      source_refs: ['skills/spec-example/SKILL.md'],
      test_refs: ['tests/unit/spec-example.test.js'],
      limitations: ['runtime boundary'],
    });
  });

  test('new-window evidence validation fails closed on missing evidence or defer', () => {
    expect(() => checker.buildLedger([
      { status: 'M', path: 'known.md' },
    ], new Map([
      ['known.md', {
        audit_id: 'F001',
        spec_first_owner: 'docs',
        verdict: '待裁决',
        target_action: 'defer',
        test_owner: 'docs contract',
        evidence_status: 'planned',
        source_refs: ['docs'],
        test_refs: ['tests/docs.test.js'],
        limitations: ['pending'],
      }],
    ]), { requireEvidence: true })).toThrow('新窗口禁止保留 defer');

    expect(() => checker.buildLedger([
      { status: 'M', path: 'known.md' },
    ], new Map([
      ['known.md', {
        audit_id: 'F001',
        spec_first_owner: 'docs',
        verdict: '待实施',
        target_action: 'implement-in-current-owner',
        test_owner: 'docs contract',
        evidence_status: 'planned',
      }],
    ]), { requireEvidence: true })).toThrow('缺少 source_refs/test_refs/limitations');
  });

  test('rejects an unknown explicit target action', () => {
    expect(() => checker.buildLedger([
      { status: 'M', path: 'known.md' },
    ], new Map([
      ['known.md', {
        audit_id: 'F001',
        spec_first_owner: 'docs',
        verdict: '证据使用',
        target_action: 'guess',
        test_owner: 'docs contract',
      }],
    ]))).toThrow('target_action 无效');
  });

  test('rejects a complete audit record without an explicit target action', () => {
    expect(() => checker.buildLedger([
      { status: 'M', path: 'known.md' },
    ], new Map([
      ['known.md', {
        audit_id: 'F001',
        spec_first_owner: 'docs',
        verdict: '证据使用',
        test_owner: 'docs contract',
      }],
    ]))).toThrow('缺少显式 target_action');
  });

  test('inventory contains regular files only', () => {
    const inventory = checker.buildCurrentInventory();
    expect(inventory.files.every((file) => fs.lstatSync(path.join(__dirname, '..', '..', file.path)).isFile())).toBe(true);
    expect(inventory.files.some((file) => file.path === 'skills/autoresearch')).toBe(false);
  });

  test('current-window counterpart mapping does not retain legacy no-counterpart entries', () => {
    const records = [
      { category: 'skill-runtime', ce_skill_or_surface: 'ce-handoff', path: 'skills/ce-handoff/SKILL.md' },
      { category: 'skill-runtime', ce_skill_or_surface: 'ce-setup', path: 'skills/ce-setup/SKILL.md' },
      { category: 'skill-runtime', ce_skill_or_surface: 'ce-prototype', path: 'skills/ce-prototype/SKILL.md' },
      { category: 'skill-runtime', ce_skill_or_surface: 'ce-babysit-pr', path: 'skills/ce-babysit-pr/SKILL.md' },
    ];

    expect(checker.summarize(records, {
      noDirectCounterpart: checker.CURRENT_NO_DIRECT_COUNTERPART,
    })).toMatchObject({
      direct_counterpart_skills: 2,
      no_direct_counterpart_skills: 2,
      direct_counterpart_skill_files: 2,
      no_direct_counterpart_skill_files: 2,
    });
  });

  test('rejects unsupported name-status states', () => {
    expect(() => checker.parseNameStatus('Z\tunknown.md\n')).toThrow('无效 name-status 状态');
  });

  test('validates the selected CE filelist against the selected diff and SHA', () => {
    const filelist = 'a.md\nb.md\n';
    const selected = [
      { status: 'M', path: 'a.md' },
      { status: 'A', path: 'b.md' },
    ];
    expect(() => checker.validateSelection(filelist, 'wrong', selected)).toThrow('SHA-256 不匹配');

    const validList = `${Array.from({ length: 148 }, (_, i) => `m${i}.md`).join('\n')}\n${Array.from({ length: 36 }, (_, i) => `a${i}.md`).join('\n')}\nrename.md\n`;
    const validDiff = [
      ...Array.from({ length: 148 }, (_, i) => ({ status: 'M', path: `m${i}.md` })),
      ...Array.from({ length: 36 }, (_, i) => ({ status: 'A', path: `a${i}.md` })),
      { status: 'R074', old_path: 'old.md', path: 'rename.md' },
    ];
    const sha = require('node:crypto').createHash('sha256').update(validList).digest('hex');
    expect(checker.validateSelection(validList, sha, validDiff)).toMatchObject({
      selected_path_count: 185,
      selected_status_counts: { M: 148, A: 36, R074: 1 },
    });
  });

  test('v2 joins an independent LLM adjudication artifact to deterministic path facts', () => {
    const nameStatus = [{ status: 'M', path: 'skills/ce-brainstorm/SKILL.md' }];
    const nameStatusContent = 'M\tskills/ce-brainstorm/SKILL.md\n';
    const inventory = {
      files: [{ path: 'skills/ce-brainstorm/SKILL.md', sha256: 'a'.repeat(64) }],
      skill_count: 1,
      file_count: 1,
    };
    const targetSourceSnapshot = {
      repository: 'spec-first',
      head: 'h',
      dirty: true,
      dirty_path_manifest_sha256: 'b'.repeat(64),
      source_tree_hash: 'c'.repeat(64),
      inventory_hash: 'd'.repeat(64),
    };
    const artifact = {
      schema_version: checker.ADJUDICATION_SCHEMA_VERSION,
      join_key: checker.ADJUDICATION_JOIN_KEY,
      producer: { kind: 'llm-adjudication', model: 'reviewer' },
      upstream: {
        repository: 'compound-engineering-plugin',
        base: 'base',
        head: 'head',
        name_status_sha256: crypto.createHash('sha256').update(nameStatusContent).digest('hex'),
      },
      target_source_snapshot: targetSourceSnapshot,
      records: [{
        audit_id: 'A001',
        path: 'skills/ce-brainstorm/SKILL.md',
        group_id: 'G01',
        package_id: 'P02',
        surface: 'ce-brainstorm',
        role: 'entry-contract',
        canonical_owner: 'skills/spec-brainstorm/SKILL.md',
        implementation_unit: 'U4',
        implementation_targets: ['skills/spec-brainstorm/SKILL.md', 'tests/unit/spec-brainstorm-contracts.test.js'],
        target_action: 'compose',
        evidence_status: 'planned',
        degraded: true,
        source_refs: ['skills/spec-brainstorm/SKILL.md'],
        test_owner: 'tests/unit/spec-brainstorm-contracts.test.js',
        test_refs: ['tests/unit/spec-brainstorm-contracts.test.js'],
        limitations: ['semantic review pending'],
        closure_profile: 'source-adjudication',
      }],
    };
    const ledger = checker.buildV2Ledger(nameStatus, artifact, {
      inventory,
      targetSourceSnapshot,
      upstream: { repository: 'compound-engineering-plugin', base: 'base', head: 'head' },
      nameStatusContent,
      expectedPackageIds: ['P02'],
    });
    expect(ledger.schema_version).toBe(checker.V2_SCHEMA_VERSION);
    expect(ledger.records[0].canonical_owner).toBe('skills/spec-brainstorm/SKILL.md');
    expect(ledger.records[0].implementation_targets).toHaveLength(2);
    expect(ledger.package_summary).toHaveLength(1);
  });

  test('v2 fails closed when the adjudication target source snapshot drifts', () => {
    const nameStatus = [{ status: 'M', path: 'docs/example.md' }];
    const artifact = {
      schema_version: checker.ADJUDICATION_SCHEMA_VERSION,
      join_key: checker.ADJUDICATION_JOIN_KEY,
      producer: { kind: 'llm-adjudication' },
      upstream: { repository: 'r', base: 'b', head: 'h', name_status_sha256: 'x' },
      target_source_snapshot: {
        repository: 'r', head: 'old', dirty: false,
        dirty_path_manifest_sha256: 'a', source_tree_hash: 'b', inventory_hash: 'c',
      },
      records: [],
    };
    expect(() => checker.buildV2Ledger(nameStatus, artifact, {
      inventory: { files: [] },
      targetSourceSnapshot: {
        repository: 'r', head: 'new', dirty: false,
        dirty_path_manifest_sha256: 'a', source_tree_hash: 'b', inventory_hash: 'c',
      },
      upstream: { repository: 'r', base: 'b', head: 'h' },
      nameStatusContent: 'M\tdocs/example.md\n',
      expectedPackageIds: [],
    })).toThrow(/snapshot mismatch/);
  });

  test('classifies full-window groups and roles without treating authoring/config paths as host metadata', () => {
    expect(checker.groupFor('.agents/skills/ce-skill-work/SKILL.md')).toBe('G01');
    expect(checker.v2RoleFor('.agents/skills/ce-skill-work/SKILL.md')).toBe('entry-contract');
    expect(checker.v2RoleFor('docs/guide.md')).toBe('documentation-evidence');
    expect(checker.v2RoleFor('tests/skills/example.test.ts')).toBe('evaluation');
    expect(checker.v2RoleFor('src/commands/install.ts')).toBe('implementation-evidence');
    expect(checker.v2RoleFor('.github/workflows/ci.yml')).toBe('host-metadata-evidence');
    expect(checker.groupFor('.compound-engineering/config.example.yaml')).toBe('G06');
    expect(checker.v2RoleFor('.compound-engineering/config.example.yaml')).toBe('config-rename-evidence');
    expect(checker.v2RoleFor('README.md')).toBe('root-metadata-evidence');
  });

  test('binds every G01 surface to its fixed package id', () => {
    expect(checker.PACKAGE_BY_SURFACE).toMatchObject({
      'ce-babysit-pr': 'P01',
      'ce-work': 'P30',
      lfg: 'P32',
      'ce-skill-work': 'P33',
    });
    expect(Object.keys(checker.PACKAGE_BY_SURFACE)).toHaveLength(33);
    expect(new Set(Object.values(checker.PACKAGE_BY_SURFACE)).size).toBe(33);
  });

  test('validates full-window hashes, status counts, and group counts together', () => {
    const nameStatusContent = [
      'M\tskills/ce-brainstorm/SKILL.md',
      'A\tdocs/example.md',
      'D\ttests/example.test.ts',
      'R069\told-config.yml\t.compound-engineering/config.example.yaml',
      '',
    ].join('\n');
    const nameStatus = checker.parseNameStatus(nameStatusContent);
    const changedPaths = `${nameStatus.map((entry) => entry.path).sort().join('\n')}\n`;
    const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
    expect(() => checker.assertFullWindowFacts(nameStatus, nameStatusContent, {
      total: 4,
      name_status_sha256: digest(nameStatusContent),
      changed_path_sha256: digest(changedPaths),
      status_counts: { M: 1, A: 1, D: 1, R069: 1 },
      group_counts: { G01: 1, G02: 1, G03: 1, G06: 1 },
    })).not.toThrow();
  });

  test('builds exactly 33 package rows over the frozen 298 G01 paths', () => {
    const countsByPackage = [12, 19, 18, 1, 8, 21, 15, 6, 24, 4, 9, 3, 15, 12, 20, 12, 6, 2, 3, 7, 8, 8, 3, 4, 5, 5, 9, 4, 1, 19, 1, 8, 6];
    const records = Object.entries(checker.PACKAGE_BY_SURFACE).flatMap(([surface, packageId], packageIndex) => {
      const excluded = ['P01', 'P19', 'P22'].includes(packageId);
      return Array.from({ length: countsByPackage[packageIndex] }, (_, pathIndex) => ({
        group_id: 'G01',
        package_id: packageId,
        surface,
        canonical_owner: excluded ? null : `skills/spec-${surface.replace(/^ce-/, '')}/SKILL.md`,
        implementation_unit: excluded ? null : 'U4',
        implementation_targets: excluded ? [] : [`skills/spec-${surface.replace(/^ce-/, '')}/SKILL.md`],
        target_action: excluded ? 'out-of-scope-by-product-decision' : 'compose',
        evidence_status: excluded ? 'not-applicable' : 'planned',
        degraded: !excluded,
        source_refs: [`upstream/${surface}/${pathIndex}`],
        test_owner: excluded ? 'product-exclusion-contract' : 'focused-contract-tests',
        test_refs: ['tests/unit/focused.test.js'],
        limitations: [excluded ? 'product excluded' : 'implementation pending'],
        closure_profile: excluded ? 'product-excluded' : 'source-adjudication',
      }));
    });
    const summary = checker.buildPackageSummary(records);
    expect(summary).toHaveLength(33);
    expect(summary.reduce((total, entry) => total + entry.changed_path_count, 0)).toBe(298);
    expect(summary[1]).toMatchObject({
      package_id: 'P02',
      canonical_owner: 'skills/spec-brainstorm/SKILL.md',
      implementation_unit: 'U4',
      target_action: 'compose',
      evidence_status: 'planned',
    });
  });

  test('prepares deterministic adjudication input without semantic decisions', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(__dirname, '..', '..', '.ce-adjudication-input-fixture-'));
    const nameStatusContent = 'M\tskills/ce-brainstorm/SKILL.md\n';
    const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
    const inventory = {
      schema_version: 'spec-first-current-skill-package-inventory/v2',
      files: [{ path: 'skills/spec-brainstorm/SKILL.md', sha256: 'b'.repeat(64) }],
    };
    const targetSourceSnapshot = {
      repository: 'spec-first', head: 'target-head', dirty: true,
      dirty_path_manifest_sha256: 'c'.repeat(64), source_tree_hash: 'd'.repeat(64), inventory_hash: 'e'.repeat(64),
    };
    const inputPath = path.join(fixtureRoot, 'adjudication-input.json');
    const nameStatusPath = path.join(fixtureRoot, 'name-status.md');
    const inventoryPath = path.join(fixtureRoot, 'inventory.json');
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      expect(checker.main([
        '--refresh',
        '--prepare-adjudication',
        '--ce-repo', path.join(os.tmpdir(), 'ce-fixture'),
        '--base', 'base',
        '--head', 'head',
        '--adjudication-input', inputPath,
        '--name-status', nameStatusPath,
        '--inventory', inventoryPath,
      ], {
        git: (_repo, args) => args[0] === 'diff' ? nameStatusContent : '',
        buildCurrentInventory: () => inventory,
        buildTargetSourceSnapshot: () => targetSourceSnapshot,
        fullWindowFacts: {
          total: 1,
          name_status_sha256: digest(nameStatusContent),
          changed_path_sha256: digest('skills/ce-brainstorm/SKILL.md\n'),
          status_counts: { M: 1 },
          group_counts: { G01: 1 },
        },
      })).toBe(0);
      const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      expect(input).toMatchObject({
        schema_version: 'ce-upstream-adjudication-input/v1',
        semantic_decisions: 'omitted: produced only by the authorized adjudication producer',
      });
      expect(input.records[0]).not.toHaveProperty('canonical_owner');
      expect(checker.main([
        '--prepare-adjudication',
        '--ce-repo', path.join(os.tmpdir(), 'ce-fixture'),
        '--base', 'base',
        '--head', 'head',
        '--adjudication-input', inputPath,
        '--name-status', nameStatusPath,
        '--inventory', inventoryPath,
      ], {
        git: (_repo, args) => args[0] === 'diff' ? nameStatusContent : '',
        buildCurrentInventory: () => inventory,
        buildTargetSourceSnapshot: () => targetSourceSnapshot,
        fullWindowFacts: {
          total: 1,
          name_status_sha256: digest(nameStatusContent),
          changed_path_sha256: digest('skills/ce-brainstorm/SKILL.md\n'),
          status_counts: { M: 1 },
          group_counts: { G01: 1 },
        },
      })).toBe(0);
    } finally {
      stdout.mockRestore();
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  test('runs the full-window main path through adjudication join and v2 projections', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(__dirname, '..', '..', '.ce-full-window-fixture-'));
    const nameStatusContent = 'M\tskills/ce-brainstorm/SKILL.md\n';
    const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
    const inventory = {
      schema_version: 'spec-first-current-skill-package-inventory/v1',
      source_head: 'target-head',
      skills_tree_oid: 'tree',
      source_mode: 'working-tree',
      manifest_sha256: 'a'.repeat(64),
      skill_count: 1,
      file_count: 1,
      per_skill_counts: { 'spec-brainstorm': 1 },
      files: [{ path: 'skills/spec-brainstorm/SKILL.md', sha256: 'b'.repeat(64) }],
    };
    const targetSourceSnapshot = {
      repository: 'spec-first',
      head: 'target-head',
      dirty: true,
      dirty_path_manifest_sha256: 'c'.repeat(64),
      source_tree_hash: 'd'.repeat(64),
      inventory_hash: 'e'.repeat(64),
    };
    const inputPath = path.join(fixtureRoot, 'adjudication-input.json');
    const adjudicationPath = path.join(fixtureRoot, 'adjudication.json');
    const nameStatusPath = path.join(fixtureRoot, 'name-status.md');
    const ledgerPath = path.join(fixtureRoot, 'ledger.json');
    const summaryPath = path.join(fixtureRoot, 'summary.md');
    const inventoryPath = path.join(fixtureRoot, 'inventory.json');
    const adjudicationInput = checker.buildAdjudicationInput(checker.parseNameStatus(nameStatusContent), {
      upstream: { repository: 'compound-engineering-plugin', base: 'base', head: 'head' },
      targetSourceSnapshot,
      inventory,
      nameStatusContent,
    });
    fs.writeFileSync(inputPath, `${JSON.stringify(adjudicationInput, null, 2)}\n`);
    fs.writeFileSync(adjudicationPath, `${JSON.stringify({
      schema_version: checker.ADJUDICATION_SCHEMA_VERSION,
      join_key: checker.ADJUDICATION_JOIN_KEY,
      producer: { kind: 'llm-adjudication', model: 'fixture-reviewer' },
      upstream: {
        repository: 'compound-engineering-plugin',
        base: 'base',
        head: 'head',
        name_status_sha256: digest(nameStatusContent),
      },
      target_source_snapshot: targetSourceSnapshot,
      input_artifact_sha256: digest(`${JSON.stringify(adjudicationInput, null, 2)}\n`),
      records: [{
        audit_id: 'A001',
        path: 'skills/ce-brainstorm/SKILL.md',
        group_id: 'G01',
        package_id: 'P02',
        surface: 'ce-brainstorm',
        role: 'entry-contract',
        canonical_owner: 'skills/spec-brainstorm/SKILL.md',
        implementation_unit: 'U4',
        implementation_targets: ['skills/spec-brainstorm/SKILL.md'],
        target_action: 'compose',
        evidence_status: 'planned',
        degraded: true,
        source_refs: ['skills/spec-brainstorm/SKILL.md'],
        test_owner: 'tests/unit/spec-brainstorm-contracts.test.js',
        test_refs: ['tests/unit/spec-brainstorm-contracts.test.js'],
        limitations: ['implementation pending'],
        closure_profile: 'source-adjudication',
      }],
    }, null, 2)}\n`);
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const commandArgs = [
      '--full-window',
      '--ce-repo', path.join(os.tmpdir(), 'ce-fixture'),
      '--base', 'base',
      '--head', 'head',
      '--adjudication-input', inputPath,
      '--adjudication', adjudicationPath,
      '--name-status', nameStatusPath,
      '--ledger', ledgerPath,
      '--summary', summaryPath,
      '--inventory', inventoryPath,
    ];
    const runtime = {
      git: (_repo, args) => args[0] === 'diff' ? nameStatusContent : '',
      buildCurrentInventory: () => inventory,
      buildTargetSourceSnapshot: () => targetSourceSnapshot,
      expectedPackageIds: ['P02'],
      fullWindowFacts: {
        total: 1,
        name_status_sha256: digest(nameStatusContent),
        changed_path_sha256: digest('skills/ce-brainstorm/SKILL.md\n'),
        status_counts: { M: 1 },
        group_counts: { G01: 1 },
      },
    };
    try {
      expect(checker.main(['--refresh', ...commandArgs], runtime)).toBe(0);
      expect(JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))).toMatchObject({
        schema_version: checker.V2_SCHEMA_VERSION,
        package_summary: [{ package_id: 'P02', changed_path_count: 1 }],
      });
      expect(fs.readFileSync(summaryPath, 'utf8')).toContain('schema_version: ce-upstream-reconciliation/v2');
      expect(fs.readFileSync(summaryPath, 'utf8')).toContain('P02 | ce-brainstorm | 1');
      expect(checker.main(commandArgs, runtime)).toBe(0);
      fs.appendFileSync(summaryPath, 'drift\n');
      expect(() => checker.main(commandArgs, runtime)).toThrow('已漂移');
    } finally {
      stdout.mockRestore();
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  test('single-writer merge accepts only base-hash-bound mutable evidence fields', () => {
    const ledger = {
      schema_version: checker.V2_SCHEMA_VERSION,
      target_source_snapshot: {
        repository: 'spec-first', head: 'h', dirty: false,
        dirty_path_manifest_sha256: 'a'.repeat(64), source_tree_hash: 'b'.repeat(64), inventory_hash: 'c'.repeat(64),
      },
      records: [{
        path: 'skills/example/SKILL.md', group_id: 'G01', package_id: 'P02', surface: 'ce-brainstorm', role: 'entry-contract',
        canonical_owner: 'skills/spec-brainstorm/SKILL.md', implementation_unit: 'U4', implementation_targets: ['skills/spec-brainstorm/SKILL.md'],
        target_action: 'compose', evidence_status: 'planned', degraded: true, source_refs: ['upstream'], test_owner: 'tests', test_refs: ['tests'], limitations: ['pending'], closure_profile: 'source-adjudication',
      }],
      package_summary: checker.buildPackageSummary([{
        path: 'skills/example/SKILL.md', group_id: 'G01', package_id: 'P02', surface: 'ce-brainstorm', role: 'entry-contract', canonical_owner: 'skills/spec-brainstorm/SKILL.md', implementation_unit: 'U4', implementation_targets: ['skills/spec-brainstorm/SKILL.md'], target_action: 'compose', evidence_status: 'planned', degraded: true, source_refs: ['upstream'], test_owner: 'tests', test_refs: ['tests'], limitations: ['pending'], closure_profile: 'source-adjudication',
      }], ['P02']),
    };
    const resultSnapshot = { ...ledger.target_source_snapshot };
    const patch = {
      schema_version: 'ce-upstream-ledger-patch/v1', unit_id: 'U4', base_ledger_sha256: checker.ledgerHash(ledger),
      base_target_source_snapshot: ledger.target_source_snapshot, result_target_source_snapshot: resultSnapshot,
      affected_paths: [{ path: 'skills/example/SKILL.md', unit_id: 'U4', changes: { evidence_status: 'confirmed', degraded: false, limitations: ['source/test verified'] } }],
    };
    const merged = checker.mergeLedgerPatch(ledger, patch, { expectedUnit: 'U4', expectedPackageIds: ['P02'] });
    expect(merged.records[0]).toMatchObject({ evidence_status: 'confirmed', degraded: false, limitations: ['source/test verified'] });
    expect(merged.records[0].canonical_owner).toBe('skills/spec-brainstorm/SKILL.md');
    expect(merged.target_source_snapshot).toEqual(resultSnapshot);
    expect(() => checker.mergeLedgerPatch(ledger, { ...patch, base_ledger_sha256: '0'.repeat(64) }, { expectedUnit: 'U4', expectedPackageIds: ['P02'] })).toThrow('base ledger hash mismatch');
    expect(() => checker.mergeLedgerPatch(ledger, { ...patch, affected_paths: [{ path: patch.affected_paths[0].path, unit_id: 'U4', changes: { target_action: 'reject' } }] }, { expectedUnit: 'U4', expectedPackageIds: ['P02'] })).toThrow('unauthorized field');
    expect(() => checker.mergeLedgerPatch(ledger, {
      ...patch,
      result_target_source_snapshot: { ...resultSnapshot, source_tree_hash: 'd'.repeat(64) },
    }, { expectedUnit: 'U4', expectedPackageIds: ['P02'] })).toThrow('target source snapshot mismatch: source_tree_hash');
    expect(() => checker.mergeLedgerPatch(ledger, {
      ...patch,
      unit_id: 'U3',
      affected_paths: [{ ...patch.affected_paths[0], unit_id: 'U3' }],
    }, { expectedUnit: 'U3', expectedPackageIds: ['P02'] })).toThrow('ledger patch path owner mismatch');
    expect(() => checker.mergeLedgerPatch(ledger, {
      ...patch,
      affected_paths: [{ path: patch.affected_paths[0].path, unit_id: 'U4', changes: { evidence_status: 'confirmed' } }],
    }, { expectedUnit: 'U4', expectedPackageIds: ['P02'] })).toThrow('confirmed record cannot be degraded');
  });
});

describe('named CE windows', () => {
  let repo;
  const run = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-named-window-'));
    run('init', '-q'); run('config', 'user.email', 'test@example.com'); run('config', 'user.name', 'Test');
    fs.mkdirSync(path.join(repo, 'skills/ce-new'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'skills/ce-new/old.md'), 'old\n');
    fs.writeFileSync(path.join(repo, 'deleted.md'), 'deleted\n');
    run('add', '.'); run('commit', '-qm', 'base');
  });
  afterEach(() => fs.rmSync(repo, { recursive: true, force: true }));
  test('derives A/D/R endpoints and rejects tampered facts or mutable refs', () => {
    const base = run('rev-parse', 'HEAD');
    run('mv', 'skills/ce-new/old.md', 'skills/ce-new/new.md');
    fs.unlinkSync(path.join(repo, 'deleted.md'));
    fs.writeFileSync(path.join(repo, 'added.md'), 'added\n');
    run('add', '.'); run('commit', '-qm', 'head');
    const head = run('rev-parse', 'HEAD');
    const facts = checker.createWindowFacts(repo, base, head);
    expect(facts.total).toBe(3);
    expect(facts.packages).toEqual(['skills/ce-new']);
    expect(facts.objects.find((r) => r.status === 'A').old_object).toBeNull();
    expect(facts.objects.find((r) => r.status === 'D').new_object).toBeNull();
    const rename = facts.objects.find((r) => r.status.startsWith('R'));
    expect(rename.old_object.git_oid).toBe(rename.new_object.git_oid);
    expect(checker.verifyWindowFacts(facts, repo, base, head)).toEqual(facts);
    expect(() => checker.verifyWindowFacts({ ...facts, total: 1 }, repo, base, head)).toThrow('ce-sync-window-facts-mismatch');
    expect(() => checker.createWindowFacts(repo, base, 'HEAD')).toThrow('ce-sync-immutable-refs-required');
  });
  test('aggregates mixed package actions without synthesizing a semantic decision', () => {
    const records = [{ path: 'skills/ce-new/a', package_id: 'skills/ce-new', surface: 'ce-new', target_action: 'compose', closure_profile: 'source-adjudication' },
      { path: 'skills/ce-new/b', package_id: 'skills/ce-new', surface: 'ce-new', target_action: 'evidence-only', closure_profile: 'evidence-only' }];
    expect(checker.buildPackageSummary(records, ['skills/ce-new'])).toEqual([expect.objectContaining({ changed_path_count: 2, actions: { compose: 1, 'evidence-only': 1 } })]);
  });
  test('publishes idempotently and rejects changed output before modifying any file', () => {
    const a = path.join(repo, 'a.json'); const b = path.join(repo, 'b.json'); const marker = path.join(repo, 'set.json');
    checker.publishArtifactSet([[a, 'a'], [b, 'b']], marker);
    checker.publishArtifactSet([[a, 'a'], [b, 'b']], marker);
    expect(JSON.parse(fs.readFileSync(marker)).files).toHaveLength(2);
    expect(() => checker.publishArtifactSet([[a, 'changed'], [b, 'changed']], marker)).toThrow('ce-sync-output-collision');
    expect(fs.readFileSync(a, 'utf8')).toBe('a'); expect(fs.readFileSync(b, 'utf8')).toBe('b');
    fs.writeFileSync(`${marker}.lock`, 'active writer');
    expect(() => checker.publishArtifactSet([[a, 'a']], marker)).toThrow('ce-sync-publisher-busy');
    expect(JSON.parse(fs.readFileSync(marker)).files).toHaveLength(2);
    fs.unlinkSync(`${marker}.lock`);
    expect(() => checker.publishArtifactSet([[a, 'a'], [a, 'a']], marker)).toThrow('ce-sync-output-duplicate');
    expect(fs.existsSync(`${marker}.lock`)).toBe(false);
  });
  test('excludes exact run outputs but includes plan, contracts, and upstream scope evidence', () => {
    expect(checker.isRunOutput('docs/validation/ce-pull-2026-10-27/window-facts.json')).toBe(true);
    expect(checker.isRunOutput('docs/validation/ce-pull-2026-10-27/review-report.md')).toBe(false);
    expect(checker.isRunOutput('docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md')).toBe(false);
  });
});


describe('CE run artifact admission', () => {
  let root;
  const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
  const stable = (value) => `${JSON.stringify(value, null, 2)}\n`;
  const snapshot = { repository: 'spec-first', head: 'head', dirty: true, dirty_path_manifest_sha256: 'd'.repeat(64), source_tree_hash: 'a'.repeat(64), inventory_hash: 'b'.repeat(64) };
  const input = { target_source_snapshot: snapshot, records: [{ path: 'skills/ce-new/a' }] };
  const facts = { base: 'base', head: 'head' };
  const envelope = () => ({ schema_version: 'ce-upstream-sync-run/v1', kind: 'package-admission', window_sha256: digest(stable(facts)), input_sha256: digest(stable(input)), target_snapshot: snapshot, source_refs: ['docs/source.md'], limitations: ['仅本地合同'], unresolved: [], package_id: 'skills/ce-new', unit_id: 'U3', paths: ['skills/ce-new/a'], decisions: [{ path: 'skills/ce-new/a', target_action: 'compose', rationale: '当前 source 差额' }], review_ref: 'docs/source.md', authority_ref: 'docs/source.md', dependency_refs: [] });
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-admission-'));
    fs.mkdirSync(path.join(root, 'docs')); fs.writeFileSync(path.join(root, 'docs/source.md'), 'source');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  test('accepts bound subset and rejects stale identity, unresolved, duplicate and outside paths', () => {
    const artifact = envelope();
    expect(checker.validateRunArtifact(artifact, input, facts, root)).toBe(true);
    expect(() => checker.validateRunArtifact({ ...artifact, input_sha256: '0'.repeat(64) }, input, facts, root)).toThrow('ce-sync-run-identity');
    expect(() => checker.validateRunArtifact({ ...artifact, unresolved: ['pending'] }, input, facts, root)).toThrow('ce-sync-run-schema');
    expect(() => checker.validateRunArtifact({ ...artifact, paths: [...artifact.paths, ...artifact.paths] }, input, facts, root)).toThrow('ce-sync-run-schema');
    expect(() => checker.validateRunArtifact({ ...artifact, paths: ['outside'] }, input, facts, root)).toThrow('ce-sync-run-path-subset');
  });
  test('receipt joins admission and verifies file/log bytes and required exit status', () => {
    const admission = envelope(); fs.writeFileSync(path.join(root, 'docs/admission.json'), stable(admission));
    fs.writeFileSync(path.join(root, 'docs/test.log'), 'passed');
    const receipt = { ...envelope(), kind: 'owner-receipt', admission_ref: 'docs/admission.json', admission_sha256: digest(stable(admission)), before_snapshot: snapshot, changed_files: [{ path: 'docs/source.md', sha256: digest('source') }], checks: [{ argv: ['node', '--check', 'file'], exit_code: 0, log_path: 'docs/test.log', log_sha256: digest('passed'), status: 'passed', required: true }], authorization_scope: '当前 source', claim_ceiling: '本地检查' };
    for (const key of ['package_id', 'decisions', 'review_ref', 'authority_ref', 'dependency_refs']) delete receipt[key];
    expect(checker.validateRunArtifact(receipt, input, facts, root)).toBe(true);
    fs.writeFileSync(path.join(root, 'docs/receipt.json'), stable(receipt));
    const handoff = { schema_version: 'ce-upstream-sync-run/v1', kind: 'handoff', window_sha256: digest(stable(facts)), input_sha256: digest(stable(input)), target_snapshot: snapshot, source_refs: ['docs/source.md'], limitations: ['仅本地合同'], unresolved: [], summary: 'fixture', receipt_refs: ['docs/receipt.json'], freshness: 'bound snapshot', next_owner: 'caller', claim_ceiling: 'local' };
    const final = [{ path: 'skills/ce-new/a', implementation_unit: 'U3', target_action: 'compose', closure_profile: 'source-adjudication', evidence_status: 'confirmed', degraded: false }];
    expect(checker.validateRunArtifact(handoff, input, facts, root, final)).toBe(true);
    expect(() => checker.validateRunArtifact(handoff, input, facts, root, [...final, { ...final[0], path: 'skills/ce-new/b' }])).toThrow('ce-sync-handoff-path-missing');
    expect(() => checker.validateRunArtifact(handoff, input, facts, root, [{ ...final[0], target_action: 'evidence-only' }])).toThrow('ce-sync-handoff-decision-mismatch');
    expect(() => checker.validateRunArtifact(handoff, input, facts, root, [{ ...final[0], evidence_status: 'planned', degraded: true }])).toThrow('ce-sync-handoff-record-unverified');
    expect(() => checker.validateRunArtifact({ ...handoff, receipt_refs: ['docs/receipt.json', 'docs/receipt.json'] }, input, facts, root, final)).toThrow('ce-sync-receipt-duplicate');
    expect(() => checker.validateRunArtifact({ ...receipt, checks: [{ ...receipt.checks[0], exit_code: 1 }] }, input, facts, root)).toThrow('ce-sync-receipt-check-failed');
    fs.writeFileSync(path.join(root, 'docs/source.md'), 'changed');
    expect(() => checker.validateRunArtifact(receipt, input, facts, root)).toThrow('ce-sync-receipt-file-hash');
  });
  test('admits non-Skill paths with the input null package identity without admitting mixed packages', () => {
    const cliInput = { ...input, records: [{ path: 'src/commands/install.ts' }, ...input.records] };
    const admission = { ...envelope(), input_sha256: digest(stable(cliInput)), package_id: null,
      paths: ['src/commands/install.ts'], decisions: [{ path: 'src/commands/install.ts', target_action: 'evidence-only', rationale: '本地没有 Git 插件安装 consumer' }] };
    expect(checker.validateRunArtifact(admission, cliInput, facts, root)).toBe(true);
    expect(() => checker.validateRunArtifact({ ...admission, package_id: 'src' }, cliInput, facts, root)).toThrow('ce-sync-admission-package-paths');
    const mixed = { ...admission, paths: [...admission.paths, ...input.records.map((record) => record.path)], decisions: [...admission.decisions, ...envelope().decisions] };
    expect(() => checker.validateRunArtifact(mixed, cliInput, facts, root)).toThrow('ce-sync-admission-package-paths');
    expect(() => checker.validateRunArtifact({ ...envelope(), package_id: null }, input, facts, root)).toThrow('ce-sync-admission-package-paths');
    fs.writeFileSync(path.join(root, 'docs/admission.json'), stable(admission));
    fs.writeFileSync(path.join(root, 'docs/test.log'), 'passed');
    const receipt = { ...admission, kind: 'owner-receipt', admission_ref: 'docs/admission.json', admission_sha256: digest(stable(admission)), before_snapshot: snapshot, changed_files: [], checks: [{ argv: ['node', 'check-consumer'], exit_code: 0, log_path: 'docs/test.log', log_sha256: digest('passed'), status: 'passed', required: true }], authorization_scope: '当前 CLI 适用性核对', claim_ceiling: 'fixture 合同' };
    for (const key of ['package_id', 'decisions', 'review_ref', 'authority_ref', 'dependency_refs']) delete receipt[key];
    expect(checker.validateRunArtifact(receipt, cliInput, facts, root)).toBe(true);
  });
});


test('named-window CLI prepares, replays and refuses stale or tampered evidence', () => {
  const upstream = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-window-cli-'));
  const runRoot = path.resolve('docs/validation/ce-pull-2026-10-27/runs/fixture-' + process.pid);
  const git = (...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args], { cwd: upstream, encoding: 'utf8' }).trim();
  const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  try {
    git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
    fs.mkdirSync(path.join(upstream, 'skills/ce-new'), { recursive: true }); fs.writeFileSync(path.join(upstream, 'skills/ce-new/SKILL.md'), 'old');
    git('add', '.'); git('commit', '-qm', 'base'); const base = git('rev-parse', 'HEAD');
    fs.writeFileSync(path.join(upstream, 'skills/ce-new/SKILL.md'), 'new'); git('commit', '-qam', 'head'); const head = git('rev-parse', 'HEAD');
    const factsPath = path.join(runRoot, 'window-facts.json');
    const shared = ['--ce-repo', upstream, '--base', base, '--head', head, '--window-facts', factsPath];
    expect(checker.main(['--create-window-facts', ...shared])).toBe(0);
    const inventory = { files: [] }; const snapshot = { repository: 'fixture', head: 'target', dirty: false, dirty_path_manifest_sha256: 'a'.repeat(64), source_tree_hash: 'b'.repeat(64), inventory_hash: 'c'.repeat(64) };
    const runtime = { buildCurrentInventory: () => inventory, buildTargetSourceSnapshot: () => snapshot };
    const paths = ['--name-status', path.join(runRoot, 'producer-name-status.tsv'), '--inventory', path.join(runRoot, 'target-source-inventory.json'), '--adjudication-input', path.join(runRoot, 'adjudication-input.json')];
    expect(checker.main(['--refresh', '--prepare-adjudication', ...shared, ...paths], runtime)).toBe(0);
    expect(checker.main(['--prepare-adjudication', ...shared, ...paths], runtime)).toBe(0);
    const input = JSON.parse(fs.readFileSync(path.join(runRoot, 'adjudication-input.json')));
    expect(input.records[0].package_id).toBe('skills/ce-new');
    expect(input.records[0].source_facts.new_object.git_oid).toBe(git('rev-parse', `${head}:skills/ce-new/SKILL.md`));
    expect(() => checker.main(['--refresh', '--prepare-adjudication', ...shared, ...paths], { ...runtime, buildTargetSourceSnapshot: () => ({ ...snapshot, source_tree_hash: 'd'.repeat(64) }) })).toThrow('ce-sync-output-collision');
    const marker = path.join(runRoot, 'artifact-set.json');
    checker.verifyArtifactSet(marker, [path.join(runRoot, 'adjudication-input.json')]);
    const stable = (value) => `${JSON.stringify(value, null, 2)}\n`;
    const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
    const ref = (file) => path.relative(process.cwd(), path.join(runRoot, file));
    const write = (file, value) => fs.writeFileSync(path.join(runRoot, file), stable(value));
    const facts = JSON.parse(fs.readFileSync(factsPath));
    const sourceRef = 'docs/contracts/verification/ce-upstream-sync-run.md';
    const commonEnvelope = { schema_version: 'ce-upstream-sync-run/v1', window_sha256: digest(stable(facts)), input_sha256: digest(stable(input)), target_snapshot: snapshot, source_refs: [sourceRef], limitations: ['synthetic fixture only'], unresolved: [] };
    const admission = { ...commonEnvelope, kind: 'package-admission', package_id: 'skills/ce-new', unit_id: 'U9', paths: ['skills/ce-new/SKILL.md'], decisions: [{ path: 'skills/ce-new/SKILL.md', target_action: 'compose', rationale: 'fixture decision' }], review_ref: sourceRef, authority_ref: sourceRef, dependency_refs: [] };
    write('plan-review.json', admission);
    fs.mkdirSync(path.join(runRoot, 'logs')); fs.writeFileSync(path.join(runRoot, 'logs/fixture.log'), 'fixture check');
    write('work-return.json', { ...commonEnvelope, kind: 'owner-receipt', unit_id: 'U9', paths: admission.paths, admission_ref: ref('plan-review.json'), admission_sha256: digest(stable(admission)), before_snapshot: snapshot, changed_files: [], checks: [{ argv: ['fixture-check'], exit_code: 0, log_path: ref('logs/fixture.log'), log_sha256: digest('fixture check'), status: 'passed', required: true }], authorization_scope: 'fixture', claim_ceiling: 'synthetic only' });
    write('handoff.json', { ...commonEnvelope, kind: 'handoff', summary: 'fixture', receipt_refs: [ref('work-return.json')], freshness: 'fixture snapshot', next_owner: 'fixture', claim_ceiling: 'synthetic only' });
    const record = { ...input.records[0], canonical_owner: sourceRef, implementation_unit: 'U9', implementation_targets: [sourceRef], target_action: 'compose', evidence_status: 'confirmed', degraded: false, source_refs: [sourceRef], test_owner: 'fixture', test_refs: [ref('logs/fixture.log')], limitations: ['fixture only'], closure_profile: 'source-adjudication' };
    delete record.source_facts; delete record.status;
    write('adjudication.json', { schema_version: checker.ADJUDICATION_SCHEMA_VERSION, join_key: checker.ADJUDICATION_JOIN_KEY, producer: { kind: 'llm-adjudication', model: 'fixture', status: 'confirmed' }, upstream: input.upstream, target_source_snapshot: snapshot, input_artifact_sha256: digest(stable(input)), records: [record] });
    const close = ['--full-window', ...shared, ...paths, '--adjudication', path.join(runRoot, 'adjudication.json'), '--run-handoff', path.join(runRoot, 'handoff.json'), '--ledger', path.join(runRoot, 'ledger.json'), '--summary', path.join(runRoot, 'summary.md')];
    expect(checker.main(['--refresh', ...close], runtime)).toBe(0);
    expect(checker.main(close, runtime)).toBe(0);
    const ledger = JSON.parse(fs.readFileSync(path.join(runRoot, 'ledger.json')));
    expect(ledger.schema_version).toBe('ce-upstream-reconciliation/v3');
    expect(ledger.package_summary[0]).toMatchObject({ package_id: 'skills/ce-new', actions: { compose: 1 }, record_paths: ['skills/ce-new/SKILL.md'] });
    fs.appendFileSync(path.join(runRoot, 'adjudication-input.json'), ' ');
    expect(() => checker.verifyArtifactSet(marker, [path.join(runRoot, 'adjudication-input.json')])).toThrow('ce-sync-artifact-set-hash');
  } finally {
    stdout.mockRestore(); fs.rmSync(upstream, { recursive: true, force: true }); fs.rmSync(runRoot, { recursive: true, force: true });
  }
});
