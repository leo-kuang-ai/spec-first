'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getSupportedPlatforms } = require('../../src/cli/adapters');
const {
  APP_AUDIT_METADATA_HOSTS,
  GENERATED_OR_CONTROL_ROOTS,
  listTextFilesWithMetadata,
  resolveBoundedSourceRoot,
  sourceInputPath,
  toPosix,
} = require('../../skills/spec-app-consistency-audit/scripts/lib/audit-utils');
const { validateArtifact } = require('../../skills/spec-app-consistency-audit/scripts/validate-artifacts');

function metadataArtifact(host) {
  return {
    schema_version: 'spec-app-consistency-audit-metadata.v1',
    artifact_id: 'metadata',
    generated_at: '2026-07-10T12:00:00.000Z',
    source_inputs: [{
      type: 'source',
      path: 'src',
      source_hash_unavailable_reason: 'test_fixture',
      freshness: 'unavailable',
    }],
    consumers: ['test'],
    contract_status: 'candidate',
    data_sensitivity: 'internal',
    run_id: 'test-run',
    host,
    mode: 'headless',
    head_sha: 'no-head',
    diff_hash: 'no-diff',
    diff_scope_kind: 'source_snapshot',
    worktree_fingerprint: 'test-fingerprint',
    audit_verdict_scope: 'static-only',
    run_dir: '.spec-first/app-audit/runs/test-run',
    summary_path: '.spec-first/app-audit/runs/test-run/summary.md',
    issues_path: '.spec-first/app-audit/runs/test-run/issues.json',
    status: 'started',
    status_reason_codes: [],
    started_at: '2026-07-10T12:00:00.000Z',
    coverage_capabilities: {},
    input_expectations: {},
  };
}

describe('spec-app-consistency-audit host boundaries', () => {
  test('keeps metadata hosts aligned with every supported platform', () => {
    const schema = JSON.parse(fs.readFileSync(
      'skills/spec-app-consistency-audit/schemas/metadata.schema.json',
      'utf8',
    ));
    const expectedHosts = ['unknown', ...getSupportedPlatforms()];

    expect(APP_AUDIT_METADATA_HOSTS).toEqual(expectedHosts);
    expect(schema.properties.host.enum).toEqual(expectedHosts);
    for (const host of expectedHosts) {
      expect(validateArtifact(metadataArtifact(host)).valid).toBe(true);
    }
    expect(validateArtifact(metadataArtifact('unsupported-host')).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'invalid_metadata_host' }),
    ]));
  });

  test('skips and redacts generated/control roots for all supported hosts', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-app-audit-hosts-'));
    try {
      fs.mkdirSync(path.join(repoRoot, 'src'), { recursive: true });
      fs.writeFileSync(path.join(repoRoot, 'src', 'App.kt'), 'class App\n');
      for (const root of GENERATED_OR_CONTROL_ROOTS) {
        fs.mkdirSync(path.join(repoRoot, root), { recursive: true });
        fs.writeFileSync(path.join(repoRoot, root, 'managed.md'), 'generated runtime\n');
      }

      const scan = listTextFilesWithMetadata(repoRoot);
      expect(scan.files.map((file) => toPosix(path.relative(repoRoot, file)))).toEqual(['src/App.kt']);

      for (const root of GENERATED_OR_CONTROL_ROOTS) {
        expect(sourceInputPath(repoRoot, path.join(repoRoot, root, 'managed.md'), 'source'))
          .toMatch(/^<source:[a-f0-9]{12}>$/);
        expect(() => resolveBoundedSourceRoot({ repoRoot, source: root }))
          .toThrow('generated/control runtime path is not auditable product source');
      }
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
