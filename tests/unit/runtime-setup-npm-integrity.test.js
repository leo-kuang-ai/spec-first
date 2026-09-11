'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { installBaselineTools } = require('../../skills/spec-runtime-setup/scripts/lib/installation-executor.cjs');

describe('required npm warmup 的字节完整性', () => {
  let root;
  let context;
  let entry;
  const bytes = Buffer.from('controlled package archive bytes');
  const digest = `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-npm-integrity-'));
    entry = { id: 'fixture', required: true, resolved_dependency: { package: '@fixture/mcp', version: '1.2.3', integrity: digest, source: 'npmjs' }, installation: { kind: 'warmup', command: 'npx', args: ['-y', '@fixture/mcp@1.2.3', '--help'] } };
    context = { host: 'codex', platform: 'macos', env: {}, effectiveRegistry: { tools: [entry] }, runner: jest.fn((command, args) => {
      if (command === 'npm' && args[0] === 'pack') {
        const dir = args[args.indexOf('--pack-destination') + 1];
        fs.writeFileSync(path.join(dir, 'fixture-mcp-1.2.3.tgz'), bytes);
        return { exit_code: 0, status: 'success', stdout: JSON.stringify([{ name: '@fixture/mcp', version: '1.2.3', filename: 'fixture-mcp-1.2.3.tgz', integrity: digest }]), stderr: '' };
      }
      return { exit_code: 0, stdout: '', stderr: '', status: 'success' };
    }) };
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  const run = () => installBaselineTools(context, root).get('fixture');

  test('仅在归档摘要匹配后执行同一归档，并发布限定范围的身份事实', () => {
    const result = run();
    expect(result).toMatchObject({ status: 'ready', dependency_identity: { package: '@fixture/mcp', version: '1.2.3', integrity: digest, integrity_status: 'verified', verification_scope: 'top-level-package-archive' } });
    const schema = require('../../docs/contracts/tool-facts.schema.json').$defs.npmArchiveIdentity;
    const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
    expect(validateAgainstSchema(schema, result.dependency_identity).valid).toBe(true);
    expect(validateAgainstSchema(schema, { ...result.dependency_identity, verification_scope: 'all-dependencies' }).valid).toBe(false);
    const pack = context.runner.mock.calls.find(([cmd]) => cmd === 'npm');
    expect(pack[1]).toEqual(expect.arrayContaining(['pack', '--ignore-scripts', '@fixture/mcp@1.2.3']));
    const launch = context.runner.mock.calls.find(([cmd]) => cmd === 'npx');
    expect(launch[1][1]).toMatch(/fixture-mcp-1\.2\.3\.tgz$/);
    expect(launch[1]).not.toContain('@fixture/mcp@1.2.3');
    expect(launch[1][1]).toMatch(/^file:/);
    expect(fs.existsSync(path.dirname(launch[1][1].slice(5)))).toBe(false);
  });

  test.each(['digest', 'pin', 'missing-digest'])('%s 不匹配时不执行包，也不写成功缓存', (kind) => {
    if (kind === 'digest') entry.resolved_dependency.integrity = `sha512-${Buffer.alloc(64).toString('base64')}`;
    if (kind === 'pin') entry.resolved_dependency.version = '9.9.9';
    if (kind === 'missing-digest') delete entry.resolved_dependency.integrity;
    expect(run().status).toBe('failed');
    expect(context.runner.mock.calls.some(([cmd]) => cmd === 'npx')).toBe(false);
    expect(fs.existsSync(path.join(root, '.spec-first/cache/mcp-warmup/codex/macos/fixture.json'))).toBe(false);
  });

  test('npm 报告的归档版本不符时不执行', () => {
    const original = context.runner.getMockImplementation();
    context.runner.mockImplementation((command, args) => {
      const result = original(command, args);
      if (command === 'npm') result.stdout = result.stdout.replace('\"version\":\"1.2.3\"', '\"version\":\"9.9.9\"');
      return result;
    });
    expect(run()).toMatchObject({ status: 'failed', reason_code: 'npm-archive-identity-mismatch' });
    expect(context.runner.mock.calls.some(([cmd]) => cmd === 'npx')).toBe(false);
  });

  test.each(['symlink', 'hardlink', 'directory'])('拒绝 %s 归档，不执行包', (kind) => {
    const outside = path.join(root, 'unrelated');
    fs.writeFileSync(outside, bytes);
    context.runner.mockImplementation((command, args) => {
      if (command === 'npm') {
        const archive = path.join(args[args.indexOf('--pack-destination') + 1], 'fixture.tgz');
        if (kind === 'symlink') fs.symlinkSync(outside, archive);
        if (kind === 'hardlink') fs.linkSync(outside, archive);
        if (kind === 'directory') fs.mkdirSync(archive);
      }
      return { exit_code: 0, status: 'success', stdout: '', stderr: '' };
    });
    expect(run().status).toBe('failed');
    expect(context.runner.mock.calls.some(([cmd]) => cmd === 'npx')).toBe(false);
    expect(fs.readFileSync(outside)).toEqual(bytes);
  });

  test('镜像下载也必须通过同一摘要校验', () => {
    const original = context.runner.getMockImplementation();
    context.effectiveRegistry.install_mirrors = { npm: { environment: { npm_config_registry: 'https://mirror.invalid' } } };
    context.runner.mockImplementation((command, args, options) => {
      if (command === 'npm' && !options.mirrorAttempt) return { exit_code: 1, status: 'failed', stdout: '', stderr: 'offline' };
      return original(command, args);
    });
    expect(run()).toMatchObject({ status: 'ready', install_source: 'mirror', mirror_used: true, dependency_identity: { integrity: digest } });
  });

  test('下载失败不执行包，并保留失败来源', () => {
    context.runner.mockReturnValue({ exit_code: 1, status: 'failed', stderr: 'offline', stdout: '' });
    expect(run()).toMatchObject({ status: 'failed', reason_code: 'npm-archive-fetch-failed', install_source: 'official' });
    expect(context.runner).toHaveBeenCalledTimes(1);
  });

  test('缺少归档不能由命令退出码 0 冒充已验证', () => {
    context.runner.mockReturnValue({ exit_code: 0, status: 'success', stderr: '', stdout: '' });
    expect(run()).toMatchObject({ status: 'failed', reason_code: 'npm-archive-invalid' });
    expect(context.runner.mock.calls.some(([cmd]) => cmd === 'npx')).toBe(false);
  });
});
