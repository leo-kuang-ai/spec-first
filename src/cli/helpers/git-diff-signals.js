'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const { resolveTargetRepoRoot } = require('./target-repo');

function execGit(repoRoot, args) {
  return execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function parseNumstat(output) {
  const entries = [];
  const lines = String(output || '').split(/\r?\n/).filter((line) => line.trim() !== '');
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const added = parts[0] === '-' ? 0 : Number.parseInt(parts[0], 10);
    const deleted = parts[1] === '-' ? 0 : Number.parseInt(parts[1], 10);
    entries.push({
      added: Number.isFinite(added) ? added : 0,
      deleted: Number.isFinite(deleted) ? deleted : 0,
      path: normalizeRepoPath(parts.slice(2).join('\t')),
    });
  }
  return entries;
}

function collectGitDiffSignals({ targetRepo, baseRef = '' }) {
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) {
    return {
      ok: false,
      reason_code: 'not-a-repo',
      errors: target.errors,
      entries: [],
      file_count: 0,
      line_delta: 0,
      paths: [],
    };
  }

  const args = ['diff', '--numstat'];
  // --end-of-options 让 git 把 baseRef 当作 revision/pathspec 而非选项,挡住
  // `--output=`(任意写文件)/`--ext-diff`(外部命令)这类 git 参数注入。
  if (baseRef) args.push('--end-of-options', baseRef);

  let output = '';
  try {
    output = execGit(target.root, args);
  } catch (error) {
    return {
      ok: false,
      reason_code: baseRef ? 'no-diff-base' : 'git-diff-failed',
      errors: [error.message],
      entries: [],
      file_count: 0,
      line_delta: 0,
      paths: [],
    };
  }

  const entries = parseNumstat(output);
  const paths = entries.map((entry) => entry.path).filter(Boolean);
  return {
    ok: true,
    reason_code: entries.length === 0 ? 'empty-diff' : 'git-diff-collected',
    errors: [],
    entries,
    file_count: entries.length,
    line_delta: entries.reduce((total, entry) => total + entry.added + entry.deleted, 0),
    paths,
  };
}

function collectGitCachedNameStatus(targetRepo) {
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) return { ok: false, reason_code: 'not-a-repo', errors: target.errors, entries: [] };
  try {
    const output = execGit(target.root, ['diff', '--cached', '--name-status']);
    return {
      ok: true,
      reason_code: output.trim() === '' ? 'empty-staged-diff' : 'staged-diff-collected',
      errors: [],
      entries: parseNameStatus(output),
    };
  } catch (error) {
    return { ok: false, reason_code: 'staged-diff-failed', errors: [error.message], entries: [] };
  }
}

function collectGitStatusPorcelain(targetRepo) {
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) return { ok: false, reason_code: 'not-a-repo', errors: target.errors, entries: [] };
  try {
    const output = execGit(target.root, ['status', '--porcelain', '-uall']);
    return {
      ok: true,
      reason_code: output.trim() === '' ? 'clean-status' : 'status-collected',
      errors: [],
      entries: parsePorcelain(output),
    };
  } catch (error) {
    return { ok: false, reason_code: 'status-failed', errors: [error.message], entries: [] };
  }
}

function parseNameStatus(output) {
  return String(output || '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const parts = line.split('\t');
      return {
        status: parts[0],
        path: normalizeRepoPath(parts[parts.length - 1]),
      };
    })
    .filter((entry) => entry.path);
}

function parsePorcelain(output) {
  return String(output || '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const rawPath = line.slice(3);
      return {
        index: line[0],
        worktree: line[1],
        path: normalizeRepoPath(rawPath.includes(' -> ') ? rawPath.split(' -> ').pop() : rawPath),
      };
    })
    .filter((entry) => entry.path);
}

const C_QUOTE_ESCAPE_BYTES = {
  a: 0x07,
  b: 0x08,
  t: 0x09,
  n: 0x0a,
  v: 0x0b,
  f: 0x0c,
  r: 0x0d,
  '"': 0x22,
  '\\': 0x5c,
};

// git wraps paths with non-ASCII or special bytes in a double-quoted C string
// (`core.quotepath` defaults to on). Octal escapes carry raw UTF-8 bytes, so they
// must be collected as a byte sequence and decoded once — per-character decoding
// yields mojibake, and leaving them encoded lets `\NNN` degrade into fake path
// segments during separator normalization.
function unquoteGitPath(value) {
  const raw = String(value == null ? '' : value);
  if (raw.length < 2 || !raw.startsWith('"') || !raw.endsWith('"')) return raw;
  const body = raw.slice(1, -1);
  const bytes = [];
  let index = 0;
  while (index < body.length) {
    if (body[index] !== '\\') {
      const literal = String.fromCodePoint(body.codePointAt(index));
      bytes.push(...Buffer.from(literal, 'utf8'));
      index += literal.length;
      continue;
    }
    const next = body[index + 1];
    if (next === undefined) {
      bytes.push(0x5c);
      break;
    }
    if (next >= '0' && next <= '7') {
      let octal = '';
      index += 1;
      while (octal.length < 3 && body[index] >= '0' && body[index] <= '7') {
        octal += body[index];
        index += 1;
      }
      bytes.push(Number.parseInt(octal, 8) & 0xff);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(C_QUOTE_ESCAPE_BYTES, next)) {
      bytes.push(C_QUOTE_ESCAPE_BYTES[next]);
      index += 2;
      continue;
    }
    const literal = String.fromCodePoint(body.codePointAt(index + 1));
    bytes.push(...Buffer.from(literal, 'utf8'));
    index += 1 + literal.length;
  }
  return Buffer.from(bytes).toString('utf8');
}

function normalizeRepoPath(filePath) {
  return unquoteGitPath(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function topDirsForPaths(paths) {
  return Array.from(new Set(
    (paths || [])
      .map((filePath) => normalizeRepoPath(filePath).split('/')[0])
      .filter((segment) => segment && segment !== '.'),
  )).sort();
}

function resolveRepoPath(repoRoot, repoPath) {
  return path.join(repoRoot, normalizeRepoPath(repoPath));
}

module.exports = {
  collectGitCachedNameStatus,
  collectGitDiffSignals,
  collectGitStatusPorcelain,
  normalizeRepoPath,
  parseNumstat,
  resolveRepoPath,
  topDirsForPaths,
  unquoteGitPath,
};
