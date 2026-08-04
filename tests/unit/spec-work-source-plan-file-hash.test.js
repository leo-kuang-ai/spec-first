'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.resolve(
  __dirname,
  '../../skills/spec-work/scripts/source-plan-file-hash.cjs',
);
const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-work-plan-file-hash-'));
  tempRoots.push(root);
  return root;
}

function run(root, target) {
  return spawnSync(process.execPath, [script, target], {
    cwd: root,
    encoding: 'utf8',
  });
}

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

test('hashes the complete source-plan bytes and changes on frontmatter-only mutation', () => {
  const root = tempRoot();
  const plan = path.join(root, 'docs', 'plans', 'plan.md');
  fs.mkdirSync(path.dirname(plan), { recursive: true });

  const initial = Buffer.from('---\nstatus: active\n---\n# Plan\n', 'utf8');
  fs.writeFileSync(plan, initial);

  const first = run(root, 'docs/plans/plan.md');
  expect(first.status).toBe(0);
  expect(first.stderr).toBe('');
  expect(first.stdout.trim()).toBe(sha256(initial));
  expect(first.stdout.trim()).toMatch(/^sha256:[a-f0-9]{64}$/);

  const updated = Buffer.from('---\nstatus: completed\n---\n# Plan\n', 'utf8');
  fs.writeFileSync(plan, updated);

  const second = run(root, 'docs/plans/plan.md');
  expect(second.status).toBe(0);
  expect(second.stdout.trim()).toBe(sha256(updated));
  expect(second.stdout.trim()).not.toBe(first.stdout.trim());
});

test.each([
  ['absolute path', (root) => path.join(root, 'plan.md')],
  ['repo escape', () => '../outside.md'],
  ['missing path', () => 'missing.md'],
  ['directory', () => 'docs'],
])('rejects %s without emitting a valid hash', (_label, targetForRoot) => {
  const root = tempRoot();
  fs.mkdirSync(path.join(root, 'docs'));

  const result = run(root, targetForRoot(root));
  expect(result.status).not.toBe(0);
  expect(result.stdout.trim()).not.toMatch(/^sha256:[a-f0-9]{64}$/);
  expect(result.stderr).toContain('source-plan-file-hash:');
});
