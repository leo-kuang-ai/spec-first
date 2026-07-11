#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SKILL_PATH = 'skills/spec-mcp-setup';
const COMMAND_NAMES = [
  'agent-browser', 'ast-grep', 'brew', 'cargo', 'codegraph', 'ffmpeg',
  'gh', 'graphify', 'npm', 'npx', 'rg', 'silicon', 'spec-first', 'sudo', 'vhs',
];

function parseArgs(argv) {
  const result = { platform: '', source: '' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--platform') result.platform = argv[index += 1] || '';
    else if (argv[index] === '--source') result.source = argv[index += 1] || '';
  }
  return result;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: options.encoding === null ? null : 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: options.timeout || 30000,
    windowsHide: true,
  });
}

function requireSuccess(result, label) {
  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error ? result.error.message : result.stderr || result.stdout}`);
  }
  return result;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function validateFixture(fixture, platform, source) {
  if (fixture.schema_version !== 'mcp-setup-legacy-parity.v2') throw new Error('不支持的 fixture schema');
  if (fixture.platform !== platform) throw new Error('fixture platform 不匹配');
  if (fixture.provenance.source_sha !== source) throw new Error('fixture source SHA 不匹配');
  for (const [mode, contract] of Object.entries(fixture.modes)) {
    if (!Array.isArray(contract.argv)) throw new Error(`mode 缺少 argv：${mode}`);
    if (!Number.isInteger(contract.exit_code)) throw new Error(`mode 缺少 exit_code：${mode}`);
    if (!contract.reason_code || !contract.artifact_schema) throw new Error(`mode 缺少 outcome：${mode}`);
    if (!Array.isArray(contract.side_effect_categories)) throw new Error(`mode 缺少 effect：${mode}`);
    if (!contract.runtime_capture || !contract.runtime_capture.capture_status || !contract.runtime_capture.owner) {
      throw new Error(`mode 缺少 runtime capture：${mode}`);
    }
  }
  for (const contract of fixture.invalid) {
    if (!Array.isArray(contract.argv) || !contract.reason_code || contract.exit_code !== 2) {
      throw new Error(`invalid-case contract 格式错误：${contract.id || 'unknown'}`);
    }
    if (!contract.runtime_capture || !contract.runtime_capture.capture_status || !contract.runtime_capture.owner) {
      throw new Error(`invalid-case 缺少 runtime capture：${contract.id || 'unknown'}`);
    }
  }
  for (const [schema, fields] of Object.entries(fixture.artifacts)) {
    if (!schema.includes('.v') || !Array.isArray(fields) || !fields.includes('schema_version')) {
      throw new Error(`artifact shape 格式错误：${schema}`);
    }
  }
}

function materializeBaseline(repoRoot, source, destination) {
  const listing = requireSuccess(run('git', ['ls-tree', '-r', '-z', source, '--', SKILL_PATH], {
    cwd: repoRoot,
    encoding: null,
  }), 'git ls-tree').stdout;
  const records = listing.toString('utf8').split('\0').filter(Boolean);
  const files = [];
  for (const record of records) {
    const match = /^(\d+)\s+(\w+)\s+[0-9a-f]+\t(.+)$/.exec(record);
    if (!match) throw new Error(`无法解析 git ls-tree record：${record}`);
    const [, mode, type, sourcePath] = match;
    if (type !== 'blob') continue;
    const contents = requireSuccess(run('git', ['show', `${source}:${sourcePath}`], {
      cwd: repoRoot,
      encoding: null,
    }), `git show ${sourcePath}`).stdout;
    const target = path.join(destination, sourcePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
    fs.chmodSync(target, mode === '100755' ? 0o755 : 0o644);
    files.push({ path: sourcePath, mode, sha256: sha256(contents) });
  }
  return files;
}

function verifySourceFiles(materializedFiles, fixture) {
  const byPath = new Map(materializedFiles.map((entry) => [entry.path, entry]));
  for (const expected of fixture.provenance.source_files) {
    const actual = byPath.get(expected.path);
    if (!actual) throw new Error(`缺少 baseline source：${expected.path}；materialized=${materializedFiles.slice(0, 3).map((entry) => entry.path).join(',')}`);
    if (actual.sha256 !== expected.sha256) throw new Error(`source digest 不匹配：${expected.path}`);
  }
}

function initializeRepo(root) {
  fs.mkdirSync(root, { recursive: true });
  requireSuccess(run('git', ['init', '-q', root]), 'git init');
}

function writeCommandStubs(binDir, platform) {
  fs.mkdirSync(binDir, { recursive: true });
  const dispatcher = path.join(binDir, 'stub-command.cjs');
  fs.writeFileSync(dispatcher, `'use strict';
