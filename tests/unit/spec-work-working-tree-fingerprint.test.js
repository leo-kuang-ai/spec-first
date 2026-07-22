'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  computeWorkingTreeFingerprint,
} = require('../../skills/spec-work/scripts/working-tree-fingerprint.cjs');

const roots = new Set();

afterEach(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
  roots.clear();
});

function runGit(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-work-tree-fingerprint-'));
  roots.add(root);
  runGit(root, ['init', '-q']);
  runGit(root, ['config', 'user.email', 'fingerprint@example.com']);
  runGit(root, ['config', 'user.name', 'Fingerprint Test']);
  fs.writeFileSync(path.join(root, 'tracked.txt'), 'base\n');
  runGit(root, ['add', 'tracked.txt']);
  runGit(root, ['commit', '-qm', 'base']);
  return root;
}

test('fingerprint changes for tracked and untracked content and is stable when bytes are restored', () => {
  const root = createRepo();
  const clean = computeWorkingTreeFingerprint(root);

  fs.writeFileSync(path.join(root, 'tracked.txt'), 'changed\n');
  const tracked = computeWorkingTreeFingerprint(root);
  expect(tracked.fingerprint).not.toBe(clean.fingerprint);
  expect(tracked.dirty).toBe(true);

  fs.writeFileSync(path.join(root, 'untracked.txt'), 'first\n');
  const untrackedFirst = computeWorkingTreeFingerprint(root);
  fs.writeFileSync(path.join(root, 'untracked.txt'), 'second\n');
  const untrackedSecond = computeWorkingTreeFingerprint(root);
  expect(untrackedSecond.fingerprint).not.toBe(untrackedFirst.fingerprint);
  expect(untrackedSecond.untracked_file_count).toBe(1);

  fs.rmSync(path.join(root, 'untracked.txt'));
  fs.writeFileSync(path.join(root, 'tracked.txt'), 'base\n');
  const restored = computeWorkingTreeFingerprint(root);
  expect(restored.fingerprint).toBe(clean.fingerprint);
  expect(restored.dirty).toBe(false);
});
