'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPTS_DIR = path.join(__dirname, '..', '..', 'skills', 'spec-app-consistency-audit', 'scripts');
const {
  buildAuditReport,
  buildIssuesArtifact,
} = require(path.join(SCRIPTS_DIR, 'merge-contracts'));
const { validateArtifact } = require(path.join(SCRIPTS_DIR, 'validate-artifacts'));
const { scanSourceTree, runPreflight } = require(path.join(SCRIPTS_DIR, 'preflight'));

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), prefix));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function errorCodes(result) {
  return result.errors.map((entry) => `${entry.path}:${entry.code}`);
}

describe('app-audit evidence gate degradation path', () => {
  const tempDirs = [];

  afterAll(() => {
    for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
  });

  function stageRawIssues(issues, rejected = []) {
    const dir = makeTempDir('app-audit-gate-');
    tempDirs.push(dir);
    const rawPath = path.join(dir, 'raw-issues.json');
    writeJson(rawPath, { issues, rejected_issues: rejected });
    return { dir, rawPath };
  }

  test('evidence-less issue is rejected by the gate and the artifacts still validate', () => {
    const { dir, rawPath } = stageRawIssues([{
      id: 'ISSUE-1',
      title: 'Login button missing analytics',
      severity: 'high',
      category: 'analytics',
      expert: 'analytics-expert',
    }]);

    const issuesArtifact = buildIssuesArtifact({
      issues: [rawPath],
      issueSynthesisStatus: 'fixture_provided',
      repoRoot: dir,
    });
    expect(issuesArtifact.issues).toHaveLength(0);
    expect(issuesArtifact.rejected_issues).toHaveLength(1);
    expect(issuesArtifact.rejected_issues[0].contract_status).toBe('rejected');
    expect(issuesArtifact.rejected_issues[0].evidence_gate.reason)
      .toBe('issue_requires_evidence_or_provenance');

    const issuesResult = validateArtifact(issuesArtifact, {});
    expect(errorCodes(issuesResult)).toEqual([]);
    expect(issuesResult.valid).toBe(true);

    const issuesPath = path.join(dir, 'issues.json');
    writeJson(issuesPath, issuesArtifact);
    const report = buildAuditReport({ issues: [issuesPath], repoRoot: dir });
    expect(report.rejected_issues).toHaveLength(1);
    expect(report.summary.rejected_count).toBe(1);
    const reportResult = validateArtifact(report, {});
    expect(errorCodes(reportResult)).toEqual([]);
    expect(reportResult.valid).toBe(true);
  });

  test('accepted issues stay under strict validation', () => {
    const report = buildAuditReport({ issues: [], repoRoot: process.cwd() });
    report.issues = [{
      id: 'ISSUE-2',
      title: 'Accepted issue without evidence',
      severity: 'high',
      category: 'analytics',
      expert: 'analytics-expert',
      contract_status: 'candidate',
      data_sensitivity: 'internal',
      confidence: 0.5,
      impact: ['x'],
      recommendation: ['y'],
      static_confirmed: false,
      requires_runtime_verification: false,
      requires_real_device: false,
      provenance: [],
      evidence: {},
      related_rule_packs: [],
      runtime_verification: { required: false },
      claim_family: 'analytics_static',
      claim_type: 'missing_event',
      validation_status: 'not_required',
      review_lifecycle: [{ stage: 'normalize', action: 'accepted' }],
      affected_surface: { type: 'screen', id: 'login', file: 'app/Login.kt' },
    }];
    const codes = errorCodes(validateArtifact(report, {}));
    expect(codes).toContain('issues[0].provenance:provenance_required');
    expect(codes).toContain('issues[0].evidence:evidence_required');
  });

  test('rejected issue must still carry identity, a reason code, and redacted text', () => {
    const report = buildAuditReport({ issues: [], repoRoot: process.cwd() });
    report.rejected_issues = [{
      title: 'Rejected without reason code',
      severity: 'high',
      data_sensitivity: 'internal',
      contract_status: 'candidate',
      static_confirmed: true,
      review_lifecycle: [],
      impact: ['See https://internal.example.com/board/1 for context'],
      evidence: [{ source: 'code', file: '/Users/someone/secret/app/Login.kt' }],
    }];
    const codes = errorCodes(validateArtifact(report, {}));
    expect(codes).toContain('rejected_issues[0].evidence_gate.reason:rejected_issue_reason_code_required');
    expect(codes).toContain('rejected_issues[0].contract_status:rejected_issue_contract_status_required');
    expect(codes).toContain('rejected_issues[0].static_confirmed:rejected_issue_must_not_be_static_confirmed');
    expect(codes).toContain('rejected_issues[0].review_lifecycle:review_lifecycle_required');
    expect(codes).toContain('rejected_issues[0].impact[0]:artifact_text_not_redacted');
    expect(codes).toContain('rejected_issues[0].evidence[0].file:artifact_path_not_public');
  });

  test('review_lifecycle reason_code satisfies the rejected reason requirement', () => {
    const report = buildAuditReport({ issues: [], repoRoot: process.cwd() });
    report.rejected_issues = [{
      title: 'Rejected upstream',
      severity: 'low',
      data_sensitivity: 'internal',
      contract_status: 'rejected',
      static_confirmed: false,
      review_lifecycle: [{
        stage: 'deterministic_evidence_gate',
        action: 'preserved',
        reason_code: 'rejected_by_upstream_issues_artifact',
      }],
    }];
    expect(errorCodes(validateArtifact(report, {}))).toEqual([]);
  });
});

