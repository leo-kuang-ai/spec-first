'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const graphify = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
const { collectSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
const { normalizeSetupFacts } = require('../../src/cli/helpers/setup-facts');
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const schema = require('../../docs/contracts/provider-readiness.schema.json');

describe('Graphify 当前安装身份的发布与消费', () => {
  let root;
  let context;
  let packages;
  let version;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-identity-'));
    const bin = path.join(root, '.local/bin');
    const interpreter = path.join(root, 'tool/bin/python');
    const command = path.join(bin, 'graphify');
    fs.mkdirSync(bin, { recursive: true });
    fs.writeFileSync(command, `#!${interpreter}\n`);
    fs.chmodSync(command, 0o755);
    version = '0.9.57';
    packages = [['graphifyy', version], ['networkx', '3.5']];
    context = { repoRoot: root, homeDir: root, host: 'codex', installationOnly: true,
      env: { HOME: root, PATH: bin },
      dependency: { ecosystem: 'pypi', package: 'graphifyy', version: '0.9.57', command: 'graphify' },
      runner: (cmd, args) => {
        let stdout;
        if (cmd === 'python3' && args[0] === '-c') stdout = '3.12.4';
        if (cmd === 'uv' && args[0] === '--version') stdout = 'uv 0.8.0';
        if (cmd === 'uv' && args.join(' ') === 'tool dir --bin') stdout = bin;
        if (cmd === interpreter && args[0] === '-c') stdout = JSON.stringify({ version, packages });
        if (cmd === command && args[0] === '--version') stdout = `graphify ${version}`;
        return { exit_code: stdout === undefined ? 1 : 0, stdout: stdout || '', stderr: '' };
      },
    };
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  test('安装与图验证都发布已解析身份，经 facts 与 CLI 保留且不输出完整包清单', () => {
    for (const installationOnly of [true, false]) {
      const readiness = graphify.verify({ ...context, installationOnly });
      expect(readiness.provider_identity).toMatchObject({ package: 'graphifyy', version, installer: 'uv', inventory_sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
      expect(validateAgainstSchema(schema, readiness).valid).toBe(true);
      const { toolFacts } = collectSetupFacts({ ...context, registry: {}, providerResults: [{ readiness, verified: true, source: 'read-only-probe' }] });
      expect(normalizeSetupFacts(toolFacts).provider_readiness[0].provider_identity).toEqual(readiness.provider_identity);
      expect(JSON.stringify(readiness.provider_identity)).not.toContain('networkx');
    }
  });

  test('inventory 顺序不改变身份，包版本变化改变摘要', () => {
    const first = graphify.verify(context).provider_identity;
    packages.reverse();
    expect(graphify.verify(context).provider_identity).toEqual(first);
    packages[0][1] = '3.6';
    expect(graphify.verify(context).provider_identity.inventory_sha256).not.toBe(first.inventory_sha256);
  });

  test('版本不符不伪造 pin 身份；空 inventory 不伪造已知摘要', () => {
    version = '9.9.9';
    expect(graphify.verify(context)).not.toHaveProperty('provider_identity');
    version = '0.9.57';
    packages = [];
    expect(graphify.verify(context).provider_identity.inventory_sha256).toBeNull();
  });
});
