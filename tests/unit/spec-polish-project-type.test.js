'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.resolve(__dirname, '../../skills/spec-polish/scripts/detect-project-type.sh');
let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'polish-classify-'));
  expect(spawnSync('git', ['init', '-q', root]).status).toBe(0);
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function signature(relative) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '');
}
function classify(...args) {
  return spawnSync('bash', [script, ...args], { cwd: root, encoding: 'utf8' });
}

test('selected launch cwd overrides a different framework at repository root', () => {
  signature('next.config.js');
  signature('apps/web/vite.config.ts');
  expect(classify().stdout.trim()).toBe('next');
  expect(classify('apps/web').stdout.trim()).toBe('vite');
});

test('monorepo results are relative to the selected classification root', () => {
  signature('apps/web/vite.config.ts');
  expect(classify('apps').stdout.trim()).toBe('vite@web');
  signature('apps/admin/next.config.js');
  expect(classify('apps').stdout.trim()).toBe('multiple:next@admin,vite@web');
});

test('physical containment rejects an external root and a symlink escape', () => {
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'polish-external-'));
  try {
    fs.writeFileSync(path.join(external, 'vite.config.ts'), '');
    fs.symlinkSync(external, path.join(root, 'linked'));
    for (const selected of [external, 'linked', 'missing']) {
      const result = classify(selected);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe('');
    }
  } finally {
    fs.rmSync(external, { recursive: true, force: true });
  }
});