const fs = require('node:fs');
const path = require('node:path');
const [name, ...args] = process.argv.slice(2);
const log = process.env.SPEC_FIRST_REPLAY_COMMAND_LOG;
if (log) fs.appendFileSync(log, JSON.stringify({ name, args, cwd: process.cwd() }) + '\\n');
function ensure(file, contents = '') { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, contents); }
function argValue(flag, fallback = '') { const index = args.indexOf(flag); return index >= 0 && args[index + 1] ? args[index + 1] : fallback; }
if (name === 'graphify') {
  if (args[0] === '--version') process.stdout.write('graphify 0.17.1\\n');
  else if (args[0] === 'install') {
    const platformName = argValue('--platform', 'qoder');
    const roots = { claude: '.claude', codex: '.codex', cursor: '.cursor', kiro: '.kiro', qoder: '.qoder' };
    ensure(path.join(process.cwd(), roots[platformName] || '.qoder', 'skills', 'graphify', 'SKILL.md'), '# Graphify\\n');
    process.stdout.write('installed\\n');
  } else if (args[0] === 'extract' || args[0] === 'update') {
    ensure(path.join(process.cwd(), '.graphify', 'graph.json'), '{}\\n');
    ensure(path.join(process.cwd(), '.graphify', 'GRAPH_REPORT.md'), '# Graph\\n');
    process.stdout.write('graph ready\\n');
  } else if (args[0] === 'hook' && args[1] === 'install') {
    ensure(path.join(process.cwd(), '.git', 'hooks', 'post-commit'), '#!/bin/sh\\n# Installed by: graphify hook install\\n');
    process.stdout.write('installed\\n');
  } else if (args[0] === 'hook' && args[1] === 'status') process.stdout.write('installed\\n');
  else process.stdout.write('{"ok":true}\\n');
} else if (name === 'codegraph') {
  if (args[0] === '--version') process.stdout.write('codegraph 1.2.0\\n');
  else process.stdout.write('ready\\n');
} else if (name === 'npm') {
  if (args[0] === '--version') process.stdout.write('10.9.0\\n');
  else if (args[0] === 'root' && args[1] === '-g') process.stdout.write(path.join(process.env.HOME, '.npm-global', 'lib', 'node_modules') + '\\n');
  else process.stdout.write('ok\\n');
} else if (name === 'npx') {
  if (args.length === 1 && args[0] === '--version') process.stdout.write('10.9.0\\n');
  else {
    if (args.some((arg) => String(arg).includes('ast-grep/agent-skill'))) {
      ensure(path.join(process.env.HOME, '.agents', 'skills', 'ast-grep', 'SKILL.md'), '# ast-grep\\n');
    }
    process.stdout.write('ok\\n');
  }
} else if (name === 'spec-first') process.stdout.write('Spec-First v1.13.2\\n');
else if (name === 'brew' && args[0] === 'list') process.stdout.write((args[2] || args[1] || 'tool') + ' 1.0.0\\n');
else process.stdout.write(name + ' 1.0.0\\n');
`, 'utf8');
  for (const name of COMMAND_NAMES) {
    if (platform === 'windows') {
      fs.writeFileSync(path.join(binDir, `${name}.cmd`), `@echo off\r\n"${process.execPath}" "${dispatcher}" ${name} %*\r\n`);
    } else {
      const wrapper = path.join(binDir, name);
      fs.writeFileSync(wrapper, `#!/bin/sh\nexec "${process.execPath}" "${dispatcher}" "${name}" "$@"\n`);
      fs.chmodSync(wrapper, 0o755);
    }
  }
}

