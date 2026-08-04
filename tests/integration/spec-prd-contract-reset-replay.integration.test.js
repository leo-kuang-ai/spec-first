'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  buildRunFacts,
  buildMaterializationVerification,
  computeTreeHash,
  materializeArmSource,
  prepareArmNamespace,
  prepareRun,
} = require('../../skills/spec-prd/evals/run-contract-reset-arm');
const {
  computeMaterializationContractHash,
  validateRunDirectory,
} = require('../../skills/spec-prd/evals/run-evals');
const {
  prepareEvidence,
  prepareRunAudit,
} = require('../../skills/spec-prd/evals/prepare-contract-reset-evidence');

const runEvalsPath = path.resolve(__dirname, '../../skills/spec-prd/evals/run-evals.js');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function write(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, 'utf8');
}

function writeJson(filePath, value) {
  write(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function toRunRelative(runRoot, filePath) {
  return path.relative(runRoot, filePath).split(path.sep).join('/');
}

function runDiff(args, options = {}) {
  const result = spawnSync('git', args, { encoding: 'utf8', ...options });
  if (![0, 1].includes(result.status)) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

describe('spec-prd Contract Reset replay', () => {
  test('another operator can reconstruct all three source arms from parent revision plus frozen patches', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-replay-repo-'));
    const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-replay-run-'));
    const sourcePath = 'skills/spec-prd/SKILL.md';
    try {
      run('git', ['init', '-q'], { cwd: repoRoot });
      run('git', ['config', 'user.email', 'replay@example.com'], { cwd: repoRoot });
      run('git', ['config', 'user.name', 'Replay Operator'], { cwd: repoRoot });
      write(path.join(repoRoot, sourcePath), 'baseline\n');
      fs.chmodSync(path.join(repoRoot, sourcePath), 0o755);
      run('git', ['add', sourcePath], { cwd: repoRoot });
      run('git', ['commit', '-qm', 'baseline'], { cwd: repoRoot });
      const parentRevision = run('git', ['rev-parse', 'HEAD'], { cwd: repoRoot }).trim();

      write(path.join(repoRoot, sourcePath), 'phase1-control\n');
      const controlPatch = run('git', ['diff', '--binary', '--', sourcePath], { cwd: repoRoot });
      write(path.join(runDir, 'control.patch'), controlPatch);
      run('git', ['add', sourcePath], { cwd: repoRoot });
      run('git', ['commit', '-qm', 'phase1 control fixture'], { cwd: repoRoot });
      write(path.join(repoRoot, sourcePath), 'contract-reset-candidate\n');
      const candidatePatch = run('git', ['diff', '--binary', '--', sourcePath], { cwd: repoRoot });
      write(path.join(runDir, 'candidate.patch'), candidatePatch);

      const baselineDir = path.join(runDir, 'expected-baseline');
      const controlDir = path.join(runDir, 'expected-control');
      const candidateDir = path.join(runDir, 'expected-candidate');
      write(path.join(baselineDir, sourcePath), 'baseline\n');
      write(path.join(controlDir, sourcePath), 'phase1-control\n');
      write(path.join(candidateDir, sourcePath), 'contract-reset-candidate\n');
      for (const root of [baselineDir, controlDir, candidateDir]) {
        fs.chmodSync(path.join(root, sourcePath), 0o755);
      }
      const manifest = {
        schema_version: 'contract-reset-source-manifest/v1',
        run_id: 'replay-integration',
        parent_revision: parentRevision,
        patches: {
          phase1_control: { path: 'control.patch', sha256: sha256(controlPatch) },
          candidate: { path: 'candidate.patch', sha256: sha256(candidatePatch) },
        },
        source_files: [{ path: sourcePath, tracked: true }],
        invocation_profile: {
          host: 'test-host',
          model: 'test-model',
          agent_type: 'fresh-generic-agent',
          context_reuse: 'forbidden',
          tool_posture: 'sandbox-root-only',
        },
        sessions: [{
          case_id: 'replay-case',
          arm: 'candidate',
          repeat: 1,
          order_position: 3,
          session_id: '08e19e3f-7326-4a3c-92e9-5ed8d95940c0',
        }],
        arms: {
          baseline: { patch_chain: [], tree_hash: computeTreeHash(baselineDir, [sourcePath]) },
          phase1_control: { patch_chain: ['phase1_control'], tree_hash: computeTreeHash(controlDir, [sourcePath]) },
          candidate: { patch_chain: ['phase1_control', 'candidate'], tree_hash: computeTreeHash(candidateDir, [sourcePath]) },
        },
      };
      writeJson(path.join(runDir, 'source-manifest.json'), manifest);

      const armReports = [];
      for (const arm of ['baseline', 'phase1_control', 'candidate']) {
        const destination = path.join(runDir, 'replayed', arm);
        const result = materializeArmSource({ repoRoot, runDir, manifest, arm, destination });
        armReports.push(result);
        expect(result.status).toBe('materialized');
        expect(result.tree_hash).toBe(manifest.arms[arm].tree_hash);
      }
      expect(fs.readFileSync(path.join(runDir, 'replayed/baseline', sourcePath), 'utf8')).toBe('baseline\n');
      expect(fs.readFileSync(path.join(runDir, 'replayed/phase1_control', sourcePath), 'utf8')).toBe('phase1-control\n');
      expect(fs.readFileSync(path.join(runDir, 'replayed/candidate', sourcePath), 'utf8')).toBe('contract-reset-candidate\n');
      for (const arm of ['baseline', 'phase1_control', 'candidate']) {
        expect(fs.statSync(path.join(runDir, 'replayed', arm, sourcePath)).mode & 0o777).toBe(0o755);
      }

      const materializationVerification = buildMaterializationVerification({ manifest, armReports });
      expect(materializationVerification).toMatchObject({
        schema_version: 'contract-reset-materialization-verification/v1',
        artifact_type: 'confirmed',
        parent_revision: parentRevision,
        contract_hash: computeMaterializationContractHash(manifest),
        arms: {
          baseline: { patch_chain: [], tree_hash: manifest.arms.baseline.tree_hash },
          phase1_control: {
            patch_chain: ['phase1_control'],
            tree_hash: manifest.arms.phase1_control.tree_hash,
          },
          candidate: {
            patch_chain: ['phase1_control', 'candidate'],
            tree_hash: manifest.arms.candidate.tree_hash,
          },
        },
      });

      const prepared = prepareArmNamespace({
        repoRoot,
        runDir,
        manifest,
        cases: {
          cases: [{
            id: 'replay-case',
            intent: 'create',
            authority_profile: ['test owner'],
            review_focus: ['trace'],
            inputs: [{ path: 'request.md', content: 'safe brownfield request' }],
          }],
        },
        caseId: 'replay-case',
        arm: 'candidate',
        repeat: 1,
        orderPosition: 3,
        sessionId: '08e19e3f-7326-4a3c-92e9-5ed8d95940c0',
      });
      const modelVisible = fs.readFileSync(
        path.join(prepared.namespace_root, 'model-visible-manifest.json'),
        'utf8',
      );
      expect(path.basename(prepared.namespace_root)).toMatch(/^ns-[a-f0-9]{20}$/);
      expect(modelVisible).not.toMatch(/"arm"\s*:|version_mapping|owner_answer_oracle|grading_notes|holdout_bundle/i);
      expect(JSON.parse(modelVisible)).toMatchObject({
        case_id: 'replay-case',
        intent: 'create',
        session_id: '08e19e3f-7326-4a3c-92e9-5ed8d95940c0',
        inputs: [{ path: 'inputs/request.md', sha256: expect.stringMatching(/^sha256:/) }],
      });
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  }, 30000);

  test('materialization rejects secret paths and workspace-external symlinks before copying bytes', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-replay-deny-repo-'));
    const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-replay-deny-run-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-replay-deny-outside-'));
    try {
      run('git', ['init', '-q'], { cwd: repoRoot });
      run('git', ['config', 'user.email', 'replay@example.com'], { cwd: repoRoot });
      run('git', ['config', 'user.name', 'Replay Operator'], { cwd: repoRoot });
      write(path.join(repoRoot, '.env'), 'SECRET=value\n');
      write(path.join(outside, 'outside.md'), 'outside\n');
      fs.symlinkSync(path.join(outside, 'outside.md'), path.join(repoRoot, 'outside-link.md'));
      run('git', ['add', '.env', 'outside-link.md'], { cwd: repoRoot });
      run('git', ['commit', '-qm', 'unsafe fixture'], { cwd: repoRoot });
      const parentRevision = run('git', ['rev-parse', 'HEAD'], { cwd: repoRoot }).trim();

      for (const unsafePath of ['.env', 'outside-link.md']) {
        const manifest = {
          schema_version: 'contract-reset-source-manifest/v1',
          run_id: 'unsafe-replay',
          parent_revision: parentRevision,
          patches: {},
          source_files: [{ path: unsafePath, tracked: true }],
          arms: { baseline: { patch_chain: [], tree_hash: sha256('unused') } },
        };
        const destination = path.join(runDir, unsafePath.replace(/[^a-z0-9]/gi, '-'));
        expect(() => materializeArmSource({ repoRoot, runDir, manifest, arm: 'baseline', destination }))
          .toThrow(/secret-denied|symlink/i);
        expect(fs.existsSync(destination)).toBe(false);
      }
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
      fs.rmSync(runDir, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('durable run audit retains every artifact required for independent validation', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-audit-repo-'));
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-audit-run-'));
    const runDir = path.join(parent, 'attempt');
    const candidatePatchPath = path.join(parent, 'candidate.patch');
    const sourcePath = 'skills/spec-prd/SKILL.md';
    const candidatePath = 'skills/spec-prd/references/product-contract-authoring.md';
    const casesRelativePath = 'skills/spec-prd/evals/contract-reset-cases.json';
    try {
      run('git', ['init', '-q'], { cwd: repoRoot });
      run('git', ['config', 'user.email', 'replay@example.com'], { cwd: repoRoot });
      run('git', ['config', 'user.name', 'Replay Operator'], { cwd: repoRoot });
      write(path.join(repoRoot, sourcePath), 'baseline\n');
      write(
        path.join(repoRoot, casesRelativePath),
        fs.readFileSync(path.resolve(__dirname, '../../skills/spec-prd/evals/contract-reset-cases.json'), 'utf8'),
      );
      run('git', ['add', sourcePath, casesRelativePath], { cwd: repoRoot });
      run('git', ['commit', '-qm', 'baseline'], { cwd: repoRoot });

      write(path.join(repoRoot, sourcePath), 'phase1-control\n');
      write(path.join(repoRoot, candidatePath), 'candidate-only\n');
      write(
        candidatePatchPath,
        runDiff(['diff', '--binary', '--no-index', '--', '/dev/null', candidatePath], { cwd: repoRoot }),
      );

      prepareRun({
        repoRoot,
        runDir,
        casesPath: path.join(repoRoot, casesRelativePath),
        candidatePatchPath,
        sourcePaths: [sourcePath],
        runId: 'audit-integration',
        attemptId: 'gate-a-audit-integration',
      });
      const manifest = JSON.parse(fs.readFileSync(path.join(runDir, 'source-manifest.json'), 'utf8'));
      const cases = JSON.parse(fs.readFileSync(path.join(repoRoot, casesRelativePath), 'utf8'));
      const session = manifest.sessions.find((entry) => entry.arm === 'candidate');
      const namespace = prepareArmNamespace({
        repoRoot,
        runDir,
        manifest,
        cases,
        caseId: session.case_id,
        arm: session.arm,
        repeat: session.repeat,
        orderPosition: session.order_position,
        sessionId: session.session_id,
      });
      const outputRoot = path.join(namespace.namespace_root, 'output');
      const artifactPath = path.join(outputRoot, 'product-contract.md');
      const eventLogPath = path.join(outputRoot, 'events.json');
      const gradingNotesPath = path.join(outputRoot, 'grading-notes.json');
      write(artifactPath, '# Product Contract\n\nDurable audit fixture.\n');
      writeJson(eventLogPath, {
        schema_version: 'contract-reset-event-log/v1',
        events: [{ type: 'action', id: 'A1', material: true, outcome: 'completed' }],
      });
      writeJson(gradingNotesPath, {
        schema_version: 'contract-reset-grading-notes/v1',
        planning_invention: 0,
        interaction_waste: 0,
        core_product_quality: 'pass',
      });
      const nativeManifestPath = path.join(outputRoot, 'native-output.json');
      writeJson(nativeManifestPath, {
        schema_version: 'contract-reset-native-output/v1',
        case_id: session.case_id,
        arm: session.arm,
        repeat: session.repeat,
        session_id: session.session_id,
        order_position: session.order_position,
        namespace_id: namespace.namespace_id,
        source_tree_hash: namespace.source_tree_hash,
        model_visible_manifest_hash: namespace.model_visible_manifest_hash,
        artifact_path: toRunRelative(runDir, artifactPath),
        event_log_path: toRunRelative(runDir, eventLogPath),
        grading_notes_path: toRunRelative(runDir, gradingNotesPath),
        output_hashes: {
          artifact: sha256(fs.readFileSync(artifactPath)),
          event_log: sha256(fs.readFileSync(eventLogPath)),
          grading_notes: sha256(fs.readFileSync(gradingNotesPath)),
        },
        pii_attestation: {
          status: 'passed',
          reviewer: 'independent-audit-test',
        },
        raw_cleanup_paths: [],
      });
      const evidenceDir = path.join(runDir, 'evidence', session.session_id);
      prepareEvidence({
        runRoot: runDir,
        nativeManifestPath,
        outDir: evidenceDir,
        cleanup: false,
      });
      const retainedManifestPath = path.join(evidenceDir, 'retained-evidence-manifest.json');
      const armReport = {
        status: 'completed',
        reason_code: 'agent_completed',
        model_invoked: true,
        namespace,
        retained_evidence: {
          path: toRunRelative(runDir, retainedManifestPath),
          sha256: sha256(fs.readFileSync(retainedManifestPath)),
        },
      };
      writeJson(path.join(runDir, 'run-facts.json'), buildRunFacts(manifest, [armReport]));

      const auditDir = path.join(runDir, 'durable-audit');
      const result = prepareRunAudit({ runRoot: runDir, outDir: auditDir, repoRoot, cleanup: false });
      const auditManifest = JSON.parse(
        fs.readFileSync(path.join(auditDir, 'run-audit-manifest.json'), 'utf8'),
      );

      expect(result).toMatchObject({
        status: 'prepared',
        gate_a_status: 'inconclusive',
        retained_file_count: 12,
      });
      expect(fs.existsSync(path.join(auditDir, 'materialization-verification.json'))).toBe(true);
      for (const name of [
        'retained-evidence-manifest.json',
        'sanitized-product-contract.md',
        'blind-packet.md',
        'events.json',
        'grading-notes.json',
      ]) {
        expect(fs.existsSync(path.join(auditDir, 'evidence', session.session_id, name))).toBe(true);
      }
      expect(auditManifest.artifact_type).toBe('generated');
      expect(auditManifest.retained_files[toRunRelative(runDir, retainedManifestPath)])
        .toMatchObject({ artifact_type: 'generated', sha256: expect.stringMatching(/^sha256:/) });
      expect(auditManifest.retained_files[
        `evidence/${session.session_id}/grading-notes.json`
      ]).toMatchObject({ artifact_type: 'advisory', sha256: expect.stringMatching(/^sha256:/) });
      expect(validateRunDirectory(auditDir, { repoRoot, requireRunAudit: true })).toMatchObject({
        status: 'passed',
        gate_a_status: 'inconclusive',
      });
      const cliPassed = spawnSync(process.execPath, [
        runEvalsPath,
        '--run-dir',
        auditDir,
        '--require-run-audit',
        '--json',
      ], { cwd: repoRoot, encoding: 'utf8' });
      expect(cliPassed.status).toBe(0);
      expect(JSON.parse(cliPassed.stdout)).toMatchObject({
        status: 'passed',
        gate_a_status: 'inconclusive',
      });
      fs.rmSync(path.join(auditDir, 'run-audit-manifest.json'));
      expect(validateRunDirectory(auditDir, { repoRoot, requireRunAudit: true })).toMatchObject({
        status: 'failed',
        structural_reason_codes: expect.arrayContaining(['run_audit_manifest_missing']),
      });
      const cliFailed = spawnSync(process.execPath, [
        runEvalsPath,
        '--run-dir',
        auditDir,
        '--require-run-audit',
        '--json',
      ], { cwd: repoRoot, encoding: 'utf8' });
      expect(cliFailed.status).toBe(1);
      expect(JSON.parse(cliFailed.stdout)).toMatchObject({
        status: 'failed',
        structural_reason_codes: expect.arrayContaining(['run_audit_manifest_missing']),
      });
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
      fs.rmSync(parent, { recursive: true, force: true });
    }
  }, 30000);
});
