'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function checkCandidate(body, { git = true, invalidRoot = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compound-claims-'));
  const repo = path.join(root, 'project');
  const candidate = path.join(root, 'candidate.md');
  try {
    fs.mkdirSync(repo);
    if (git) expect(spawnSync('git', ['init', repo]).status).toBe(0);
    fs.writeFileSync(path.join(repo, 'README.md'), '# 项目');
    fs.mkdirSync(path.join(repo, 'src'));
    fs.writeFileSync(path.join(repo, 'src', 'index.js'), 'module.exports = {};');
    fs.writeFileSync(candidate, body);
    return spawnSync('python3', [
      path.resolve('skills/spec-compound/scripts/validate-doc-claims.py'), candidate,
      '--repo-root', invalidRoot ? path.join(root, 'missing') : repo,
      '--target-path', 'docs/solutions/learning.md',
    ], { encoding: 'utf8', cwd: root });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test.each([
  'Fixed in commit 7e6861b4.',
  'Fixed in 7e6861b4.',
  '提交 `7e6861b4` 修复了问题。',
  'Pinned to owner/repo@7e6861b4.',
  'Session id: 7e6861b4\nFixed in commit 7e6861b4.',
])('unresolved explicit commit requires adjudication: %s', (body) => {
  const result = checkCandidate(body);
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('FLAG sha 7e6861b4');
  expect(result.stdout).not.toContain('OK:');
  if (body.startsWith('Session')) expect(result.stdout).toContain('(line 2)');
});

test.each(['Session id: 7e6861b4', 'SHA256: 7e6861b4', 'Blob 7e6861b4'])('ordinary identifiers stay advisory: %s', (body) => {
  const result = checkCandidate(body);
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('NOTE hex 7e6861b4');
  expect(result.stdout).not.toContain('FLAG sha');
});

test('non-Git projects retain final-location link checking', () => {
  const result = checkCandidate('[项目](../../README.md)\n`src/index.js`\n`../../README.md`', { git: false });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('Git path/SHA classification unavailable');
  expect(result.stdout).not.toContain('FLAG link');
  expect(result.stdout).not.toContain('FLAG path');
  expect(result.stdout).toContain('checked 2 paths');
});

test('non-Git projects still flag broken links, paths, and scaffolding', () => {
  const result = checkCandidate('[不存在](../../missing.md)\n`src/missing.js`\n{{unfinished}}', { git: false });
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('FLAG link');
  expect(result.stdout).toContain('FLAG path');
  expect(result.stdout).toContain('FLAG scaffold');
});

test('an invalid explicit project directory is a usage error', () => {
  const result = checkCandidate('# 候选', { git: false, invalidRoot: true });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain('explicit repo-root is not a readable directory');
});

test('private candidates use the target repository and final link location', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compound-claims-'));
  const repo = path.join(root, 'repo');
  const candidate = path.join(root, 'candidate.md');
  fs.mkdirSync(repo);
  try {
    expect(spawnSync('git', ['init', repo]).status).toBe(0);
    fs.mkdirSync(path.join(repo, 'src'));
    fs.writeFileSync(path.join(repo, 'src', 'index.js'), 'module.exports = {};');
    fs.writeFileSync(candidate, [
      '# 候选',
      '[源码](../../src/index.js)',
      '`' + path.join(repo, 'src', 'missing.js') + '`',
      'session id: 7e6861b4',
    ].join('\n'));
    const result = spawnSync('python3', [
      path.resolve('skills/spec-compound/scripts/validate-doc-claims.py'), candidate,
      '--repo-root', repo,
      '--target-path', 'docs/solutions/learning.md',
    ], { encoding: 'utf8', cwd: root });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('FLAG path');
    expect(result.stdout).not.toContain('FLAG link');
    expect(result.stdout).toContain('NOTE hex 7e6861b4');
    expect(result.stdout).not.toContain('FLAG sha 7e6861b4');
    expect(result.stdout).not.toContain('not a git repository');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
