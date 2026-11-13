'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { assertContainedPath, ensureContainedDirectory } = require('./path-safety.cjs');
const { commandSucceeded } = require('./process-runner.cjs');

function verifiedNpmWarmup({ context, repoRoot, entry, command, args, executeInstall }) {
  return verifiedNpmExecution({ context, repoRoot, identity: entry.resolved_dependency || {}, command, args, executeInstall, mode: 'warmup' });
}

function verifiedNpmInstall(options) {
  return verifiedNpmExecution({ ...options, mode: 'install' });
}

function verifiedNpmExecution({ context, repoRoot, identity = {}, command, args, executeInstall, mode }) {
  const spec = `${identity.package}@${identity.version}`;
  const validIdentity = typeof identity.package === 'string'
    && /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(identity.package)
    && /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(identity.version || '')
    && typeof identity.source === 'string' && identity.source.length > 0
    && /^sha512-[A-Za-z0-9+/]{86}==$/.test(identity.integrity || '');
  const executable = path.basename(command).replace(/\.(cmd|exe)$/i, '').toLowerCase();
  const validCommand = mode === 'warmup' ? executable === 'npx'
    : executable === 'npm' && args[0] === 'install' && args.includes('-g');
  if (!validIdentity || !validCommand
    || args.filter((arg) => arg === spec).length !== 1) {
    return failure('npm-package-identity-invalid');
  }
  let scratch;
  let result;
  const operations = [];
  try {
    const parent = ensureContainedDirectory(repoRoot, path.join(repoRoot, '.spec-first', 'cache', 'mcp-warmup', context.host || 'standalone', context.platform || process.platform), { mode: 0o700, reasonCode: 'npm-warmup-path-unsafe' });
    scratch = fs.mkdtempSync(path.join(parent, '.archive-'));
    const packed = executeInstall('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch, spec], { cwd: repoRoot, timeoutMs: 120000 });
    operations.push(packed);
    if (!commandSucceeded(packed)) {
      result = failure('npm-archive-fetch-failed');
    } else {
      const archives = fs.readdirSync(scratch).filter((name) => name.endsWith('.tgz'));
      if (archives.length !== 1) throw new Error('npm-archive-invalid');
      const archive = path.join(scratch, archives[0]);
      assertContainedPath(repoRoot, archive, { reasonCode: 'npm-archive-invalid' });
      const linkStat = fs.lstatSync(archive);
      if (!linkStat.isFile() || linkStat.isSymbolicLink() || linkStat.nlink !== 1) throw new Error('npm-archive-invalid');
      const fd = fs.openSync(archive, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0) | (fs.constants.O_NONBLOCK || 0));
      let integrity;
      try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile() || stat.nlink !== 1 || stat.dev !== linkStat.dev || stat.ino !== linkStat.ino || stat.size === 0 || stat.size > 32 * 1024 * 1024) throw new Error('npm-archive-invalid');
        integrity = `sha512-${crypto.createHash('sha512').update(fs.readFileSync(fd)).digest('base64')}`;
      } finally {
        fs.closeSync(fd);
      }
      if (integrity !== identity.integrity) throw new Error('npm-archive-integrity-mismatch');
      let manifests;
      try { manifests = JSON.parse(packed.stdout); } catch (_error) { throw new Error('npm-archive-identity-mismatch'); }
      if (!Array.isArray(manifests) || manifests.length !== 1
        || manifests[0]?.name !== identity.package || manifests[0].version !== identity.version
        || manifests[0].filename !== archives[0] || manifests[0].integrity !== integrity) {
        throw new Error('npm-archive-identity-mismatch');
      }
      // 执行刚校验的归档，不能再次按名称解析另一份包。
      const launched = executeInstall(command, args.map((arg) => arg === spec ? `file:${archive}` : arg), { cwd: repoRoot, timeoutMs: 120000 });
      operations.push(launched);
      result = {
        ...launched,
        dependency_identity: {
          package: identity.package, version: identity.version, source: identity.source,
          integrity, installer: mode === 'warmup' ? 'npm-pack+npx' : 'npm-pack+npm-install', integrity_status: 'verified',
          verification_scope: 'top-level-package-archive',
        },
      };
    }
  } catch (error) {
    const reason = ['npm-archive-invalid', 'npm-archive-integrity-mismatch', 'npm-archive-identity-mismatch'].includes(error.message)
      ? error.message : 'npm-warmup-path-or-io-failed';
    result = failure(reason);
  } finally {
    if (scratch) {
      try {
        assertContainedPath(repoRoot, scratch, { reasonCode: 'npm-warmup-path-unsafe' });
        fs.rmSync(scratch, { recursive: true, force: true });
      } catch (_error) {
        if (result) result.limitations = ['npm-warmup-scratch-cleanup-failed'];
      }
    }
  }
  const mirrorUsed = operations.some((operation) => operation.mirror_used === true);
  return {
    ...result,
    attempts: operations.flatMap((operation) => operation.attempts || []),
    install_source: operations.some((operation) => operation.install_source === 'both-failed')
      ? 'both-failed' : (mirrorUsed ? 'mirror' : 'official'),
    mirror_used: mirrorUsed,
  };
}

function failure(reason) {
  return { exit_code: 1, status: 'failed', reason_code: reason, stdout: '', stderr: reason };
}

function isVerifiedNpmArchiveIdentity(value, expected, installers = ['npm-pack+npx']) {
  if (!value || !expected || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = ['package', 'version', 'source', 'integrity', 'installer', 'integrity_status', 'verification_scope'];
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
    && ['package', 'version', 'source'].every((key) => typeof value[key] === 'string' && value[key].length > 0)
    && /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(value.version)
    && ['package', 'version', 'source', 'integrity'].every((key) => value[key] === expected[key])
    && /^sha512-[A-Za-z0-9+/]{86}==$/.test(value.integrity || '')
    && installers.includes(value.installer) && value.integrity_status === 'verified'
    && value.verification_scope === 'top-level-package-archive';
}

module.exports = { verifiedNpmWarmup, verifiedNpmInstall, isVerifiedNpmArchiveIdentity };
