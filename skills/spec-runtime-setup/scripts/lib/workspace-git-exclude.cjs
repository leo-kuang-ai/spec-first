'use strict';

// U2/U6 — Managed per-child `.git/info/exclude` writer.
//
// CodeGraph has no out-of-tree artifact option: `.codegraph/` lives inside the
// child working tree. To keep `git status` clean without touching the child's
// tracked `.gitignore` (KTD2), spec-first appends a single managed line to the
// child's local, untracked `info/exclude`.
//
// Correctness points enforced here (from plan review P1/P2):
//   - Resolve the exclude file via `git rev-parse --git-path info/exclude`, which
//     is correct for `.git`-as-file worktrees/submodules (do NOT hardcode
//     `<repo>/.git/info/exclude`).
//   - Assert the RESOLVED path is contained in the workspace root before writing.
//   - Idempotent add (re-running does not duplicate the line) and self-only
//     removal (never touches user-authored lines).
//   - This is the single authorized child Git-metadata write (CR13); it grants
//     no source/finding/verification authority over the child.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { assertContainedPath, isPathWithin } = require('./path-safety.cjs');

const MANAGED_BLOCK_START = '# spec-first codegraph exclude start';
const MANAGED_BLOCK_END = '# spec-first codegraph exclude end';
const DEFAULT_PATTERNS = ['.codegraph/'];

// Generic `git rev-parse --git-path <gitRelative>` resolution. Correct for
// `.git`-as-file worktrees/submodules where the real git dir is elsewhere.
function resolveGitPath(repoRoot, gitRelative) {
  const result = spawnSync('git', ['-C', repoRoot, 'rev-parse', '--git-path', gitRelative], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 5000,
    windowsHide: true,
  });
  if (result.status !== 0) {
    return { ok: false, reason_code: 'git-path-resolution-failed' };
  }
  const raw = String(result.stdout || '').trim();
  if (!raw) return { ok: false, reason_code: 'git-path-empty' };
  // `git rev-parse --git-path` returns a path relative to the cwd it was run in
  // (repoRoot) unless already absolute.
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);
  return { ok: true, absolute };
}

function resolveExcludePath(repoRoot) {
  return resolveGitPath(repoRoot, 'info/exclude');
}

// Add the managed exclude block to a child repo. Idempotent.
// `workspaceRoot` is the containment boundary — the resolved exclude path must
// live inside it (rejects `.git`-file redirection escaping the workspace).
function addManagedExclude(repoRoot, workspaceRoot, patterns = DEFAULT_PATTERNS) {
  const resolved = resolveExcludePath(repoRoot);
  if (!resolved.ok) return { ok: false, reason_code: resolved.reason_code };

  if (!isPathWithin(resolved.absolute, workspaceRoot)) {
    return { ok: false, reason_code: 'exclude-target-escapes-workspace', target: resolved.absolute };
  }
  const infoDir = path.dirname(resolved.absolute);
  try {
    fs.mkdirSync(infoDir, { recursive: true });
    // Containment on the resolved target after ensuring its parent exists.
    assertContainedPath(workspaceRoot, resolved.absolute, { reasonCode: 'exclude-target-escapes-workspace' });
  } catch (error) {
    return { ok: false, reason_code: error.reason_code || 'exclude-target-escapes-workspace', target: resolved.absolute };
  }

  const existing = fs.existsSync(resolved.absolute) ? fs.readFileSync(resolved.absolute, 'utf8') : '';
  const stripped = stripManagedBlock(existing);
  if (!stripped.ok) return { ok: false, reason_code: stripped.reason_code, target: resolved.absolute };
  const withoutBlock = stripped.contents;
  const block = [MANAGED_BLOCK_START, ...patterns, MANAGED_BLOCK_END].join('\n');
  const base = withoutBlock.length && !withoutBlock.endsWith('\n') ? `${withoutBlock}\n` : withoutBlock;
  const next = `${base}${block}\n`;
  if (next === existing) {
    return { ok: true, changed: false, target: resolved.absolute };
  }
  fs.writeFileSync(resolved.absolute, next, 'utf8');
  return { ok: true, changed: existing !== next, target: resolved.absolute };
}

// Remove only the spec-first managed block; leave user lines untouched. Idempotent.
function removeManagedExclude(repoRoot, workspaceRoot) {
  const resolved = resolveExcludePath(repoRoot);
  if (!resolved.ok) return { ok: false, reason_code: resolved.reason_code };
  if (!isPathWithin(resolved.absolute, workspaceRoot)) {
    return { ok: false, reason_code: 'exclude-target-escapes-workspace', target: resolved.absolute };
  }
  if (!fs.existsSync(resolved.absolute)) {
    return { ok: true, changed: false, target: resolved.absolute };
  }
  try {
    assertContainedPath(workspaceRoot, resolved.absolute, { reasonCode: 'exclude-target-escapes-workspace' });
  } catch (error) {
    return { ok: false, reason_code: error.reason_code || 'exclude-target-escapes-workspace', target: resolved.absolute };
  }
  const existing = fs.readFileSync(resolved.absolute, 'utf8');
  const stripped = stripManagedBlock(existing);
  if (!stripped.ok) return { ok: false, reason_code: stripped.reason_code, target: resolved.absolute };
  if (stripped.contents === existing) {
    return { ok: true, changed: false, target: resolved.absolute };
  }
  fs.writeFileSync(resolved.absolute, stripped.contents, 'utf8');
  return { ok: true, changed: true, target: resolved.absolute };
}

function stripManagedBlock(contents) {
  const lines = contents.split('\n');
  const starts = [];
  const ends = [];
  lines.forEach((line, index) => {
    if (line.trim() === MANAGED_BLOCK_START) starts.push(index);
    if (line.trim() === MANAGED_BLOCK_END) ends.push(index);
  });
  if (starts.length === 0 && ends.length === 0) return { ok: true, contents };
  if (starts.length !== 1 || ends.length !== 1 || starts[0] >= ends[0]) {
    return { ok: false, reason_code: 'exclude-managed-block-malformed', contents };
  }
  const out = lines.filter((_line, index) => index < starts[0] || index > ends[0]);
  let result = out.join('\n');
  // Collapse a trailing blank left by block removal, preserve single trailing newline semantics.
  result = result.replace(/\n{3,}/g, '\n\n');
  return { ok: true, contents: result };
}

module.exports = {
  addManagedExclude,
  removeManagedExclude,
  resolveExcludePath,
  resolveGitPath,
  MANAGED_BLOCK_START,
  MANAGED_BLOCK_END,
  DEFAULT_PATTERNS,
};
