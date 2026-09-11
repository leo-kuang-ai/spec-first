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
    expect(result).toEqual({ ok: true, command: path.join(bundleRoot, 'node.exe'), args: ['--liftoff-only', '--disable-warning=ExperimentalWarning', path.join(bundleRoot, 'lib', 'dist', 'bin', 'codegraph.js'), 'query', 'a b; echo unsafe'] });
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
