'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validateAuthoringPreview,
  verifyWriteReceipt,
} = require('../../skills/spec-write-skill/scripts/validate-authoring-preview.cjs');

const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function sha(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fixture() {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'spec-write-skill-preview-'));
  tempRoots.push(root);
  const source = path.join(root, 'example-skill');
  fs.mkdirSync(source);
  const before = '# Before\n';
  fs.writeFileSync(path.join(source, 'SKILL.md'), before);
  const after = '# After\n';
  const wouldChange = [{
    path: 'example-skill/SKILL.md',
    before_sha256: sha(before),
    after_sha256: sha(after),
    collision_disposition: 'replace',
  }];
  return {
    root,
    after,
    manifest: {
      schema_version: 'spec-write-skill.authoring-preview/v1',
      target_repo_root: root,
      canonical_source_root: 'example-skill',
      authorized_root: '.',
      requested_effect: 'apply',
      authorization_claim: 'ready',
      source_snapshot: { files: [{ path: 'example-skill/SKILL.md', sha256: sha(before) }] },
      would_change: wouldChange,
      preserve: [],
      generated: [],
      not_touch: [],
      planned_side_effects: [],
      residual_risks: [],
    },
    scope: {
      paths: ['example-skill/SKILL.md'],
      dirty_paths: [],
      pre_write_binding: true,
      conditional_patch_primitive: 'atomic-expected-hash',
    },
    writeSet: wouldChange,
  };
}

test('passes only when manifest, host scope, snapshot and exact write set bind together', () => {
  const { root, manifest, scope, writeSet } = fixture();
  const before = fs.readFileSync(path.join(root, 'example-skill', 'SKILL.md'), 'utf8');
  const report = validateAuthoringPreview({
    manifest,
    authorizedRoot: root,
    scope,
    writeSet,
  });

  expect(report).toMatchObject({
    schema_version: 'spec-write-skill.authoring-preview-report/v1',
    result: 'pass',
    mutation_readiness: 'ready',
    findings: [],
  });
  expect(fs.readFileSync(path.join(root, 'example-skill', 'SKILL.md'), 'utf8')).toBe(before);
});

test('fails stale snapshots, scope mismatch, generated-runtime paths and malformed semantic arrays without writing', () => {
  const { root, manifest, scope, writeSet } = fixture();
  fs.writeFileSync(path.join(root, 'example-skill', 'SKILL.md'), '# User change\n');
  manifest.planned_side_effects = ['valid', 3];
  manifest.generated = ['.codex/skills/example-skill/SKILL.md'];
  scope.paths = ['other.md'];

  const report = validateAuthoringPreview({ manifest, authorizedRoot: root, scope, writeSet });

  expect(report.result).toBe('fail');
  expect(report.findings.map((entry) => entry.reason_code)).toEqual(expect.arrayContaining([
    'snapshot_stale',
    'scope_path_mismatch',
    'generated_runtime_path_forbidden',
    'planned_side_effects_invalid',
  ]));
  expect(fs.readFileSync(path.join(root, 'example-skill', 'SKILL.md'), 'utf8')).toBe('# User change\n');
});

test('returns incomplete when the host cannot prove exact pre-write binding and atomic conditional patch support', () => {
  const { root, manifest, scope, writeSet } = fixture();
  scope.pre_write_binding = false;
  scope.conditional_patch_primitive = 'plain-write';

  const report = validateAuthoringPreview({ manifest, authorizedRoot: root, scope, writeSet: null });

  expect(report.result).toBe('incomplete');
  expect(report.mutation_readiness).toBe('not-ready');
  expect(report.findings.map((entry) => entry.reason_code)).toEqual(expect.arrayContaining([
    'exact_write_set_unavailable',
    'atomic_conditional_patch_unavailable',
  ]));
});

test('rejects writes outside canonical source root and requires snapshot/dirty-overlap coverage', () => {
  const { root, manifest, scope, writeSet } = fixture();
  fs.writeFileSync(path.join(root, 'README.md'), 'outside\n');
  const outside = {
    path: 'README.md', before_sha256: sha('outside\n'), after_sha256: sha('changed\n'), collision_disposition: 'replace',
  };
  manifest.would_change = [outside];
  manifest.source_snapshot = { files: [{ path: outside.path, sha256: outside.before_sha256 }] };
  scope.paths = [outside.path];
  scope.dirty_paths = ['README.md'];

  const report = validateAuthoringPreview({ manifest, authorizedRoot: root, scope, writeSet: [outside] });

  expect(report.result).toBe('fail');
  expect(report.findings.map((entry) => entry.reason_code)).toEqual(expect.arrayContaining([
    'path_outside_canonical_source_root',
    'snapshot_required_path_missing',
    'dirty_overlap_disposition_missing',
  ]));
});

