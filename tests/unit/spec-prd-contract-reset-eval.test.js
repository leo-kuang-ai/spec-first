'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  computeMaterializationContractHash,
  validateContractResetCases,
  validateRunDirectory,
} = require('../../skills/spec-prd/evals/run-evals');
const {
  buildMaterializationVerification,
  computeTreeHash,
} = require('../../skills/spec-prd/evals/run-contract-reset-arm');

const repoRoot = path.resolve(__dirname, '../..');
const casesPath = path.join(repoRoot, 'skills/spec-prd/evals/contract-reset-cases.json');
const runnerPath = path.join(repoRoot, 'skills/spec-prd/evals/run-evals.js');

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

function updateJson(filePath, update) {
  const value = readJson(filePath);
  update(value);
  writeJson(filePath, value);
}

function treeSnapshot(root) {
  const entries = [];
  function visit(current, relative = '') {
    for (const name of fs.readdirSync(current).sort()) {
      const absolute = path.join(current, name);
      const nextRelative = relative ? `${relative}/${name}` : name;
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory()) {
        entries.push([nextRelative, 'dir', stat.mode & 0o777]);
        visit(absolute, nextRelative);
      } else {
        entries.push([nextRelative, 'file', stat.mode & 0o777, sha256(fs.readFileSync(absolute))]);
      }
    }
  }
  visit(root);
  return entries;
}

function createStructurallyValidRunDir() {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-contract-reset-run-'));
  const controlPatch = 'diff --git a/a.md b/a.md\n--- a/a.md\n+++ b/a.md\n@@ -1 +1 @@\n-a\n+b\n';
  const candidatePatch = 'diff --git a/a.md b/a.md\n--- a/a.md\n+++ b/a.md\n@@ -1 +1 @@\n-b\n+c\n';
  fs.writeFileSync(path.join(runDir, 'control.patch'), controlPatch, 'utf8');
  fs.writeFileSync(path.join(runDir, 'candidate.patch'), candidatePatch, 'utf8');
  const casesBytes = fs.readFileSync(casesPath);
  const cases = JSON.parse(casesBytes.toString('utf8'));
  const sessions = [];
  let sessionIndex = 0;
  for (const entry of cases.cases.filter((item) => item.gate_role !== 'trigger_matrix')) {
    for (let repeat = 1; repeat <= cases.run_contract.repeats_per_arm; repeat += 1) {
      const order = cases.run_contract.balanced_orders[(repeat - 1) % cases.run_contract.balanced_orders.length];
      order.forEach((arm, index) => {
        sessionIndex += 1;
        sessions.push({
          case_id: entry.id,
          arm,
          repeat,
          order_position: index + 1,
          session_id: `opaque-session-${String(sessionIndex).padStart(3, '0')}`,
        });
      });
    }
  }
  const sourcePath = 'a.md';
  const armContents = {
    baseline: 'a\n',
    phase1_control: 'b\n',
    candidate: 'c\n',
  };
  const armReports = Object.entries(armContents).map(([arm, content]) => {
    const materializedRoot = path.join(runDir, '.verified-materializations', arm);
    fs.mkdirSync(materializedRoot, { recursive: true });
    fs.writeFileSync(path.join(materializedRoot, sourcePath), content, 'utf8');
    return {
      schema_version: 'contract-reset-materialization/v1',
      artifact_type: 'confirmed',
      status: 'materialized',
      arm,
      tree_hash: computeTreeHash(materializedRoot, [sourcePath]),
      source_file_count: 1,
    };
  });
  const treeHashes = Object.fromEntries(armReports.map((entry) => [entry.arm, entry.tree_hash]));
  const manifest = {
    schema_version: 'contract-reset-source-manifest/v1',
    artifact_type: 'generated',
    run_id: 'unit-run',
    attempt_id: 'gate-a-unit-run',
    parent_revision: '0123456789012345678901234567890123456789',
    cases_path: 'skills/spec-prd/evals/contract-reset-cases.json',
    cases_hash: sha256(casesBytes),
    patches: {
      phase1_control: { path: 'control.patch', sha256: sha256(controlPatch) },
      candidate: { path: 'candidate.patch', sha256: sha256(candidatePatch) },
    },
    source_files: [{ path: sourcePath, tracked: true }],
    arms: {
      baseline: { patch_chain: [], tree_hash: treeHashes.baseline },
      phase1_control: { patch_chain: ['phase1_control'], tree_hash: treeHashes.phase1_control },
      candidate: { patch_chain: ['phase1_control', 'candidate'], tree_hash: treeHashes.candidate },
    },
    invocation_profile: cases.run_contract.invocation_profile,
    threshold_contract_hash: sha256(JSON.stringify({
      cases: cases.cases.map((entry) => [entry.id, entry.minimum_material_effect || null]),
      budget: cases.run_contract.maximum_complexity_budget,
    })),
    sessions,
  };
  const materializationVerification = buildMaterializationVerification({
    manifest,
    armReports,
  });
  expect(materializationVerification.contract_hash).toBe(computeMaterializationContractHash(manifest));
  const materializationBytes = Buffer.from(`${JSON.stringify(materializationVerification, null, 2)}\n`);
  fs.writeFileSync(path.join(runDir, 'materialization-verification.json'), materializationBytes);
  manifest.materialization_verification = {
    path: 'materialization-verification.json',
    sha256: sha256(materializationBytes),
  };
  writeJson(path.join(runDir, 'source-manifest.json'), manifest);
  writeJson(path.join(runDir, 'promotion-holdout-commitment.json'), {
    schema_version: 'contract-reset-holdout-commitment/v1',
    artifact_type: 'degraded',
    attempt_id: 'gate-a-unit-run',
    commitment_status: 'unavailable',
    candidate_hash: treeHashes.candidate,
    source_hash: treeHashes.phase1_control,
    opaque_custody_id: null,
    bundle_hash: null,
    custodian: null,
    retention_authority: null,
    expires_at: null,
    reason_code: 'independent_custody_boundary_unavailable',
  });
  writeJson(path.join(runDir, 'run-facts.json'), {
    schema_version: 'contract-reset-run-facts/v1',
    artifact_type: 'degraded',
    status: 'inconclusive',
    model_invoked: false,
    isolation: {
      artifact_type: 'degraded',
      status: 'inconclusive',
      primitive: null,
      probes: {},
      reason_code: 'hard_isolation_unavailable',
    },
    scheduled_session_count: sessions.length,
    attempted_sessions: [],
    completed_sessions: [],
    sessions,
    reason_codes: [
      'hard_isolation_unavailable',
      'holdout_commitment_unavailable',
      'model_outcomes_missing',
    ],
  });
  return runDir;
}

