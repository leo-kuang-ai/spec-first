#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { finding, findSymlinkSegment, isInside, readStableRegularFile } = require('./lib/package-inspection.cjs');

const GENERATED_RUNTIME_PREFIXES = ['.claude/', '.codex/', '.agents/skills/', '.cursor/', '.kiro/', '.qoder/'];
const SHA256 = /^[a-f0-9]{64}$/;
const CLAIMS = new Set(['ready', 'preview-only', 'blocked']);
const STATUS_ORDER = { error: 0, warning: 1, not_checked: 2 };

function hashFile(absolutePath) {
  return crypto.createHash('sha256').update(readStableRegularFile(absolutePath)).digest('hex');
}

function hashDirectoryEntries(absolutePath) {
  const stat = fs.lstatSync(absolutePath);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('not a regular directory');
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true })
    .map((entry) => `${entry.name}:${entry.isDirectory() ? 'd' : entry.isFile() ? 'f' : entry.isSymbolicLink() ? 'l' : 'o'}`)
    .sort();
  return crypto.createHash('sha256').update(entries.join('\n')).digest('hex');
}

function nearestExistingAncestor(absolutePath, boundary) {
  let current = absolutePath;
  while (isInside(current, boundary)) {
    try {
      fs.lstatSync(current);
      return current;
    } catch (error) {
      if (!error || error.code !== 'ENOENT') throw error;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return null;
}

function isSafeRelative(value) {
  return typeof value === 'string'
    && value.length > 0
    && !path.isAbsolute(value)
    && !value.includes('\\')
    && value.split('/').every((segment) => segment && segment !== '.' && segment !== '..');
}

function resolveWithin(root, relative) {
  if (!isSafeRelative(relative)) return null;
  const absolute = path.resolve(root, relative);
  if (!isInside(absolute, root) || findSymlinkSegment(absolute)) return null;
  return absolute;
}

function normalizedPathSet(entries) {
  return new Set(entries.filter((entry) => typeof entry === 'string'));
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function writeSetHash(writeSet) {
  const normalized = writeSet.map((entry) => ({
    path: entry.path,
    before_sha256: entry.before_sha256,
    after_sha256: entry.after_sha256,
  })).sort((left, right) => left.path.localeCompare(right.path));
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function validateAuthoringPreview({ manifest, authorizedRoot, scope, writeSet }) {
  const findings = [];
  let incomplete = false;
  const add = (...args) => findings.push(finding(...args));
  let root;
  let canonicalRoot;

  try {
    root = fs.realpathSync(path.resolve(authorizedRoot));
    if (findSymlinkSegment(path.resolve(authorizedRoot))) add('authorized_root_symlink_segment', 'path-safety', 'error', null, 'Authorized root must not traverse a symbolic link.');
  } catch (error) {
    incomplete = true;
    add('authorized_root_unavailable', 'path-safety', 'not_checked', null, error.message);
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    add('manifest_invalid', 'schema', 'error', null, 'Manifest must be a JSON object.');
    return report();
  }
  if (manifest.schema_version !== 'spec-write-skill.authoring-preview/v1') add('schema_version_invalid', 'schema', 'error', null, 'Manifest schema_version is not supported.');
  if (!root) return report();
  if (path.resolve(manifest.target_repo_root || '') !== root) add('target_repo_root_mismatch', 'scope', 'error', null, 'Manifest target repository root must equal the authorized root.');
  if (manifest.authorized_root !== '.') add('authorized_root_mismatch', 'scope', 'error', null, 'Manifest authorized_root must be the authorized root represented as .');
  if (!isSafeRelative(manifest.canonical_source_root)) add('canonical_source_root_invalid', 'path-safety', 'error', null, 'canonical_source_root must be a safe repo-relative path.');
  else {
    canonicalRoot = resolveWithin(root, manifest.canonical_source_root);
    if (!canonicalRoot) add('canonical_source_root_unsafe', 'path-safety', 'error', manifest.canonical_source_root, 'canonical_source_root escapes or traverses a symbolic link.');
    else {
      try {
        const stat = fs.lstatSync(canonicalRoot);
        if (!stat.isDirectory() || stat.isSymbolicLink()) add('canonical_source_root_not_directory', 'path-safety', 'error', manifest.canonical_source_root, 'Existing canonical_source_root must be a regular directory.');
      } catch (error) {
        if (!error || error.code !== 'ENOENT') {
          incomplete = true;
          add('canonical_source_root_unreadable', 'path-safety', 'not_checked', manifest.canonical_source_root, error.message);
        }
      }
    }
  }
  if (manifest.requested_effect !== 'apply') add('effect_not_apply', 'effect', 'error', null, 'Only apply previews may be mutation-ready.');
  if (!CLAIMS.has(manifest.authorization_claim)) add('authorization_claim_invalid', 'authorization', 'error', null, 'authorization_claim must be ready, preview-only, or blocked.');
  else if (manifest.authorization_claim !== 'ready') add('authorization_not_ready', 'authorization', 'error', null, 'Manifest claim is not eligible for an apply gate.');

  for (const field of ['planned_side_effects', 'residual_risks']) {
    if (!Array.isArray(manifest[field]) || manifest[field].some((entry) => typeof entry !== 'string')) {
      add(`${field}_invalid`, 'schema', 'error', null, `${field} must be a string array.`);
    }
  }

  const groups = ['would_change', 'preserve', 'generated', 'not_touch'];
  const allPaths = new Map();
  let wouldChange = [];
  for (const group of groups) {
    if (!Array.isArray(manifest[group])) {
      add(`${group}_invalid`, 'schema', 'error', null, `${group} must be an array.`);
      continue;
    }
    const entries = group === 'would_change' ? manifest[group] : manifest[group].map((entry) => ({ path: entry }));
    if (group === 'would_change') wouldChange = entries;
    for (const entry of entries) {
      const relative = entry && entry.path;
      if (!isSafeRelative(relative)) {
        add('manifest_path_invalid', 'path-safety', 'error', null, `${group} contains an unsafe path.`);
        continue;
      }
      if (allPaths.has(relative)) add('manifest_path_overlap', 'path-sets', 'error', relative, `Path overlaps ${allPaths.get(relative)} and ${group}.`);
      else allPaths.set(relative, group);
      if (GENERATED_RUNTIME_PREFIXES.some((prefix) => relative.startsWith(prefix))) add('generated_runtime_path_forbidden', 'source-runtime', 'error', relative, 'Generated runtime paths are not canonical source mutation targets.');
      const absolute = resolveWithin(root, relative);
      if (!absolute) add('manifest_path_unsafe', 'path-safety', 'error', relative, 'Path escapes or traverses a symbolic link.');
      else if (canonicalRoot && !isInside(absolute, canonicalRoot)) add('path_outside_canonical_source_root', 'ownership', 'error', relative, 'Declared path is outside canonical_source_root.');
    }
  }
  if (wouldChange.length === 0) add('empty_mutation_list', 'mutation', 'error', null, 'Apply preview requires at least one would_change entry.');

  for (const entry of wouldChange) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.before_sha256 !== null && !SHA256.test(entry.before_sha256 || '')) add('before_hash_invalid', 'hash', 'error', entry.path || null, 'before_sha256 must be null or a SHA-256 hex value.');
    if (!SHA256.test(entry.after_sha256 || '')) add('after_hash_invalid', 'hash', 'error', entry.path || null, 'after_sha256 must be a SHA-256 hex value.');
    if (!['create', 'replace'].includes(entry.collision_disposition)) add('collision_disposition_invalid', 'collision', 'error', entry.path || null, 'would_change requires create or replace collision_disposition.');
    const absolute = resolveWithin(root, entry.path);
    if (!absolute) continue;
    let currentHash = null;
    let exists = true;
    try {
      currentHash = hashFile(absolute);
    } catch (error) {
      if (error && error.code === 'ENOENT') exists = false;
      else {
        incomplete = true;
        add('snapshot_unreadable', 'snapshot', 'not_checked', entry.path, error.message);
        continue;
      }
    }
    if (exists) {
      if (entry.collision_disposition !== 'replace') add('existing_collision_unresolved', 'collision', 'error', entry.path, 'Existing file requires replace disposition.');
      if (entry.before_sha256 !== currentHash) add('snapshot_stale', 'snapshot', 'error', entry.path, 'Current file hash differs from preview before hash.');
    } else if (entry.before_sha256 !== null || entry.collision_disposition !== 'create') {
      add('new_file_precondition_invalid', 'collision', 'error', entry.path, 'New file requires null before hash and create disposition.');
    }
  }

  if (!manifest.source_snapshot || !Array.isArray(manifest.source_snapshot.files)) {
    add('source_snapshot_invalid', 'snapshot', 'error', null, 'source_snapshot.files must be an array.');
  } else {
    const snapshotPaths = new Set();
    for (const entry of manifest.source_snapshot.files) {
      if (!entry || !isSafeRelative(entry.path) || !SHA256.test(entry.sha256 || '')) {
        add('source_snapshot_entry_invalid', 'snapshot', 'error', null, 'Snapshot entries require safe path and SHA-256.');
        continue;
      }
      snapshotPaths.add(entry.path);
      const absolute = resolveWithin(root, entry.path);
      if (!absolute || (canonicalRoot && !isInside(absolute, canonicalRoot))) {
        add('snapshot_path_missing', 'snapshot', 'error', entry.path, 'Snapshot file is missing or unsafe.');
        continue;
      }
      try {
        if (hashFile(absolute) !== entry.sha256) add('snapshot_stale', 'snapshot', 'error', entry.path, 'Source snapshot no longer matches the file.');
      } catch (error) {
        if (error && error.code === 'ENOENT') add('snapshot_path_missing', 'snapshot', 'error', entry.path, 'Snapshot file is missing or unsafe.');
        else {
          incomplete = true;
          add('snapshot_unreadable', 'snapshot', 'not_checked', entry.path, error.message);
        }
      }
    }
    const requiredSnapshotPaths = new Set();
    const canonicalSkill = `${manifest.canonical_source_root}/SKILL.md`;
    for (const relative of [canonicalSkill, ...allPaths.keys()]) {
      const absolute = resolveWithin(root, relative);
      if (!absolute || (canonicalRoot && !isInside(absolute, canonicalRoot))) continue;
      try {
        hashFile(absolute);
        requiredSnapshotPaths.add(relative);
      } catch (error) {
        if (!error || error.code !== 'ENOENT') {
          incomplete = true;
          add('snapshot_unreadable', 'snapshot', 'not_checked', relative, error.message);
        }
      }
    }
    for (const relative of requiredSnapshotPaths) {
      if (!snapshotPaths.has(relative)) add('snapshot_required_path_missing', 'snapshot', 'error', relative, 'Existing canonical or declared path is absent from source_snapshot.files.');
    }
    const parentEntries = manifest.source_snapshot.parents;
    for (const entry of wouldChange) {
      const absolute = entry && resolveWithin(root, entry.path);
      if (!absolute || !canonicalRoot) continue;
      try {
        hashFile(absolute);
        continue;
      } catch (error) {
        if (!error || error.code !== 'ENOENT') {
          incomplete = true;
          add('snapshot_unreadable', 'snapshot', 'not_checked', entry.path, error.message);
          continue;
        }
      }
      const parent = nearestExistingAncestor(path.dirname(absolute), root);
      const relativeParent = parent && (path.relative(root, parent).split(path.sep).join('/') || '.');
      const parentSnapshot = Array.isArray(parentEntries) && parentEntries.find((candidate) => candidate && candidate.path === relativeParent);
      if (!parentSnapshot || !SHA256.test(parentSnapshot.entries_sha256 || '')) {
        add('parent_snapshot_missing', 'snapshot', 'error', relativeParent || null, 'New file requires a snapshot of its nearest existing parent directory.');
      } else {
        try {
          if (hashDirectoryEntries(parent) !== parentSnapshot.entries_sha256) add('parent_snapshot_stale', 'snapshot', 'error', relativeParent, 'Parent directory entries changed since preview.');
        } catch (error) {
          incomplete = true;
          add('parent_snapshot_unreadable', 'snapshot', 'not_checked', relativeParent || null, error.message);
        }
      }
    }
  }

  const manifestPaths = normalizedPathSet(wouldChange.map((entry) => entry && entry.path));
  const scopePaths = normalizedPathSet(scope && scope.paths || []);
  if (!scope || !Array.isArray(scope.paths) || !sameSet(manifestPaths, scopePaths)) add('scope_path_mismatch', 'scope', 'error', null, 'Host scope paths must exactly equal manifest would_change paths.');
  const dirtyPaths = new Set(scope && Array.isArray(scope.dirty_paths) ? scope.dirty_paths : []);
  if (!scope || !Array.isArray(scope.dirty_paths)) {
    incomplete = true;
    add('dirty_overlap_unavailable', 'dirty-overlap', 'not_checked', null, 'Host did not provide the preview-time dirty path set.');
  } else {
    const dirtyProtectedPaths = new Set([...manifestPaths, ...normalizedPathSet(manifest.generated || [])]);
    const dirtyOverlaps = [...dirtyProtectedPaths].filter((filePath) => dirtyPaths.has(filePath));
    for (const filePath of dirtyOverlaps) {
      const record = Array.isArray(manifest.dirty_overlap) && manifest.dirty_overlap.find((entry) => entry && entry.path === filePath);
      if (!record || !SHA256.test(record.current_sha256 || '') || !['replace', 'preserve'].includes(record.disposition) || record.authorization !== true) {
        add('dirty_overlap_disposition_missing', 'dirty-overlap', 'error', filePath, 'Dirty overlap requires current hash, disposition, and explicit authorization.');
        continue;
      }
      const absolute = resolveWithin(root, filePath);
      try {
        if (!absolute || hashFile(absolute) !== record.current_sha256) add('dirty_overlap_stale', 'dirty-overlap', 'error', filePath, 'Dirty overlap hash no longer matches preview.');
      } catch (error) {
        incomplete = true;
        add('dirty_overlap_unreadable', 'dirty-overlap', 'not_checked', filePath, error.message);
      }
    }
  }
  if (!scope || scope.pre_write_binding !== true || !Array.isArray(writeSet)) {
    incomplete = true;
    add('exact_write_set_unavailable', 'write-set', 'not_checked', null, 'Host did not provide an exact pre-write binding and candidate write set.');
  } else {
    const writeByPath = new Map(writeSet.map((entry) => [entry && entry.path, entry]));
    if (!sameSet(manifestPaths, new Set(writeByPath.keys()))) add('write_set_path_mismatch', 'write-set', 'error', null, 'Candidate write set paths must exactly equal manifest paths.');
    for (const entry of wouldChange) {
      const candidate = writeByPath.get(entry && entry.path);
      if (!candidate || candidate.before_sha256 !== entry.before_sha256 || candidate.after_sha256 !== entry.after_sha256) {
        add('write_set_hash_mismatch', 'write-set', 'error', entry && entry.path || null, 'Candidate write set hash preconditions must exactly match manifest.');
      }
    }
  }
  if (!scope || scope.conditional_patch_primitive !== 'atomic-expected-hash') {
    incomplete = true;
    add('atomic_conditional_patch_unavailable', 'host-capability', 'not_checked', null, 'Host cannot prove an atomic expected-hash or expected-nonexistence patch primitive.');
  }
  return report();

  function report() {
    findings.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      || a.reason_code.localeCompare(b.reason_code)
      || String(a.path || '').localeCompare(String(b.path || '')));
    const hasErrors = findings.some((entry) => entry.status === 'error');
    const result = hasErrors ? 'fail' : incomplete ? 'incomplete' : 'pass';
    return {
      schema_version: 'spec-write-skill.authoring-preview-report/v1',
      result,
      mutation_readiness: result === 'pass' ? 'ready' : 'not-ready',
      binding: result === 'pass' ? {
        authorized_root: root,
        canonical_source_root: manifest.canonical_source_root,
        write_set_sha256: writeSetHash(writeSet),
      } : null,
      findings,
      limitations: [
        'authorization_claim is structural only; the host must re-confirm current user authorization before writing.',
        'This validator does not judge Design Brief quality, patch semantics, or user authorization.',
      ],
    };
  }
}

function verifyWriteReceipt({ preview, root, writeSet, patch_receipt }) {
  const paths = Array.isArray(writeSet) ? writeSet.map((entry) => entry.path) : [];
  const rollbackPreview = paths;
  const changed_paths = patch_receipt && patch_receipt.actual_changed_paths;
  const unchanged_paths = patch_receipt && patch_receipt.unchanged_paths;
  const failure_reason = patch_receipt && patch_receipt.failure_reason;
  if (!preview || preview.result !== 'pass' || !preview.binding) return { result: 'fail', completion_claim_allowed: false, reason_code: 'preview_not_verified', rollback_preview: rollbackPreview };
  if (!patch_receipt || patch_receipt.primitive !== 'atomic-expected-hash' || !Array.isArray(changed_paths) || !Array.isArray(unchanged_paths)) {
    return { result: 'fail', completion_claim_allowed: false, reason_code: 'actual_change_list_unavailable', rollback_preview: rollbackPreview };
  }
  try {
    if (fs.realpathSync(root) !== preview.binding.authorized_root || writeSetHash(writeSet) !== preview.binding.write_set_sha256) {
      return { result: 'fail', completion_claim_allowed: false, reason_code: 'write_receipt_binding_mismatch', rollback_preview: rollbackPreview };
    }
  } catch {
    return { result: 'fail', completion_claim_allowed: false, reason_code: 'write_receipt_binding_mismatch', rollback_preview: rollbackPreview };
  }
  if (failure_reason || !sameSet(new Set(changed_paths || []), new Set(paths)) || (unchanged_paths || []).length > 0) {
    return { result: 'fail', completion_claim_allowed: false, reason_code: failure_reason || 'write_receipt_path_mismatch', changed_paths: changed_paths || [], unchanged_paths: unchanged_paths || [], rollback_preview: rollbackPreview };
  }
  for (const entry of writeSet) {
    try {
      if (hashFile(path.resolve(root, entry.path)) !== entry.after_sha256) {
        return { result: 'fail', completion_claim_allowed: false, reason_code: 'write_receipt_after_hash_mismatch', changed_paths, unchanged_paths, rollback_preview: rollbackPreview };
      }
    } catch (error) {
      return { result: 'fail', completion_claim_allowed: false, reason_code: 'write_receipt_unreadable', changed_paths, unchanged_paths, rollback_preview: rollbackPreview };
    }
  }
  return { result: 'pass', completion_claim_allowed: true, changed_paths, unchanged_paths, rollback_preview: [] };
}

function readJsonNoFollow(filePath) {
  const absolute = path.resolve(filePath);
  return JSON.parse(readStableRegularFile(absolute).toString('utf8'));
}

function parseArgs(argv) {
  const args = { manifestPath: null, authorizedRoot: null, allowedPathsPath: null, writeSetPath: null, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') args.json = true;
    else if (arg === '--authorized-root') args.authorizedRoot = argv[++index] || null;
    else if (arg === '--allowed-paths') args.allowedPathsPath = argv[++index] || null;
    else if (arg === '--write-set') args.writeSetPath = argv[++index] || null;
    else if (!arg.startsWith('-') && !args.manifestPath) args.manifestPath = arg;
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  if (!args.manifestPath || !args.authorizedRoot || !args.allowedPathsPath || !args.writeSetPath) throw new Error('Usage: validate-authoring-preview.cjs <manifest.json> --authorized-root <root> --allowed-paths <scope.json> --write-set <write-set.json> [--json]');
  return args;
}

function renderHuman(report) {
  return [`Authoring preview: ${report.result}`, `Mutation readiness: ${report.mutation_readiness}`, ...report.findings.map((entry) => `[${entry.status}] ${entry.reason_code}: ${entry.message}`)].join('\n');
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const report = validateAuthoringPreview({
      manifest: readJsonNoFollow(args.manifestPath), authorizedRoot: args.authorizedRoot,
      scope: readJsonNoFollow(args.allowedPathsPath), writeSet: readJsonNoFollow(args.writeSetPath),
    });
    process.stdout.write(`${args.json ? JSON.stringify(report, null, 2) : renderHuman(report)}\n`);
    return report.result === 'pass' ? 0 : report.result === 'fail' ? 1 : 2;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = { parseArgs, readJsonNoFollow, renderHuman, validateAuthoringPreview, verifyWriteReceipt };
