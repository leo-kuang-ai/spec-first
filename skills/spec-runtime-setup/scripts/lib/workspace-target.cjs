'use strict';

// U1 — Per-requirement workspace target resolution.
//
// Layers manifest + CLI declarations + bounded auto-discovery on top of the
// existing `resolveProjectTarget` (which owns non-git-parent topology detection
// and symlink-safe child-repo discovery). Produces a stable per-repo envelope
// that U2 (build), U4 (doctor/facts) and U5 (routing) consume.
//
// This module deliberately reuses `resolveProjectTarget` and `path-safety`
// rather than re-implementing discovery/containment, per the plan KTD1
// (extension, not greenfield).

const fs = require('node:fs');
const path = require('node:path');
const { resolveProjectTarget } = require('./project-target.cjs');
const { assertContainedPath } = require('./path-safety.cjs');
const { parseWorkspaceManifest } = require('./workspace-manifest.cjs');

const MANIFEST_RELATIVE_PATH = '.spec-first/workspace.yaml';
const MANIFEST_SCHEMA_VERSION = 'workspace-manifest.v1';
const RESULT_SCHEMA_VERSION = 'workspace-targets.v1';

function resolveWorkspaceTargets({
  cwd = process.cwd(),
  repos = [],
  allowDiscovery = true,
  manifestPath = null,
  // `discoverChildRepos` starts at depth 0, so 0 means direct children only.
  scanDepth = 0,
} = {}) {
  const invocationCwd = path.resolve(cwd);
  const discovery = resolveProjectTarget({ cwd: invocationCwd, allRepos: true, scanDepth });

  // Topology guard: this resolver is for a non-Git parent requirement workspace.
  if (discovery.mode === 'git-repo' || discovery.repo_status === 'git-repo') {
    return baseResult(invocationCwd, {
      topology: 'cwd-is-git-repo',
      reason_code: 'workspace-cwd-is-git-repo',
      next_action: '在非 Git 的需求文件夹(多仓父目录)根运行;当前 cwd 本身是 Git 仓。',
    });
  }
  if (discovery.mode === 'invalid-target') {
    return baseResult(invocationCwd, {
      topology: 'invalid',
      reason_code: discovery.reason_code || 'workspace-target-invalid',
      next_action: discovery.next_action || '请在有效的需求文件夹根运行。',
    });
  }

  const workspaceRoot = discovery.workspace_root || invocationCwd;
  const discoveredCandidates = Array.isArray(discovery.candidates) ? discovery.candidates : [];

  const manifest = loadManifest(workspaceRoot, manifestPath);
  const exclusions = new Set(
    (manifest.data.exclusions || []).map((entry) => normalizeRelative(String(entry))),
  );

  const repoById = new Map();
  const rejected = [];
  const ambiguous = [];
  const aliasOwners = new Map();

  // 1. Declared repos: manifest entries + CLI --repos (both are user-confirmed).
  const declared = [
    ...manifest.data.repos.map((entry) => ({ path: entry.path, alias: entry.alias || null, source: 'manifest' })),
    ...repos.map((entry) => ({ path: String(entry), alias: null, source: 'cli' })),
  ];

  for (const decl of declared) {
    const resolved = resolveDeclaredRepo(workspaceRoot, decl.path);
    if (!resolved.ok) {
      rejected.push({ path: normalizeRelative(decl.path), source: decl.source, reason_code: resolved.reason_code });
      continue;
    }
    const repoId = resolved.repo_id;
    if (repoById.has(repoId)) {
      // Same repo declared twice (manifest + cli, or dup) — keep first, not an error.
      continue;
    }
    repoById.set(repoId, {
      repo_id: repoId,
      workspace_relative_path: repoId,
      git_root: resolved.git_root,
      source: decl.source,
      needs_confirm: false,
      alias: decl.alias,
      git_health: healthFor(discoveredCandidates, resolved.git_root),
    });
    recordAlias(aliasOwners, decl.alias, repoId);
  }

  // 2. Auto-discovery: candidates not already declared and not excluded.
  if (allowDiscovery) {
    for (const candidate of discoveredCandidates) {
      const repoId = normalizeRelative(candidate.workspace_relative_path || candidate.repo_label || '');
      if (!repoId) continue;
      if (/[\u0000-\u001F\u007F]/.test(repoId)) {
        rejected.push({ path: repoId, source: 'discovered', reason_code: 'discovered-repo-control-character' });
        continue;
      }
      if (isExcluded(repoId, exclusions)) continue;
      if (repoById.has(repoId)) continue;
      repoById.set(repoId, {
        repo_id: repoId,
        workspace_relative_path: repoId,
        git_root: candidate.git_root,
        source: 'discovered',
        needs_confirm: true,
        alias: null,
        git_health: candidate.git_health || null,
      });
    }
  }

  const reposOut = Array.from(repoById.values())
    .sort((left, right) => left.repo_id.localeCompare(right.repo_id));

  // 3. Ambiguity — duplicate alias across distinct repos, and nested repo roots.
  for (const [alias, owners] of aliasOwners.entries()) {
    if (owners.length > 1) {
      ambiguous.push({ reason_code: 'duplicate-alias', alias, repo_ids: owners.slice().sort() });
    }
  }
  for (const nested of detectNestedPairs(reposOut)) {
    ambiguous.push(nested);
  }

  const hasTargets = reposOut.length > 0;
  const manifestError = manifest.malformed ? (manifest.reason_code || 'workspace-manifest-invalid') : null;
  let reasonCode = '';
  if (manifestError) {
    reasonCode = manifestError;
  } else if (ambiguous.length > 0) {
    reasonCode = 'workspace-targets-ambiguous';
  } else if (!hasTargets) {
    reasonCode = allowDiscovery ? 'workspace-no-review-targets' : 'workspace-no-declared-repos';
  }
  return {
    schema_version: RESULT_SCHEMA_VERSION,
    topology: 'requirement-workspace',
    workspace_root: workspaceRoot,
    manifest_present: manifest.present,
    manifest_error: manifestError,
    manifest_relative_path: MANIFEST_RELATIVE_PATH,
    repos: reposOut,
    ambiguous,
    rejected,
    excluded: Array.from(exclusions).sort(),
    reason_code: reasonCode,
    next_action: ambiguous.length > 0
      ? '消除重复 alias 或嵌套仓歧义后重试；不要静默选择其中一个仓。'
      : (hasTargets ? '' : '提供 --repos <child> 或在 .spec-first/workspace.yaml 声明仓,或从含子 Git 仓的父目录运行。'),
  };
}

