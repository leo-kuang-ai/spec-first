#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const MAX_GIT_OUTPUT_BYTES = 128 * 1024 * 1024;

function runGit(repoRoot, args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: null,
    maxBuffer: MAX_GIT_OUTPUT_BYTES,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr) ? result.stderr.toString('utf8').trim() : '';
    throw new Error(stderr || `git ${args.join(' ')} failed with status ${result.status}`);
  }
  return Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.alloc(0);
}

function resolveRepoRoot(cwd = process.cwd()) {
  const root = runGit(cwd, ['rev-parse', '--show-toplevel']).toString('utf8').trim();
  if (!root) throw new Error('unable to resolve git root');
  return fs.realpathSync(root);
}

function splitNullTerminated(buffer) {
  if (!buffer.length) return [];
  return buffer.toString('utf8').split('\0').filter(Boolean);
}

function assertRepoRelativePath(relativePath) {
  if (!relativePath || relativePath.includes('\0') || path.isAbsolute(relativePath)) {
    throw new Error(`unsafe untracked path: ${relativePath || '<empty>'}`);
  }
  const normalized = relativePath.split('/').join(path.sep);
  if (normalized.split(path.sep).some((segment) => segment === '..')) {
    throw new Error(`unsafe untracked path: ${relativePath}`);
  }
  return normalized;
}

function updateUntrackedEntry(hash, repoRoot, relativePath) {
  const normalized = assertRepoRelativePath(relativePath);
  const absolutePath = path.join(repoRoot, normalized);
  const stat = fs.lstatSync(absolutePath);
  hash.update('untracked\0');
  hash.update(Buffer.from(relativePath, 'utf8'));
  hash.update('\0');
  hash.update(String(stat.mode));
  hash.update('\0');
  if (stat.isSymbolicLink()) {
    hash.update('symlink\0');
    hash.update(Buffer.from(fs.readlinkSync(absolutePath), 'utf8'));
    hash.update('\0');
    return;
  }
  if (!stat.isFile()) {
    hash.update('special\0');
    return;
  }
  hash.update('file\0');
  hash.update(fs.readFileSync(absolutePath));
  hash.update('\0');
}

function computeWorkingTreeFingerprint(cwd = process.cwd()) {
  const repoRoot = resolveRepoRoot(cwd);
  const headSha = runGit(repoRoot, ['rev-parse', 'HEAD']).toString('utf8').trim();
  const status = runGit(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const trackedDiff = runGit(repoRoot, ['diff', '--binary', 'HEAD', '--']);
  const untrackedPaths = splitNullTerminated(
    runGit(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z']),
  ).sort((left, right) => left.localeCompare(right));

  const hash = crypto.createHash('sha256');
  hash.update('spec-work-working-tree-fingerprint/v1\0');
  hash.update(headSha);
  hash.update('\0status\0');
  hash.update(status);
  hash.update('\0tracked-diff\0');
  hash.update(trackedDiff);
  hash.update('\0');
  for (const relativePath of untrackedPaths) {
    updateUntrackedEntry(hash, repoRoot, relativePath);
  }

  return {
    schema_version: 'spec-work-working-tree-fingerprint/v1',
    repo_root: repoRoot,
    head_sha: headSha,
    fingerprint: `sha256:${hash.digest('hex')}`,
    dirty: status.length > 0,
    untracked_file_count: untrackedPaths.length,
  };
}

function main() {
  try {
    process.stdout.write(`${JSON.stringify(computeWorkingTreeFingerprint())}\n`);
  } catch (error) {
    process.stderr.write(`working-tree-fingerprint: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  computeWorkingTreeFingerprint,
  resolveRepoRoot,
  splitNullTerminated,
};
