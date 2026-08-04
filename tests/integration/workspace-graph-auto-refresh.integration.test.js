'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const packageJson = require('../../package.json');

const setupScript = path.resolve(__dirname, '../../skills/spec-runtime-setup/scripts/setup.cjs');
const asyncRefreshScript = path.resolve(
  __dirname,
  '../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs',
);
const workspaceGraphExecutor = path.resolve(
  __dirname,
  '../../skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs',
);
const workspaceExec = path.resolve(
  __dirname,
  '../../skills/spec-runtime-setup/scripts/lib/workspace-exec.cjs',
);
const PROCESS_TIMEOUT_MS = 15000;
const trackedRoots = new Set();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: PROCESS_TIMEOUT_MS,
    ...options,
  });
  if (result.error) {
    throw new Error(`command failed to execute: ${command} ${args.join(' ')}: ${result.error.message}`);
  }
  return result;
}

function makeWorkspace(label) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${label}-`)));
  trackedRoots.add(root);
  return root;
}

function initRepo(workspaceRoot, name) {
  const repo = path.join(workspaceRoot, name);
  fs.mkdirSync(repo, { recursive: true });
  expect(run('git', ['init', '-q'], { cwd: repo }).status).toBe(0);
  expect(run('git', ['config', 'user.email', 'test@example.com'], { cwd: repo }).status).toBe(0);
  expect(run('git', ['config', 'user.name', 'Test'], { cwd: repo }).status).toBe(0);
  expect(run('git', ['config', '--local', 'core.hooksPath', '.git/hooks'], { cwd: repo }).status).toBe(0);
  fs.writeFileSync(path.join(repo, 'value.txt'), `${name}-v1\n`);
  expect(run('git', ['add', 'value.txt'], { cwd: repo }).status).toBe(0);
  expect(run('git', ['commit', '-q', '-m', 'init'], { cwd: repo }).status).toBe(0);
  const runtimeStateDir = path.join(repo, '.codex', 'spec-first');
  fs.mkdirSync(runtimeStateDir, { recursive: true });
  fs.writeFileSync(path.join(runtimeStateDir, 'state.json'), `${JSON.stringify({
    manifestVersion: packageJson.version,
  })}\n`);
  return repo;
}

function installFakeProviders({ binRoot, homeRoot }) {
  fs.mkdirSync(binRoot, { recursive: true });
  const providerLog = path.join(homeRoot, 'provider-events.jsonl');
  const activeRoot = path.join(homeRoot, 'provider-active');
  const delayControl = path.join(homeRoot, 'graphify-delay-ms');
  const failControl = path.join(homeRoot, 'graphify-fail');
  const codegraphFailControl = path.join(homeRoot, 'codegraph-fail');

  const codegraph = path.join(binRoot, 'codegraph');
  fs.writeFileSync(codegraph, [
    `#!${process.execPath}`,
    "'use strict';",
    "const fs = require('node:fs');",
    "const path = require('node:path');",
    'const args = process.argv.slice(2);',
    `const logPath = ${JSON.stringify(providerLog)};`,
    `const failControl = ${JSON.stringify(codegraphFailControl)};`,
    "const leakedKeys = ['REVIEW_SENTINEL_SECRET', 'OPENAI_API_KEY', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_REFRESH_ONLY', 'SPEC_FIRST_INTERNAL_WORKSPACE_CODEGRAPH_COMMAND', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPHIFY_COMMAND', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_TOKEN', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_PID', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_START'];",
    'const leakedEnv = Object.fromEntries(leakedKeys.filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));',
    'if (logPath) {',
    '  fs.mkdirSync(path.dirname(logPath), { recursive: true });',
    "  fs.appendFileSync(logPath, `${JSON.stringify({ provider: 'codegraph', action: args[0], args, pid: process.pid, leaked_env: leakedEnv })}\\n`);",
    '}',
    "if (args[0] === 'init') {",
    '  const repo = args[1];',
    "  const out = path.join(repo, '.codegraph');",
    '  fs.mkdirSync(out, { recursive: true });',
    "  fs.writeFileSync(path.join(out, 'codegraph.db'), fs.readFileSync(path.join(repo, 'value.txt'), 'utf8'));",
    "} else if (args[0] === 'sync') {",
    "  if (fs.existsSync(failControl)) process.exitCode = 4;",
    '  else {',
    '    const repo = args[1] || process.cwd();',
    "    fs.writeFileSync(path.join(repo, '.codegraph', 'codegraph.db'), fs.readFileSync(path.join(repo, 'value.txt'), 'utf8'));",
    '  }',
    '}',
    '',
  ].join('\n'));

  const managedGraphify = path.join(binRoot, 'graphify');
  fs.writeFileSync(managedGraphify, [
    `#!${process.execPath}`,
    "'use strict';",
    "const crypto = require('node:crypto');",
    "const fs = require('node:fs');",
    "const path = require('node:path');",
    'const args = process.argv.slice(2);',
    `const logPath = ${JSON.stringify(providerLog)};`,
    `const activeRoot = ${JSON.stringify(activeRoot)};`,
    `const delayControl = ${JSON.stringify(delayControl)};`,
    `const failControl = ${JSON.stringify(failControl)};`,
    "if (args[0] === '--version') { process.stdout.write('graphify 0.9.29\\n'); process.exit(0); }",
    "const leakedKeys = ['REVIEW_SENTINEL_SECRET', 'OPENAI_API_KEY', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_REFRESH_ONLY', 'SPEC_FIRST_INTERNAL_WORKSPACE_CODEGRAPH_COMMAND', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPHIFY_COMMAND', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_TOKEN', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_PID', 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_START'];",
    'const leakedEnv = Object.fromEntries(leakedKeys.filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));',
    'const invocation = `${process.pid}-${Date.now()}-${crypto.randomUUID()}`;',
    'const activeFile = path.join(activeRoot, invocation);',
    'function log(entry) {',
    '  fs.mkdirSync(path.dirname(logPath), { recursive: true });',
    "  fs.appendFileSync(logPath, `${JSON.stringify({ provider: 'graphify', ...entry, pid: process.pid, leaked_env: leakedEnv })}\\n`);",
    '}',
    'function readControl(file) {',
    "  try { return fs.readFileSync(file, 'utf8').trim(); } catch (_error) { return ''; }",
    '}',
    'fs.mkdirSync(activeRoot, { recursive: true });',
    "fs.writeFileSync(activeFile, args[0] || 'unknown');",
    "log({ event: 'start', action: args[0], args, active_count: fs.readdirSync(activeRoot).length });",
    'let exitCode = 0;',
    'try {',
    '  const delayMs = Number(readControl(delayControl)) || 0;',
    '  if (delayMs > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);',
    "  if (readControl(failControl) === '1' && args[0] === 'merge-graphs') {",
    '    exitCode = 3;',
    "  } else if (args[0] === 'extract') {",
    '    const repo = args[1];',
    "    const out = args[args.indexOf('--out') + 1];",
    "    const value = fs.readFileSync(path.join(repo, 'value.txt'), 'utf8');",
    "    const target = path.join(out, 'graphify-out', 'graph.json');",
    '    fs.mkdirSync(path.dirname(target), { recursive: true });',
    '    fs.writeFileSync(target, JSON.stringify({ repo: path.basename(repo), value }));',
    "  } else if (args[0] === 'merge-graphs') {",
    "    const outIndex = args.indexOf('--out');",
    "    const content = args.slice(1, outIndex).map((item) => fs.readFileSync(item, 'utf8')).join('\\n');",
    '    const target = args[outIndex + 1];',
    '    fs.mkdirSync(path.dirname(target), { recursive: true });',
    "    fs.writeFileSync(target, JSON.stringify({ digest: crypto.createHash('sha256').update(content).digest('hex'), content }));",
    '  }',
    '} finally {',
    "  log({ event: 'end', action: args[0], args, exit_code: exitCode });",
    '  fs.rmSync(activeFile, { force: true });',
    '}',
    'process.exitCode = exitCode;',
    '',
  ].join('\n'));

  for (const executable of [codegraph, managedGraphify]) {
    fs.chmodSync(executable, 0o755);
  }
  return {
    codegraph,
    managedGraphify,
    providerLog,
    activeRoot,
    delayControl,
    failControl,
    codegraphFailControl,
  };
}

