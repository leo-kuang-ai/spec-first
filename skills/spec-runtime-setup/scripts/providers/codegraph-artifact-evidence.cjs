'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { readStableRegularFile } = require('../lib/regular-file-snapshot.cjs');
const { captureSourceSnapshot, sourceContentIdentity } = require('../lib/source-snapshot.cjs');

const FILES = ['codegraph.db', 'codegraph.db-wal', 'codegraph.db-journal'];
const IDENTITY_KEYS = ['package', 'version', 'installer', 'command', 'inventory_sha256'];
const SCHEMA = 'codegraph-artifact-evidence.v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const unknown = (reason = 'codegraph-artifact-evidence-unavailable') => ({ status: 'unknown', reason_code: reason });
const signature = (stat) => [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeMs, stat.ctimeMs].join(':');

function captureDatabaseSnapshot(repoRoot, { maxBytes = 256 * 1024 * 1024, budgetMs = 5000 } = {}) {
  const root = path.resolve(repoRoot);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || !Number.isFinite(budgetMs) || budgetMs <= 0) return unknown();
  const deadline = performance.now() + budgetMs;
  const directory = path.join(root, '.codegraph');
  try {
    const rootStat = fs.lstatSync(root);
    const directoryStat = fs.lstatSync(directory);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || !directoryStat.isDirectory() || directoryStat.isSymbolicLink()) return unknown();
    const inventory = () => FILES.map((name) => {
      try {
        const stat = fs.lstatSync(path.join(directory, name));
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('unsafe');
        return signature(stat);
      } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    });
    const before = inventory();
    const files = {};
    let bytes = 0;
    for (const [index, name] of FILES.entries()) {
      if (performance.now() >= deadline) return unknown('codegraph-artifact-snapshot-budget-exceeded');
      if (before[index] === null) { files[name] = null; continue; }
      const read = readStableRegularFile(path.join(directory, name), {
        rootPath: root,
        read: (fd, stat) => {
          if (signature(stat) !== before[index] || bytes + stat.size > maxBytes) throw new Error('budget-or-drift');
          bytes += stat.size;
          const hash = crypto.createHash('sha256');
          const buffer = Buffer.allocUnsafe(128 * 1024);
          let offset = 0;
          while (offset < stat.size) {
            if (performance.now() >= deadline) throw new Error('budget');
            const size = fs.readSync(fd, buffer, 0, Math.min(buffer.length, stat.size - offset), offset);
            if (!size) throw new Error('short-read');
            hash.update(buffer.subarray(0, size)); offset += size;
          }
          return { size_bytes: stat.size, sha256: hash.digest('hex') };
        },
      });
      if (!read.ok) return unknown('codegraph-artifact-snapshot-unstable');
      files[name] = read.value;
    }
    if (!files['codegraph.db'] || files['codegraph.db'].size_bytes === 0) return unknown('codegraph-artifact-missing');
    if (performance.now() >= deadline || JSON.stringify(before) !== JSON.stringify(inventory())
      || signature(directoryStat) !== signature(fs.lstatSync(directory))) return unknown('codegraph-artifact-snapshot-unstable');
    return { status: 'confirmed', files };
  } catch (_error) { return unknown(); }
}

function validEvidence(evidence) {
  return Boolean(evidence && evidence.schema_version === SCHEMA && evidence.query_verified === true
    && typeof evidence.verified_at === 'string' && Number.isFinite(Date.parse(evidence.verified_at))
    && typeof evidence.repo_root === 'string' && path.isAbsolute(evidence.repo_root)
    && sourceContentIdentity(evidence.source_snapshot)
    && evidence.provider_identity && IDENTITY_KEYS.every((key) => typeof evidence.provider_identity[key] === 'string' && evidence.provider_identity[key].length > 0)
    && evidence.provider_identity.installer === 'npm'
    && /^[a-f0-9]{64}$/.test(evidence.provider_identity.inventory_sha256)
    && evidence.files && !Array.isArray(evidence.files) && Object.keys(evidence.files).length === FILES.length
    && FILES.every((name) => evidence.files[name] === null || (evidence.files[name]
      && Number.isSafeInteger(evidence.files[name].size_bytes) && evidence.files[name].size_bytes >= 0
      && /^[a-f0-9]{64}$/.test(evidence.files[name].sha256)))
    && evidence.files['codegraph.db'] && evidence.files['codegraph.db'].size_bytes > 0);
}

function sameIdentity(left, right) {
  return Boolean(left && right && IDENTITY_KEYS.every((key) => left[key] === right[key]));
}

function sameFiles(left, right) {
  return FILES.every((name) => left[name] === null ? right[name] === null
    : right[name] && left[name].size_bytes === right[name].size_bytes && left[name].sha256 === right[name].sha256);
}

function compareEvidence(context, evidence, currentIdentity, currentSource) {
  if (!validEvidence(evidence)) return unknown('codegraph-artifact-evidence-missing');
  const now = (context.now || new Date()).getTime();
  const age = now - Date.parse(evidence.verified_at);
  if (!Number.isFinite(age) || age < 0) return unknown('codegraph-artifact-evidence-clock-invalid');
  if (age > MAX_AGE_MS) return { status: 'stale', reason_code: 'codegraph-artifact-evidence-expired' };
  if (path.resolve(context.repoRoot) !== evidence.repo_root) return { status: 'stale', reason_code: 'codegraph-artifact-evidence-root-mismatch' };
  if (currentIdentity && currentIdentity.status === 'stale') return { status: 'stale', reason_code: 'codegraph-artifact-identity-mismatch' };
  if (!currentIdentity || currentIdentity.status !== 'confirmed') return unknown('codegraph-artifact-identity-unverified');
  if (!sameIdentity(currentIdentity.identity, evidence.provider_identity)) return { status: 'stale', reason_code: 'codegraph-artifact-identity-mismatch' };
  const source = sourceContentIdentity(currentSource || captureSourceSnapshot(context));
  if (!source) return unknown('codegraph-artifact-source-unavailable');
  if (JSON.stringify(source) !== JSON.stringify(sourceContentIdentity(evidence.source_snapshot))) return { status: 'stale', reason_code: 'codegraph-artifact-source-mismatch' };
  const current = captureDatabaseSnapshot(context.repoRoot);
  if (current.status !== 'confirmed') return current;
  if (!sameFiles(current.files, evidence.files)) return { status: 'stale', reason_code: 'codegraph-artifact-content-mismatch' };
  return { status: 'confirmed', evidence };
}

function readRecordedEvidence(context) {
  const root = path.resolve(context.repoRoot);
  const result = readStableRegularFile(path.join(root, '.spec-first', 'config', 'tool-facts.json'), {
    rootPath: root,
    read: (fd, stat) => stat.size <= 4 * 1024 * 1024 ? JSON.parse(fs.readFileSync(fd, 'utf8')) : null,
  });
  const facts = result.ok ? result.value : null;
  if (!facts || facts.schema_version !== 'tool-facts.v2' || facts.repo_root !== root || facts.host !== (context.host || null)) return null;
  const entries = Array.isArray(facts.provider_readiness) ? facts.provider_readiness.filter((entry) => entry && entry.provider === 'codegraph' && entry.readiness_scope === 'artifact') : [];
  return entries.length === 1 && validEvidence(entries[0].artifact_evidence) ? entries[0].artifact_evidence : null;
}

module.exports = { SCHEMA, captureDatabaseSnapshot, validEvidence, compareEvidence, readRecordedEvidence, sameFiles, sameIdentity };
