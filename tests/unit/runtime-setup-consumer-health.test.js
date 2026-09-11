'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { computeDecisionInputHealth, normalizeSetupFacts } = require('../../src/cli/helpers/setup-facts');

describe('setup facts 的真实消费出口', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-health-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test.each([undefined, 'invalid-time'])('缺失或非法时间 %s 不能支持 readiness pass', (generatedAt) => {
    const factsPath = path.join(root, 'facts.json');
    fs.writeFileSync(factsPath, JSON.stringify({ schema_version: 'tool-facts.v2', host: 'codex', generated_at: generatedAt, items: [] }));
    const result = computeDecisionInputHealth({ projectRoot: root, platforms: ['codex'], factsPath });
    expect(result.status).toBe('warn');
    expect(result.basis.reason_code).toBe('setup-facts-freshness-unknown');
    expect(result.basis.next_action).toContain('spec-runtime-setup');
  });
});

describe('setup snapshot 与当前身份比较', () => {
  const snapshot = { schema_version: 'setup-source-snapshot.v2', source_kind: 'git', source_content_sha256: 'd'.repeat(64), registry_sha256: 'a'.repeat(64), host_config_sha256: 'b'.repeat(64), source_head: 'c'.repeat(40), repo_root: '/fixture', host: 'codex', platform: 'macos' };
  const facts = { schema_version: 'tool-facts.v2', generated_at: '2026-09-11T00:00:00Z', items: [], source_snapshot: snapshot };
  const options = { now: new Date('2026-09-11T01:00:00Z'), currentSourceSnapshot: snapshot };
  test('当前身份一致保留 TTL freshness', () => {
    expect(normalizeSetupFacts(facts, options).freshness.status).toBe('fresh');
  });
  test.each(['registry_sha256', 'host', 'platform'])('%s 变化使近期 facts 失效', (key) => {
    const result = normalizeSetupFacts(facts, { ...options, currentSourceSnapshot: { ...snapshot, [key]: 'different' } });
    expect(result.freshness.status).toBe('stale');
    expect(result.freshness.reason_code).toBe('setup-facts-source-snapshot-mismatch');
  });
  test('未来时间戳不能伪装成刚生成的 facts', () => {
    const result = normalizeSetupFacts({ ...facts, generated_at: '2026-09-12T00:00:00Z' }, options);
    expect(result.freshness.status).toBe('unknown');
    expect(result.freshness.reason_code).toBe('setup-facts-clock-invalid');
  });
  test('旧 facts 缺少快照时不能通过身份校验', () => {
    expect(normalizeSetupFacts({ ...facts, source_snapshot: undefined }, options).freshness.status).toBe('unknown');
  });
});

