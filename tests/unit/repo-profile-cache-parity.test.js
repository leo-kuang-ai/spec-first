'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const skillsRoot = path.resolve(__dirname, '../../skills');
const cacheScript = path.join(skillsRoot, 'spec-plan/scripts/repo-profile-cache.py');

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: 'utf8' });
}

function write(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function findNamedFiles(root, name, found = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) findNamedFiles(fullPath, name, found);
    if (entry.isFile() && entry.name === name) found.push(fullPath);
  }
  return found.sort();
}

describe('repo profile cache copies', () => {
  test.each([
    'repo-profile-cache.md',
    'repo-profile-cache.py',
    'repo-profiler.md',
  ])('%s copies remain byte-identical', (name) => {
    const files = findNamedFiles(skillsRoot, name);
    expect(files.length).toBeGreaterThan(1);
    const baseline = fs.readFileSync(files[0]);
    for (const file of files.slice(1)) {
      expect(fs.readFileSync(file).equals(baseline)).toBe(true);
    }
  });

  test('dirty profile inputs invalidate while docs/plans changes keep a verified HIT', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-profile-cache-'));
    let cachePath;
    try {
      expect(run('git', ['init', '-q'], root).status).toBe(0);
      expect(run('git', ['config', 'user.email', 'cache-test@example.com'], root).status).toBe(0);
      expect(run('git', ['config', 'user.name', 'Cache Test'], root).status).toBe(0);
      write(path.join(root, 'package.json'), '{"name":"cache-fixture"}\n');
      write(path.join(root, 'AGENTS.md'), '# Instructions\n');
      write(path.join(root, 'docs/plans/example.md'), '# Example\n');
      expect(run('git', ['add', '.'], root).status).toBe(0);
      expect(run('git', ['commit', '-qm', 'fixture'], root).status).toBe(0);

      const initial = run('python3', [cacheScript, 'get'], root);
      expect(initial.status).toBe(0);
      expect(initial.stdout).toMatch(/^MISS\n/);

      const profilePath = path.join(root, 'profile.json');
      write(profilePath, JSON.stringify({
        stack: {},
        dependencies: {},
        topology: {},
        conventions: {},
        vocabulary: {},
      }));
      const put = run('python3', [cacheScript, 'put', profilePath], root);
      expect(put.status).toBe(0);
      cachePath = put.stdout.trim();
      expect(cachePath).toMatch(/\/tmp\/spec-first\/repo-profile\//);
      expect(run('python3', [cacheScript, 'get'], root).stdout).toMatch(/^HIT\n/);

      fs.appendFileSync(path.join(root, 'docs/plans/example.md'), '\nChanged plan only.\n');
      expect(run('python3', [cacheScript, 'get'], root).stdout).toMatch(/^HIT\n/);

      fs.appendFileSync(path.join(root, 'package.json'), '\n');
      expect(run('python3', [cacheScript, 'get'], root).stdout).toMatch(/^MISS\n/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      if (cachePath) fs.rmSync(cachePath, { force: true });
    }
  });
});
