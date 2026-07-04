#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PACKAGE_CONTENT_MANIFEST_FILE = 'package-content-manifest.json';
const INIT_CLAUDE_PROGRAMMATIC_LOG_FILE = 'init-claude-programmatic.log';
const INIT_CODEX_PROGRAMMATIC_LOG_FILE = 'init-codex-programmatic.log';
const INIT_KIRO_PROGRAMMATIC_LOG_FILE = 'init-kiro-programmatic.log';
const INIT_QODER_PROGRAMMATIC_LOG_FILE = 'init-qoder-programmatic.log';
const RELEASE_ARTIFACT_SUMMARY_FILE = 'release-artifact-summary.json';
const SUMMARY_FILE = 'summary.json';
const PACK_OUTPUT_FILE = 'pack-output.log';
const INIT_PROGRAMMATIC_HOSTS = ['claude', 'codex', 'kiro', 'qoder'];
const INIT_PROGRAMMATIC_LOG_FILES = {
  claude: INIT_CLAUDE_PROGRAMMATIC_LOG_FILE,
  codex: INIT_CODEX_PROGRAMMATIC_LOG_FILE,
  kiro: INIT_KIRO_PROGRAMMATIC_LOG_FILE,
  qoder: INIT_QODER_PROGRAMMATIC_LOG_FILE,
};

const REQUIRED_PACKAGE_PATHS = [
  'bin/spec-first.js',
  'src/cli/index.js',
  'skills/spec-work/SKILL.md',
  'skills/spec-plan/SKILL.md',
  'scripts/npm-install-matrix-smoke.js',
  'templates/claude/commands/spec/work.md',
  'docs/contracts/knowledge/knowledge-harness.md',
  'README.md',
];

const FORBIDDEN_PACKAGE_PATTERNS = [
  { pattern: '.claude-plugin/', kind: 'prefix' },
  { pattern: '.claude/', kind: 'prefix' },
  { pattern: '.codex/', kind: 'prefix' },
  { pattern: '.agents/skills/', kind: 'prefix' },
  { pattern: 'vendor/', kind: 'prefix' },
  { pattern: '__pycache__/', kind: 'segment' },
  { pattern: '.pyc', kind: 'suffix' },
  { pattern: '.pyo', kind: 'suffix' },
];

function uniqueExistingPaths(paths) {
  return [...new Set(paths.filter(Boolean))];
}

function selectPathApi(filePath) {
  return /^[a-zA-Z]:[\\/]/.test(String(filePath)) || String(filePath).includes('\\')
    ? path.win32
    : path;
}

function getEnvValue(env, name) {
  if (!env || typeof env !== 'object') return '';
  if (Object.prototype.hasOwnProperty.call(env, name)) return env[name] || '';
  const lowerName = name.toLowerCase();
  const matchedKey = Object.keys(env).find((key) => key.toLowerCase() === lowerName);
  return matchedKey ? env[matchedKey] || '' : '';
}

function resolveNpmCliPath(options = {}) {
  const env = options.env || process.env;
  const execPath = options.execPath || process.execPath;
  const existsSync = options.existsSync || fs.existsSync;
  const pathApi = selectPathApi(execPath);
  const nodeDir = pathApi.dirname(execPath);
  const candidates = uniqueExistingPaths([
    getEnvValue(env, 'npm_execpath'),
    pathApi.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    pathApi.join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    pathApi.join(nodeDir, '..', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ]);

  return candidates.find((candidate) => existsSync(candidate)) || '';
}

function runChild(command, args, options = {}) {
  const result = runChildResult(command, args, options);
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    const error = new Error(`${command} ${args.join(' ')} failed with status ${result.status}`);
    error.status = result.status || 1;
    throw error;
  }
  return result.stdout || '';
}

function runChildResult(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    encoding: options.encoding || 'utf8',
    env: options.env || process.env,
    input: options.input,
    shell: false,
    stdio: options.stdio || 'pipe',
    windowsHide: true,
  });
}

