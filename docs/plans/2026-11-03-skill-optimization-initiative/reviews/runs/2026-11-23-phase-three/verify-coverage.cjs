'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const freeze = '5a55514d9a799b54ebe08580a35e618ee377029d';
const names = ['spec-strategy', 'spec-product-pulse', 'spec-sweep', 'spec-riffrec-feedback-analysis', 'spec-promote', 'spec-runtime-setup', 'spec-compound-refresh', 'spec-explain', 'spec-write-skill'];
const retired = ['spec-project-rules', 'spec-rule-miner'];
const roots = [...names, '_shared'].map(name => `skills/${name}`);
const caches = new Map([
  ['skills/spec-sweep/scripts/__pycache__/sweep-state.cpython-312.pyc', { size: 38363, before: '9e666ade74ca683664a32d528dc1033f16c33e9c69af9f25db1e03365ea2c075', after: 'f469438895265cd50bbb9cbe898b358f9f99d05cfdfd36887b896ae6f8ebce37' }],
  ['skills/spec-riffrec-feedback-analysis/scripts/__pycache__/analyze_riffrec_zip.cpython-312.pyc', { size: 79897, before: '174877bab6898f8b914498c191251d361277336d7e0508bd391b1f74f9a83ab7', after: '7eb9ccff593f91bd7fb926dcf7e6546462ae4c4beb012201ada45641484f0827' }],
]);
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
process.chdir(git('rev-parse', '--show-toplevel').trim());
const registry = JSON.parse(fs.readFileSync('src/cli/contracts/dual-host-governance/skills-governance.json')).skills.map(row => row.skill_name);
for (const name of names) assert.ok(registry.includes(name), name);
for (const name of retired) assert.ok(!registry.includes(name) && !fs.existsSync(`skills/${name}`), name);
const expected = new Map(git('ls-tree', '-rz', freeze, '--', ...roots).split('\0').filter(Boolean).map(row => {
  const [, mode, blob, file] = row.match(/^(\d+) blob (\w+)\t(.+)$/);
  return [file, { mode, blob }];
}));
const current = process.argv.includes('--current');
assert.ok(process.argv.slice(2).every(arg => ['--current', '--list', '--snapshot'].includes(arg)));
const disk = new Map();
function visit(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = `${dir}/${item.name}`;
    if (item.isDirectory()) visit(file);
    else {
      assert.ok(item.isFile(), file);
      const bytes = fs.readFileSync(file);
      const mode = fs.statSync(file).mode & 0o111 ? '100755' : '100644';
      const blob = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      disk.set(file, { mode, blob });
      if (caches.has(file)) assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), caches.get(file).after, file);
    }
  }
}
roots.forEach(visit);
for (const file of caches.keys()) assert.equal(disk.get(file)?.mode, '100644', file);
const baseline = [...expected.keys(), ...caches.keys()].sort();
assert.equal(baseline.length, 270);
const sources = new Map([
  ['spec-strategy', ['strategy-and-promotion.md']], ['spec-promote', ['strategy-and-promotion.md']],
  ['spec-product-pulse', ['pulse-and-explain.md']], ['spec-explain', ['pulse-and-explain.md']],
  ['spec-sweep', ['feedback.md']], ['spec-riffrec-feedback-analysis', ['feedback.md']],
  ['spec-runtime-setup', ['runtime-surface.md', 'runtime-lib.md']], ['spec-compound-refresh', ['compound-refresh.md']],
  ['spec-write-skill', ['write-skill.md']], ['_shared', ['shared.md']],
]);
const reviewed = new Set();
function inspectReport(name, source) {
  let section;
  for (const line of fs.readFileSync(path.join(__dirname, source), 'utf8').split('\n')) {
    if (line.startsWith('## ')) section = line.slice(3);
    if (section !== name || !line.startsWith('| `')) continue;
    const [, file, lastLine, byteCount, judgment] = /^\| `([^`]+)` \| (?:1–(\d+)|(\d+) 字节) \| (.+) \|$/.exec(line) || [];
    assert.ok(judgment?.trim(), line);
    const key = `skills/${name}/${file}`;
    assert.ok(!reviewed.has(key), key);
    if (caches.has(key)) assert.equal(caches.get(key).size, Number(byteCount), key);
    else assert.equal(git('cat-file', 'blob', expected.get(key).blob).replace(/\n$/, '').split('\n').length, Number(lastLine), key);
    reviewed.add(key);
  }
}
for (const [name, files] of sources) for (const file of files) inspectReport(name, file);
assert.deepEqual([...reviewed].sort(), baseline);
if (process.argv.includes('--list')) for (const file of baseline) console.log(reviewed.has(file) ? '已登记' : '待审', file);
console.log(`冻结 ${names.length} 包及共享目录，共 ${baseline.length} 个路径，逐文件登记 ${reviewed.size} 个。`);
if (current || process.argv.includes('--snapshot')) {
  const changes = new Map();
  for (const file of new Set([...baseline, ...disk.keys()])) {
    if (caches.has(file)) {
      if (caches.get(file).before !== caches.get(file).after) changes.set(file, '改');
      continue;
    }
    const original = expected.get(file);
    const present = disk.get(file);
    if (!original || !present || original.blob !== present.blob || original.mode !== present.mode) {
      assert.ok(sources.has(file.split('/')[1]), `未审范围漂移：${file}`);
      changes.set(file, !original ? '增' : !present ? '删' : '改');
    }
  }
  const identities = [...disk.keys()].sort().map(file => [file, disk.get(file).mode, disk.get(file).blob]);
  const digest = crypto.createHash('sha256').update(JSON.stringify(identities)).digest('hex');
  if (process.argv.includes('--snapshot')) console.log(JSON.stringify({ paths: disk.size, changes: changes.size, sha256: digest }));
  if (!current) process.exit(0);
  const reports = ['current-review.md', 'final-current.md', 'after-compound.md', 'after-write-skill.md', 'after-runtime-lib.md', 'after-runtime-surface.md', 'after-shared.md'].map(file => fs.readFileSync(path.join(__dirname, file), 'utf8'));
  const registered = new Map();
  let owner;
  for (const line of reports.join('\n').split('\n')) {
    if (line.startsWith('## ')) owner = line.slice(3);
    if (!sources.has(owner) || !line.startsWith('| `')) continue;
    const row = /^\| `([^`]+)` \| (增|删|改) \| (.+) \|$/.exec(line);
    assert.ok(row && row[3].trim() && sources.has(owner), line);
    const key = `skills/${owner}/${row[1]}`;
    assert.ok(!registered.has(key), key);
    registered.set(key, row[2]);
  }
  assert.deepEqual(registered, changes);
  assert.equal(digest, /快照 SHA-256：`([0-9a-f]{64})`/.exec(reports[1])?.[1], '当前内容或执行位已变化');
  console.log(`当前 ${disk.size} 个路径，${changes.size} 项差异均有记录；当前快照匹配。`);
}