function createFixture(label) {
  const workspaceRoot = makeWorkspace(label);
  const api = initRepo(workspaceRoot, 'api');
  const web = initRepo(workspaceRoot, 'web');
  const binRoot = path.join(workspaceRoot, 'fixture-bin');
  const homeRoot = path.join(workspaceRoot, 'fixture-home');
  fs.mkdirSync(homeRoot, { recursive: true });
  const provider = installFakeProviders({ binRoot, homeRoot });
  const { providerLog, activeRoot } = provider;
  const buildDriver = path.join(workspaceRoot, 'fixture-workspace-build.cjs');
  fs.writeFileSync(buildDriver, [
    "'use strict';",
    `const { runWorkspaceGraphBuild } = require(${JSON.stringify(workspaceGraphExecutor)});`,
    `const { defaultWorkspaceExec } = require(${JSON.stringify(workspaceExec)});`,
    'const workspaceRoot = process.argv[2];',
    'const result = runWorkspaceGraphBuild({',
    '  cwd: workspaceRoot,',
    "  repos: ['api', 'web'],",
    '  allowDiscovery: false,',
    '  exec: defaultWorkspaceExec,',
    `  codegraphCommand: ${JSON.stringify(provider.codegraph)},`,
    `  graphifyCommand: ${JSON.stringify(provider.managedGraphify)},`,
    "  runtimeHost: 'codex',",
    `  bundledVersion: ${JSON.stringify(packageJson.version)},`,
    '});',
    "process.stdout.write(`${JSON.stringify(result)}\\n`);",
    "process.exitCode = result.status === 'complete' ? 0 : 1;",
    '',
  ].join('\n'));
  const baseEnv = {
    ...process.env,
    HOME: homeRoot,
    PATH: `${binRoot}${path.delimiter}${process.env.PATH || ''}`,
    MCP_SETUP_HOST: 'codex',
    SPEC_FIRST_BUNDLED_VERSION: packageJson.version,
  };
  return {
    workspaceRoot,
    api,
    web,
    binRoot,
    providerLog,
    activeRoot,
    provider,
    baseEnv,
    commitEnv: {
      ...baseEnv,
      PATH: process.env.PATH || '/usr/bin:/bin',
      REVIEW_SENTINEL_SECRET: 'commit-secret-must-not-reach-provider',
      OPENAI_API_KEY: 'sk-fixture-must-not-reach-provider',
    },
    buildArgs: [buildDriver, workspaceRoot],
  };
}

