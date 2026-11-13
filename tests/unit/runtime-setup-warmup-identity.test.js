'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const archiveBytes = Buffer.from('warmup cache identity fixture');
const archiveIntegrity = `sha512-${crypto.createHash('sha512').update(archiveBytes).digest('base64')}`;
const { installBaselineTools, warmupCacheHit } = require('../../skills/spec-runtime-setup/scripts/lib/installation-executor.cjs');

describe('warmup 缓存的依赖身份与来源', () => {
  let root;
  let entry;
  let context;
  let cachePath;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'warmup-identity-'));
    entry = {
      id: 'context7', required: true,
      resolved_dependency: { package: '@upstash/context7-mcp', version: '4.0.7', integrity: archiveIntegrity, source: 'npmjs' },
      installation: { kind: 'warmup', command: 'npx', args: ['-y', '@upstash/context7-mcp@4.0.7', '--help'] },
    };
    context = {
      env: {}, host: 'codex', platform: 'macos',
      effectiveRegistry: { tools: [entry], install_mirrors: { npm: { environment: { npm_config_registry: 'https://mirror.invalid' } } } },
      runner: jest.fn((command, args) => {
        if (command === 'npm' && args[0] === 'pack') {
          fs.writeFileSync(path.join(args[args.indexOf('--pack-destination') + 1], 'fixture.tgz'), archiveBytes);
          return { exit_code: 0, status: 'success', stderr: '', stdout: JSON.stringify([{ name: entry.resolved_dependency.package, version: entry.resolved_dependency.version, filename: 'fixture.tgz', integrity: archiveIntegrity }]) };
        }
        return { exit_code: 0, status: 'success', stdout: '', stderr: '' };
      }),
    };
    cachePath = path.join(root, '.spec-first/cache/mcp-warmup/codex/macos/context7.json');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  const hit = () => warmupCacheHit(context, root, entry, entry.installation.command, entry.installation.args);

  test.each(['integrity', 'source', 'version'])('依赖 %s 改变后不复用 warmup', (field) => {
    installBaselineTools(context, root);
    expect(hit()).toBe(true);
    entry.resolved_dependency[field] += '-changed';
    expect(hit()).toBe(false);
    expect(context.runner).toHaveBeenCalledTimes(2);
  });

  test('镜像成功的缓存命中保留来源，且不伪造本次执行 attempts', () => {
    const successful = context.runner.getMockImplementation();
    context.runner.mockImplementation((command, args, options) => options.mirrorAttempt
      ? successful(command, args, options) : { exit_code: 1, status: 'failed', stdout: '', stderr: '' });
    const first = installBaselineTools(context, root).get(entry.id);
    expect(first).toMatchObject({ status: 'ready', install_source: 'mirror', mirror_used: true });
    const second = installBaselineTools(context, root).get(entry.id);
    expect(second).toMatchObject({ reason_code: 'warmup-cache-hit', install_source: 'mirror', mirror_used: true, attempts: [] });
    expect(context.runner).toHaveBeenCalledTimes(4);
  });

  test('成功后强制尝试失败，不能复用旧成功缓存', () => {
    installBaselineTools(context, root);
    expect(hit()).toBe(true);
    const successful = context.runner.getMockImplementation();
    context.env.SPEC_FIRST_FORCE_WARMUP = '1';
    context.runner.mockReturnValue({ exit_code: 1, status: 'failed', stderr: 'offline', stdout: '' });
    expect(installBaselineTools(context, root).get(entry.id).status).toBe('failed');
    delete context.env.SPEC_FIRST_FORCE_WARMUP;
    expect(hit()).toBe(false);
    context.runner.mockImplementation(successful);
    expect(installBaselineTools(context, root).get(entry.id).reason_code).toBe('ready');
  });

  test.each(['source', 'installer', 'verification_scope'])('不复用身份字段 %s 非法的 receipt', (field) => {
    installBaselineTools(context, root);
    const receipt = JSON.parse(fs.readFileSync(cachePath));
    receipt.dependency_identity[field] = 'invalid';
    fs.writeFileSync(cachePath, JSON.stringify(receipt));
    expect(hit()).toBe(false);
  });

  test('latest 的 TTL 过期和显式 force 都不会复用缓存', () => {
    delete entry.resolved_dependency;
    entry.installation.args = ['-y', 'example@latest', '--help'];
    context.env.SPEC_FIRST_WARMUP_LATEST_TTL_SECONDS = '60';
    installBaselineTools(context, root);
    expect(hit()).toBe(true);
    const receipt = JSON.parse(fs.readFileSync(cachePath));
    receipt.last_success_epoch -= 120;
    fs.writeFileSync(cachePath, JSON.stringify(receipt));
    expect(hit()).toBe(false);
    installBaselineTools(context, root);
    context.env.SPEC_FIRST_FORCE_WARMUP = '1';
    expect(hit()).toBe(false);
  });

  test.each(['legacy', 'future', 'invalid-time', 'invalid-provenance'])('不信任 %s 缓存', (scenario) => {
    installBaselineTools(context, root);
    const receipt = JSON.parse(fs.readFileSync(cachePath));
    if (scenario === 'legacy') receipt.schema_version = 'mcp-warmup-cache.v1';
    if (scenario === 'future') receipt.last_success_epoch = Math.floor(Date.now() / 1000) + 3600;
    if (scenario === 'invalid-time') receipt.last_success_epoch = 'not-a-time';
    if (scenario === 'invalid-provenance') receipt.install_source = 'both-failed';
    fs.writeFileSync(cachePath, JSON.stringify(receipt));
    expect(hit()).toBe(false);
  });
});
