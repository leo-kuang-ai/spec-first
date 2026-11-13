'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
const { verifiedNpmInstall } = require('../../skills/spec-runtime-setup/scripts/lib/npm-warmup.cjs');

describe('CodeGraph 安装归档完整性', () => {
  let root;
  let context;
  let action;
  const bytes = fs.readFileSync(path.join(__dirname, '../fixtures/mcp-setup/npm-archives/codegraph-1.6.0.tgz'));
  const integrity = `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-install-integrity-'));
    context = {
      repoRoot: root, host: 'codex', platform: 'macos', selected: true, installationOnly: true,
      dependency: { package: '@colbymchenry/codegraph', version: '1.6.0', integrity, source: 'npmjs' },
      runner: jest.fn((command, args) => {
        if (command === 'npm' && args[0] === 'pack') {
          fs.writeFileSync(path.join(args[args.indexOf('--pack-destination') + 1], 'codegraph.tgz'), bytes);
          return { exit_code: 0, stdout: JSON.stringify([{ name: context.dependency.package, version: '1.6.0', filename: 'codegraph.tgz', integrity }]), stderr: '' };
        }
        return { exit_code: 0, stdout: '1.6.0', stderr: '' };
      }),
    };
    action = provider.plan(context).actions.find((entry) => entry.kind === 'install-dependency');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  test('全局安装消费实际校验归档并保留证据，随后清理临时归档', () => {
    const result = verifiedNpmInstall({ context, repoRoot: root, identity: context.dependency,
      command: action.command, args: action.args, executeInstall: context.runner });
    expect(result).toMatchObject({ exit_code: 0, dependency_identity: {
      integrity, installer: 'npm-pack+npm-install', verification_scope: 'top-level-package-archive',
    } });
    const installArgs = context.runner.mock.calls.find(([, args]) => args[0] === 'install')[1];
    expect(installArgs).toContain('-g');
    expect(installArgs).not.toContain('@colbymchenry/codegraph@1.6.0');
    const archive = installArgs.find((arg) => arg.startsWith('file:')).slice(5);
    expect(fs.existsSync(archive)).toBe(false);
  });

  test('直接 Provider apply 的 digest 不符不能进入 npm install 或报告 fresh', () => {
    context.dependency.integrity = `sha512-${Buffer.alloc(64).toString('base64')}`;
    const result = provider.apply(context, provider.plan(context));
    expect(context.runner.mock.calls.some(([, args]) => args[0] === 'install')).toBe(false);
    expect(result.readiness_status).toBe('degraded');
    expect(result.limitations.join(' ')).toContain('npm-archive-integrity-mismatch');
  });

  test('Provider installDependency 与 apply 共用校验，不允许缺失 digest 直接安装', () => {
    delete context.dependency.integrity;
    expect(provider.installDependency(context, action)).toMatchObject({ exit_code: 1, reason_code: 'npm-package-identity-invalid' });
    expect(context.runner).not.toHaveBeenCalled();
  });

  test('直接 apply 成功保留安装证据，CLI 不接受伪造的完整性范围', () => {
    const { normalizeSetupFacts } = require('../../src/cli/helpers/setup-facts');
    const result = provider.apply(context, provider.plan(context));
    expect(result.dependency_identity).toMatchObject({ integrity, installer: 'npm-pack+npm-install' });
    const facts = { schema_version: 'tool-facts.v2', items: [], provider_readiness: [result] };
    expect(normalizeSetupFacts(facts).provider_readiness[0].dependency_identity).toEqual(result.dependency_identity);
    result.dependency_identity.verification_scope = 'all-platform-binaries';
    expect(normalizeSetupFacts(facts).provider_readiness[0]).not.toHaveProperty('dependency_identity');
  });
});