function runNpm(args, options = {}) {
  const npmCliPath = resolveNpmCliPath(options);
  if (!npmCliPath) {
    throw new Error('Unable to locate npm CLI JavaScript entrypoint for non-shell execution.');
  }
  return runChild(process.execPath, [npmCliPath, ...args], options);
}

function runGit(args, options = {}) {
  return runChild('git', args, {
    ...options,
    stdio: options.stdio || 'inherit',
  });
}

function quoteCmdArg(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildCmdCommandLine(command, args) {
  return ['call', command, ...args].map((part, index) => (
    index === 0 ? part : quoteCmdArg(part)
  )).join(' ');
}

function runWindowsCmdShim(shim, args, options = {}) {
  const comspec = getEnvValue(options.env || process.env, 'ComSpec') || 'cmd.exe';
  return runChild(comspec, ['/d', '/c', buildCmdCommandLine(shim, args)], {
    ...options,
    stdio: options.stdio || 'inherit',
  });
}

function runInstalledShim(shim, args, options = {}) {
  if (process.platform === 'win32') {
    return runWindowsCmdShim(shim, args, options);
  }
  return runChild(shim, args, {
    ...options,
    stdio: options.stdio || 'inherit',
  });
}

function runInstalledBin(packageRoot, args, options = {}) {
  const binPath = path.join(packageRoot, 'bin', 'spec-first.js');
  return runChild(process.execPath, [binPath, ...args], {
    ...options,
    stdio: options.stdio || 'inherit',
  });
}

function runInstalledBinResult(packageRoot, args, options = {}) {
  const binPath = path.join(packageRoot, 'bin', 'spec-first.js');
  return runChildResult(process.execPath, [binPath, ...args], options);
}

function createArtifactWriter() {
  const configuredDir = process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR;
  if (!configuredDir) {
    return {
      dir: '',
      write() {},
    };
  }

  const dir = path.resolve(configuredDir);
  fs.mkdirSync(dir, { recursive: true });

  return {
    dir,
    write(name, content) {
      const filePath = path.join(dir, normalizeArtifactFileName(name));
      const body = typeof content === 'string'
        ? content
        : `${JSON.stringify(content, null, 2)}\n`;
      fs.writeFileSync(filePath, body, 'utf8');
    },
  };
}

function normalizeArtifactFileName(name) {
  const value = String(name || '');
  if (
    !value ||
    value === '.' ||
    value === '..' ||
    value !== path.basename(value) ||
    value !== path.win32.basename(value) ||
    /[<>:"|?*\0]/.test(value)
  ) {
    throw new Error(`Unsafe smoke artifact file name: ${value || '<empty>'}`);
  }
  return value;
}

function normalizePackagePath(filePath) {
  const value = String(filePath || '').replace(/\\/g, '/').replace(/^package\//, '');
  if (
    !value ||
    value.startsWith('/') ||
    /^[a-zA-Z]:\//.test(value) ||
    value.split('/').some((segment) => segment === '..' || segment === '')
  ) {
    throw new Error(`Unsafe package content path: ${filePath || '<empty>'}`);
  }
  return value;
}

function matchesForbiddenPattern(filePath, rule) {
  if (rule.kind === 'prefix') return filePath === rule.pattern.slice(0, -1) || filePath.startsWith(rule.pattern);
  if (rule.kind === 'suffix') return filePath.endsWith(rule.pattern);
  if (rule.kind === 'segment') return filePath.includes(`/${rule.pattern}`) || filePath.startsWith(rule.pattern);
  return false;
}

function parseNpmPackJson(packJsonOutput) {
  const parsed = JSON.parse(packJsonOutput);
  if (!Array.isArray(parsed) || !parsed[0] || typeof parsed[0] !== 'object') {
    throw new Error('npm pack --dry-run --json returned an unexpected payload.');
  }
  return parsed[0];
}

function buildPackageContentManifest(packJsonOutput, options = {}) {
  const packResult = typeof packJsonOutput === 'string'
    ? parseNpmPackJson(packJsonOutput)
    : packJsonOutput;
  const requiredPaths = options.requiredPaths || REQUIRED_PACKAGE_PATHS;
  const forbiddenPatterns = options.forbiddenPatterns || FORBIDDEN_PACKAGE_PATTERNS;
  const files = (packResult.files || [])
    .map((file) => ({
      path: normalizePackagePath(file.path),
      size: Number.isFinite(file.size) ? file.size : 0,
      mode: Number.isFinite(file.mode) ? file.mode : 0,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const filePathSet = new Set(files.map((file) => file.path));
  const required = requiredPaths.map((requiredPath) => ({
    path: requiredPath,
    present: filePathSet.has(requiredPath),
  }));
  const forbidden = forbiddenPatterns.map((rule) => ({
    pattern: rule.pattern,
    matches: files
      .filter((file) => matchesForbiddenPattern(file.path, rule))
      .map((file) => file.path),
  }));
  const checks = [
    ...required.map((item) => ({
      check_id: `required:${item.path}`,
      passed: item.present,
      reason_code: item.present ? 'required-package-path-present' : 'required-package-path-missing',
      paths: [item.path],
    })),
    ...forbidden.map((item) => ({
      check_id: `forbidden:${item.pattern}`,
      passed: item.matches.length === 0,
      reason_code: item.matches.length === 0 ? 'forbidden-package-path-absent' : 'forbidden-package-path-present',
      paths: item.matches,
    })),
  ];
  const failures = checks
    .filter((check) => !check.passed)
    .map((check) => ({
      reason_code: check.reason_code,
      check_id: check.check_id,
      paths: check.paths,
    }));

  return {
    schema_version: 'package-content-manifest.v1',
    generated_at: options.generatedAt || new Date().toISOString(),
    source: 'npm pack --dry-run --json',
    package: {
      name: packResult.name || '',
      version: packResult.version || '',
      filename: packResult.filename || '',
    },
    file_count: files.length,
    files,
    required_paths: required,
    forbidden_paths: forbidden,
    checks,
    failures,
    passed: failures.length === 0,
  };
}

function snapshotTree(rootDir) {
  const results = [];
  if (!fs.existsSync(rootDir)) return results;

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join('/');
      if (entry.isDirectory()) {
        results.push(`${relativePath}/`);
        walk(absolutePath);
        continue;
      }
      if (entry.isFile()) {
        results.push(`${relativePath}:${fs.readFileSync(absolutePath, 'utf8')}`);
      }
    }
  }

  walk(rootDir);
  return results;
}

function buildInitProgrammaticEvidence({ host, result, beforeSnapshot, afterSnapshot }) {
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const status = Number.isInteger(result.status) ? result.status : 1;
  const mutated = JSON.stringify(beforeSnapshot) !== JSON.stringify(afterSnapshot);
  const expectedStatePath = {
    claude: '.claude/spec-first/state.json',
    codex: '.codex/spec-first/state.json',
    kiro: '.kiro/spec-first/state.json',
    qoder: '.qoder/spec-first/state.json',
  }[host] || `.${host}/spec-first/state.json`;
  const expectedInstructionPath = host === 'claude' ? 'CLAUDE.md' : 'AGENTS.md';
  const hasState = afterSnapshot.some((entry) => entry.startsWith(`${expectedStatePath}:`));
  const hasInstruction = afterSnapshot.some((entry) => entry.startsWith(`${expectedInstructionPath}:`));
  const passed = status === 0 && mutated && hasState && hasInstruction;

  return {
    host,
    status,
    passed,
    reason_code: passed ? 'init-programmatic-passed' : 'init-programmatic-failed',
    mutated,
    expected_state_path: expectedStatePath,
    has_state: hasState,
    expected_instruction_path: expectedInstructionPath,
    has_instruction: hasInstruction,
    stdout,
    stderr,
  };
}

function runInstalledProgrammaticInitResult({ packageRoot, cwd, host, name = 'matrix', lang = 'en' }) {
  const source = `
const packageRoot = process.argv[2];
const projectRoot = process.argv[3];
const platform = process.argv[4];
const name = process.argv[5];
const lang = process.argv[6];
const { applyInitPlan, buildInitPlan } = require(packageRoot + '/src/cli/init-plan');
const { printInitApplySuccess } = require(packageRoot + '/src/cli/commands/init');

const plan = buildInitPlan({
  projectRoot,
  workspaceRoot: projectRoot,
  platform,
  name,
  lang,
  target: { mode: 'single-repo', projectRoot },
  gitRootTopology: 'single-repo',
});

if (Array.isArray(plan.errors) && plan.errors.length > 0) {
  for (const error of plan.errors) {
    console.error(error.message || String(error));
  }
  process.exit(1);
}

const result = applyInitPlan(projectRoot, plan);
printInitApplySuccess(plan, result);
process.exit(result.exit_code);
`;
  return runChildResult(process.execPath, ['-', packageRoot, cwd, host, name, lang], {
    cwd,
    input: source,
  });
}

function runInitProgrammaticEvidence({ packageRoot, cwd, host, artifacts }) {
  const logName = INIT_PROGRAMMATIC_LOG_FILES[host] || `init-${host}-programmatic.log`;
  const beforeSnapshot = snapshotTree(cwd);
  const result = runInstalledProgrammaticInitResult({ packageRoot, cwd, host });
  const afterSnapshot = snapshotTree(cwd);
  const evidence = buildInitProgrammaticEvidence({
    host,
    result,
    beforeSnapshot,
    afterSnapshot,
  });
  artifacts.write(logName, [
    `host=${host}`,
    `status=${evidence.status}`,
    `passed=${evidence.passed}`,
    `reason_code=${evidence.reason_code}`,
    `mutated=${evidence.mutated}`,
    `expected_state_path=${evidence.expected_state_path}`,
    `has_state=${evidence.has_state}`,
    `expected_instruction_path=${evidence.expected_instruction_path}`,
    `has_instruction=${evidence.has_instruction}`,
    '',
    '--- stdout ---',
    evidence.stdout,
    '--- stderr ---',
    evidence.stderr,
  ].join('\n'));
  return {
    ...evidence,
    artifact_path: logName,
  };
}

function readPackageInfo(cwd) {
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  return {
    name: pkg.name || '',
    version: pkg.version || '',
  };
}

function defaultReleaseArtifacts() {
  return {
    summary: SUMMARY_FILE,
    pack_output: PACK_OUTPUT_FILE,
    package_content_manifest: PACKAGE_CONTENT_MANIFEST_FILE,
    init_claude_programmatic_log: INIT_CLAUDE_PROGRAMMATIC_LOG_FILE,
    init_codex_programmatic_log: INIT_CODEX_PROGRAMMATIC_LOG_FILE,
    init_kiro_programmatic_log: INIT_KIRO_PROGRAMMATIC_LOG_FILE,
    init_qoder_programmatic_log: INIT_QODER_PROGRAMMATIC_LOG_FILE,
    release_artifact_summary: RELEASE_ARTIFACT_SUMMARY_FILE,
  };
}

function checkFromPackageContentManifest(manifest) {
  return {
    check_id: 'package-content-manifest',
    status: manifest.passed ? 'passed' : 'failed',
    reason_code: manifest.passed ? 'package-content-manifest-passed' : 'package-content-manifest-failed',
    summary: manifest.passed
      ? `${manifest.file_count} package file(s) passed required/forbidden path checks.`
      : `${manifest.failures.length} package content check(s) failed.`,
    artifact_path: PACKAGE_CONTENT_MANIFEST_FILE,
  };
}

function checkFromInitProgrammaticEvidence(evidence) {
  return {
    check_id: `init-${evidence.host}-programmatic`,
    status: evidence.passed ? 'passed' : 'failed',
    reason_code: evidence.reason_code,
    summary: evidence.passed
      ? `Programmatic spec-first init plan/apply for ${evidence.host} passed and wrote expected runtime evidence.`
      : `Programmatic spec-first init plan/apply for ${evidence.host} failed evidence checks.`,
    artifact_path: evidence.artifact_path,
  };
}

function failureFromCheck(check) {
  return {
    reason_code: check.reason_code,
    message: check.summary,
    artifact_path: check.artifact_path,
  };
}

function buildReleaseArtifactSummary(options = {}) {
  const checks = options.checks || [];
  const status = options.status || (checks.every((check) => check.status !== 'failed') ? 'passed' : 'failed');
  const failures = options.failures || checks
    .filter((check) => check.status === 'failed')
    .map(failureFromCheck);
  const packageInfo = options.packageInfo || { name: '', version: '' };

  return {
    schema_version: 'release-package-evidence.v1',
    generated_at: options.generatedAt || new Date().toISOString(),
    status,
    package: {
      name: packageInfo.name || '',
      version: packageInfo.version || '',
      tarball_name: options.tarballName || '',
    },
    environment: {
      platform: options.platform || process.platform,
      node: options.node || process.version,
    },
    artifacts: defaultReleaseArtifacts(),
    checks,
    failures,
  };
}

function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec first install-'));
  const artifacts = createArtifactWriter();
  const startedAt = new Date().toISOString();
  const packageInfo = readPackageInfo(process.cwd());
  const releaseChecks = [];
  let releaseFailures = [];
  let tarballName = '';
  const summaryBase = {
    schema_version: 'npm-install-matrix-smoke.v1',
    started_at: startedAt,
    platform: process.platform,
    node: process.version,
    cwd: process.cwd(),
    temp_dir: tmp,
    artifact_dir: artifacts.dir || null,
    package: packageInfo,
    artifacts: defaultReleaseArtifacts(),
  };
  console.log(`npm install matrix smoke temp: ${tmp}`);
  artifacts.write(SUMMARY_FILE, {
    ...summaryBase,
    status: 'started',
  });

  function writeReleaseSummary(status, extraFailures = []) {
    const failures = [
      ...releaseFailures,
      ...extraFailures,
    ];
    const summary = buildReleaseArtifactSummary({
      generatedAt: new Date().toISOString(),
      status,
      packageInfo,
      tarballName,
      checks: releaseChecks,
      failures,
    });
    artifacts.write(RELEASE_ARTIFACT_SUMMARY_FILE, summary);
    return summary;
  }

  try {
    const tarballDir = path.join(tmp, 'tarball');
    const prefix = path.join(tmp, 'prefix with spaces');
    const cache = path.join(tmp, 'cache with spaces');
    fs.mkdirSync(tarballDir);
    fs.mkdirSync(prefix);
    fs.mkdirSync(cache);

    const packDryRunOutput = runNpm([
      'pack',
      '--dry-run',
      '--json',
    ]);
    const packageContentManifest = buildPackageContentManifest(packDryRunOutput, {
      generatedAt: startedAt,
    });
    artifacts.write(PACKAGE_CONTENT_MANIFEST_FILE, packageContentManifest);
    const packageContentCheck = checkFromPackageContentManifest(packageContentManifest);
    releaseChecks.push(packageContentCheck);
    if (!packageContentManifest.passed) {
      const error = new Error(packageContentCheck.summary);
      error.reasonCode = packageContentCheck.reason_code;
      throw error;
    }

    const packOutput = runNpm([
      'pack',
      '--pack-destination',
      tarballDir,
      '--silent',
    ]);
    artifacts.write(PACK_OUTPUT_FILE, packOutput);

    tarballName = packOutput.trim().split(/\r?\n/).pop();
    const tarballPath = path.join(tarballDir, tarballName);

    runNpm([
      'install',
      '-g',
      tarballPath,
      '--prefix',
      prefix,
      '--cache',
      cache,
      '--loglevel=error',
    ], { stdio: 'inherit' });

    const shim = process.platform === 'win32'
      ? path.join(prefix, 'spec-first.cmd')
      : path.join(prefix, 'bin', 'spec-first');
    const packageRoot = process.platform === 'win32'
      ? path.join(prefix, 'node_modules', 'spec-first')
      : path.join(prefix, 'lib', 'node_modules', 'spec-first');

    for (const requiredPath of [shim, packageRoot, path.join(packageRoot, 'bin', 'spec-first.js')]) {
      if (!fs.existsSync(requiredPath)) {
        throw new Error(`Expected installed path missing: ${requiredPath}`);
      }
    }

    runInstalledBin(packageRoot, ['--help']);
    runInstalledBin(packageRoot, ['-v']);
    runInstalledShim(shim, ['--help']);
    runInstalledShim(shim, ['-v']);

    const initProgrammaticChecks = INIT_PROGRAMMATIC_HOSTS.map((host) => {
      const programmaticProject = path.join(tmp, `programmatic-${host} workspace [win64] 中文`);
      fs.mkdirSync(programmaticProject);
      const evidence = runInitProgrammaticEvidence({
        packageRoot,
        cwd: programmaticProject,
        host,
        artifacts,
      });
      return checkFromInitProgrammaticEvidence(evidence);
    });
    releaseChecks.push(...initProgrammaticChecks);
    const failedProgrammaticInits = initProgrammaticChecks.filter((check) => check.status === 'failed');
    if (failedProgrammaticInits.length > 0) {
      throw new Error(`${failedProgrammaticInits.length} programmatic init evidence check(s) failed.`);
    }

    const fixtureProject = path.join(tmp, 'workspace [win64] 中文 (paren)');
    fs.mkdirSync(fixtureProject);
    runInstalledBin(packageRoot, ['doctor'], { cwd: fixtureProject });
    const claudeInit = runInstalledProgrammaticInitResult({ packageRoot, cwd: fixtureProject, host: 'claude' });
    if (claudeInit.status !== 0) {
      throw new Error(`Programmatic Claude init failed with status ${claudeInit.status}`);
    }
    const codexInit = runInstalledProgrammaticInitResult({ packageRoot, cwd: fixtureProject, host: 'codex' });
    if (codexInit.status !== 0) {
      throw new Error(`Programmatic Codex init failed with status ${codexInit.status}`);
    }
    runInstalledShim(shim, ['doctor', '--json'], { cwd: fixtureProject });

    for (const requiredPath of [
      path.join(fixtureProject, 'CLAUDE.md'),
      path.join(fixtureProject, 'AGENTS.md'),
      path.join(fixtureProject, '.claude', 'spec-first', 'state.json'),
      path.join(fixtureProject, '.codex', 'spec-first', 'state.json'),
    ]) {
      if (!fs.existsSync(requiredPath)) {
        throw new Error(`Expected initialized fixture path missing: ${requiredPath}`);
      }
    }

    const gitProject = path.join(tmp, 'minimal git repo [win64] 中文');
    fs.mkdirSync(gitProject);
    runGit(['init'], { cwd: gitProject });
    runInstalledBin(packageRoot, ['doctor'], { cwd: gitProject });
    runInstalledShim(shim, ['doctor', '--json'], { cwd: gitProject });

    const releaseArtifactSummary = writeReleaseSummary('passed');
    artifacts.write(SUMMARY_FILE, {
      ...summaryBase,
      status: 'passed',
      finished_at: new Date().toISOString(),
      tarball_path: tarballPath,
      prefix,
      package_root: packageRoot,
      shim,
      fixture_project: fixtureProject,
      minimal_git_project: gitProject,
      release_artifact_summary: RELEASE_ARTIFACT_SUMMARY_FILE,
      package_content_manifest: PACKAGE_CONTENT_MANIFEST_FILE,
      init_programmatic_artifacts: {
        claude: INIT_CLAUDE_PROGRAMMATIC_LOG_FILE,
        codex: INIT_CODEX_PROGRAMMATIC_LOG_FILE,
        kiro: INIT_KIRO_PROGRAMMATIC_LOG_FILE,
        qoder: INIT_QODER_PROGRAMMATIC_LOG_FILE,
      },
      release_checks: releaseChecks,
      release_failures: releaseArtifactSummary.failures,
    });

    fs.rmSync(tmp, { recursive: true, force: true });
    return 0;
  } catch (error) {
    const fallbackFailure = {
      reason_code: error && error.reasonCode ? error.reasonCode : 'npm-install-matrix-smoke-failed',
      message: error && error.stack ? error.stack : String(error),
      artifact_path: RELEASE_ARTIFACT_SUMMARY_FILE,
    };
    const knownFailureKeys = new Set(releaseChecks
      .filter((check) => check.status === 'failed')
      .map((check) => `${check.reason_code}:${check.artifact_path}`));
    releaseFailures = releaseChecks
      .filter((check) => check.status === 'failed')
      .map(failureFromCheck);
    if (!knownFailureKeys.has(`${fallbackFailure.reason_code}:${fallbackFailure.artifact_path}`)) {
      releaseFailures.push(fallbackFailure);
    }
    const releaseArtifactSummary = writeReleaseSummary('failed');
    artifacts.write(SUMMARY_FILE, {
      ...summaryBase,
      status: 'failed',
      finished_at: new Date().toISOString(),
      error: error && error.stack ? error.stack : String(error),
      release_artifact_summary: RELEASE_ARTIFACT_SUMMARY_FILE,
      package_content_manifest: PACKAGE_CONTENT_MANIFEST_FILE,
      init_programmatic_artifacts: {
        claude: INIT_CLAUDE_PROGRAMMATIC_LOG_FILE,
        codex: INIT_CODEX_PROGRAMMATIC_LOG_FILE,
        kiro: INIT_KIRO_PROGRAMMATIC_LOG_FILE,
        qoder: INIT_QODER_PROGRAMMATIC_LOG_FILE,
      },
      release_checks: releaseChecks,
      release_failures: releaseArtifactSummary.failures,
    });
    console.error(error && error.stack ? error.stack : String(error));
    console.error(`npm install matrix smoke temp preserved for debugging: ${tmp}`);
    return error && Number.isInteger(error.status) ? error.status : 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  buildInitProgrammaticEvidence,
  buildPackageContentManifest,
  buildCmdCommandLine,
  buildReleaseArtifactSummary,
  checkFromInitProgrammaticEvidence,
  checkFromPackageContentManifest,
  createArtifactWriter,
  defaultReleaseArtifacts,
  failureFromCheck,
  FORBIDDEN_PACKAGE_PATTERNS,
  getEnvValue,
  INIT_CLAUDE_PROGRAMMATIC_LOG_FILE,
  INIT_CODEX_PROGRAMMATIC_LOG_FILE,
  INIT_KIRO_PROGRAMMATIC_LOG_FILE,
  INIT_QODER_PROGRAMMATIC_LOG_FILE,
  matchesForbiddenPattern,
  normalizePackagePath,
  normalizeArtifactFileName,
  PACKAGE_CONTENT_MANIFEST_FILE,
  PACK_OUTPUT_FILE,
  quoteCmdArg,
  RELEASE_ARTIFACT_SUMMARY_FILE,
  REQUIRED_PACKAGE_PATHS,
  resolveNpmCliPath,
  runChild,
  runChildResult,
  runGit,
  runInstalledBin,
  runInstalledBinResult,
  runInstalledShim,
  runNpm,
  runWindowsCmdShim,
  SUMMARY_FILE,
};
