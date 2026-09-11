'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { assertContainedPath } = require('./path-safety.cjs');
const { resolveReadOnlyHostConfigTargets } = require('./host-config.cjs');
const { detectRuntimePlatform, getEffectiveRegistry, canonicalizeRegistry } = require('./registry.cjs');

function captureSourceSnapshot({ repoRoot, skillRoot = path.resolve(__dirname, '../..'), host, platform, homeDir, sourceRegistry, env = process.env, now = new Date() } = {}) {
  const root = path.resolve(repoRoot);
  const limitations = [];
  const currentPlatform = platform || detectRuntimePlatform({ platform: process.platform, env });
  let hostConfigHash = null;
  let registryHash = null;
  try {
    const registryBytes = fs.readFileSync(path.join(skillRoot, 'setup-registry.json'));
    registryHash = crypto.createHash('sha256').update(registryBytes).digest('hex');
    const diskRegistry = JSON.parse(registryBytes);
    if (sourceRegistry && JSON.stringify(canonicalizeRegistry(sourceRegistry)) !== JSON.stringify(canonicalizeRegistry(diskRegistry))) {
      limitations.push('registry-changed-during-setup');
    }
    const registry = getEffectiveRegistry(diskRegistry, { host, platform: currentPlatform });
    const paths = new Map();
    for (const entry of registry.tools) {
      for (const target of resolveReadOnlyHostConfigTargets({ entry, repoRoot: root, homeDir, env })) {
        if (!target.ok) {
          limitations.push(target.reason_code || 'host-config-target-unavailable');
          paths.set(`unavailable:${entry.id}:${target.scope}`, target.reason_code || 'unknown');
          continue;
        }
        const candidates = [target, ...(target.precedence_guards || [])];
        for (const candidate of candidates) {
          const filename = candidate.config_path;
          if (paths.has(filename)) continue;
          try {
            const stat = fs.lstatSync(filename);
            if (!stat.isFile() || stat.size > 4 * 1024 * 1024) throw new Error('host-config-unreadable');
            paths.set(filename, crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'));
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            paths.set(filename, 'missing');
          }
        }
      }
    }
    hostConfigHash = crypto.createHash('sha256').update(JSON.stringify([...paths.entries()].sort())).digest('hex');
  } catch (_error) {
    limitations.push(registryHash ? 'host-config-snapshot-unavailable' : 'registry-unreadable');
  }
  const gitEnv = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
  // 调用者的 Git 定位变量不能把 target 的证据重定向到其他仓库。
  for (const key of Object.keys(gitEnv)) {
    if (key.startsWith('GIT_') && key !== 'GIT_OPTIONAL_LOCKS') delete gitEnv[key];
  }
  const git = (args) => execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', root, ...args], {
    env: gitEnv, encoding: 'utf8', timeout: 3000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  let sourceHead = null;
  let sourceKind = 'unknown';
  let sourceContentHash = null;
  try {
    git(['rev-parse', '--show-toplevel']);
    sourceKind = 'git';
    sourceHead = git(['rev-parse', '--verify', 'HEAD']);
  } catch (_error) {
    // Git 不可用和无 Git 是不同事实；只有目录链确实没有 .git 才使用 folder 范围。
    let cursor = root;
    let gitMarker = false;
    while (true) {
      try { fs.lstatSync(path.join(cursor, '.git')); gitMarker = true; break; } catch (error) {
        if (error.code !== 'ENOENT') { gitMarker = true; break; }
      }
      const parent = path.dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
    sourceKind = gitMarker ? 'unknown' : 'folder';
    if (gitMarker) limitations.push('source-head-unavailable');
  }
  if (sourceKind !== 'unknown') {
    try {
      sourceContentHash = captureSourceContent(root, sourceKind, git);
      if (sourceHead && git(['rev-parse', '--verify', 'HEAD']) !== sourceHead) {
        sourceContentHash = null;
        limitations.push('source-changed-during-snapshot');
      }
    } catch (_error) {
      limitations.push('source-content-snapshot-unavailable');
    }
  }
  return {
    schema_version: 'setup-source-snapshot.v2',
    registry_sha256: registryHash,
    host_config_sha256: hostConfigHash,
    repo_root: root,
    source_head: sourceHead,
    source_kind: sourceKind,
    source_content_sha256: sourceContentHash,
    host: host || null,
    platform: currentPlatform,
    captured_at: now.toISOString(),
    invalidation: ['source-content-change', 'source-kind-change', 'source-head-change', 'registry-change', 'host-config-change', 'host-change', 'platform-change'],
    limitations,
  };
}

// 排除本层生成的证据及缓存，避免发布 facts 自身使 source 失效；local config 仍在范围内。
const GENERATED_SOURCE_ROOTS = [
  '.git', '.spec-first/cache', '.spec-first/audits', '.spec-first/governance',
  '.spec-first/config/tool-facts.json', '.spec-first/config/runtime-capabilities.json',
  '.spec-first/workspace/scenario-fingerprint-setup.json',
  'graphify-out', '.graphify', '.codegraph', '.agents/skills',
  ...['claude', 'codex', 'cursor', 'kiro', 'qoder', 'opencode', 'zcode', 'pi']
    .flatMap((host) => [`.${host}/spec-first`, `.${host}/skills`]),
];
const FOLDER_DEPENDENCY_DIRS = new Set(['node_modules', '.venv', 'venv', '__pycache__']);
function isGeneratedSource(relative) {
  return GENERATED_SOURCE_ROOTS.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`));
}

function captureSourceContent(root, kind, git) {
  const deadline = Date.now() + 3000;
  const maxFiles = 20000;
  const maxBytes = 256 * 1024 * 1024;
  let totalBytes = 0;
  const hash = crypto.createHash('sha256').update(`setup-source-content.v1:${kind}\0`);
  const signatures = [];
  const enumerate = () => {
    if (kind === 'git') {
      return [...new Set([...git(['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', '.']).split('\0').filter(Boolean), '.spec-first/config.local.yaml'])]
        .filter((relative) => !isGeneratedSource(relative)).sort();
    }
    const files = [];
    let visited = 0;
    const walk = (relative) => {
      if (++visited > maxFiles || Date.now() > deadline) throw new Error('source-budget-exceeded');
      for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
        const name = relative ? `${relative}/${entry.name}` : entry.name;
        if (isGeneratedSource(name) || FOLDER_DEPENDENCY_DIRS.has(entry.name)) continue;
        if (entry.isDirectory()) walk(name);
        else files.push(name);
        if (files.length > maxFiles) throw new Error('source-budget-exceeded');
      }
    };
    walk('');
    return files.sort();
  };
  const files = enumerate();
  if (files.length > maxFiles) throw new Error('source-budget-exceeded');
  for (const relative of files) {
    if (Date.now() > deadline) throw new Error('source-budget-exceeded');
    const filename = path.resolve(root, relative);
    assertContainedPath(root, filename, { reasonCode: 'source-path-unsafe' });
    let stat;
    try { stat = fs.lstatSync(filename); } catch (error) {
      if (error.code !== 'ENOENT' || kind !== 'git') throw error;
      hash.update(JSON.stringify([relative, 'deleted']));
      signatures.push([filename, null]);
      continue;
    }
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error('source-path-unsafe');
    totalBytes += stat.size;
    if (stat.size > 32 * 1024 * 1024 || totalBytes > maxBytes) throw new Error('source-budget-exceeded');
    const fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0) | (fs.constants.O_NONBLOCK || 0));
    let digest;
    try {
      const current = fs.fstatSync(fd);
      if (fileSignature(current) !== fileSignature(stat)) throw new Error('source-changed');
      const bytes = Buffer.alloc(stat.size + 1);
      let size = 0;
      while (size < bytes.length) {
        const read = fs.readSync(fd, bytes, size, bytes.length - size, null);
        if (!read) break;
        size += read;
      }
      if (size !== stat.size) throw new Error('source-changed');
      digest = crypto.createHash('sha256').update(bytes.subarray(0, size)).digest('hex');
      if (fileSignature(fs.fstatSync(fd)) !== fileSignature(stat)) throw new Error('source-changed');
    } finally { fs.closeSync(fd); }
    hash.update(JSON.stringify([relative, stat.mode, digest]));
    signatures.push([filename, fileSignature(stat)]);
  }
  if (JSON.stringify(enumerate()) !== JSON.stringify(files)) throw new Error('source-changed');
  for (const [filename, signature] of signatures) {
    if (Date.now() > deadline) throw new Error('source-budget-exceeded');
    let current = null;
    try { current = fileSignature(fs.lstatSync(filename)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current !== signature) throw new Error('source-changed');
  }
  return hash.digest('hex');
}
function fileSignature(stat) {
  return JSON.stringify([stat.dev, stat.ino, stat.size, stat.mode, stat.nlink, stat.mtimeMs, stat.ctimeMs]);
}

function sourceContentIdentity(snapshot) {
  if (!snapshot || snapshot.schema_version !== 'setup-source-snapshot.v2'
    || !['git', 'folder'].includes(snapshot.source_kind)
    || typeof snapshot.source_content_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(snapshot.source_content_sha256)) return null;
  return { schema_version: snapshot.schema_version, source_kind: snapshot.source_kind, source_content_sha256: snapshot.source_content_sha256 };
}

module.exports = { captureSourceSnapshot, sourceContentIdentity };
