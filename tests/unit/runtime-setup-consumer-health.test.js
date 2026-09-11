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
  const snapshot = { schema_version: 'setup-source-snapshot.v1', registry_sha256: 'a'.repeat(64), host_config_sha256: 'b'.repeat(64), source_head: 'c'.repeat(40), repo_root: '/fixture', host: 'codex', platform: 'macos' };
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
    const factsPath = path.join(root, 'facts.json');
    fs.writeFileSync(factsPath, JSON.stringify(toolFacts));
    return factsPath;
  }
  function health(factsPath) {
    return computeDecisionInputHealth({ projectRoot: root, skillRoot, homeDir: root, env: {}, factsPath, platforms: ['codex'], now });
  }
  test('同一磁盘源的 producer 与 doctor 使用一致哈希', () => {
    expect(health(produce()).status).toBe('pass');
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
