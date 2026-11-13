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

  test('既有 scope receipt 的摘要通过 Provider/facts/schema/normalizer，当前读取不执行命令', () => {
    const crypto = require('node:crypto');
    const out = path.join(root, 'graphify-out');
    fs.mkdirSync(out);
    const graph = '{"nodes":[],"edges":[]}';
    fs.writeFileSync(path.join(out, 'graph.json'), graph);
    const digest = crypto.createHash('sha256').update(graph).digest('hex');
    const receipt = { schema_version: 'graphify-scope-provenance.v1', provider: 'graphify', artifact_root: 'graphify-out', requirement_workspace_path: '.', operation: 'first-generation', graph_sha256: digest };
    fs.writeFileSync(path.join(out, 'spec-first-graph-scope.json'), JSON.stringify(receipt));
    const readiness = graphify.verify({ ...context, installationOnly: false });
    expect(readiness.first_generation.scope_provenance).toMatchObject({ status: 'verified', graph_sha256: digest });
    expect(validateAgainstSchema(schema, readiness).valid).toBe(true);
    const { toolFacts } = collectSetupFacts({ ...context, registry: {}, providerResults: [{ readiness, verified: true, source: 'read-only-probe' }] });
    expect(normalizeSetupFacts(toolFacts).provider_readiness[0].first_generation.scope_provenance).toEqual(readiness.first_generation.scope_provenance);
    const runner = jest.fn(() => { throw new Error('receipt reader must not execute commands'); });
    expect(graphify.readCurrentScopeProvenance({ ...context, requirementWorkspace: '.', runner })).toMatchObject({ status: 'verified', graph_sha256: digest });
    expect(runner).not.toHaveBeenCalled();
    const receiptPath = path.join(out, 'spec-first-graph-scope.json');
    const other = path.join(root, 'other-receipt.json');
    fs.writeFileSync(other, JSON.stringify(receipt));
    for (const change of ['grow', 'replace-link']) {
      const open = fs.openSync;
      let injected = false;
      const spy = jest.spyOn(fs, 'openSync').mockImplementation((filename, ...args) => {
        if (!injected && filename === receiptPath) {
          injected = true;
          if (change === 'grow') fs.appendFileSync(receiptPath, ' '.repeat(65537));
          else { fs.unlinkSync(receiptPath); fs.symlinkSync(other, receiptPath); }
        }
        return open(filename, ...args);
      });
      try {
        expect(graphify.readCurrentScopeProvenance({ ...context, requirementWorkspace: '.' }).status).toBe('invalid');
        expect(injected).toBe(true);
      } finally {
        spy.mockRestore();
        fs.unlinkSync(receiptPath);
        fs.writeFileSync(receiptPath, JSON.stringify(receipt));
      }
    }
    fs.truncateSync(path.join(out, 'spec-first-graph-scope.json'), 65537);
    expect(graphify.readCurrentScopeProvenance({ ...context, requirementWorkspace: '.' }).reason_code).toBe('graphify-scope-provenance-size-limit');
  });

  test('独立当前身份探测复用 Provider resolver，不执行构图或安装', () => {
    const runner = jest.fn(context.runner);
    const result = graphify.readCurrentIdentity({ ...context, runner });
    expect(result.status).toBe('confirmed');
    expect(result.identity).toEqual(graphify.verify(context).provider_identity);
    expect(runner.mock.calls.some(([, args]) => args.some((arg) => ['install', 'update', 'refresh', 'query'].includes(arg)))).toBe(false);
    version = '9.9.9';
    expect(graphify.readCurrentIdentity(context)).toMatchObject({ status: 'stale', reason_code: 'graphify-package-version-mismatch' });
  });

  test('当前身份解析共享总预算，不能对每个候选重新累计十秒', () => {
    jest.useFakeTimers();
    const runner = jest.fn((_command, _args, options) => {
      expect(options.timeoutMs).toBeLessThanOrEqual(5000);
      jest.advanceTimersByTime(5001);
      return { exit_code: 1, stdout: '', stderr: '', timed_out: true };
    });
    try {
      expect(graphify.readCurrentIdentity({ ...context, runner })).toMatchObject({ status: 'unknown', reason_code: 'graphify-identity-probe-timeout' });
      expect(runner).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  test.each([{ exit_code: 1 }, { exit_code: 0, timed_out: true }])('launcher 失败不等于实际版本漂移 %j', (failure) => {
    const result = graphify.readCurrentIdentity({ ...context, runner: (command, args, options) => {
      if (command.endsWith('/graphify') && args[0] === '--version') return { stdout: '', stderr: '', ...failure };
      return context.runner(command, args, options);
    } });
    expect(result.status).toBe('unknown');
  });

  // python3 存在性是环境假设而非被测契约:缺失(如精简 Windows CI)时跳过而非失败。
  const python3Available = (() => {
    try {
      return require('node:child_process')
        .spawnSync('python3', ['-I', '-c', 'import sys'], { timeout: 5000 }).status === 0;
    } catch {
      return false;
    }
  })();

  (python3Available ? test : test.skip)('隔离真实 Python 导入不向 HOME 或 package 目录写入字节码', () => {
    const { spawnSync } = require('node:child_process');
    const pythonProbe = spawnSync('python3', ['-I', '-c', 'import sys; print(sys.executable)'], { encoding: 'utf8' });
    expect(pythonProbe.status).toBe(0);
    const python = pythonProbe.stdout.trim();
    const bin = path.join(root, '.local/bin');
    const launcher = path.join(bin, 'graphify');
    fs.writeFileSync(launcher, `#!${python}\nimport probe_dependency\nprint("graphify 0.9.57")\n`);
    fs.writeFileSync(path.join(bin, 'probe_dependency.py'), 'value = 1\n');
    const metadata = path.join(root, 'graphifyy-0.9.57.dist-info');
    fs.mkdirSync(metadata);
    fs.writeFileSync(path.join(metadata, 'METADATA'), 'Metadata-Version: 2.1\nName: graphifyy\nVersion: 0.9.57\n');
    const snapshot = () => fs.readdirSync(root, { recursive: true }).sort().map((relative) => {
      const file = path.join(root, relative);
      return [relative, fs.statSync(file).isFile() ? fs.readFileSync(file).toString('base64') : null];
    });
    const before = snapshot();
    const runner = jest.fn((command, args, options) => {
      if (command === 'uv') return context.runner(command, args, options);
      const result = spawnSync(command, args, { cwd: options.cwd, env: options.env, timeout: options.timeoutMs, encoding: 'utf8' });
      return { exit_code: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error, signal: result.signal };
    });
    const result = graphify.readCurrentIdentity({ ...context, pythonCommand: python, runner });
    expect(result.status).toBe('confirmed');
    expect(runner.mock.calls.some(([command]) => command === 'npm')).toBe(false);
    expect(snapshot()).toEqual(before);
  });

  test('版本不符不伪造 pin 身份；空 inventory 不伪造已知摘要', () => {
    version = '9.9.9';
    expect(graphify.verify(context)).not.toHaveProperty('provider_identity');
    version = '0.9.57';
    packages = [];
    expect(graphify.verify(context).provider_identity.inventory_sha256).toBeNull();
  });
});