function createScenarioContext(root, platform, materializedRoot, mode) {
  const scenarioRoot = path.join(root, `${platform}-${mode}`);
  const repo = path.join(scenarioRoot, 'repo');
  const home = path.join(scenarioRoot, 'home');
  const bin = path.join(scenarioRoot, 'bin');
  const log = path.join(scenarioRoot, 'commands.ndjson');
  initializeRepo(repo);
  fs.mkdirSync(home, { recursive: true });
  writeCommandStubs(bin, platform);
  for (const skill of ['agent-browser', 'ast-grep']) {
    const skillPath = path.join(home, '.agents', 'skills', skill, 'SKILL.md');
    fs.mkdirSync(path.dirname(skillPath), { recursive: true });
    fs.writeFileSync(skillPath, `# ${skill}\n`);
  }
  const browserMarker = path.join(home, '.agent-browser', 'spec-first-install.json');
  fs.mkdirSync(path.dirname(browserMarker), { recursive: true });
  fs.writeFileSync(browserMarker, '{}\n');
  const runtimeState = path.join(repo, '.qoder', 'spec-first', 'state.json');
  fs.mkdirSync(path.dirname(runtimeState), { recursive: true });
  fs.writeFileSync(runtimeState, '{"manifestVersion":"1.13.2"}\n');
  if (mode === 'graphify-refresh') {
    const graphPath = path.join(repo, '.graphify', 'graph.json');
    fs.mkdirSync(path.dirname(graphPath), { recursive: true });
    fs.writeFileSync(graphPath, '{}\n');
  }
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    PATH: `${bin}${path.delimiter}${process.env.PATH || ''}`,
    MCP_SETUP_HOST: 'qoder',
    SPEC_FIRST_PROVIDER_HOST: 'qoder',
    SPEC_FIRST_PROVIDER_REPO_ROOT: repo,
    SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
    SPEC_FIRST_PROVIDER_GRAPHIFY_REQUIREMENT_WORKSPACE: '.',
    SPEC_FIRST_PROVIDER_ORIGINAL_PATH: `${bin}${path.delimiter}${process.env.PATH || ''}`,
    SPEC_FIRST_REPLAY_COMMAND_LOG: log,
    SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '10',
    SPEC_FIRST_PROBE_TIMEOUT_SECONDS: '5',
    SPEC_FIRST_DISABLE_WARMUP_CACHE: '1',
    SPEC_FIRST_BUNDLED_VERSION: '1.13.2',
    CI: 'true',
  };
  return {
    bin,
    env,
    home,
    log,
    materializedRoot,
    repo,
    scenarioRoot,
    scripts: path.join(materializedRoot, SKILL_PATH, 'scripts'),
  };
}

function snapshotFiles(root) {
  const entries = new Map();
  function visit(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else entries.set(path.relative(root, absolute).split(path.sep).join('/'), sha256(fs.readFileSync(absolute)));
    }
  }
  visit(root);
  return entries;
}

function changedPaths(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])]
    .filter((entry) => before.get(entry) !== after.get(entry));
}

