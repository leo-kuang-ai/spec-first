'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
const evidenceOwner = require('../../skills/spec-runtime-setup/scripts/providers/codegraph-artifact-evidence.cjs');
const { collectSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
const { computeDecisionInputHealth, normalizeSetupFacts } = require('../../src/cli/helpers/setup-facts');
const codegraphStatus = require('../fixtures/mcp-setup/codegraph-status.cjs');

let root;
let context;
let runner;
let onQuery;
const now = new Date('2026-09-11T12:00:00Z');
const plan = { mutation: true, dependency_version: '1.6.0', actions: [] };
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-evidence-')));
  fs.writeFileSync(path.join(root, 'source.js'), 'module.exports = 1;');
  fs.writeFileSync(path.join(root, 'codegraph.cmd'), '@echo off\n');
  const packageRoot = path.join(root, 'node_modules', '@colbymchenry', 'codegraph');
  const platformRoot = path.join(root, 'node_modules', '@colbymchenry', 'codegraph-win32-x64');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.mkdirSync(path.join(platformRoot, 'lib', 'dist', 'bin'), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name: '@colbymchenry/codegraph', version: '1.6.0', optionalDependencies: { '@colbymchenry/codegraph-win32-x64': '1.6.0' } }));
  fs.writeFileSync(path.join(packageRoot, 'npm-shim.js'), 'throw new Error("not executable");');
  fs.writeFileSync(path.join(platformRoot, 'package.json'), JSON.stringify({ name: '@colbymchenry/codegraph-win32-x64', version: '1.6.0' }));
  fs.writeFileSync(path.join(platformRoot, 'node.exe'), 'fixture');
  fs.writeFileSync(path.join(platformRoot, 'lib', 'dist', 'bin', 'codegraph.js'), 'fixture');
  onQuery = () => {};
  runner = jest.fn((_command, args) => {
    if (args.includes('--version')) return { exit_code: 0, stdout: 'codegraph 1.6.0' };
    if (args[0] === 'init') {
      fs.mkdirSync(path.join(root, '.codegraph'), { recursive: true });
      fs.writeFileSync(path.join(root, '.codegraph', 'codegraph.db'), 'database');
    }
    if (args[0] === 'status') return { exit_code: 0, stdout: codegraphStatus(root) };
    if (args[0] === 'query') onQuery();
    return { exit_code: 0, stdout: '[]' };
  });
  context = { repoRoot: root, host: 'codex', homeDir: root, env: { PATH: root, PATHEXT: '.CMD;.EXE' }, platform: 'windows', arch: 'x64', configured: true, runner, dependency: { version: '1.6.0' }, now };
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function publish(readiness) {
  const { toolFacts } = collectSetupFacts({ ...context, registry: {}, providerResults: [{ readiness, verified: true, source: 'post-mutation-probe' }] });
  const filename = path.join(root, '.spec-first', 'config', 'tool-facts.json');
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(toolFacts));
  return { toolFacts, filename };
}

test('apply 证据经 facts/schema/normalizer 到只读 verify，保留原 verified_at', () => {
  const applied = provider.apply(context, plan);
  expect(applied.readiness_status).toBe('fresh');
  expect(evidenceOwner.validEvidence(applied.artifact_evidence)).toBe(true);
  const schema = require('../../docs/contracts/provider-readiness.schema.json');
  expect(require('../../src/contracts/schema-validator').validateAgainstSchema(schema, applied).valid).toBe(true);
  const { toolFacts } = publish(applied);
  expect(normalizeSetupFacts(toolFacts).provider_readiness[0].artifact_evidence).toEqual(applied.artifact_evidence);
  runner.mockClear();
  const verified = provider.verify({ ...context, now: new Date(now.getTime() + 1000) });
  expect(verified.readiness_status).toBe('fresh');
  expect(verified.artifact_evidence).toEqual(applied.artifact_evidence);
  expect(runner.mock.calls.every(([, args]) => args.includes('--version'))).toBe(true);
});

test('没有历史证据时 verify 不能运行 status/query 或回填 fresh', () => {
  provider.apply(context, plan);
  runner.mockClear();
  const result = provider.verify(context);
  expect(result.readiness_status).toBe('unknown');
  expect(result.lifecycle.query_verified).toBe(false);
  expect(runner.mock.calls.every(([, args]) => args.includes('--version'))).toBe(true);
});

test.each(['source', 'database'])('query 期间 %s 变化不发布新证据', (changed) => {
  onQuery = () => fs.writeFileSync(path.join(root, changed === 'source' ? 'source.js' : '.codegraph/codegraph.db'), 'changed');
  const result = provider.apply(context, plan);
  expect(result.artifact_evidence).toBeUndefined();
  expect(result.readiness_status).toBe('degraded');
  expect(provider.reconcileConfigured(result, { configured_status: 'ready' }).readiness_status).toBe('degraded');
});

test.each(['codegraph.db', 'codegraph.db-wal', 'codegraph.db-journal'])('%s 字节或出现状态变化使历史 query 失效', (name) => {
  const applied = provider.apply(context, plan); publish(applied);
  fs.writeFileSync(path.join(root, '.codegraph', name), 'different');
  runner.mockClear();
  expect(provider.verify(context).readiness_status).toBe('stale');
  expect(runner.mock.calls.every(([, args]) => args.includes('--version'))).toBe(true);
});

test('重发 facts 不能洗掉原证据的源码或 TTL 漂移', () => {
  const applied = provider.apply(context, plan);
  fs.writeFileSync(path.join(root, 'source.js'), 'changed'); publish(applied);
  expect(provider.verify(context).readiness_status).toBe('stale');
  fs.writeFileSync(path.join(root, 'source.js'), 'module.exports = 1;'); publish(applied);
  expect(provider.verify({ ...context, now: new Date(now.getTime() + 8 * 86400000) }).readiness_status).toBe('stale');
});

test('目录/sidecar symlink、采样期间变动和超字节预算不确认快照', () => {
  provider.apply(context, plan);
  expect(evidenceOwner.captureDatabaseSnapshot(root, { maxBytes: 1 }).status).toBe('unknown');
  const original = fs.readSync;
  let changed = false;
  const spy = jest.spyOn(fs, 'readSync').mockImplementation((...args) => {
    const count = original(...args);
    if (!changed) { changed = true; fs.writeFileSync(path.join(root, '.codegraph', 'codegraph.db-wal'), 'new-wal'); }
    return count;
  });
  try { expect(evidenceOwner.captureDatabaseSnapshot(root).status).toBe('unknown'); } finally { spy.mockRestore(); }
  fs.unlinkSync(path.join(root, '.codegraph', 'codegraph.db-wal'));
  fs.symlinkSync(path.join(root, 'source.js'), path.join(root, '.codegraph', 'codegraph.db-wal'), 'file');
  expect(evidenceOwner.captureDatabaseSnapshot(root).status).toBe('unknown');
});