function readProviderEvents(logPath) {
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function snapshotFile(file) {
  const stat = fs.statSync(file);
  return { contents: fs.readFileSync(file, 'utf8'), mtimeMs: stat.mtimeMs };
}

function lifecycleLockPath(workspaceRoot) {
  return path.join(workspaceRoot, '.spec-first', 'workspace-graph-lifecycle.lock');
}

function asyncLockPath(workspaceRoot) {
  return path.join(workspaceRoot, 'graphify-out', 'workspace-async-refresh.lock');
}

function pendingPath(workspaceRoot) {
  return path.join(workspaceRoot, 'graphify-out', 'workspace-async-refresh.pending');
}

async function waitFor(predicate, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`condition not reached within ${timeoutMs}ms`);
}

function workerPids(workspaceRoot) {
  const pids = new Set();
  for (const file of [asyncLockPath(workspaceRoot), lifecycleLockPath(workspaceRoot)]) {
    try {
      const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
      const pid = Number(payload.owner_pid);
      if (Number.isInteger(pid) && pid > 0 && pid !== process.pid) pids.add(pid);
    } catch (_error) {
      // 测试清理只处理仍可识别的 fixture worker。
    }
  }
  return [...pids];
}

async function settleAndRemove(workspaceRoot) {
  try {
    await waitFor(() => !fs.existsSync(asyncLockPath(workspaceRoot))
      && !fs.existsSync(lifecycleLockPath(workspaceRoot)), 5000);
  } catch (_error) {
    for (const pid of workerPids(workspaceRoot)) {
      try { process.kill(pid, 'SIGTERM'); } catch (_killError) { /* fixture worker already exited */ }
    }
    try {
      await waitFor(() => !fs.existsSync(asyncLockPath(workspaceRoot))
        && !fs.existsSync(lifecycleLockPath(workspaceRoot)), 1000);
    } catch (_settleError) { /* bounded cleanup continues below */ }
  }
  fs.rmSync(workspaceRoot, { recursive: true, force: true });
}

