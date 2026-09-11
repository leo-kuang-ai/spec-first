'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { runProcess, runProcessSync } = require('../../skills/spec-runtime-setup/scripts/lib/process-runner.cjs');
const { defaultWorkspaceExec } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-exec.cjs');

const posixTest = process.platform === 'win32' ? test.skip : test;
const archive = path.resolve(__dirname, '../fixtures/mcp-setup/npm-archives/codegraph-1.6.0.tgz');

describe('真实 CodeGraph npm launcher 的只读启动边界', () => {
  let root;
  let command;
  let packageRoot;
  let oldBundle;
  let env;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph launcher '));
    packageRoot = path.join(root, 'prefix', 'lib', 'node_modules', '@colbymchenry', 'codegraph');
    fs.mkdirSync(packageRoot, { recursive: true });
    for (const file of ['npm-shim.js', 'package.json']) {
      fs.writeFileSync(path.join(packageRoot, file), execFileSync('tar', ['-xOf', archive, `package/${file}`]));
    }
    fs.chmodSync(path.join(packageRoot, 'npm-shim.js'), 0o755);
    const bin = path.join(root, 'prefix', 'bin');
    fs.mkdirSync(bin);
    command = path.join(bin, 'codegraph');
    fs.symlinkSync(path.join(packageRoot, 'npm-shim.js'), command);
    const platform = `${process.platform}-${process.arch}`;
    const bundles = path.join(root, 'home', '.codegraph', 'bundles');
    const cachedBin = path.join(bundles, `${platform}-1.6.0`, 'bin');
    fs.mkdirSync(cachedBin, { recursive: true });
    writeLauncher(path.join(cachedBin, 'codegraph'), '1.6.0');
    oldBundle = path.join(bundles, `${platform}-1.5.0`);
    fs.mkdirSync(oldBundle);
    fs.writeFileSync(path.join(oldBundle, 'keep'), 'must remain');
    env = { HOME: path.join(root, 'home'), PATH: [bin, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter), CODEGRAPH_NO_DOWNLOAD: '1' };
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  function writeLauncher(filename, output) {
    fs.writeFileSync(filename, `#!/bin/sh\nprintf '${output}\\n'\n`);
    fs.chmodSync(filename, 0o755);
  }
  function installPlatformBundle() {
    const platformPackage = `codegraph-${process.platform}-${process.arch}`;
    const installed = path.join(packageRoot, 'node_modules', '@colbymchenry', platformPackage);
    fs.mkdirSync(path.join(installed, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(installed, 'package.json'), JSON.stringify({ name: `@colbymchenry/${platformPackage}`, version: '1.6.0' }));
    const launcher = path.join(installed, 'bin', 'codegraph');
    writeLauncher(launcher, 'INSTALLED_BUNDLE_1.6.0');
    return launcher;
  }
  async function invoke(kind) {
    const options = { command: kind === 'async-path' ? 'codegraph' : command, args: ['--version'], env, inheritEnv: false, cwd: root, timeoutMs: 5000 };
    if (kind.startsWith('async')) return runProcess(options);
    if (kind === 'sync') return runProcessSync(options);
    return defaultWorkspaceExec(command, ['--version'], { env, cwd: root, timeoutMs: 5000, unsetEnv: Object.keys(process.env).filter((key) => !(key in env)) });
  }
  posixTest.each(['async-path', 'async-absolute', 'sync', 'workspace'])('%s 缺平台包时不执行 shim 或清理用户 cache', async (kind) => {
    const result = await invoke(kind);
    expect(fs.existsSync(path.join(oldBundle, 'keep'))).toBe(true);
    expect(result.exit_code ?? result.status).not.toBe(0);
    expect(result.reason_code).toBe('codegraph-platform-bundle-missing');
  });
  posixTest('Provider 无 DI 与 registry dependency probe 均经过真实 guard', () => {
    const providerPath = path.resolve(__dirname, '../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const executorPath = path.resolve(__dirname, '../../skills/spec-runtime-setup/scripts/lib/installation-executor.cjs');
    const runnerPath = path.resolve(__dirname, '../../skills/spec-runtime-setup/scripts/lib/process-runner.cjs');
    const script = `
      const provider = require(${JSON.stringify(providerPath)});
      const readiness = provider.verify({ repoRoot: process.cwd(), dependency: { version: '1.6.0' }, installationOnly: true });
      const probes = require(${JSON.stringify(executorPath)}).probeRegistry({
        runner: require(${JSON.stringify(runnerPath)}).runCommandSync,
        effectiveRegistry: { tools: [{ id: 'codegraph', dependencies: ['codegraph'], required: true, host_config_required: false }], helpers: [] },
      }, process.cwd(), { selectedIds: [] });
      process.stdout.write(JSON.stringify({ installed: readiness.lifecycle.installed, probe_status: probes.toolResults[0].status }));
    `;
    const result = JSON.parse(execFileSync(process.execPath, ['-e', script], { env, cwd: root, encoding: 'utf8', timeout: 10000 }));
    expect(result).toEqual({ installed: false, probe_status: 'missing' });
    expect(fs.existsSync(path.join(oldBundle, 'keep'))).toBe(true);
  });
  posixTest.each(['sync', 'workspace'])('%s 仅运行已安装 bundle 并保留缓存', async (kind) => {
    installPlatformBundle();
    const result = await invoke(kind);
    expect(result.exit_code ?? result.status).toBe(0);
    expect(result.stdout.trim()).toBe('INSTALLED_BUNDLE_1.6.0');
    expect(fs.existsSync(path.join(oldBundle, 'keep'))).toBe(true);
  });
});