test('requires a nearest-parent snapshot before a new canonical source file is created', () => {
  const { root, manifest, scope } = fixture();
  const create = {
    path: 'example-skill/references/new.md', before_sha256: null, after_sha256: sha('# New\n'), collision_disposition: 'create',
  };
  manifest.would_change = [create];
  manifest.source_snapshot.parents = [{ path: 'example-skill', entries_sha256: sha('SKILL.md:f') }];
  scope.paths = [create.path];

  expect(validateAuthoringPreview({ manifest, authorizedRoot: root, scope, writeSet: [create] }))
    .toMatchObject({ result: 'pass', mutation_readiness: 'ready' });

  manifest.source_snapshot.parents = [];
  const missing = validateAuthoringPreview({ manifest, authorizedRoot: root, scope, writeSet: [create] });
  expect(missing.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'parent_snapshot_missing', status: 'error' }),
  ]));
});

test('allows a new canonical source root when the authorized-root parent is snapshotted', () => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'spec-write-skill-new-root-'));
  tempRoots.push(root);
  const create = {
    path: 'new-skill/SKILL.md', before_sha256: null, after_sha256: sha('# New skill\n'), collision_disposition: 'create',
  };
  const manifest = {
    schema_version: 'spec-write-skill.authoring-preview/v1',
    target_repo_root: root,
    canonical_source_root: 'new-skill',
    authorized_root: '.',
    requested_effect: 'apply',
    authorization_claim: 'ready',
    source_snapshot: { files: [], parents: [{ path: '.', entries_sha256: sha('') }] },
    would_change: [create],
    preserve: [],
    generated: [],
    not_touch: [],
    planned_side_effects: [],
    residual_risks: [],
  };
  const scope = {
    paths: [create.path], dirty_paths: [], pre_write_binding: true, conditional_patch_primitive: 'atomic-expected-hash',
  };

  expect(validateAuthoringPreview({ manifest, authorizedRoot: root, scope, writeSet: [create] }))
    .toMatchObject({ result: 'pass', mutation_readiness: 'ready' });
});

test('write receipt binds changed paths and hashes, and exposes partial failure without claiming completion', () => {
  const { root, manifest, scope, writeSet, after } = fixture();
  const preview = validateAuthoringPreview({ manifest, authorizedRoot: root, scope, writeSet });
  fs.writeFileSync(path.join(root, 'example-skill', 'SKILL.md'), after);

  const receipt = verifyWriteReceipt({
    preview,
    root,
    writeSet,
    patch_receipt: { primitive: 'atomic-expected-hash', actual_changed_paths: ['example-skill/SKILL.md'], unchanged_paths: [], failure_reason: null },
  });
  expect(receipt).toMatchObject({ result: 'pass', completion_claim_allowed: true });

  const partial = verifyWriteReceipt({
    preview,
    root,
    writeSet,
    patch_receipt: { primitive: 'atomic-expected-hash', actual_changed_paths: [], unchanged_paths: ['example-skill/SKILL.md'], failure_reason: 'host-write-failed' },
  });
  expect(partial).toMatchObject({ result: 'fail', completion_claim_allowed: false });
  expect(partial.rollback_preview).toContain('example-skill/SKILL.md');
  expect(verifyWriteReceipt({
    preview: { result: 'pass' }, root, writeSet,
    patch_receipt: { primitive: 'atomic-expected-hash', actual_changed_paths: ['example-skill/SKILL.md'], unchanged_paths: [], failure_reason: null },
  })).toMatchObject({ result: 'fail', reason_code: 'preview_not_verified' });
  expect(verifyWriteReceipt({ preview, root, writeSet })).toMatchObject({
    result: 'fail', completion_claim_allowed: false, reason_code: 'actual_change_list_unavailable',
  });
});

test('requires dirty-overlap disposition for generated paths as well as would-change paths', () => {
  const { root, manifest, scope, writeSet } = fixture();
  const generatedPath = 'example-skill/catalog.json';
  const generatedContent = '{}\n';
  fs.writeFileSync(path.join(root, generatedPath), generatedContent);
  manifest.generated = [generatedPath];
  manifest.source_snapshot.files.push({ path: generatedPath, sha256: sha(generatedContent) });
  scope.dirty_paths = [generatedPath];

  const report = validateAuthoringPreview({ manifest, authorizedRoot: root, scope, writeSet });
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'dirty_overlap_disposition_missing', path: generatedPath }),
  ]));
});