afterEach(async () => {
  for (const root of [...trackedRoots]) {
    await settleAndRemove(root);
    trackedRoots.delete(root);
  }
});

const unixTest = process.platform === 'win32' ? test.skip : test;

describe('workspace graph automatic refresh (integration)', () => {
  unixTest('continuous commits stay single-flight and converge without PATH or setup mutations', async () => {
    const fixture = createFixture('wg-auto');
    const { workspaceRoot, api, providerLog, provider, baseEnv, commitEnv, buildArgs } = fixture;
    const initial = run(process.execPath, buildArgs, { cwd: workspaceRoot, env: baseEnv });
    if (initial.status !== 0) {
      const version = run(provider.managedGraphify, ['--version'], { cwd: workspaceRoot, env: baseEnv });
      throw new Error(`initial workspace build failed (${initial.status})\nstdout:\n${initial.stdout}\nstderr:\n${initial.stderr}\nversion:${version.status}:${version.stdout}:${version.stderr}`);
    }

    const mergedPath = path.join(workspaceRoot, 'graphify-out', 'merged-graph.json');
    const statusPath = path.join(workspaceRoot, 'graphify-out', 'workspace-async-refresh-status.json');
    const statePath = path.join(workspaceRoot, 'graphify-out', 'workspace-graph-state.json');
    const routingPath = path.join(workspaceRoot, 'AGENTS.md');
    const hookPath = path.join(api, '.git', 'hooks', 'post-commit');
    const beforeMerged = fs.readFileSync(mergedPath, 'utf8');
    const beforeManagedFiles = [routingPath, hookPath].map(snapshotFile);
    const initialEvents = readProviderEvents(providerLog);
    expect(fs.readFileSync(hookPath, 'utf8')).toContain('SPEC_FIRST_INTERNAL_WORKSPACE_CODEGRAPH_COMMAND=');
    expect(fs.readFileSync(hookPath, 'utf8')).toContain('SPEC_FIRST_INTERNAL_WORKSPACE_GRAPHIFY_COMMAND=');

    fs.writeFileSync(provider.delayControl, '350\n');
    fs.writeFileSync(path.join(api, 'value.txt'), 'api-v2\n');
    expect(run('git', ['add', 'value.txt'], { cwd: api }).status).toBe(0);
    const firstCommitStartedAt = Date.now();
    const firstCommit = run('git', ['commit', '-q', '-m', 'change-v2'], {
      cwd: api,
      env: commitEnv,
    });
    const firstCommitDurationMs = Date.now() - firstCommitStartedAt;
    expect(firstCommit.status).toBe(0);
    expect(firstCommitDurationMs).toBeLessThan(1250);
    await waitFor(() => readProviderEvents(providerLog).slice(initialEvents.length)
      .some((event) => event.provider === 'graphify' && event.event === 'start' && event.action === 'extract'));

    fs.writeFileSync(path.join(api, 'value.txt'), 'api-v3\n');
    expect(run('git', ['add', 'value.txt'], { cwd: api }).status).toBe(0);
    const secondCommit = run('git', ['commit', '-q', '-m', 'change-v3'], {
      cwd: api,
      env: commitEnv,
    });
    expect(secondCommit.status).toBe(0);

    await waitFor(() => {
      if (!fs.existsSync(statusPath)
        || fs.existsSync(asyncLockPath(workspaceRoot))
        || fs.existsSync(lifecycleLockPath(workspaceRoot))
        || fs.existsSync(pendingPath(workspaceRoot))) return null;
      const receipt = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      const merged = fs.readFileSync(mergedPath, 'utf8');
      return receipt.ok === true && receipt.iterations === 2 && merged.includes('api-v3')
        ? { receipt, merged }
        : null;
    });

    const events = readProviderEvents(providerLog);
    const refreshCodegraph = events.slice(initialEvents.length)
      .filter((event) => event.provider === 'codegraph');
    expect(refreshCodegraph).toHaveLength(4);
    expect(refreshCodegraph.every((event) => event.action === 'sync')).toBe(true);
    for (const event of refreshCodegraph) expect(event.leaked_env).toEqual({});
    expect(fs.readFileSync(path.join(api, '.codegraph', 'codegraph.db'), 'utf8')).toContain('api-v3');
    const refreshStarts = events.slice(initialEvents.length)
      .filter((event) => event.provider === 'graphify' && event.event === 'start');
    expect(refreshStarts).toHaveLength(6);
    expect(Math.max(...refreshStarts.map((event) => event.active_count))).toBe(1);
    for (const event of refreshStarts) expect(event.leaked_env).toEqual({});
    expect([routingPath, hookPath].map(snapshotFile)).toEqual(beforeManagedFiles);
    const head = run('git', ['rev-parse', 'HEAD'], { cwd: api }).stdout.trim();
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    expect(state).toMatchObject({ operation_status: 'complete', refresh_mode: 'commit-hook-spec-first-async' });
    expect(state.repos.find((repo) => repo.repo_id === 'api').head_sha).toBe(head);
    expect(fs.readFileSync(mergedPath, 'utf8')).not.toBe(beforeMerged);

    fs.rmSync(provider.delayControl, { force: true });
    const lastKnownGood = fs.readFileSync(mergedPath, 'utf8');
    const beforeFailureEventCount = readProviderEvents(providerLog).length;
    fs.writeFileSync(provider.failControl, '1\n');
    fs.writeFileSync(path.join(api, 'value.txt'), 'api-v4\n');
    expect(run('git', ['add', 'value.txt'], { cwd: api }).status).toBe(0);
    expect(run('git', ['commit', '-q', '-m', 'failing-refresh'], {
      cwd: api,
      env: commitEnv,
    }).status).toBe(0);
    await waitFor(() => {
      if (!fs.existsSync(statusPath)) return null;
      const receipt = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      return receipt.ok === false && !fs.existsSync(asyncLockPath(workspaceRoot)) ? receipt : null;
    });
    expect(fs.readFileSync(mergedPath, 'utf8')).toBe(lastKnownGood);
    const failureStarts = readProviderEvents(providerLog).slice(beforeFailureEventCount)
      .filter((event) => event.provider === 'graphify' && event.event === 'start');
    expect(failureStarts).toHaveLength(3);
    for (const event of failureStarts) expect(event.leaked_env).toEqual({});

    fs.rmSync(provider.failControl, { force: true });
    const recovered = run(process.execPath, buildArgs, { cwd: workspaceRoot, env: baseEnv });
    expect(recovered.status).toBe(0);
    expect(fs.readFileSync(mergedPath, 'utf8')).toContain('api-v4');
    expect(fs.existsSync(statusPath)).toBe(false);
  }, 30000);

  unixTest('CodeGraph sync failure stays visible even when Graphify refresh succeeds', async () => {
    const fixture = createFixture('wg-codegraph-failure');
    const {
      workspaceRoot,
      api,
      providerLog,
      provider,
      baseEnv,
      commitEnv,
      buildArgs,
    } = fixture;
    expect(run(process.execPath, buildArgs, { cwd: workspaceRoot, env: baseEnv }).status).toBe(0);
    const initialEvents = readProviderEvents(providerLog);
    const statusPath = path.join(workspaceRoot, 'graphify-out', 'workspace-async-refresh-status.json');
    const statePath = path.join(workspaceRoot, 'graphify-out', 'workspace-graph-state.json');
    const mergedPath = path.join(workspaceRoot, 'graphify-out', 'merged-graph.json');
    const beforeCodegraph = fs.readFileSync(path.join(api, '.codegraph', 'codegraph.db'), 'utf8');

    fs.writeFileSync(provider.codegraphFailControl, '1\n');
    fs.writeFileSync(path.join(api, 'value.txt'), 'api-codegraph-failure-v2\n');
    expect(run('git', ['add', 'value.txt'], { cwd: api }).status).toBe(0);
    expect(run('git', ['commit', '-q', '-m', 'codegraph-sync-fails'], {
      cwd: api,
      env: commitEnv,
    }).status).toBe(0);

    await waitFor(() => {
      if (!fs.existsSync(statusPath)
        || fs.existsSync(asyncLockPath(workspaceRoot))
        || fs.existsSync(lifecycleLockPath(workspaceRoot))) return null;
      const receipt = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      return receipt.ok === false ? receipt : null;
    });

    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    expect(state).toMatchObject({
      operation_status: 'partial',
      reason_code: 'workspace-codegraph-sync-partial',
      refresh_mode: 'commit-hook-spec-first-async',
    });
    expect(state.repos.find((repo) => repo.repo_id === 'api')).toMatchObject({
      codegraph_status: 'failed',
      graphify_status: 'ready',
      reason_code: 'codegraph-sync-failed',
    });
    expect(fs.readFileSync(path.join(api, '.codegraph', 'codegraph.db'), 'utf8')).toBe(beforeCodegraph);
    expect(fs.readFileSync(mergedPath, 'utf8')).toContain('api-codegraph-failure-v2');

    const refreshEvents = readProviderEvents(providerLog).slice(initialEvents.length);
    const codegraphEvents = refreshEvents.filter((event) => event.provider === 'codegraph');
    expect(codegraphEvents).toHaveLength(2);
    expect(codegraphEvents.every((event) => event.action === 'sync')).toBe(true);
    expect(codegraphEvents.some((event) => ['install', 'init'].includes(event.action))).toBe(false);
    for (const event of codegraphEvents) expect(event.leaked_env).toEqual({});
    expect(refreshEvents.filter((event) => (
      event.provider === 'graphify' && event.event === 'start'
    ))).toHaveLength(3);

    const beforeRecoveryEvents = readProviderEvents(providerLog).length;
    fs.rmSync(provider.codegraphFailControl, { force: true });
    fs.writeFileSync(path.join(api, 'value.txt'), 'api-codegraph-recovered-v3\n');
    expect(run('git', ['add', 'value.txt'], { cwd: api }).status).toBe(0);
    expect(run('git', ['commit', '-q', '-m', 'codegraph-sync-recovers'], {
      cwd: api,
      env: commitEnv,
    }).status).toBe(0);

    await waitFor(() => {
      if (!fs.existsSync(statusPath)
        || fs.existsSync(asyncLockPath(workspaceRoot))
        || fs.existsSync(lifecycleLockPath(workspaceRoot))) return null;
      const receipt = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      const recoveredState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return receipt.ok === true && recoveredState.operation_status === 'complete'
        ? { receipt, recoveredState }
        : null;
    });

    const recoveredState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    expect(recoveredState).toMatchObject({
      operation_status: 'complete',
      reason_code: '',
      refresh_mode: 'commit-hook-spec-first-async',
    });
    expect(recoveredState.repos.find((repo) => repo.repo_id === 'api')).toMatchObject({
      codegraph_status: 'ready',
      graphify_status: 'ready',
      reason_code: '',
    });
    expect(fs.readFileSync(path.join(api, '.codegraph', 'codegraph.db'), 'utf8'))
      .toContain('api-codegraph-recovered-v3');
    expect(fs.readFileSync(mergedPath, 'utf8')).toContain('api-codegraph-recovered-v3');

    const recoveryEvents = readProviderEvents(providerLog).slice(beforeRecoveryEvents);
    expect(recoveryEvents.filter((event) => event.provider === 'codegraph'))
      .toHaveLength(2);
    expect(recoveryEvents.filter((event) => (
      event.provider === 'codegraph' && ['install', 'init'].includes(event.action)
    ))).toHaveLength(0);
  }, 30000);

  unixTest('an explicit build fails closed while the async worker owns the lifecycle lease', async () => {
    const fixture = createFixture('wg-explicit-race');
    const { workspaceRoot, api, provider, baseEnv, commitEnv, buildArgs } = fixture;
    expect(run(process.execPath, buildArgs, { cwd: workspaceRoot, env: baseEnv }).status).toBe(0);

    fs.writeFileSync(provider.delayControl, '350\n');
    fs.writeFileSync(path.join(api, 'value.txt'), 'api-concurrent-v2\n');
    expect(run('git', ['add', 'value.txt'], { cwd: api }).status).toBe(0);
    expect(run('git', ['commit', '-q', '-m', 'async-owns-lifecycle'], {
      cwd: api,
      env: commitEnv,
    }).status).toBe(0);
    await waitFor(() => fs.existsSync(lifecycleLockPath(workspaceRoot)));

    const explicit = run(process.execPath, [...buildArgs, '--json'], { cwd: workspaceRoot, env: baseEnv });
    expect(explicit.status).toBe(1);
    expect(explicit.stdout).toContain('workspace-graph-lifecycle-busy');

    const statusPath = path.join(workspaceRoot, 'graphify-out', 'workspace-async-refresh-status.json');
    const mergedPath = path.join(workspaceRoot, 'graphify-out', 'merged-graph.json');
    await waitFor(() => {
      if (!fs.existsSync(statusPath) || fs.existsSync(lifecycleLockPath(workspaceRoot))) return false;
      const receipt = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      return receipt.ok === true && fs.readFileSync(mergedPath, 'utf8').includes('api-concurrent-v2');
    });
  }, 30000);

  unixTest('clean is fail-closed during a worker and stale hook invocations stay disabled', async () => {
    const fixture = createFixture('wg-clean-race');
    const { workspaceRoot, api, provider, baseEnv, commitEnv, buildArgs } = fixture;
    expect(run(process.execPath, buildArgs, { cwd: workspaceRoot, env: baseEnv }).status).toBe(0);

    fs.writeFileSync(provider.delayControl, '350\n');
    fs.writeFileSync(path.join(api, 'value.txt'), 'api-clean-race-v2\n');
    expect(run('git', ['add', 'value.txt'], { cwd: api }).status).toBe(0);
    expect(run('git', ['commit', '-q', '-m', 'clean-race'], {
      cwd: api,
      env: commitEnv,
    }).status).toBe(0);
    await waitFor(() => fs.existsSync(lifecycleLockPath(workspaceRoot)));

    const cleanArgs = [
      setupScript,
      '--only', 'codegraph,graphify',
      '--workspace-graph-clean',
      '--repos', 'api,web',
    ];
    const busyClean = run(process.execPath, [...cleanArgs, '--json'], { cwd: workspaceRoot, env: baseEnv });
    expect(busyClean.status).toBe(1);
    expect(busyClean.stdout).toContain('workspace-graph-lifecycle-busy');
    expect(fs.existsSync(path.join(workspaceRoot, 'graphify-out', 'merged-graph.json'))).toBe(true);
    expect(fs.readFileSync(path.join(api, '.git', 'hooks', 'post-commit'), 'utf8'))
      .toContain('spec-first-graphify-workspace-refresh');

    const statusPath = path.join(workspaceRoot, 'graphify-out', 'workspace-async-refresh-status.json');
    await waitFor(() => {
      if (!fs.existsSync(statusPath) || fs.existsSync(lifecycleLockPath(workspaceRoot))) return false;
      return JSON.parse(fs.readFileSync(statusPath, 'utf8')).ok === true;
    });
    expect(run(process.execPath, cleanArgs, { cwd: workspaceRoot, env: baseEnv }).status).toBe(0);
    expect(fs.existsSync(path.join(workspaceRoot, 'graphify-out'))).toBe(false);
    expect(fs.existsSync(path.join(api, '.git', 'hooks', 'post-commit'))).toBe(false);

    const lateTrigger = run(process.execPath, [
      asyncRefreshScript,
      '--trigger',
      '--workspace', workspaceRoot,
      '--command', process.execPath,
      '--args', JSON.stringify(buildArgs),
    ], { cwd: workspaceRoot, env: commitEnv });
    expect(lateTrigger.status).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(fs.existsSync(path.join(workspaceRoot, 'graphify-out'))).toBe(false);
    expect(fs.existsSync(lifecycleLockPath(workspaceRoot))).toBe(false);
  }, 30000);
});