function parseCommandLog(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function classifyEffects(context, beforeRepo, beforeHome) {
  const repoPaths = changedPaths(beforeRepo, snapshotFiles(context.repo));
  const homePaths = changedPaths(beforeHome, snapshotFiles(context.home));
  const calls = parseCommandLog(context.log);
  const effects = new Set();
  if (repoPaths.some((entry) => entry.startsWith('.spec-first/config/')
    || entry === '.spec-first/workspace/scenario-fingerprint-setup.json')) effects.add('setup-facts');
  if (repoPaths.some((entry) => entry === '.spec-first/config.local.example.yaml'
    || entry === '.spec-first/config.local.yaml'
    || entry === '.gitignore'
    || entry === 'compound-engineering.local.md')) effects.add('project-config');
  if (repoPaths.some((entry) => /^\.(?:claude|codex|cursor|kiro|qoder)\//.test(entry)
    && entry !== '.qoder/spec-first/state.json')) effects.add('host-config');
  if (repoPaths.some((entry) => entry.startsWith('.graphify/') || entry.includes('/skills/graphify/')
    || entry.startsWith('.git/hooks/'))
    || calls.some((entry) => entry.name === 'graphify'
      && ['install', 'extract', 'update'].includes(entry.args[0]))) effects.add('provider-mutation');
  if (homePaths.some((entry) => entry.includes('readiness-ledger') || entry.endsWith('host-setup.json'))) {
    effects.add('setup-facts');
  }
  return [...effects].sort();
}

function extractJson(stdout) {
  const value = String(stdout || '').trim();
  if (!value) return null;
  try { return JSON.parse(value); } catch (_error) { /* 尝试逐行解析输出 */ }
  const lines = value.split(/\r?\n/).reverse();
  for (const line of lines) {
    try { return JSON.parse(line); } catch (_error) { /* 继续 */ }
  }
  return null;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function directReasonCode(value) {
  if (!value || typeof value !== 'object') return null;
  for (const field of ['reason_code', 'reason']) {
    if (typeof value[field] === 'string' && value[field].trim()) return value[field].trim();
  }
  return null;
}

function collectRuntimeArtifacts(context, parsedStdout) {
  const candidates = [
    ['stdout', parsedStdout],
    ['host-ledger', readJson(path.join(context.home, '.qoder', 'spec-first', 'host-setup.json'))],
    ['tool-facts', readJson(path.join(context.repo, '.spec-first', 'config', 'tool-facts.json'))],
    ['runtime-capabilities', readJson(path.join(context.repo, '.spec-first', 'config', 'runtime-capabilities.json'))],
  ];
  return candidates
    .filter(([, value]) => value && typeof value === 'object')
    .map(([source, value]) => ({
      source,
      schema_version: typeof value.schema_version === 'string' ? value.schema_version : null,
      reason_code: directReasonCode(value),
    }));
}

function extractTextReasonCode(stdout, stderr) {
  const text = `${stdout || ''}\n${stderr || ''}`;
  const patterns = [
    [/use either --repo or --folder, not both/i, 'repo-and-folder'],
    [/use either --all-repos or --folder, not both/i, 'folder-and-all-repos'],
    [/(?:all-repos.*(?:conflict|cannot|with).*repo|repo.*(?:conflict|cannot|with).*all-repos)/i, 'repo-and-all-repos'],
  ];
  const observed = patterns.find(([pattern]) => pattern.test(text));
  return observed ? observed[1] : null;
}

function normalizeObservedReasonCode(reasonCode) {
  const aliases = {
    'all-repos-conflicts-with-repo': 'repo-and-all-repos',
  };
  return reasonCode ? (aliases[reasonCode] || reasonCode) : null;
}

function runtimeOutcomeEvidence(context, result) {
  const parsedStdout = extractJson(result.stdout);
  const rawArtifacts = collectRuntimeArtifacts(context, parsedStdout);
  const stdoutArtifact = rawArtifacts.find((entry) => entry.source === 'stdout') || null;
  const rawReasonCode = (stdoutArtifact && stdoutArtifact.reason_code)
    || extractTextReasonCode(result.stdout, result.stderr);
  return {
    parsedStdout,
    raw_artifact_schema: stdoutArtifact ? stdoutArtifact.schema_version : null,
    raw_artifact_schemas: [...new Set(rawArtifacts.map((entry) => entry.schema_version).filter(Boolean))].sort(),
    raw_reason_code: rawReasonCode || null,
  };
}

function scenarioInvocation(platform, mode, context) {
  if (platform === 'windows') {
    const shell = process.env.SPEC_FIRST_REPLAY_POWERSHELL || 'pwsh';
    const map = {
      bare: ['check-health.ps1', ['-Json', '-Version', '1.13.2']],
      check: ['check-health.ps1', ['-Json', '-Version', '1.13.2']],
      verify: ['verify-tools.ps1', ['-Repo', context.repo]],
      plan: ['install-mcp.ps1', ['-Plan', '-Repo', context.repo, '-Only', 'graphify']],
      'project-config': ['bootstrap-project-config.ps1', ['-Repo', context.repo, '-RefreshExample', '-EnsureGitignore', '-Json']],
      only: ['install-mcp.ps1', ['-Repo', context.repo, '-Only', 'graphify']],
      'graphify-refresh': ['install-mcp.ps1', ['-Repo', context.repo, '-Only', 'graphify', '-Refresh']],
    };
    const [script, args] = map[mode];
    return { command: shell, args: ['-NoLogo', '-NoProfile', '-File', path.join(context.scripts, script), ...args] };
  }
  const map = {
    bare: ['check-health', ['--json', '--version', '1.13.2']],
    check: ['check-health', ['--json', '--version', '1.13.2']],
    verify: ['verify-tools.sh', ['--repo', context.repo]],
    plan: ['install-mcp.sh', ['--plan', '--repo', context.repo, '--only', 'graphify']],
    'project-config': ['bootstrap-project-config.sh', ['--repo', context.repo, '--refresh-example', '--ensure-gitignore', '--json']],
    only: ['install-mcp.sh', ['--repo', context.repo, '--only', 'graphify']],
    'graphify-refresh': ['install-mcp.sh', ['--repo', context.repo, '--only', 'graphify', '--refresh']],
  };
  const [script, args] = map[mode];
  return { command: '/bin/bash', args: [path.join(context.scripts, script), ...args] };
}

function executeModeScenario(platform, mode, context) {
  const invocation = scenarioInvocation(platform, mode, context);
  const primary = run(invocation.command, invocation.args, { cwd: context.repo, env: context.env, timeout: 30000 });
  if (!['only', 'graphify-refresh'].includes(mode) || primary.status !== 0) return primary;
  const verification = platform === 'windows'
    ? {
      command: process.env.SPEC_FIRST_REPLAY_POWERSHELL || 'pwsh',
      args: ['-NoLogo', '-NoProfile', '-File', path.join(context.scripts, 'verify-tools.ps1'), '-Repo', context.repo],
    }
    : {
      command: '/bin/bash',
      args: [path.join(context.scripts, 'verify-tools.sh'), '--repo', context.repo],
    };
  const verified = run(verification.command, verification.args, { cwd: context.repo, env: context.env, timeout: 30000 });
  return {
    ...verified,
    stdout: `${primary.stdout || ''}\n${verified.stdout || ''}`,
    stderr: `${primary.stderr || ''}\n${verified.stderr || ''}`,
  };
}

function hasFile(root, relativePath) {
  return fs.existsSync(path.join(root, ...relativePath.split('/')));
}

function normalizeMode(mode, result, context, effects) {
  const outcome = runtimeOutcomeEvidence(context, result);
  const hasSetupArtifacts = hasFile(context.repo, '.spec-first/config/tool-facts.json')
    && hasFile(context.repo, '.spec-first/config/runtime-capabilities.json');
  let structuralEvidence = Number.isInteger(result.status);
  if (mode === 'bare' || mode === 'check' || mode === 'plan' || mode === 'project-config') {
    structuralEvidence = structuralEvidence && outcome.raw_artifact_schema !== null;
  } else {
    structuralEvidence = structuralEvidence && hasSetupArtifacts;
  }
  const captureReasonCode = !structuralEvidence
    ? 'legacy-runtime-evidence-incomplete'
    : (outcome.raw_reason_code === null ? 'legacy-runtime-reason-unavailable' : null);
  return {
    capture_status: captureReasonCode === null ? 'confirmed' : 'degraded',
    capture_reason_code: captureReasonCode,
    raw_exit_code: result.status,
    raw_reason_code: outcome.raw_reason_code,
    raw_artifact_schema: outcome.raw_artifact_schema,
    raw_artifact_schemas: outcome.raw_artifact_schemas,
    exit_code: result.status,
    reason_code: normalizeObservedReasonCode(outcome.raw_reason_code),
    artifact_schema: outcome.raw_artifact_schema,
    side_effect_categories: effects,
    raw_stderr: String(result.stderr || '').trim().slice(0, 500),
  };
}

function invalidInvocation(platform, contract, context) {
  const usePowerShell = platform === 'windows';
  const script = path.join(context.scripts, usePowerShell ? 'install-mcp.ps1' : 'install-mcp.sh');
  const args = contract.argv.flatMap((arg) => {
    if (!usePowerShell) return [arg];
    const names = {
      '--refresh': '-Refresh', '--only': '-Only', '--repo': '-Repo', '--folder': '-Folder', '--all-repos': '-AllRepos',
    };
    return [names[arg] || arg];
  });
  return usePowerShell
    ? { command: process.env.SPEC_FIRST_REPLAY_POWERSHELL || 'pwsh', args: ['-NoLogo', '-NoProfile', '-File', script, ...args] }
    : { command: '/bin/bash', args: [script, ...args] };
}

function normalizeInvalid(result, context, effects) {
  const outcome = runtimeOutcomeEvidence(context, result);
  const structuralEvidence = Number.isInteger(result.status);
  const captureReasonCode = !structuralEvidence
    ? 'legacy-runtime-evidence-incomplete'
    : (outcome.raw_reason_code === null ? 'legacy-runtime-reason-unavailable' : null);
  return {
    capture_status: captureReasonCode === null ? 'confirmed' : 'degraded',
    capture_reason_code: captureReasonCode,
    raw_exit_code: result.status,
    raw_reason_code: outcome.raw_reason_code,
    raw_artifact_schema: outcome.raw_artifact_schema,
    raw_artifact_schemas: outcome.raw_artifact_schemas,
    exit_code: result.status === 0 ? 0 : 2,
    reason_code: normalizeObservedReasonCode(outcome.raw_reason_code),
    artifact_schema: outcome.raw_artifact_schema,
    side_effect_categories: effects,
  };
}

function replayRuntime({ platform, fixture, materializedRoot, workRoot }) {
  if (platform === 'windows' && process.platform !== 'win32') {
    return {
      capture_status: 'skipped',
      authority_level: 'degraded',
      runtime_replay: 'windows-ci-only',
      reason_code: 'windows-runtime-required',
      capture_reason_code: 'windows-runtime-required',
      modes: {},
      invalid: {},
    };
  }
  const modes = {};
  for (const [mode, contract] of Object.entries(fixture.modes)) {
    const context = createScenarioContext(workRoot, platform, materializedRoot, mode);
    const beforeRepo = snapshotFiles(context.repo);
    const beforeHome = snapshotFiles(context.home);
    const result = executeModeScenario(platform, mode, context);
    modes[mode] = normalizeMode(mode, result, context, classifyEffects(context, beforeRepo, beforeHome));
  }
  const invalid = {};
  for (const contract of fixture.invalid) {
    const context = createScenarioContext(workRoot, platform, materializedRoot, `invalid-${contract.id}`);
    const beforeRepo = snapshotFiles(context.repo);
    const beforeHome = snapshotFiles(context.home);
    const invocation = invalidInvocation(platform, contract, context);
    const result = run(invocation.command, invocation.args, { cwd: context.repo, env: context.env, timeout: 15000 });
    invalid[contract.id] = normalizeInvalid(result, context, classifyEffects(context, beforeRepo, beforeHome));
  }
  const all = [...Object.values(modes), ...Object.values(invalid)];
  return {
    capture_status: all.every((entry) => entry.capture_status === 'confirmed') ? 'confirmed' : 'partial',
    authority_level: 'confirmed-runtime',
    runtime_replay: 'executed',
    reason_code: all.every((entry) => entry.capture_status === 'confirmed') ? null : 'legacy-runtime-scenario-degraded',
    capture_reason_code: all.every((entry) => entry.capture_status === 'confirmed')
      ? null
      : 'legacy-runtime-reason-unavailable',
    modes,
    invalid,
  };
}

function assertRuntimeMatchesFixture(runtime, fixture) {
  const mismatches = [];
  if (runtime.runtime_replay !== 'executed') return mismatches;
  for (const [mode, contract] of Object.entries(fixture.modes)) {
    const observed = runtime.modes[mode];
    for (const field of ['exit_code']) {
      if (observed[field] !== contract[field]) mismatches.push(`${mode}:${field}:${observed[field]}!=${contract[field]}`);
    }
    for (const field of ['reason_code', 'artifact_schema']) {
      if (observed[field] !== null && observed[field] !== contract[field]) {
        mismatches.push(`${mode}:${field}:${observed[field]}!=${contract[field]}`);
      }
    }
    if (JSON.stringify(observed.side_effect_categories) !== JSON.stringify([...contract.side_effect_categories].sort())) {
      mismatches.push(`${mode}:side_effect_categories:${JSON.stringify(observed.side_effect_categories)}`);
    }
  }
  for (const contract of fixture.invalid) {
    const observed = runtime.invalid[contract.id];
    if (observed.exit_code !== contract.exit_code
      || (observed.reason_code !== null && observed.reason_code !== contract.reason_code)) {
      mismatches.push(`${contract.id}:invalid-outcome`);
    }
    if (observed.side_effect_categories.length > 0) mismatches.push(`${contract.id}:mutated-state`);
  }
  return mismatches;
}

function assertRecordedCapture(runtime, fixture) {
  if (runtime.runtime_replay !== 'executed') return false;
  const mismatches = [];
  let compared = 0;
  function compareCapture(label, observed, expected) {
    for (const field of [
      'capture_status', 'capture_reason_code', 'raw_exit_code', 'raw_reason_code',
      'raw_artifact_schema', 'raw_artifact_schemas', 'side_effect_categories',
    ]) {
      if (JSON.stringify(observed[field] ?? null) !== JSON.stringify(expected[field] ?? null)) {
        mismatches.push(`${label}:${field}:${JSON.stringify(observed[field] ?? null)}!=${JSON.stringify(expected[field] ?? null)}`);
      }
    }
  }
  for (const [mode, contract] of Object.entries(fixture.modes)) {
    const expected = contract.runtime_capture;
    if (expected.capture_status === 'pending-windows-ci') continue;
    const observed = runtime.modes[mode];
    compareCapture(mode, observed, expected);
    compared += 1;
  }
  for (const contract of fixture.invalid) {
    const expected = contract.runtime_capture;
    if (expected.capture_status === 'pending-windows-ci') continue;
    const observed = runtime.invalid[contract.id];
    compareCapture(contract.id, observed, expected);
    compared += 1;
  }
  if (mismatches.length > 0) throw new Error(`记录的 runtime capture 发生 drift：${mismatches.join(', ')}`);
  return compared > 0;
}

function replay({ repoRoot, platform, source }) {
  if (!['posix', 'windows'].includes(platform)) throw new Error(`不支持的 platform：${platform}`);
  const fixturePath = path.join(__dirname, platform, 'runtime-contracts.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  validateFixture(fixture, platform, source);
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-legacy-replay-${platform}-`));
  try {
    const materializedRoot = path.join(workRoot, 'baseline');
    const materializedFiles = materializeBaseline(repoRoot, source, materializedRoot);
    verifySourceFiles(materializedFiles, fixture);
    const runtime = replayRuntime({ platform, fixture, materializedRoot, workRoot });
    const contractMismatches = assertRuntimeMatchesFixture(runtime, fixture);
    const fixtureCaptureVerified = assertRecordedCapture(runtime, fixture);
    return {
      schema_version: fixture.schema_version,
      platform,
      source_sha: source,
      source_files_materialized: materializedFiles.length,
      source_files_verified: fixture.provenance.source_files.length,
      modes_verified: Object.keys(fixture.modes).length,
      invalid_cases_verified: fixture.invalid.length,
      artifact_shapes_verified: Object.keys(fixture.artifacts).length,
      contract_mismatches: contractMismatches,
      fixture_capture_verified: fixtureCaptureVerified,
      ...runtime,
    };
  } finally {
    fs.rmSync(workRoot, { force: true, recursive: true });
  }
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
    process.stdout.write(`${JSON.stringify(replay({ repoRoot, ...options }))}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { replay };
