'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const freeze = '48e93fdd7b62a7e629d1154869d051ef48be5c8f';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const root = git('rev-parse', '--show-toplevel').trim();
process.chdir(root);
const records = new Map();
const sources = {
  'report.md': { '首包：方向探索': 'spec-ideate' },
  'first-four.md': { 方向探索: 'spec-ideate', 可体验原型: 'spec-prototype', 模拟器测试: 'spec-test-xcode', 内部提交: 'spec-commit' },
  'pov-simplify.md': { 采用裁决: 'spec-pov', 保行为的代码简化: 'spec-simplify-code' },
  'optimize.md': { 全量记录: 'spec-optimize' },
  'autoresearch.md': { 逐文件记录: 'autoresearch' },
  'browser-delivery.md': ['spec-polish', 'spec-dogfood', 'spec-test-browser', 'spec-worktree', 'spec-commit-push-pr'],
  'pipeline-feedback.md': ['spec-lfg', 'spec-resolve-pr-feedback'],
  'handoff-knowledge.md': ['spec-handoff', 'spec-compound'],
};
const packages = new Set();
for (const [source, sections] of Object.entries(sources)) {
  const keys = Array.isArray(sections) ? sections.map(name => [name, name]) : Object.entries(sections);
  for (const [, name] of keys) packages.add(name);
  let owner;
  for (const line of fs.readFileSync(path.join(__dirname, source), 'utf8').split('\n')) {
    if (line.startsWith('## ')) owner = keys.find(([key]) => line.slice(3) === key || line.slice(3).startsWith(`${key}：`))?.[1];
    if (!owner || !line.startsWith('| `')) continue;
    const [, cell, judgment] = line.split('|');
    assert.ok(judgment.trim(), `${source}: ${cell}`);
    for (const [, entry] of cell.matchAll(/`([^`]+)`/g)) {
      const file = `skills/${owner}/${entry.replace(/:1[–-]\d+$/, '')}`;
      assert.ok(!records.has(file), `重复记录: ${file}`);
      records.set(file, source);
    }
  }
}

const dirs = [...packages].map(name => `skills/${name}`);
const versioned = new Map(git('ls-tree', '-rz', freeze, '--', ...dirs).split('\0').filter(Boolean).map(row => {
  const [, mode, blob, file] = row.match(/^(\d+) blob (\w+)\t(.+)$/);
  return [file, { blob, mode }];
}));
const cache = 'skills/spec-pov/scripts/__pycache__/peer-job-runner.cpython-312.pyc';
const frozen = new Map([...versioned, [cache, { blob: '09c7d5d5a1f1a474713c11c9d1c62ed733d4f4b8' }]]);
const disk = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) visit(file);
    else disk.push(file);
  }
}
dirs.forEach(visit);
assert.deepEqual([...records.keys()].sort(), [...frozen.keys()].sort(), '逐文件记录与冻结路径不相等');
assert.equal(packages.size, 17);
assert.equal(versioned.size, 411);
const currentMode = process.argv[2] === '--current';
assert.deepEqual(process.argv.slice(2), currentMode ? ['--current'] : [], '不支持的参数');
const changes = new Map([...frozen.keys()].map(file => [file, '删']));
const identities = disk.sort().map(file => {
  const stat = fs.lstatSync(file);
  assert.ok(stat.isFile(), file);
  const mode = stat.mode & 0o111 ? '100755' : '100644';
  const bytes = fs.readFileSync(file);
  const baseline = frozen.get(file);
  const blob = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if (!baseline) changes.set(file, '增');
  else if (blob !== baseline.blob || (baseline.mode && mode !== baseline.mode)) changes.set(file, '改');
  else changes.delete(file);
  return [file, mode, crypto.createHash('sha256').update(bytes).digest('hex')];
});
if (!currentMode) {
  assert.deepEqual([...changes.keys()], [], '磁盘与冻结版本不同');
  console.log(`${packages.size} 个包，${versioned.size} 个版本化文件，${disk.length} 个磁盘路径，${records.size} 个路径记录；无缺项、额外项、重复或内容漂移。`);
} else {
  const report = fs.readFileSync(path.join(__dirname, 'current-review.md'), 'utf8');
  const reviewed = new Map();
  let owner;
  for (const line of report.split('\n')) {
    if (line.startsWith('## ')) owner = line.slice(3);
    if (!line.startsWith('| `')) continue;
    const match = /^\| `([^`]+)` \| (增|删|改) \| (.+) \|$/.exec(line);
    assert.ok(match && match[3].trim() && packages.has(owner), `差异记录格式：${line}`);
    const file = `skills/${owner}/${match[1]}`;
    assert.ok(!reviewed.has(file), `重复记录：${file}`);
    reviewed.set(file, match[2]);
  }
  assert.deepEqual(reviewed, changes, '当前差异与已审路径、变化类型不一致');
  const digest = crypto.createHash('sha256').update(JSON.stringify(identities)).digest('hex');
  assert.equal(digest, /快照 SHA-256：`([0-9a-f]{64})`/.exec(report)?.[1], '当前文件字节或可执行位已变化');
  console.log(`${packages.size} 包、${disk.length} 个当前路径、${reviewed.size} 项差异记录与指定快照一致；未评定语义深度。`);
}