function exactPassedIsolation() {
  return {
    artifact_type: 'confirmed',
    status: 'passed',
    primitive: 'macos-sandbox-exec',
    probes: Object.fromEntries([
      'absolute',
      'parent_traversal',
      'symlink',
      'control',
      'sibling',
    ].map((name) => [name, { denied: true, code: 'EPERM' }])),
    reason_code: 'isolation_probe_passed',
  };
}

function commitHoldout(runDir) {
  const manifest = readJson(path.join(runDir, 'source-manifest.json'));
  updateJson(path.join(runDir, 'promotion-holdout-commitment.json'), (holdout) => {
    holdout.artifact_type = 'confirmed';
    holdout.commitment_status = 'committed';
    holdout.attempt_id = manifest.attempt_id;
    holdout.candidate_hash = manifest.arms.candidate.tree_hash;
    holdout.source_hash = manifest.arms.phase1_control.tree_hash;
    holdout.bundle_hash = sha256('bundle');
    holdout.opaque_custody_id = 'custody-001';
    holdout.custodian = 'independent-test-custodian';
    holdout.retention_authority = 'test-owner';
    holdout.expires_at = '2026-08-01T00:00:00.000Z';
  });
}

function writeRetainedEvidence(runDir, manifest, session, namespaceId, overrides = {}) {
  const evidenceDir = path.join(runDir, 'evidence', session.session_id);
  const retainedFiles = {
    sanitized_product_contract: 'sanitized-product-contract.md',
    blind_packet: 'blind-packet.md',
    event_log: 'events.json',
    grading_notes: 'grading-notes.json',
  };
  const contents = {
    sanitized_product_contract: Buffer.from('# Product Contract\n'),
    blind_packet: Buffer.from('# Product Contract\n'),
    event_log: Buffer.from('{"schema_version":"contract-reset-event-log/v1","events":[]}\n'),
    grading_notes: Buffer.from('{"schema_version":"contract-reset-grading-notes/v1","planning_invention":0,"interaction_waste":0,"core_product_quality":"pass"}\n'),
  };
  fs.mkdirSync(evidenceDir, { recursive: true });
  for (const [key, fileName] of Object.entries(retainedFiles)) {
    fs.writeFileSync(path.join(evidenceDir, fileName), contents[key]);
  }
  const sourceManifestBytes = fs.readFileSync(path.join(runDir, 'source-manifest.json'));
  const retained = {
    schema_version: 'contract-reset-retained-evidence/v1',
    artifact_type: 'generated',
    transformation_version: 'contract-reset-blind-transform/v1',
    producer: 'prepare-contract-reset-evidence.js',
    case_id: session.case_id,
    arm: session.arm,
    repeat: session.repeat,
    session_id: session.session_id,
    order_position: session.order_position,
    body_byte_preserved: true,
    provenance: {
      source_manifest: {
        path: 'source-manifest.json',
        sha256: sha256(sourceManifestBytes),
        run_id: manifest.run_id,
        parent_revision: manifest.parent_revision,
      },
      frozen_session: { ...session },
      namespace: {
        namespace_id: namespaceId,
        source_tree_hash: manifest.arms[session.arm].tree_hash,
        model_visible_manifest_hash: sha256('model-visible'),
      },
    },
    hashes: {
      native_output_manifest: sha256('native-output'),
      native_artifact: sha256(contents.sanitized_product_contract),
      blind_packet: sha256(contents.blind_packet),
      human_body: sha256(contents.sanitized_product_contract),
      event_log: sha256(contents.event_log),
      grading_notes: sha256(contents.grading_notes),
    },
    retained_files: retainedFiles,
    raw_cleanup_allowlist_version: 'contract-reset-raw-cleanup-allowlist/v1',
    limitations: [],
  };
  Object.assign(retained.provenance.namespace, overrides.namespace || {});
  const manifestPath = path.join(evidenceDir, 'retained-evidence-manifest.json');
  writeJson(manifestPath, retained);
  return {
    path: path.relative(runDir, manifestPath).split(path.sep).join('/'),
    sha256: sha256(fs.readFileSync(manifestPath)),
  };
}