describe('producer 到 doctor 的磁盘快照闭环', () => {
  const { execFileSync } = require('node:child_process');
  const { collectSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
  let root;
  let skillRoot;
  const now = new Date('2026-09-11T01:00:00Z');
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' });
  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'setup-current-')));
    skillRoot = path.join(root, 'skill');
    fs.mkdirSync(skillRoot);
    const registry = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../skills/spec-runtime-setup/setup-registry.json')));
    registry.hosts.codex.defaults.tool.host_config.targets.system.config_path = path.join(root, 'system.toml');
    fs.writeFileSync(path.join(skillRoot, 'setup-registry.json'), JSON.stringify(registry));
    git('init', '-q');
    git('-c', 'user.name=Setup Test', '-c', 'user.email=setup@example.test', 'commit', '--allow-empty', '-qm', 'fixture');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  function produce() {
    const { toolFacts } = collectSetupFacts({ repoRoot: root, skillRoot, homeDir: root, env: {}, host: 'codex', now, registry: { tools: [], helpers: [] } });
    const factsPath = path.join(root, '.spec-first', 'config', 'tool-facts.json');
    fs.mkdirSync(path.dirname(factsPath), { recursive: true });
    fs.writeFileSync(factsPath, JSON.stringify(toolFacts));
    return factsPath;
  }
  function health(factsPath, currentTime = now) {
    return computeDecisionInputHealth({ projectRoot: root, skillRoot, homeDir: root, env: {}, factsPath, platforms: ['codex'], now: currentTime });
  }
  test('同一磁盘源的 producer 与 doctor 使用一致哈希', () => {
    expect(health(produce()).status).toBe('pass');
  });
  test('doctor 比较当前 Provider 身份，失败和旧 facts 不冒充 fresh', () => {
    const graphify = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const identity = { package: 'graphifyy', version: '0.9.57', command: '/managed/graphify', interpreter: '/managed/python', installer: 'uv', inventory_sha256: 'a'.repeat(64) };
    const probe = jest.spyOn(graphify, 'readCurrentIdentity');
    const factsPath = produce();
    const facts = JSON.parse(fs.readFileSync(factsPath));
    facts.provider_readiness = [{ provider: 'graphify', readiness_scope: 'installation', readiness_status: 'fresh', provider_identity: identity }];
    fs.writeFileSync(factsPath, JSON.stringify(facts));
    try {
      probe.mockReturnValue({ status: 'confirmed', identity });
      expect(health(factsPath).status).toBe('pass');
      for (const key of ['command', 'interpreter', 'installer', 'inventory_sha256', 'version']) {
        probe.mockReturnValue({ status: 'confirmed', identity: { ...identity, [key]: 'changed' } });
        expect(health(factsPath).normalized.freshness).toMatchObject({ status: 'stale', reason_code: 'setup-facts-provider-identity-mismatch' });
      }
      probe.mockReturnValue({ status: 'unknown', reason_code: 'graphify-package-identity-unverified' });
      expect(health(factsPath).status).toBe('warn');
      expect(health(factsPath).normalized.provider_counts).toMatchObject({ fresh: 0, unknown: 1 });
      probe.mockReturnValue({ status: 'confirmed', identity: { ...identity, inventory_sha256: null } });
      expect(health(factsPath).normalized.freshness.status).toBe('unknown');
      probe.mockReturnValue({ status: 'stale', reason_code: 'graphify-package-version-mismatch' });
      expect(health(factsPath).status).toBe('stale');
      delete facts.provider_readiness[0].provider_identity;
      fs.writeFileSync(factsPath, JSON.stringify(facts));
      probe.mockReturnValue({ status: 'confirmed', identity });
      expect(health(factsPath).normalized.freshness.status).toBe('unknown');
      probe.mockClear();
      fs.writeFileSync(path.join(root, 'changed.js'), 'changed');
      expect(health(factsPath).status).toBe('stale');
      expect(probe).not.toHaveBeenCalled();
    } finally {
      probe.mockRestore();
    }
  });
  test('doctor 回读既有 Graphify scope receipt，拒绝图变化和缺失证据', () => {
    const crypto = require('node:crypto');
    const graphify = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const identity = { package: 'graphifyy', version: '0.9.57', command: '/managed/graphify', interpreter: '/managed/python', installer: 'uv', inventory_sha256: 'a'.repeat(64) };
    const probe = jest.spyOn(graphify, 'readCurrentIdentity').mockReturnValue({ status: 'confirmed', identity });
    const artifactRoot = path.join(root, 'graphify-out');
    fs.mkdirSync(artifactRoot);
    const graphPath = path.join(artifactRoot, 'graph.json');
    const receiptPath = path.join(artifactRoot, 'spec-first-graph-scope.json');
    const graph = '{"nodes":[],"edges":[]}';
    fs.writeFileSync(graphPath, graph);
    const receipt = { schema_version: 'graphify-scope-provenance.v1', provider: 'graphify', artifact_root: 'graphify-out', requirement_workspace_path: '.', operation: 'first-generation', graph_sha256: crypto.createHash('sha256').update(graph).digest('hex') };
    fs.writeFileSync(receiptPath, JSON.stringify(receipt));
    const factsPath = produce();
    const facts = JSON.parse(fs.readFileSync(factsPath));
    facts.provider_readiness = [{ provider: 'graphify', readiness_scope: 'artifact', readiness_status: 'fresh', provider_identity: identity, first_generation: { requirement_workspace_path: '.', artifact_root: 'graphify-out', scope_provenance: { status: 'verified', verified_requirement_workspace_path: '.', graph_sha256: receipt.graph_sha256 } } }];
    fs.writeFileSync(factsPath, JSON.stringify(facts));
    try {
      expect(health(factsPath).status).toBe('pass');
      fs.writeFileSync(graphPath, '{"nodes":[{}]}');
      expect(health(factsPath).normalized.freshness).toMatchObject({ status: 'stale', reason_code: 'graphify-scope-provenance-artifact-mismatch' });
      expect(health(factsPath).normalized.provider_counts).toMatchObject({ fresh: 0, stale: 1 });
      const changedHash = crypto.createHash('sha256').update(fs.readFileSync(graphPath)).digest('hex');
      fs.writeFileSync(receiptPath, JSON.stringify({ ...receipt, graph_sha256: changedHash }));
      expect(health(factsPath).normalized.freshness.status).toBe('stale');
      fs.writeFileSync(graphPath, graph);
      fs.unlinkSync(receiptPath);
      expect(health(factsPath).normalized.freshness.status).toBe('unknown');
      fs.writeFileSync(receiptPath, JSON.stringify({ ...receipt, schema_version: 'legacy' }));
      expect(health(factsPath).normalized.freshness.status).toBe('unknown');
      fs.writeFileSync(receiptPath, JSON.stringify(receipt));
      delete facts.provider_readiness[0].first_generation.scope_provenance.graph_sha256;
      fs.writeFileSync(factsPath, JSON.stringify(facts));
      expect(health(factsPath).normalized.freshness.status).toBe('unknown');
      facts.provider_readiness[0].first_generation.requirement_workspace_path = null;
      fs.writeFileSync(factsPath, JSON.stringify(facts));
      expect(health(factsPath).normalized.freshness.status).toBe('unknown');
    } finally {
      probe.mockRestore();
    }
  });
  test.each(['tracked', 'untracked'])('%s 文件内容变化使 facts 立即失效', (kind) => {
    const filename = path.join(root, 'source.js');
    fs.writeFileSync(filename, 'module.exports = 1;');
    if (kind === 'tracked') {
      git('add', 'source.js');
      git('-c', 'user.name=Setup Test', '-c', 'user.email=setup@example.test', 'commit', '-qm', 'source');
    }
    const factsPath = produce();
    expect(health(factsPath).status).toBe('pass');
    fs.writeFileSync(filename, 'module.exports = 2;');
    expect(health(factsPath).status).toBe('stale');
  });
  test('facts 发布及 cache 更新不自失效，local config 变化仍失效', () => {
    const factsPath = produce();
    fs.mkdirSync(path.join(root, '.spec-first', 'cache'), { recursive: true });
    fs.writeFileSync(path.join(root, '.spec-first', 'cache', 'receipt.json'), '{}');
    fs.writeFileSync(path.join(root, '.spec-first', 'config', 'runtime-capabilities.json'), '{}');
    expect(health(factsPath).status).toBe('pass');
    fs.writeFileSync(path.join(root, '.spec-first', 'config.yaml'), 'setting: true');
    expect(health(factsPath).status).toBe('stale');
  });
  test('非 Git folder 依据 bounded source 内容判断 freshness', () => {
    fs.rmSync(path.join(root, '.git'), { recursive: true, force: true });
    fs.writeFileSync(path.join(root, 'source.js'), 'first');
    const factsPath = produce();
    expect(health(factsPath).status).toBe('pass');
    fs.writeFileSync(path.join(root, 'source.js'), 'second');
    expect(health(factsPath).status).toBe('stale');
  });
  test('source symlink 不读取目标内容，也不能声称快照完整', () => {
    fs.symlinkSync(os.tmpdir(), path.join(root, 'external'));
    const factsPath = produce();
    expect(health(factsPath).status).toBe('warn');
  });
  test('删除 tracked 文件与新增文件均改变内容摘要', () => {
    fs.writeFileSync(path.join(root, 'source.js'), 'first');
    git('add', 'source.js');
    git('-c', 'user.name=Setup Test', '-c', 'user.email=setup@example.test', 'commit', '-qm', 'source');
    const factsPath = produce();
    fs.unlinkSync(path.join(root, 'source.js'));
    expect(health(factsPath).status).toBe('stale');
    const deletedBaseline = produce();
    expect(health(deletedBaseline).status).toBe('pass');
    fs.writeFileSync(path.join(root, 'new.js'), 'new');
    expect(health(deletedBaseline).status).toBe('stale');
  });
  test('nested folder 只采集自身 source，不混入同仓 sibling', () => {
    const { captureSourceSnapshot } = require('../../skills/spec-runtime-setup/scripts/lib/source-snapshot.cjs');
    const nested = path.join(root, 'nested');
    fs.mkdirSync(nested);
    fs.writeFileSync(path.join(nested, 'source.js'), 'first');
    const capture = () => captureSourceSnapshot({ repoRoot: nested, skillRoot, homeDir: root, env: {}, host: 'codex', now });
    const before = capture();
    expect(before.source_content_sha256).toMatch(/^[a-f0-9]{64}$/);
    fs.writeFileSync(path.join(root, 'sibling.js'), 'outside-target');
    expect(capture().source_content_sha256).toBe(before.source_content_sha256);
    fs.writeFileSync(path.join(nested, 'source.js'), 'second');
    expect(capture().source_content_sha256).not.toBe(before.source_content_sha256);
  });
  test('旧 v1 快照保持可读，但不证明已核对当前工作区内容', () => {
    const factsPath = produce();
    const facts = JSON.parse(fs.readFileSync(factsPath));
    facts.source_snapshot.schema_version = 'setup-source-snapshot.v1';
    delete facts.source_snapshot.source_content_sha256;
    delete facts.source_snapshot.source_kind;
    fs.writeFileSync(factsPath, JSON.stringify(facts));
    expect(health(factsPath).status).toBe('warn');
  });
  test('超出文件大小预算不输出部分摘要或假 fresh', () => {
    const fd = fs.openSync(path.join(root, 'large-source.bin'), 'w');
    fs.ftruncateSync(fd, 32 * 1024 * 1024 + 1);
    fs.closeSync(fd);
    const factsPath = produce();
    const facts = JSON.parse(fs.readFileSync(factsPath));
    expect(facts.source_snapshot.source_content_sha256).toBeNull();
    expect(facts.source_snapshot.limitations).toContain('source-content-snapshot-unavailable');
    expect(health(factsPath).status).toBe('warn');
  });
  test('canonical local config 即使被 Git ignore 仍参与快照', () => {
    fs.writeFileSync(path.join(root, '.gitignore'), '.spec-first/config.local.yaml\n');
    fs.mkdirSync(path.join(root, '.spec-first'), { recursive: true });
    const local = path.join(root, '.spec-first', 'config.local.yaml');
    fs.writeFileSync(local, 'verification_profile: minimal');
    const factsPath = produce();
    expect(health(factsPath).status).toBe('pass');
    fs.writeFileSync(local, 'verification_profile: strict');
    expect(health(factsPath).status).toBe('stale');
  });
  test.each(['git', 'folder'])('%s 完整发布链不会因 scenario fingerprint 自失效', (kind) => {
    const { runVerificationOrMutation } = require('../../skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs');
    if (kind === 'folder') fs.rmSync(path.join(root, '.git'), { recursive: true, force: true });
    const context = {
      skillRoot, setupScriptDir: path.resolve(__dirname, '../../skills/spec-runtime-setup/scripts'),
      homeDir: root, env: {}, host: 'codex', platform: process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux',
      registry: JSON.parse(fs.readFileSync(path.join(skillRoot, 'setup-registry.json'))),
      effectiveRegistry: { tools: [], helpers: [], providers: [] },
      actionPlan: { mode: 'verify', selected_ids: [], args: { installationOnly: true }, capabilities: ['write-setup-facts'] },
      target: { repo_status: kind === 'git' ? 'git-repo' : 'not-git-repo', target_root: root },
      runner: () => ({ exit_code: 0, stdout: '', stderr: '' }),
    };
    const factsPath = path.join(root, '.spec-first', 'config', 'tool-facts.json');
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = runVerificationOrMutation(context, root);
      expect(result.exit_code).toBe(0);
      expect(fs.existsSync(path.join(root, '.spec-first', 'workspace', 'scenario-fingerprint-setup.json'))).toBe(true);
      expect(result.payload.tool_facts.source_snapshot.source_content_sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(health(factsPath, new Date()).status).toBe('pass');
    }
  });
  test('registry 修改立即失效，无需等 TTL', () => {
    const factsPath = produce();
    fs.appendFileSync(path.join(skillRoot, 'setup-registry.json'), '\n');
    expect(health(factsPath).status).toBe('stale');
  });
  test('宿主配置从不存在变为存在立即失效，且不泄漏配置内容', () => {
    const factsPath = produce();
    fs.mkdirSync(path.join(root, '.codex'));
    fs.writeFileSync(path.join(root, '.codex', 'config.toml'), 'secret_fixture = "private-fixture"');
    const result = health(factsPath);
    expect(result.status).toBe('stale');
    expect(JSON.stringify(result)).not.toContain('private-fixture');
  });
  test('执行期间 registry 变化时不能把旧 probe 绑定到新 source', () => {
    const sourceRegistry = JSON.parse(fs.readFileSync(path.join(skillRoot, 'setup-registry.json')));
    const changed = JSON.parse(JSON.stringify(sourceRegistry));
    changed.tools[0].description += ' changed';
    fs.writeFileSync(path.join(skillRoot, 'setup-registry.json'), JSON.stringify(changed));
    const { toolFacts } = collectSetupFacts({ repoRoot: root, skillRoot, homeDir: root, env: {}, host: 'codex', now, sourceRegistry, registry: { tools: [], helpers: [] } });
    expect(toolFacts.source_snapshot.limitations).toContain('registry-changed-during-setup');
  });
  test('HEAD 改变立即失效', () => {
    const factsPath = produce();
    git('-c', 'user.name=Setup Test', '-c', 'user.email=setup@example.test', 'commit', '--allow-empty', '-qm', 'next');
    expect(health(factsPath).status).toBe('stale');
  });
  test('宿主配置 symlink 不进入摘要且保持 unknown', () => {
    const factsPath = produce();
    fs.mkdirSync(path.join(root, '.codex'));
    fs.writeFileSync(path.join(root, 'private-config'), 'must-not-read');
    fs.symlinkSync(path.join(root, 'private-config'), path.join(root, '.codex', 'config.toml'));
    const refreshed = produce();
    const facts = JSON.parse(fs.readFileSync(refreshed));
    expect(facts.source_snapshot.limitations.length).toBeGreaterThan(0);
    expect(health(factsPath).status).toBe('warn');
    expect(JSON.stringify(facts)).not.toContain('must-not-read');
  });
  test('当前 snapshot 符合增量 schema，非法摘要被拒绝', () => {
    const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
    const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/contracts/tool-facts.schema.json')));
    const facts = JSON.parse(fs.readFileSync(produce()));
    expect(validateAgainstSchema(schema, facts).valid).toBe(true);
    facts.source_snapshot.host_config_sha256 = 'unverified';
    expect(validateAgainstSchema(schema, facts).valid).toBe(false);
  });
  test('旧快照缺字段时 doctor 不再通过', () => {
    const factsPath = produce();
    const facts = JSON.parse(fs.readFileSync(factsPath));
    delete facts.source_snapshot.source_head;
    fs.writeFileSync(factsPath, JSON.stringify(facts));
    expect(health(factsPath).status).toBe('warn');
  });
});