describe('app-audit preflight source scan facts', () => {
  const tempDirs = [];

  afterAll(() => {
    for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
  });

  function makeFixture(prefix) {
    const dir = makeTempDir(prefix);
    tempDirs.push(dir);
    return dir;
  }

  test('project signals match repo-root files that are not the first or last scanned path', () => {
    const dir = makeFixture('app-audit-signals-');
    fs.mkdirSync(path.join(dir, 'App'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'App', 'a.kt'), 'class A\n');
    fs.writeFileSync(path.join(dir, 'Package.swift'), '// swift package\n');
    fs.writeFileSync(path.join(dir, 'settings.gradle'), "include(':app')\n");
    fs.writeFileSync(path.join(dir, 'build.gradle'), 'plugins {}\n');
    fs.writeFileSync(path.join(dir, 'zz.txt'), 'z\n');

    const scan = scanSourceTree(dir, { maxFiles: 100 });
    // Guards the regression: these paths are neither the first nor the last line of the joined
    // path list, so they are only matched when the signal patterns are multiline.
    expect(scan.files.indexOf('settings.gradle')).toBeGreaterThan(0);
    expect(scan.files.indexOf('settings.gradle')).toBeLessThan(scan.files.length - 1);
    expect(scan.signals.gradle).toBe(true);
    expect(scan.signals.iosApp).toBe(true);
    expect(scan.signals.androidApp).toBe(true);
    expect(scan.signals.modularStructure).toBe(true);
  });

  test('preflight reports android platform for a repo-root gradle app', () => {
    const dir = makeFixture('app-audit-project-type-');
    fs.mkdirSync(path.join(dir, 'App'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'App', 'a.kt'), 'class A\n');
    fs.writeFileSync(path.join(dir, 'build.gradle'), 'plugins {}\n');
    fs.writeFileSync(path.join(dir, 'zz.txt'), 'z\n');

    const artifact = runPreflight({ repoRoot: dir, source: dir });
    expect(artifact.project_type).toBe('android_app');
    expect(artifact.platforms).toEqual(['android']);
  });

  test('generated and control roots are skipped so source_hash is reproducible across runs', () => {
    const dir = makeFixture('app-audit-control-roots-');
    fs.mkdirSync(path.join(dir, 'app', 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'app', 'src', 'Main.kt'), 'class Main\n');
    const controlRoots = ['.spec-first', '.claude', '.codex', '.agents', '.cursor', '.kiro', '.qoder'];
    for (const root of controlRoots) {
      fs.mkdirSync(path.join(dir, root), { recursive: true });
      fs.writeFileSync(path.join(dir, root, 'runtime.json'), '{"run":1}\n');
    }
    const runArtifact = path.join(dir, '.spec-first', 'app-audit', 'runs', 'r1', 'metadata.json');
    writeJson(runArtifact, { run_id: 'r1', started_at: '2026-07-26T00:00:00.000Z' });

    const first = scanSourceTree(dir, { maxFiles: 100 });
    expect(first.files).toEqual(['app/src/Main.kt']);
    for (const root of controlRoots) {
      expect(first.skipped_directories).toContain(root);
    }

    // A later run rewrites its own metadata under .spec-first; the source hash must not move.
    writeJson(runArtifact, { run_id: 'r2', started_at: '2026-07-26T01:00:00.000Z' });
    const second = scanSourceTree(dir, { maxFiles: 100 });
    expect(second.source_hash).toBe(first.source_hash);
    expect(second.source_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

describe('app-audit runner bound flag forwarding', () => {
  const tempDirs = [];

  afterAll(() => {
    for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
  });

  function initRepo() {
    const dir = makeTempDir('app-audit-runner-');
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, 'app', 'src'), { recursive: true });
    for (const name of ['Main.kt', 'A.kt', 'B.kt', 'C.kt']) {
      fs.writeFileSync(path.join(dir, 'app', 'src', name), `class ${name.replace('.kt', '')}\n`);
    }
    fs.writeFileSync(path.join(dir, 'settings.gradle'), "include(':app')\n");
    const git = (args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    git(['init', '-q', '.']);
    git(['config', 'user.email', 'test@example.com']);
    git(['config', 'user.name', 'test']);
    git(['config', 'commit.gpgsign', 'false']);
    git(['add', '-A']);
    const commit = git(['commit', '-qm', 'init', '--no-verify']);
    expect(commit.status).toBe(0);
    return dir;
  }

  function runAudit(dir, extraArgs) {
    return spawnSync(process.execPath, [
      path.join(SCRIPTS_DIR, 'run-audit.js'),
      'mode:headless',
      'base:HEAD',
      'run-id:flag-forwarding',
      '--source', dir,
      ...extraArgs,
    ], { cwd: dir, encoding: 'utf8' });
  }

  test('--max-files and --prd-max-bytes reach the steps that consume them', () => {
    const dir = initRepo();
    const prdPath = path.join(dir, 'PRD.md');
    fs.writeFileSync(prdPath, `# PRD\n\n${'detail line\n'.repeat(600)}`);
    expect(fs.statSync(prdPath).size).toBeGreaterThan(4096);

    const result = runAudit(dir, ['--prd', prdPath, '--max-files', '1', '--prd-max-bytes', '4096']);
    expect(result.status).toBe(0);

    const runDir = path.join(dir, '.spec-first', 'app-audit', 'runs', 'flag-forwarding');
    const metadata = JSON.parse(fs.readFileSync(path.join(runDir, 'metadata.json'), 'utf8'));
    expect(metadata.source_inputs[0].max_files).toBe(1);
    expect(metadata.source_inputs[0].source_hash_unavailable_reason).toBe('file_scan_truncated');

    const impact = JSON.parse(fs.readFileSync(path.join(runDir, 'impact-facts.json'), 'utf8'));
    const codeInput = impact.source_inputs.find((entry) => entry.type === 'code');
    expect(codeInput.max_files).toBe(1);

    const preflight = JSON.parse(fs.readFileSync(path.join(runDir, 'preflight.json'), 'utf8'));
    expect(preflight.has_prd).toBe(false);
    expect(preflight.degraded_modes.map((mode) => mode.code)).toContain('file_too_large');
  });

  test('no bound flags leaves downstream defaults untouched', () => {
    const dir = initRepo();
    const result = runAudit(dir, []);
    expect(result.status).toBe(0);
    const runDir = path.join(dir, '.spec-first', 'app-audit', 'runs', 'flag-forwarding');
    const metadata = JSON.parse(fs.readFileSync(path.join(runDir, 'metadata.json'), 'utf8'));
    expect(metadata.source_inputs[0].source_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(metadata.source_inputs[0].source_hash_unavailable_reason).toBeUndefined();
  });
});