describe('spec-prd Contract Reset eval contracts', () => {
  test('cases freeze roles, repeats, profiles, material effects, complexity budget, and no-go rules', () => {
    const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
    const report = validateContractResetCases(cases, casesPath);

    expect(report.status).toBe('passed');
    expect(report.reason_codes).toEqual([]);
    expect(cases.run_contract.repeats_per_arm).toBeGreaterThanOrEqual(3);
    expect(cases.run_contract.arms).toEqual(['baseline', 'phase1_control', 'candidate']);
    expect(cases.run_contract.tie_rule).toMatch(/no-go/i);
    expect(cases.run_contract.inconclusive_rule).toMatch(/Gate A/i);
    expect(cases.run_contract.maximum_complexity_budget).toMatchObject({
      mandatory_state_concepts: expect.any(Number),
      always_read_references: expect.any(Number),
      canonical_owners: expect.any(Number),
      hot_path_reference_reads: expect.any(Number),
    });

    const byIntent = new Map(cases.cases.map((entry) => [entry.intent, entry]));
    for (const intent of ['create', 'refine', 'validate']) {
      expect(byIntent.get(intent)).toMatchObject({
        gate_role: 'gate_a_primary',
        minimum_material_effect: {
          eliminated_load_bearing_what: expect.any(Number),
          interaction_waste_reduction: expect.any(Number),
          core_product_quality_floor: 'no-new-fail',
        },
      });
    }
    expect(cases.cases.filter((entry) => entry.gate_role === 'gate_a_critical').map((entry) => entry.intent).sort())
      .toEqual(['design', 'domain', 'stress']);
    expect(cases.cases.some((entry) => entry.gate_role === 'trigger_matrix')).toBe(true);
  });

  test('run-dir validation is report-only and marks unavailable isolation/custody inconclusive', () => {
    const runDir = createStructurallyValidRunDir();
    try {
      const before = treeSnapshot(runDir);
      const report = validateRunDirectory(runDir, { repoRoot });
      const cli = spawnSync(process.execPath, [runnerPath, '--run-dir', runDir, '--json'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const after = treeSnapshot(runDir);

      expect(report.status).toBe('passed');
      expect(report.gate_a_status).toBe('inconclusive');
      expect(report.reason_codes).toEqual(expect.arrayContaining([
        'hard_isolation_unavailable',
        'holdout_commitment_unavailable',
      ]));
      expect(cli.status).toBe(0);
      expect(JSON.parse(cli.stdout)).toMatchObject({
        status: 'passed',
        gate_a_status: 'inconclusive',
      });
      expect(after).toEqual(before);
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  test('run-dir validation fails closed for missing thresholds and stale patch hashes', () => {
    const runDir = createStructurallyValidRunDir();
    try {
      const manifestPath = path.join(runDir, 'source-manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      delete manifest.threshold_contract_hash;
      manifest.patches.candidate.sha256 = sha256('stale');
      writeJson(manifestPath, manifest);

      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('failed');
      expect(report.reason_codes).toEqual(expect.arrayContaining([
        'threshold_contract_missing',
        'patch_hash_mismatch',
      ]));
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  test.each([
    ['stale attempt binding', (holdout) => { holdout.attempt_id = 'stale-attempt'; }, 'holdout_commitment_binding_mismatch'],
    ['stale candidate binding', (holdout) => { holdout.candidate_hash = sha256('stale-candidate'); }, 'holdout_commitment_binding_mismatch'],
    ['stale source binding', (holdout) => { holdout.source_hash = sha256('stale-source'); }, 'holdout_commitment_binding_mismatch'],
    ['missing retention authority', (holdout) => { delete holdout.retention_authority; }, 'holdout_commitment_incomplete'],
    ['invalid bundle hash', (holdout) => { holdout.bundle_hash = 'bundle'; }, 'holdout_commitment_schema_invalid'],
    ['invalid expiry', (holdout) => { holdout.expires_at = 'next month'; }, 'holdout_commitment_schema_invalid'],
  ])('run-dir validation rejects committed holdout with %s', (_label, mutate, reasonCode) => {
    const runDir = createStructurallyValidRunDir();
    try {
      commitHoldout(runDir);
      updateJson(path.join(runDir, 'promotion-holdout-commitment.json'), mutate);

      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('failed');
      expect(report.structural_reason_codes).toContain(reasonCode);
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  test.each([
    ['missing frozen schedule row', (manifest) => manifest.sessions.pop(), 'session_schedule_mismatch'],
    ['wrong balanced-order arm', (manifest) => { manifest.sessions[0].arm = 'candidate'; }, 'session_schedule_mismatch'],
    ['reused opaque session id', (manifest) => { manifest.sessions[1].session_id = manifest.sessions[0].session_id; }, 'session_schedule_invalid'],
  ])('run-dir validation rejects %s', (_label, mutate, reasonCode) => {
    const runDir = createStructurallyValidRunDir();
    try {
      updateJson(path.join(runDir, 'source-manifest.json'), mutate);
      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('failed');
      expect(report.reason_codes).toContain(reasonCode);
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  test.each([
    ['run-facts schedule drift', (facts) => facts.sessions.pop(), 'run_facts_schedule_mismatch'],
    ['attempted row without arm identity', (facts) => {
      facts.attempted_sessions = [{
        ...facts.sessions[0],
        arm: undefined,
        namespace_id: 'ns-test',
        status: 'inconclusive',
        reason_code: 'test',
        model_invoked: false,
      }];
    }, 'attempted_session_invalid'],
    ['completed row outside attempted set', (facts) => {
      facts.completed_sessions = [{
        ...facts.sessions[0],
        namespace_id: 'ns-test',
        status: 'completed',
        model_invoked: true,
      }];
    }, 'completed_session_invalid'],
  ])('run-dir validation rejects %s', (_label, mutate, reasonCode) => {
    const runDir = createStructurallyValidRunDir();
    try {
      updateJson(path.join(runDir, 'run-facts.json'), mutate);
      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('failed');
      expect(report.reason_codes).toContain(reasonCode);
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  test('run-dir validation binds arm tree hashes and patch chains to materialization evidence', () => {
    const runDir = createStructurallyValidRunDir();
    try {
      updateJson(path.join(runDir, 'materialization-verification.json'), (verification) => {
        verification.arms.candidate.patch_chain = ['candidate'];
      });
      const manifestPath = path.join(runDir, 'source-manifest.json');
      updateJson(manifestPath, (manifest) => {
        manifest.materialization_verification.sha256 = sha256(
          fs.readFileSync(path.join(runDir, 'materialization-verification.json')),
        );
      });

      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('failed');
      expect(report.reason_codes).toContain('materialization_verification_invalid');
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  const symlinkTest = process.platform === 'win32' ? test.skip : test;

  symlinkTest('run-dir validation rejects a retained artifact reached through a symlink ancestor', () => {
    const runDir = createStructurallyValidRunDir();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-contract-reset-linked-'));
    try {
      const source = path.join(runDir, 'materialization-verification.json');
      const target = path.join(outside, 'materialization-verification.json');
      fs.renameSync(source, target);
      fs.symlinkSync(outside, path.join(runDir, 'linked'), 'dir');
      updateJson(path.join(runDir, 'source-manifest.json'), (manifest) => {
        manifest.materialization_verification.path = 'linked/materialization-verification.json';
      });

      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('failed');
      expect(report.reason_codes).toContain('materialization_verification_invalid');
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('passed isolation without exact real deny facts remains inconclusive', () => {
    const runDir = createStructurallyValidRunDir();
    try {
      commitHoldout(runDir);
      updateJson(path.join(runDir, 'run-facts.json'), (facts) => {
        facts.isolation = exactPassedIsolation();
        delete facts.isolation.probes.parent_traversal;
      });

      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('passed');
      expect(report.gate_a_status).toBe('inconclusive');
      expect(report.reason_codes).toContain('isolation_probe_contract_invalid');

      updateJson(path.join(runDir, 'run-facts.json'), (facts) => {
        facts.isolation = exactPassedIsolation();
        facts.isolation.probes.parent_traversal.code = 'ENOENT';
      });
      const missingTargetReport = validateRunDirectory(runDir, { repoRoot });
      expect(missingTargetReport.gate_a_status).toBe('inconclusive');
      expect(missingTargetReport.reason_codes).toContain('isolation_probe_contract_invalid');
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  test('model invocation without retained evidence remains inconclusive', () => {
    const runDir = createStructurallyValidRunDir();
    try {
      commitHoldout(runDir);
      updateJson(path.join(runDir, 'run-facts.json'), (facts) => {
        facts.model_invoked = true;
        facts.isolation = exactPassedIsolation();
        facts.reason_codes = [];
        facts.attempted_sessions = facts.sessions.map((session, index) => ({
          ...session,
          namespace_id: `ns-${String(index + 1).padStart(3, '0')}`,
          status: 'completed',
          reason_code: 'agent_completed',
          model_invoked: true,
        }));
        facts.completed_sessions = facts.attempted_sessions.map((session) => ({ ...session }));
      });

      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('passed');
      expect(report.gate_a_status).toBe('inconclusive');
      expect(report.reason_codes).toContain('retained_evidence_missing');
      expect(report.reason_codes).not.toContain('semantic_gate_decision_required');
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  test('retained evidence provenance must bind namespace and arm tree facts', () => {
    const runDir = createStructurallyValidRunDir();
    try {
      const manifest = readJson(path.join(runDir, 'source-manifest.json'));
      const session = manifest.sessions[0];
      const namespaceId = 'ns-001';
      const retainedEvidence = writeRetainedEvidence(runDir, manifest, session, namespaceId, {
        namespace: { source_tree_hash: sha256('wrong-tree') },
      });
      updateJson(path.join(runDir, 'run-facts.json'), (facts) => {
        facts.model_invoked = true;
        facts.isolation = exactPassedIsolation();
        facts.reason_codes = [];
        facts.attempted_sessions = [{
          ...session,
          namespace_id: namespaceId,
          status: 'completed',
          reason_code: 'agent_completed',
          model_invoked: true,
        }];
        facts.completed_sessions = [{
          ...facts.attempted_sessions[0],
          retained_evidence: retainedEvidence,
        }];
      });

      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('passed');
      expect(report.gate_a_status).toBe('inconclusive');
      expect(report.reason_codes).toContain('retained_evidence_invalid');
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });

  test('artifact types are required and coherent with degraded runner facts', () => {
    const runDir = createStructurallyValidRunDir();
    try {
      updateJson(path.join(runDir, 'source-manifest.json'), (manifest) => {
        delete manifest.artifact_type;
      });
      const report = validateRunDirectory(runDir, { repoRoot });
      expect(report.status).toBe('failed');
      expect(report.reason_codes).toContain('artifact_type_invalid');
    } finally {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  });
});
