'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { prepareCodegraphLaunch } = require('../../skills/spec-runtime-setup/scripts/providers/codegraph-launcher.cjs');

describe('CodeGraph Windows launcher 解析合同（不执行 Windows 二进制）', () => {
  let root;
  let wrapper;
  let bundleRoot;
  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph windows ')));
    wrapper = path.join(root, 'codegraph.cmd');
    fs.writeFileSync(wrapper, '@echo off\n');
    const packageRoot = path.join(root, 'node_modules', '@colbymchenry', 'codegraph');
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'npm-shim.js'), 'throw new Error("must not execute");');
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name: '@colbymchenry/codegraph', version: '1.6.0', optionalDependencies: { '@colbymchenry/codegraph-win32-x64': '1.6.0' } }));
    bundleRoot = path.join(root, 'node_modules', '@colbymchenry', 'codegraph-win32-x64');
    fs.mkdirSync(path.join(bundleRoot, 'lib', 'dist', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(bundleRoot, 'package.json'), JSON.stringify({ name: '@colbymchenry/codegraph-win32-x64', version: '1.6.0' }));
    fs.writeFileSync(path.join(bundleRoot, 'node.exe'), 'fixture, not executed');
    fs.writeFileSync(path.join(bundleRoot, 'lib', 'dist', 'bin', 'codegraph.js'), 'fixture, not executed');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  const resolve = (command, args = ['--version']) => prepareCodegraphLaunch({ command, args, platform: 'win32', arch: 'x64', env: { PATH: root, PATHEXT: '.EXE;.CMD' } });
  test('保留含空格路径、Node flags 和原始 argv，不拼接 shell', () => {
    const result = resolve('codegraph', ['query', 'a b; echo unsafe']);
    expect(result).toMatchObject({ ok: true, command: path.join(bundleRoot, 'node.exe'), args: ['--liftoff-only', '--disable-warning=ExperimentalWarning', path.join(bundleRoot, 'lib', 'dist', 'bin', 'codegraph.js'), 'query', 'a b; echo unsafe'] });
  });
  test('发布当前 npm 平台身份，argv 不参与安装身份', () => {
    const first = resolve(wrapper).provider_identity;
    expect(first).toMatchObject({ package: '@colbymchenry/codegraph', version: '1.6.0', installer: 'npm', command: path.join(bundleRoot, 'node.exe'), inventory_sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(resolve(wrapper, ['status']).provider_identity).toEqual(first);
    const codegraph = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const runner = jest.fn(() => ({ exit_code: 0, stdout: 'codegraph 1.6.0', stderr: '' }));
    const context = { repoRoot: root, platform: 'windows', arch: 'x64', env: { PATH: root, PATHEXT: '.EXE;.CMD' }, runner, installationOnly: true, dependency: { version: '1.6.0' } };
    expect(codegraph.readCurrentIdentity(context)).toEqual({ status: 'confirmed', identity: first });
    expect(runner.mock.calls[0][0]).toBe(path.join(bundleRoot, 'node.exe'));
    expect(runner.mock.calls[0][2].timeoutMs).toBeLessThanOrEqual(5000);
    const readiness = codegraph.verify(context);
    expect(readiness.provider_identity).toEqual(first);
    const schema = require('../../docs/contracts/provider-readiness.schema.json');
    const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
    const { collectSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const { normalizeSetupFacts } = require('../../src/cli/helpers/setup-facts');
    expect(validateAgainstSchema(schema, readiness).valid).toBe(true);
    const { toolFacts } = collectSetupFacts({ ...context, registry: {}, providerResults: [{ readiness, verified: true, source: 'read-only-probe' }] });
    expect(normalizeSetupFacts(toolFacts).provider_readiness[0].provider_identity).toEqual(first);
    runner.mockReturnValue({ exit_code: 1, stdout: '' });
    expect(codegraph.readCurrentIdentity(context).status).toBe('unknown');
    runner.mockReturnValue({ exit_code: 0, stdout: 'codegraph 9.9.9' });
    expect(codegraph.readCurrentIdentity(context).status).toBe('stale');
  });
  test.each(['confirmed', 'failed', 'mismatch', 'missing'])('前序 query 成功后最终身份 %s 决定 producer freshness', (outcome) => {
    const codegraph = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    fs.mkdirSync(path.join(root, '.codegraph'));
    fs.writeFileSync(path.join(root, '.codegraph', 'codegraph.db'), 'fixture');
    if (outcome === 'missing') fs.unlinkSync(wrapper);
    const runner = (command, args) => args[0] === 'status'
      ? { exit_code: 0, stdout: require('../fixtures/mcp-setup/codegraph-status.cjs')(root) }
      : command === path.join(bundleRoot, 'node.exe')
      ? { exit_code: outcome === 'failed' ? 1 : 0, stdout: outcome === 'mismatch' ? 'codegraph 9.9.9' : 'codegraph 1.6.0' }
      : { exit_code: 0, stdout: 'codegraph 1.6.0' };
    const context = { repoRoot: root, platform: 'windows', arch: 'x64', env: { PATH: root }, runner, configured: true, dependency: { version: '1.6.0' } };
    const expected = { confirmed: 'fresh', failed: 'unknown', mismatch: 'degraded', missing: 'unknown' }[outcome];
    for (const result of [codegraph.verify(context), codegraph.apply(context, { mutation: true, dependency_version: '1.6.0', actions: [] })]) {
      expect(result.readiness_status).toBe(expected);
      expect(result.lifecycle.query_verified).toBe(true);
      expect(codegraph.reconcileConfigured(result, { configured_status: 'ready' }).readiness_status).toBe(expected);
      if (outcome !== 'confirmed') expect(result).not.toHaveProperty('provider_identity');
    }
  });
  test('版本探针期间平台身份发生变化不发布旧身份', () => {
    const codegraph = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const runner = () => {
      fs.writeFileSync(path.join(bundleRoot, 'package.json'), JSON.stringify({ name: '@colbymchenry/codegraph-win32-x64', version: '9.9.9' }));
      return { exit_code: 0, stdout: 'codegraph 1.6.0' };
    };
    expect(codegraph.readCurrentIdentity({ repoRoot: root, platform: 'windows', arch: 'x64', env: { PATH: root }, runner }).status).toBe('stale');
  });
  test('非 npm 原生程序不伪造安装身份或执行身份探针', () => {
    const codegraph = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    fs.writeFileSync(path.join(root, 'codegraph.exe'), 'native fixture');
    const runner = jest.fn();
    expect(codegraph.readCurrentIdentity({ repoRoot: root, platform: 'windows', env: { PATH: root }, runner }).status).toBe('unknown');
    expect(runner).not.toHaveBeenCalled();
  });
  test('记录的绝对 npm wrapper 同样经过重新解析', () => {
    expect(resolve(wrapper).command).toBe(path.join(bundleRoot, 'node.exe'));
  });
  test.each(['absolute', 'path'])('标准 local .bin wrapper 的 %s 入口不绕过解析', (kind) => {
    const localBin = path.join(root, 'node_modules', '.bin');
    fs.mkdirSync(localBin);
    const localWrapper = path.join(localBin, 'codegraph.cmd');
    fs.writeFileSync(localWrapper, '@echo off\n');
    const options = { command: kind === 'absolute' ? localWrapper : 'codegraph', args: ['--version'], platform: 'win32', arch: 'x64', env: { PATH: localBin, PATHEXT: '.EXE;.CMD' } };
    expect(prepareCodegraphLaunch(options).command).toBe(path.join(bundleRoot, 'node.exe'));
    fs.rmSync(bundleRoot, { recursive: true, force: true });
    expect(prepareCodegraphLaunch(options)).toMatchObject({ ok: false, reason_code: 'codegraph-platform-bundle-missing' });
  });
  test('平台包版本不符不回退 npm shim', () => {
    fs.writeFileSync(path.join(bundleRoot, 'package.json'), JSON.stringify({ name: '@colbymchenry/codegraph-win32-x64', version: '1.5.0' }));
    expect(resolve(wrapper)).toMatchObject({ ok: false, reason_code: 'codegraph-platform-version-mismatch' });
  });
  test('缺少实际入口不能把 package manifest 存在当作可执行', () => {
    fs.unlinkSync(path.join(bundleRoot, 'node.exe'));
    expect(resolve(wrapper)).toMatchObject({ ok: false, reason_code: 'codegraph-launcher-identity-unavailable' });
  });
  test('非 CodeGraph 命令不受 provider guard 改写', () => {
    expect(resolve('git', ['status'])).toEqual({ ok: true, command: 'git', args: ['status'] });
  });
});

(process.platform === 'win32' ? test.skip : test)('真实默认 runner 从 Unix npm 布局探测身份，不执行 shim 或写安装目录', () => {
  const codegraph = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-identity-live-')));
  try {
    const bin = path.join(root, 'bin');
    const packageRoot = path.join(root, 'node_modules', '@colbymchenry', 'codegraph');
    const platformPackage = `@colbymchenry/codegraph-${process.platform}-${process.arch}`;
    const bundleRoot = path.join(root, 'node_modules', platformPackage);
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.mkdirSync(path.join(bundleRoot, 'bin'), { recursive: true });
    const shim = path.join(packageRoot, 'npm-shim.js');
    fs.writeFileSync(shim, '#!/bin/sh\nexit 99\n', { mode: 0o755 });
    fs.symlinkSync(shim, path.join(bin, 'codegraph'));
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name: '@colbymchenry/codegraph', version: '1.6.0', optionalDependencies: { [platformPackage]: '1.6.0' } }));
    fs.writeFileSync(path.join(bundleRoot, 'package.json'), JSON.stringify({ name: platformPackage, version: '1.6.0' }));
    fs.writeFileSync(path.join(bundleRoot, 'bin', 'codegraph'), '#!/bin/sh\nprintf "codegraph 1.6.0\\n"\n', { mode: 0o755 });
    const snapshot = () => fs.readdirSync(root, { recursive: true }).sort().map((relative) => {
      const filename = path.join(root, relative);
      const stat = fs.lstatSync(filename);
      return [relative, stat.mode, stat.isSymbolicLink() ? fs.readlinkSync(filename) : stat.isFile() ? fs.readFileSync(filename).toString('base64') : null];
    });
    const before = snapshot();
    expect(codegraph.readCurrentIdentity({ repoRoot: root, env: { HOME: root, PATH: bin } })).toMatchObject({ status: 'confirmed', identity: { command: path.join(bundleRoot, 'bin', 'codegraph'), installer: 'npm' } });
    expect(snapshot()).toEqual(before);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
