'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function runGit(repoRoot, args) {
  return spawnSync('git', ['-C', path.resolve(repoRoot), ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 5000,
    windowsHide: true,
  });
}

function resolveGitPath(repoRoot, gitRelative) {
  if (!gitRelative || typeof gitRelative !== 'string') {
    return { ok: false, reason_code: 'git-path-invalid' };
  }
  const inside = runGit(repoRoot, ['rev-parse', '--is-inside-work-tree']);
  if (inside.error) return { ok: false, reason_code: 'git-path-resolution-failed' };
  if (inside.status !== 0 || String(inside.stdout || '').trim() !== 'true') {
    return { ok: false, reason_code: 'not-a-git-repo' };
  }
  const result = runGit(repoRoot, ['rev-parse', '--git-path', gitRelative]);
  if (result.error || result.status !== 0) {
    return { ok: false, reason_code: 'git-path-resolution-failed' };
  }
  const raw = String(result.stdout || '').trim();
  if (!raw) return { ok: false, reason_code: 'git-path-empty' };
  const absolute = path.isAbsolute(raw) || path.win32.isAbsolute(raw)
    ? raw
    : path.resolve(repoRoot, raw);
  return { ok: true, absolute: path.normalize(absolute) };
}

function canonicalizeGitPath(candidatePath) {
  const absolute = path.resolve(candidatePath);
  let nearest = absolute;
  while (!fs.existsSync(nearest)) {
    const parent = path.dirname(nearest);
    if (parent === nearest) break;
    nearest = parent;
  }
  const realNearest = fs.realpathSync.native(nearest);
  const suffix = path.relative(nearest, absolute);
  return path.resolve(realNearest, suffix);
}

module.exports = {
  canonicalizeGitPath,
  resolveGitPath,
};
