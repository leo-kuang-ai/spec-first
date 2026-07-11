'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  prepareEvidence,
  prepareRunAudit,
} = require('../../skills/spec-prd/evals/prepare-contract-reset-evidence');

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toRunRelative(runRoot, filePath) {
  return path.relative(runRoot, filePath).split(path.sep).join('/');
}

function opaqueNamespaceId(sessionId) {
  return `ns-${crypto.createHash('sha256').update(sessionId).digest('hex').slice(0, 20)}`;
}

function computeTreeHash(root, sourcePaths) {
  const hash = crypto.createHash('sha256');
  for (const relativePath of [...sourcePaths].sort()) {
    const absolutePath = path.join(root, relativePath);
    const stat = fs.statSync(absolutePath);
    const bytes = fs.readFileSync(absolutePath);
    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(stat.mode & 0o777));
    hash.update('\0');
    hash.update(String(bytes.length));
    hash.update('\0');
    hash.update(bytes);
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

function createNativeRun(artifactInput) {
  const artifactBytes = Buffer.isBuffer(artifactInput)
    ? artifactInput
    : Buffer.from(String(artifactInput), 'utf8');
  const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-evidence-'));
  const session = {
    case_id: 'create-brownfield-single-surface',
    arm: 'candidate',
    repeat: 1,
    session_id: 'session-1',
    order_position: 3,
  };
  const namespaceId = opaqueNamespaceId(session.session_id);
  const namespaceRoot = path.join(runRoot, 'namespaces', namespaceId);
  const sourceRoot = path.join(namespaceRoot, 'source');
  const inputsRoot = path.join(namespaceRoot, 'inputs');
  const outputRoot = path.join(namespaceRoot, 'output');
  const rawRoot = path.join(outputRoot, 'raw');
  const sourcePath = 'skills/spec-prd/SKILL.md';
  fs.mkdirSync(path.dirname(path.join(sourceRoot, sourcePath)), { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(sourceRoot, sourcePath), '# spec-prd source\n', { mode: 0o644 });
  const sourceTreeHash = computeTreeHash(sourceRoot, [sourcePath]);
  fs.mkdirSync(inputsRoot, { recursive: true, mode: 0o700 });
  const invocationProfile = {
    host: 'codex',
    model_profile: 'gate-a-test',
    authority_profile: 'repository-owned-eval',
  };
  const sourceManifestPath = path.join(runRoot, 'source-manifest.json');
  writeJson(sourceManifestPath, {
    schema_version: 'contract-reset-source-manifest/v1',
    artifact_type: 'generated',
    run_id: 'unit-run',
    attempt_id: 'gate-a-unit-run',
    parent_revision: '0123456789012345678901234567890123456789',
    source_files: [{ path: sourcePath, tracked: true }],
    arms: {
      baseline: { patch_chain: [], tree_hash: sha256('baseline') },
      phase1_control: { patch_chain: ['phase1_control'], tree_hash: sha256('control') },
      candidate: { patch_chain: ['phase1_control', 'candidate'], tree_hash: sourceTreeHash },
    },
    invocation_profile: invocationProfile,
    sessions: [session],
  });

  const modelVisibleManifest = {
    schema_version: 'contract-reset-model-visible-manifest/v1',
    artifact_type: 'generated',
    case_id: session.case_id,
    intent: 'Create a brownfield Product Contract.',
    authority_profile: 'repository-owned-eval',
    review_focus: ['product contract'],
    session_id: session.session_id,
    repeat: session.repeat,
    order_position: session.order_position,
    invocation_profile: invocationProfile,
    source: {
      root: 'source',
      tree_hash: sourceTreeHash,
      files: [sourcePath],
    },
    inputs: [],
    limitations: ['Only namespace-local inputs and source are available.'],
  };
  const modelVisibleManifestPath = path.join(namespaceRoot, 'model-visible-manifest.json');
  writeJson(modelVisibleManifestPath, modelVisibleManifest);
  const modelVisibleManifestBytes = fs.readFileSync(modelVisibleManifestPath);

  fs.mkdirSync(rawRoot, { recursive: true, mode: 0o700 });
  const artifactPath = path.join(outputRoot, 'product-contract.md');
  const eventLogPath = path.join(outputRoot, 'events.json');
  const gradingNotesPath = path.join(outputRoot, 'grading-notes.json');
  fs.writeFileSync(artifactPath, artifactBytes, { mode: 0o600 });
  writeJson(eventLogPath, {
    schema_version: 'contract-reset-event-log/v1',
    events: [{ type: 'question', id: 'Q1', material: true }],
  });
  writeJson(gradingNotesPath, {
    schema_version: 'contract-reset-grading-notes/v1',
    planning_invention: 0,
    interaction_waste: 0,
    core_product_quality: 'pass',
  });
  fs.writeFileSync(path.join(rawRoot, 'provider.log'), 'temporary provider log\n', 'utf8');
  fs.writeFileSync(path.join(rawRoot, 'transcript.txt'), 'temporary transcript\n', 'utf8');

  const nativeManifestPath = path.join(outputRoot, 'native-output.json');
  const native = {
    schema_version: 'contract-reset-native-output/v1',
    ...session,
    namespace_id: namespaceId,
    source_tree_hash: sourceTreeHash,
    model_visible_manifest_hash: sha256(modelVisibleManifestBytes),
    artifact_path: toRunRelative(runRoot, artifactPath),
    event_log_path: toRunRelative(runRoot, eventLogPath),
    grading_notes_path: toRunRelative(runRoot, gradingNotesPath),
    output_hashes: {
      artifact: sha256(fs.readFileSync(artifactPath)),
      event_log: sha256(fs.readFileSync(eventLogPath)),
      grading_notes: sha256(fs.readFileSync(gradingNotesPath)),
    },
    pii_attestation: {
      status: 'passed',
      reviewer: 'independent-evaluator',
    },
    raw_cleanup_paths: [
      toRunRelative(runRoot, path.join(rawRoot, 'provider.log')),
      toRunRelative(runRoot, path.join(rawRoot, 'transcript.txt')),
    ],
  };
  writeJson(nativeManifestPath, native);
  return {
    runRoot,
    nativeManifestPath,
    native,
    namespaceRoot,
    outputRoot,
    rawRoot,
    artifactPath,
    eventLogPath,
    gradingNotesPath,
    sourceManifestPath,
    modelVisibleManifestPath,
    sourceRoot,
    sourcePath,
    outDir: path.join(runRoot, 'durable-evidence'),
  };
}

function updateNative(fixture, update) {
  const native = readJson(fixture.nativeManifestPath);
  update(native);
  writeJson(fixture.nativeManifestPath, native);
  fixture.native = native;
}

function updateOutputJson(fixture, kind, filePath, value) {
  writeJson(filePath, value);
  updateNative(fixture, (native) => {
    native.output_hashes[kind] = sha256(fs.readFileSync(filePath));
  });
}

function cleanupFixture(fixture) {
  fs.rmSync(fixture.runRoot, { recursive: true, force: true });
}

describe('spec-prd Contract Reset evidence producer', () => {
  test('strips quoted/spaced machine identity, preserves source mode/body bytes, binds provenance, and cleans raw files', () => {
    const body = [
      '# Product Contract',
      '',
      '## Summary',
      '',
      '管理员需要在当前 release 中看到失败原因。',
      '',
      '## Requirements',
      '',
      '| id | requirement |',
      '| --- | --- |',
      '| R-01 | 失败必须可观察 |',
      '',
    ].join('\n');
    const artifact = [
      '---',
      'title: 可观察失败',
      "'producer' : spec-prd-contract-reset-candidate",
      '"arm" : candidate',
      'session_id : session-1',
      'status: ready-for-planning',
      'readiness_verified_at : 2026-07-11T00:00:00.000Z',
      'source_mode: refine',
      'mode : validate',
      '---',
      body,
    ].join('\n');
    const fixture = createNativeRun(artifact);
    const chmodSpy = jest.spyOn(fs, 'chmodSync');
    try {
      const result = prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: true,
      });
      const packet = fs.readFileSync(path.join(fixture.outDir, 'blind-packet.md'), 'utf8');
      const retained = readJson(path.join(fixture.outDir, 'retained-evidence-manifest.json'));

      expect(result.status).toBe('prepared');
      expect(packet).toContain('title: 可观察失败');
      expect(packet).toContain('source_mode: refine');
      expect(packet).toContain('mode : validate');
      expect(packet).not.toMatch(/["']?(?:producer|arm|session_id|status|readiness_verified_at)["']?\s*:/);
      expect(packet.slice(packet.indexOf('# Product Contract'))).toBe(body);
      expect(retained).toMatchObject({
        schema_version: 'contract-reset-retained-evidence/v1',
        artifact_type: 'generated',
        transformation_version: 'contract-reset-blind-transform/v1',
        body_byte_preserved: true,
        pii_attestation: {
          status: 'passed',
          reviewer: 'independent-evaluator',
        },
        provenance: {
          source_manifest: {
            path: 'source-manifest.json',
            sha256: sha256(fs.readFileSync(fixture.sourceManifestPath)),
            run_id: 'unit-run',
          },
          frozen_session: fixture.native && expect.objectContaining({
            case_id: fixture.native.case_id,
            arm: fixture.native.arm,
            repeat: fixture.native.repeat,
            session_id: fixture.native.session_id,
            order_position: fixture.native.order_position,
          }),
          namespace: {
            namespace_id: fixture.native.namespace_id,
            source_tree_hash: fixture.native.source_tree_hash,
            model_visible_manifest_hash: fixture.native.model_visible_manifest_hash,
          },
        },
        hashes: {
          native_artifact: sha256(Buffer.from(artifact)),
          blind_packet: sha256(Buffer.from(packet)),
          event_log: expect.stringMatching(/^sha256:/),
          grading_notes: expect.stringMatching(/^sha256:/),
        },
      });
      expect(fs.existsSync(path.join(fixture.rawRoot, 'provider.log'))).toBe(false);
      expect(fs.existsSync(path.join(fixture.rawRoot, 'transcript.txt'))).toBe(false);
      const outputNames = fs.readdirSync(fixture.outDir);
      expect(chmodSpy).toHaveBeenCalledWith(fixture.outDir, 0o700);
      for (const name of outputNames) {
        expect(chmodSpy.mock.calls.some(([target, mode]) => (
          path.basename(target) === name && mode === 0o600
        ))).toBe(true);
      }
      if (process.platform !== 'win32') {
        expect(fs.statSync(fixture.outDir).mode & 0o777).toBe(0o700);
        for (const name of outputNames) {
          expect(fs.statSync(path.join(fixture.outDir, name)).mode & 0o777).toBe(0o600);
        }
      }
    } finally {
      chmodSpy.mockRestore();
      cleanupFixture(fixture);
    }
  });

  test('binds executable source mode into retained provenance tree verification', () => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    try {
      fs.chmodSync(path.join(fixture.sourceRoot, fixture.sourcePath), 0o755);
      const sourceTreeHash = computeTreeHash(fixture.sourceRoot, [fixture.sourcePath]);
      const sourceManifest = readJson(fixture.sourceManifestPath);
      sourceManifest.arms.candidate.tree_hash = sourceTreeHash;
      writeJson(fixture.sourceManifestPath, sourceManifest);

      const modelVisible = readJson(fixture.modelVisibleManifestPath);
      modelVisible.source.tree_hash = sourceTreeHash;
      writeJson(fixture.modelVisibleManifestPath, modelVisible);
      updateNative(fixture, (native) => {
        native.source_tree_hash = sourceTreeHash;
        native.model_visible_manifest_hash = sha256(fs.readFileSync(fixture.modelVisibleManifestPath));
      });

      expect(prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: false,
      })).toMatchObject({ status: 'prepared' });
    } finally {
      cleanupFixture(fixture);
    }
  });

  test.each([
    ['explicit canary', 'SPEC_FIRST_CANARY_DO_NOT_RETAIN_123'],
    ['credential', 'api_key=super-secret-value-12345'],
    ['quoted JSON credential', '"access_token": "super-secret-value-12345"'],
  ])('fails closed before durable write for %s in the artifact', (_label, unsafeValue) => {
    const fixture = createNativeRun(`# Product Contract\n\n${unsafeValue}\n`);
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: true,
      })).toThrow(/sensitive content/i);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
      expect(fs.existsSync(path.join(fixture.rawRoot, 'provider.log'))).toBe(true);
    } finally {
      cleanupFixture(fixture);
    }
  });

  test.each(['event_log', 'grading_notes'])('rejects quoted JSON credentials in %s', (kind) => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    const filePath = kind === 'event_log' ? fixture.eventLogPath : fixture.gradingNotesPath;
    try {
      updateOutputJson(fixture, kind, filePath, {
        schema_version: kind === 'event_log'
          ? 'contract-reset-event-log/v1'
          : 'contract-reset-grading-notes/v1',
        access_token: 'super-secret-value-12345',
      });
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: false,
      })).toThrow(/sensitive content/i);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
    } finally {
      cleanupFixture(fixture);
    }
  });

  test('rejects invalid UTF-8 instead of claiming body byte preservation', () => {
    const invalidArtifact = Buffer.concat([
      Buffer.from('# Product Contract\n\n'),
      Buffer.from([0xc3, 0x28]),
      Buffer.from('\n'),
    ]);
    const fixture = createNativeRun(invalidArtifact);
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: false,
      })).toThrow(/UTF-8/i);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
    } finally {
      cleanupFixture(fixture);
    }
  });

  test('requires semantic PII attestation independently of cleanup validation', () => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    updateNative(fixture, (native) => {
      native.pii_attestation.status = 'not-reviewed';
    });
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: false,
      })).toThrow(/PII attestation/i);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
    } finally {
      cleanupFixture(fixture);
    }
  });

  test('allows only fixed PII attestation fields and scans the serialized retained manifest', () => {
    const extraFieldFixture = createNativeRun('# Product Contract\n\nSafe body\n');
    updateNative(extraFieldFixture, (native) => {
      native.pii_attestation.notes = 'free-form text';
    });
    try {
      expect(() => prepareEvidence({
        runRoot: extraFieldFixture.runRoot,
        nativeManifestPath: extraFieldFixture.nativeManifestPath,
        outDir: extraFieldFixture.outDir,
        cleanup: false,
      })).toThrow(/PII attestation.*field/i);
      expect(fs.existsSync(extraFieldFixture.outDir)).toBe(false);
    } finally {
      cleanupFixture(extraFieldFixture);
    }

    const manifestScanFixture = createNativeRun('# Product Contract\n\nSafe body\n');
    updateNative(manifestScanFixture, (native) => {
      native.pii_attestation.reviewer = 'SPEC_FIRST_CANARY_REVIEWER_123';
    });
    try {
      expect(() => prepareEvidence({
        runRoot: manifestScanFixture.runRoot,
        nativeManifestPath: manifestScanFixture.nativeManifestPath,
        outDir: manifestScanFixture.outDir,
        cleanup: false,
      })).toThrow(/sensitive content/i);
      expect(fs.existsSync(manifestScanFixture.outDir)).toBe(false);
    } finally {
      cleanupFixture(manifestScanFixture);
    }
  });

  test('rejects cleanup paths outside the run root without deleting the external sentinel', () => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-outside-'));
    const sentinel = path.join(outside, 'outside.log');
    fs.writeFileSync(sentinel, 'keep me\n', 'utf8');
    updateNative(fixture, (native) => {
      native.raw_cleanup_paths.push(sentinel);
    });
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: true,
      })).toThrow(/cleanup path.*run root|escapes the run root/i);
      expect(fs.readFileSync(sentinel, 'utf8')).toBe('keep me\n');
      expect(fs.existsSync(fixture.outDir)).toBe(false);
      expect(fs.existsSync(path.join(fixture.rawRoot, 'provider.log'))).toBe(true);
    } finally {
      cleanupFixture(fixture);
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test.each([
    ['dot/run root', (fixture) => '.'],
    ['absolute run root', (fixture) => fixture.runRoot],
    ['durable output', (fixture) => fixture.outDir],
    ['durable output ancestor', (fixture) => path.join(fixture.runRoot, 'durable-parent')],
    ['durable output descendant', (fixture) => path.join(fixture.outDir, 'raw')],
    ['source manifest', (fixture) => fixture.sourceManifestPath],
    ['retained native artifact', (fixture) => fixture.artifactPath],
    ['unallowlisted raw file', (fixture) => {
      const other = path.join(fixture.rawRoot, 'arbitrary.log');
      fs.writeFileSync(other, 'raw\n', 'utf8');
      return other;
    }],
  ])('rejects protected, overlapping, or unallowlisted cleanup target: %s', (_label, targetFor) => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    if (_label === 'durable output ancestor') {
      fixture.outDir = path.join(fixture.runRoot, 'durable-parent', 'evidence');
      fs.mkdirSync(path.dirname(fixture.outDir), { recursive: true });
    }
    const cleanupTarget = targetFor(fixture);
    updateNative(fixture, (native) => {
      native.raw_cleanup_paths = [path.isAbsolute(cleanupTarget)
        ? cleanupTarget
        : cleanupTarget];
    });
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: true,
      })).toThrow(/cleanup|allowlist|overlap|protected|run root/i);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
      expect(fs.existsSync(path.join(fixture.rawRoot, 'provider.log'))).toBe(true);
    } finally {
      cleanupFixture(fixture);
    }
  });

  const symlinkTest = process.platform === 'win32' ? test.skip : test;

  symlinkTest('rejects a symlink ancestor for native evidence inputs', () => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-native-link-'));
    const outsideOutput = path.join(outside, 'output');
    fs.cpSync(fixture.outputRoot, outsideOutput, { recursive: true });
    fs.rmSync(fixture.outputRoot, { recursive: true, force: true });
    fs.symlinkSync(outsideOutput, fixture.outputRoot, 'dir');
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: false,
      })).toThrow(/symlink/i);
      expect(fs.existsSync(path.join(outsideOutput, 'product-contract.md'))).toBe(true);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
    } finally {
      cleanupFixture(fixture);
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  symlinkTest('rejects a symlink ancestor for cleanup without deleting outside files', () => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-cleanup-link-'));
    const outsideRaw = path.join(outside, 'raw');
    fs.cpSync(fixture.rawRoot, outsideRaw, { recursive: true });
    fs.rmSync(fixture.rawRoot, { recursive: true, force: true });
    fs.symlinkSync(outsideRaw, fixture.rawRoot, 'dir');
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: true,
      })).toThrow(/symlink/i);
      expect(fs.existsSync(path.join(outsideRaw, 'provider.log'))).toBe(true);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
    } finally {
      cleanupFixture(fixture);
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  symlinkTest('rejects a symlink ancestor for durable output before writing outside the run root', () => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-output-link-'));
    const outputLink = path.join(fixture.runRoot, 'outside-link');
    fs.symlinkSync(outside, outputLink, 'dir');
    const outDir = path.join(outputLink, 'durable-evidence');
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir,
        cleanup: false,
      })).toThrow(/symlink/i);
      expect(fs.existsSync(path.join(outside, 'durable-evidence'))).toBe(false);
    } finally {
      cleanupFixture(fixture);
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test.each([
    ['frozen arm', (native) => { native.arm = 'baseline'; }],
    ['frozen session', (native) => { native.session_id = 'session-other'; }],
    ['source tree hash', (native) => { native.source_tree_hash = sha256('wrong-tree'); }],
    ['model-visible manifest hash', (native) => { native.model_visible_manifest_hash = sha256('wrong-manifest'); }],
    ['artifact output hash', (native) => { native.output_hashes.artifact = sha256('wrong-output'); }],
    ['event output path', (native, fixture) => {
      native.event_log_path = toRunRelative(fixture.runRoot, path.join(fixture.rawRoot, 'transcript.txt'));
      native.output_hashes.event_log = sha256(fs.readFileSync(path.join(fixture.rawRoot, 'transcript.txt')));
    }],
  ])('fails closed when retained evidence provenance mismatches %s', (_label, mutate) => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    updateNative(fixture, (native) => mutate(native, fixture));
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: false,
      })).toThrow(/provenance|frozen|hash|output path|session|arm|tree/i);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
    } finally {
      cleanupFixture(fixture);
    }
  });

  test('removes a renamed durable output when final permission hardening fails', () => {
    const fixture = createNativeRun('# Product Contract\n\nSafe body\n');
    const originalChmodSync = fs.chmodSync;
    const chmodSpy = jest.spyOn(fs, 'chmodSync').mockImplementation((target, mode) => {
      if (path.resolve(target) === path.resolve(fixture.outDir)) {
        throw new Error('simulated final chmod failure');
      }
      return originalChmodSync(target, mode);
    });
    try {
      expect(() => prepareEvidence({
        runRoot: fixture.runRoot,
        nativeManifestPath: fixture.nativeManifestPath,
        outDir: fixture.outDir,
        cleanup: false,
      })).toThrow(/simulated final chmod failure/);
      expect(fs.existsSync(fixture.outDir)).toBe(false);
    } finally {
      chmodSpy.mockRestore();
      cleanupFixture(fixture);
    }
  });

  test('rejects run audit output outside the run root before writing', () => {
    const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-audit-root-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-audit-outside-'));
    const outDir = path.join(outside, 'audit');
    try {
      expect(() => prepareRunAudit({ runRoot, outDir, repoRoot: path.resolve(__dirname, '../..') }))
        .toThrow(/escapes the run root/);
      expect(fs.existsSync(outDir)).toBe(false);
    } finally {
      fs.rmSync(runRoot, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});
