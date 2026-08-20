'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const producer = require('../../scripts/check-ce-localization-review.cjs');

const repoRoot = path.resolve(__dirname, '../..');

describe('CE setup localization prerequisite contracts', () => {
  test('builds source-bound preflight and exact S1-S11 dependency records', () => {
    const { inventory, preflight, dependencyMatrix } = producer.buildArtifacts();

    expect(preflight).toMatchObject({
      schema_version: 'ce-setup-prerequisite-preflight/v1',
      producer: 'scripts/check-ce-localization-review.cjs',
      source_snapshot: inventory.source_snapshot,
    });
    expect(preflight.contracts.map((entry) => entry.contract_id)).toEqual([
      'mode-side-effect',
      'source-snapshot',
      'project-config-validity',
      'runtime-status-projection',
      'host-invocation-receipt',
      'consumer-inventory',
    ]);

    expect(dependencyMatrix).toMatchObject({
      schema_version: 'ce-setup-dependency-matrix/v1',
      producer: 'scripts/check-ce-localization-review.cjs',
      source_snapshot: inventory.source_snapshot,
      public_entrypoint_disposition: 'reuse-spec-runtime-setup-only',
    });
    expect(dependencyMatrix.dependencies.map((entry) => entry.dependency_id)).toEqual(
      Array.from({ length: 11 }, (_value, index) => `S${index + 1}`),
    );
    for (const entry of dependencyMatrix.dependencies) {
      expect(entry.owner).toBeTruthy();
      expect(entry.source_refs.length).toBeGreaterThan(0);
      expect(entry.test_refs.length).toBeGreaterThan(0);
      expect(entry.evidence_refs.length).toBeGreaterThan(0);
      expect(entry.next_action).toBeTruthy();
    }
    expect(dependencyMatrix.dependencies.find((entry) => entry.dependency_id === 'S9'))
      .toMatchObject({ status: 'evidence-only', terminal_disposition: 'evidence-only' });
    expect(dependencyMatrix.dependencies.find((entry) => entry.dependency_id === 'S2'))
      .toMatchObject({ status: 'confirmed' });
    expect(dependencyMatrix.dependencies.find((entry) => entry.dependency_id === 'S11'))
      .toMatchObject({ status: 'confirmed' });
    expect(dependencyMatrix.status_counts.blocked || 0).toBe(0);
    expect(dependencyMatrix.overall_status).toBe('degraded');
    expect(dependencyMatrix.ce_tool_dispositions.map((entry) => entry.tool_id)).toEqual([
      'agent-browser',
      'ast-grep',
      'ast-grep-skill',
      'ffmpeg',
      'gh',
      'jq',
    ]);
    expect(dependencyMatrix.ce_tool_dispositions.find((entry) => entry.tool_id === 'jq'))
      .toMatchObject({ disposition: 'reject', reason_code: 'no-active-local-consumer' });
  });

  test('propagates non-confirmed prerequisite contracts into the preflight status', () => {
    expect(producer.derivePreflightStatus([
      { contract_id: 'source-snapshot', status: 'confirmed', reason_code: 'source-current' },
      { contract_id: 'consumer-inventory', status: 'partial', reason_code: 'consumer-inventory-incomplete' },
    ])).toEqual({
      overall_status: 'degraded',
      blocking_reason_codes: ['consumer-inventory-incomplete'],
    });

    expect(producer.derivePreflightStatus([
      { contract_id: 'source-snapshot', status: 'blocked', reason_code: 'target-snapshot-drift' },
    ])).toEqual({
      overall_status: 'blocked',
      blocking_reason_codes: ['target-snapshot-drift'],
    });
  });

  test('publishes versioned schemas for each prerequisite artifact boundary', () => {
    const expectations = new Map([
      ['ce-setup-prerequisite-preflight.schema.json', 'ce-setup-prerequisite-preflight/v1'],
      ['ce-setup-side-effect.schema.json', 'ce-setup-side-effect-contract/v1'],
      ['ce-setup-snapshot.schema.json', 'ce-setup-snapshot/v1'],
      ['runtime-status-projection.schema.json', 'runtime-status-projection/v1'],
      ['host-invocation-receipt.schema.json', 'host-invocation-receipt/v1'],
      ['ce-setup-dependency-matrix.schema.json', 'ce-setup-dependency-matrix/v1'],
    ]);

    for (const [fileName, schemaVersion] of expectations) {
      const schemaPath = path.join(repoRoot, 'docs', 'contracts', 'verification', fileName);
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
      expect(JSON.stringify(schema)).toContain(schemaVersion);
    }

    const snapshotSchema = JSON.parse(fs.readFileSync(path.join(
      repoRoot,
      'docs',
      'contracts',
      'verification',
      'ce-setup-snapshot.schema.json',
    ), 'utf8'));
    expect(snapshotSchema.required).not.toContain('schema_version');
    expect(snapshotSchema.required).toEqual(expect.arrayContaining([
      'head',
      'dirty_path_manifest_sha256',
      'source_tree_hash',
      'inventory_hash',
    ]));
  });

  test('validates produced setup artifacts against their published schemas', () => {
    const { preflight, dependencyMatrix } = producer.buildArtifacts();
    expect(producer.validateCeSetupArtifacts({ preflight, dependencyMatrix })).toEqual({ valid: true, errors: [] });

    expect(producer.validateCeSetupArtifacts({
      preflight: { ...preflight, unexpected: true },
      dependencyMatrix,
    })).toMatchObject({
      valid: false,
      errors: [expect.stringContaining('unexpected')],
    });
  });

  test('refresh writes all artifacts and verify-only is byte-read-only', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-setup-localization-'));
    const paths = {
      inventory: path.join(tempRoot, 'skill-inventory.json'),
      coverage: path.join(tempRoot, 'source-coverage.json'),
      preflight: path.join(tempRoot, 'ce-setup-prerequisite-preflight.json'),
      matrix: path.join(tempRoot, 'ce-setup-dependency-matrix.json'),
    };
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      expect(producer.main([
        '--refresh',
        '--inventory', paths.inventory,
        '--coverage', paths.coverage,
        '--preflight', paths.preflight,
        '--matrix', paths.matrix,
      ])).toBe(0);
      const before = new Map(Object.values(paths).map((filePath) => [
        filePath,
        fs.readFileSync(filePath, 'utf8'),
      ]));

      expect(producer.main([
        '--verify-only',
        '--inventory', paths.inventory,
        '--coverage', paths.coverage,
        '--preflight', paths.preflight,
        '--matrix', paths.matrix,
      ])).toBe(0);
      for (const [filePath, contents] of before) {
        expect(fs.readFileSync(filePath, 'utf8')).toBe(contents);
      }
    } finally {
      stdout.mockRestore();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
