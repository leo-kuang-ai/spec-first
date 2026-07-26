'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  writeVerificationRunSummary,
} = require('../../src/cli/helpers/verification-run-summary');

const REPO_ROOT = path.join(__dirname, '..', '..');
const ARTIFACT_SCHEMA_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'workflows', 'spec-work-run-artifact.schema.json');
const LOG_SCAN_CHUNK_BYTES = 64 * 1024;
const tempDirs = [];

function makeRepo(prefix) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(repo);
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Spec First Test'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'spec-first-test@example.invalid'], { cwd: repo });
  return repo;
}

function slugify(value) {
  return String(value || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

function writeLog(repo, runId, contents, fileName = 'typecheck.log') {
  const logRef = `.spec-first/workflows/spec-work/${slugify(path.basename(repo))}/${runId}/logs/${fileName}`;
  const absolutePath = path.join(repo, logRef);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
  return { logRef, absolutePath };
}

function runSummaryInput(repo, logRef) {
  const inputPath = path.join(repo, 'run-summary-input.json');
  fs.writeFileSync(inputPath, `${JSON.stringify({
    profile: { source: 'explicit', name: 'default', path: 'spec-first.verification.json' },
    checks: [
      {
        id: 'typecheck',
        service: 'spec-first',
        command: 'npm run typecheck',
        status: 'passed',
        exit_code: 0,
        ran: true,
        required_tools: ['node', 'npm'],
        missing_tools: [],
        log_path: logRef,
        reason_code: 'exit-code-zero',
        redaction_status: 'none-required',
      },
    ],
  }, null, 2)}\n`);
  return inputPath;
}

// Windows 无法在 posix CI 上直接验证,所以用子进程 + path facade 模拟:facade 让相对路径的
// join/relative/sep 走 win32 语义(反斜杠),绝对路径保持 posix 语义,这样 /tmp fixture 的真实
// 文件 IO 仍可用。注入必须在子进程里做——facade 依赖 Module._load,Jest 自有 module registry
// 不走这条路径;而且 posix 上 require('path') === path.posix,进程内改写会连带污染 path.posix。
const WIN32_PROBE = String.raw`
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const repoRoot = process.argv[2];
const targetRepo = process.argv[3];
const runId = process.argv[4];
const artifactModule = path.join(repoRoot, 'src', 'cli', 'helpers', 'spec-work-run-artifact.js');
const summaryModule = path.join(repoRoot, 'src', 'cli', 'helpers', 'verification-run-summary.js');

const facade = Object.assign(Object.create(null), path, {
  sep: '\\',
  join: (...parts) => (path.isAbsolute(parts[0] || '') ? path.join(...parts) : path.win32.join(...parts)),
  relative: (from, to) => path.relative(from, to).split('/').join('\\'),
  posix: path.posix,
  win32: path.win32,
});

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if ((request === 'node:path' || request === 'path') && parent
    && (parent.filename === artifactModule || parent.filename === summaryModule)) {
    return facade;
  }
  return originalLoad.call(this, request, parent, isMain);
};
const artifactHelper = require(artifactModule);
const summaryHelper = require(summaryModule);
Module._load = originalLoad;

const slug = path.basename(targetRepo).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
const base = '.spec-first/workflows/spec-work/' + slug + '/' + runId;

const record = summaryHelper.writeVerificationRunSummary({
  inputPath: path.join(targetRepo, 'run-summary-input.json'),
  runId,
  targetRepo,
});
const readBack = summaryHelper.readVerificationRunSummary({
  targetRepo,
  runSummaryRef: record.output.run_summary_ref,
});

const payload = {
  schema_version: 'spec-work-run-artifact-payload/v2',
  workflow: 'spec-work',
  mode: 'interactive',
  plan_path: 'docs/plans/example-plan.md',
  plan_source: 'explicit',
  task_pack_path: 'docs/tasks/example-tasks.md',
  source_refs: ['docs/plans/example-plan.md'],
  script_confirmed: {
    validation: {
      status: 'passed',
      reason_code: 'run-summary-recorded',
      run_summary_ref: record.output.run_summary_ref,
    },
    changed_files: ['src/cli/helpers/spec-work-run-artifact.js'],
    artifact_refs: [base + '/run.json'],
    raw_log_ref: {
      kind: 'none',
      display_ref: '',
      secret_stripped: true,
      redaction_status: 'none-required',
      retention_status: 'lifecycle-deferred',
      access_boundary: 'none',
      reason_code: 'no-raw-log',
    },
    resume_evidence: { status: 'not-run', reason_code: 'first-write' },
  },
  llm_asserted: {
    summary: 'Work completed.',
    read_artifacts: ['docs/plans/example-plan.md'],
    key_decisions: ['Keep repo-relative refs POSIX.'],
    deferred_follow_up: [],
    next_action: 'Run review.',
  },
  provider_untrusted: { readiness_status: 'degraded', summaries: ['external evidence was limited'] },
  retention: {
    retention_status: 'lifecycle-deferred',
    artifact_category: 'spec-work-run-evidence',
    raw_log_retention_impact: 'none',
    redaction_status: 'none-required',
  },
};
const payloadPath = path.join(targetRepo, 'run-artifact-payload.json');
fs.writeFileSync(payloadPath, JSON.stringify(payload));
const write = artifactHelper.writeSpecWorkRunArtifact({ inputPath: payloadPath, runId, targetRepo });
const absoluteArtifact = path.join(targetRepo, base, 'run.json');
const read = artifactHelper.readSpecWorkRunArtifact({ targetRepo, workspaceSlug: slug, runId });
const prune = artifactHelper.pruneSpecWorkRunArtifacts({ targetRepo, dryRun: true, retentionDays: 0 });

process.stdout.write(JSON.stringify({
  simulation_live: facade.join('.spec-first', 'a', 'b.json'),
  simulation_sep: facade.sep,
  expected_base: base,
  record: {
    status: record.output.status,
    reason_code: record.output.reason_code,
    run_summary_ref: record.output.run_summary_ref,
  },
  read_back: { exit_code: readBack.exitCode, reason_code: readBack.output.reason_code },
  write: {
    exit_code: write.exitCode,
    status: write.output.status,
    reason_code: write.output.reason_code,
    errors: write.output.errors || [],
    artifact_path: write.output.artifact_path,
  },
  artifact_exists: fs.existsSync(absoluteArtifact),
  on_disk_artifact_path: fs.existsSync(absoluteArtifact)
    ? JSON.parse(fs.readFileSync(absoluteArtifact, 'utf8')).artifact_path
    : null,
  read: { exit_code: read.exitCode, status: read.output.status, artifact_path: read.output.artifact_path },
  prune_refs: [...prune.output.removed, ...prune.output.retained].map((entry) => entry.artifact_path),
}));
`;

function runWin32Probe(repo, runId) {
  const scriptPath = path.join(repo, 'win32-ref-probe.js');
  fs.writeFileSync(scriptPath, WIN32_PROBE);
  const stdout = execFileSync(process.execPath, [scriptPath, REPO_ROOT, repo, runId], { encoding: 'utf8' });
  return JSON.parse(stdout);
}

describe('repo-relative refs stay POSIX on Windows', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('run summary and run artifact refs round-trip under simulated win32 separators', () => {
    const repo = makeRepo('windows-refs-roundtrip-');
    const runId = 'run-1';
    const { logRef } = writeLog(repo, runId, 'ok\n');
    runSummaryInput(repo, logRef);

    const probe = runWin32Probe(repo, runId);

    // 先证明模拟真的生效,否则后面的断言会变成空断言。
    expect(probe.simulation_sep).toBe('\\');
    expect(probe.simulation_live).toBe('.spec-first\\a\\b.json');

    expect(probe.record.status).toBe('written');
    expect(probe.record.run_summary_ref).toBe(`${probe.expected_base}/verification-run-summary.json`);
    expect(probe.record.run_summary_ref).not.toMatch(/\\/);

    // 写侧产物必须能被读侧直接接受,形成 record -> read 闭环。
    expect(probe.read_back.exit_code).toBe(0);
    expect(probe.read_back.reason_code).toBe('read');

    expect(probe.write.errors).toEqual([]);
    expect(probe.write.reason_code).toBe('written');
    expect(probe.write.exit_code).toBe(0);
    expect(probe.artifact_exists).toBe(true);
    expect(probe.write.artifact_path).toBe(`${probe.expected_base}/run.json`);
    expect(probe.on_disk_artifact_path).toBe(`${probe.expected_base}/run.json`);

    expect(probe.read.exit_code).toBe(0);
    expect(probe.read.status).toBe('read');
    expect(probe.read.artifact_path).not.toMatch(/\\/);
    expect(probe.prune_refs.length).toBeGreaterThan(0);
    for (const ref of probe.prune_refs) expect(ref).not.toMatch(/\\/);
  });

  test('artifact_path emitted under simulated win32 still matches the schema pattern', () => {
    const repo = makeRepo('windows-refs-schema-');
    const runId = 'run-2';
    const { logRef } = writeLog(repo, runId, 'ok\n');
    runSummaryInput(repo, logRef);

    const probe = runWin32Probe(repo, runId);
    const schema = JSON.parse(fs.readFileSync(ARTIFACT_SCHEMA_PATH, 'utf8'));
    const pattern = new RegExp(schema.properties.artifact_path.pattern);

    expect(pattern.test(probe.on_disk_artifact_path)).toBe(true);
  });
});

describe('log secret scan degrades structurally and covers the whole file', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  const canDropReadPermission = process.platform !== 'win32'
    && !(typeof process.getuid === 'function' && process.getuid() === 0);
  const maybeTest = canDropReadPermission ? test : test.skip;

  maybeTest('unreadable log yields a structured rejection instead of an uncaught error', () => {
    const repo = makeRepo('windows-refs-eacces-');
    const runId = 'run-3';
    const { logRef, absolutePath } = writeLog(repo, runId, 'ok\n');
    const inputPath = runSummaryInput(repo, logRef);
    fs.chmodSync(absolutePath, 0o000);

    let result;
    try {
      result = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });
    } finally {
      fs.chmodSync(absolutePath, 0o644);
    }

    expect(result.exitCode).toBe(1);
    expect(result.output.status).toBe('rejected');
    expect(result.output.reason_code).toBe('path-rejected');
    expect(result.output.errors.join('\n')).toContain('checks[0].log_path cannot be inspected');
    expect(fs.existsSync(path.join(repo, path.dirname(logRef), '..', 'verification-run-summary.json'))).toBe(false);
  });

  test('secret past the first scan chunk is still rejected', () => {
    const repo = makeRepo('windows-refs-late-secret-');
    const runId = 'run-4';
    const { logRef } = writeLog(repo, runId, `${'x'.repeat(LOG_SCAN_CHUNK_BYTES + 6 * 1024)}\nAuthorization: Bearer sk-live-DEADBEEF\n`);
    const inputPath = runSummaryInput(repo, logRef);

    const result = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });

    expect(result.exitCode).toBe(1);
    expect(result.output.reason_code).toBe('security-rejected');
    expect(result.output.errors.join('\n')).toContain('contains secret-like content: secret-like-value');
  });

  test('secret straddling a scan chunk boundary is still rejected', () => {
    const repo = makeRepo('windows-refs-straddle-secret-');
    const runId = 'run-5';
    const secret = 'Authorization: Bearer sk-live-DEADBEEF';
    const { logRef } = writeLog(repo, runId, `${'x'.repeat(LOG_SCAN_CHUNK_BYTES - 10)}${secret}\n`);
    const inputPath = runSummaryInput(repo, logRef);

    const result = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });

    expect(result.exitCode).toBe(1);
    expect(result.output.reason_code).toBe('security-rejected');
  });

  test('an unbounded credential-bearing URL candidate cannot outrun the chunk carry window', () => {
    const repo = makeRepo('windows-refs-long-url-secret-');
    const runId = 'run-5b';
    const adversarialUrl = `https://${'x'.repeat(LOG_SCAN_CHUNK_BYTES + 6 * 1024)}:secret@host`;
    const { logRef } = writeLog(repo, runId, `${adversarialUrl}\n`);
    const inputPath = runSummaryInput(repo, logRef);

    const result = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });

    expect(result.exitCode).toBe(1);
    expect(result.output.reason_code).toBe('security-rejected');
    expect(result.output.errors.join('\n')).toMatch(/credential-bearing-url|unterminated-secret-candidate/);
  });

  test('clean multi-chunk log is still accepted', () => {
    const repo = makeRepo('windows-refs-clean-large-');
    const runId = 'run-6';
    const { logRef } = writeLog(repo, runId, `${'compiled ok\n'.repeat(20 * 1024)}`);
    const inputPath = runSummaryInput(repo, logRef);

    const result = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });

    expect(result.exitCode).toBe(0);
    expect(result.output.status).toBe('written');
    expect(result.output.run_summary_ref).not.toMatch(/\\/);
  });
});