function resolveDeclaredRepo(workspaceRoot, relPath) {
  const normalized = normalizeRelative(relPath);
  if (!normalized || normalized === '.') {
    return { ok: false, reason_code: 'declared-repo-empty-path' };
  }
  if (/[\u0000-\u001F\u007F]/.test(normalized)) {
    return { ok: false, reason_code: 'declared-repo-control-character' };
  }
  const absolute = path.resolve(workspaceRoot, normalized);
  try {
    assertContainedPath(workspaceRoot, absolute, { reasonCode: 'declared-repo-symlink-escape' });
  } catch (error) {
    return { ok: false, reason_code: error.reason_code || 'declared-repo-symlink-escape' };
  }
  let stat;
  try {
    stat = fs.statSync(absolute);
  } catch (_error) {
    return { ok: false, reason_code: 'declared-repo-not-found' };
  }
  if (!stat.isDirectory()) {
    return { ok: false, reason_code: 'declared-repo-not-directory' };
  }
  if (!hasGitMarker(absolute)) {
    return { ok: false, reason_code: 'declared-repo-not-git' };
  }
  return { ok: true, repo_id: normalized, git_root: absolute };
}

function loadManifest(workspaceRoot, manifestPath) {
  const resolvedPath = manifestPath
    ? path.resolve(workspaceRoot, manifestPath)
    : path.join(workspaceRoot, MANIFEST_RELATIVE_PATH);
  if (!fs.existsSync(resolvedPath)) {
    return { present: false, data: { repos: [], exclusions: [] } };
  }
  const parsed = parseWorkspaceManifest(fs.readFileSync(resolvedPath, 'utf8'));
  if (!parsed.ok) {
    return { present: true, malformed: true, reason_code: parsed.reason_code, data: { repos: [], exclusions: [] } };
  }
  return {
    present: true,
    data: {
      repos: parsed.data.repos || [],
      exclusions: parsed.data.exclusions || [],
    },
  };
}

function detectNestedPairs(repos) {
  const out = [];
  for (let i = 0; i < repos.length; i += 1) {
    for (let j = 0; j < repos.length; j += 1) {
      if (i === j) continue;
      const outer = repos[i].repo_id;
      const inner = repos[j].repo_id;
      if (inner.startsWith(`${outer}/`)) {
        out.push({ reason_code: 'nested-repo-roots', outer, inner });
      }
    }
  }
  return out;
}

function recordAlias(aliasOwners, alias, repoId) {
  if (!alias) return;
  if (!aliasOwners.has(alias)) aliasOwners.set(alias, []);
  aliasOwners.get(alias).push(repoId);
}

function healthFor(candidates, gitRoot) {
  const match = candidates.find((candidate) => candidate.git_root === gitRoot);
  return match ? match.git_health || null : null;
}

function isExcluded(repoId, exclusions) {
  if (exclusions.has(repoId)) return true;
  for (const excluded of exclusions) {
    if (repoId === excluded || repoId.startsWith(`${excluded}/`)) return true;
  }
  return false;
}

function hasGitMarker(directory) {
  try {
    const stat = fs.lstatSync(path.join(directory, '.git'));
    return stat.isDirectory() || stat.isFile();
  } catch (_error) {
    return false;
  }
}

function normalizeRelative(value) {
  if (!value) return '';
  const trimmed = String(value).trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
  return trimmed;
}

function baseResult(workspaceRoot, overrides) {
  return {
    schema_version: RESULT_SCHEMA_VERSION,
    topology: 'invalid',
    workspace_root: workspaceRoot,
    manifest_present: false,
    manifest_relative_path: MANIFEST_RELATIVE_PATH,
    repos: [],
    ambiguous: [],
    rejected: [],
    excluded: [],
    reason_code: '',
    next_action: '',
    ...overrides,
  };
}

module.exports = {
  resolveWorkspaceTargets,
  MANIFEST_RELATIVE_PATH,
  MANIFEST_SCHEMA_VERSION,
  RESULT_SCHEMA_VERSION,
};
