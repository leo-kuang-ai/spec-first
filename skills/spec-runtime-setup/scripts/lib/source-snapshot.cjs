'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
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
  const git = (args) => execFileSync('git', ['-C', root, ...args], {
    env: gitEnv, encoding: 'utf8', timeout: 3000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  let sourceHead = null;
  try {
    git(['rev-parse', '--show-toplevel']);
    sourceHead = git(['rev-parse', '--verify', 'HEAD']);
  } catch (_error) {
    // 无 Git、空仓库和执行失败都只提供 unknown，不能伪造 source identity。
    limitations.push('source-head-unavailable');
  }
  return {
    schema_version: 'setup-source-snapshot.v1',
    registry_sha256: registryHash,
    host_config_sha256: hostConfigHash,
    repo_root: root,
    source_head: sourceHead,
    host: host || null,
    platform: currentPlatform,
    captured_at: now.toISOString(),
    invalidation: ['source-head-change', 'registry-change', 'host-config-change', 'host-change', 'platform-change'],
    limitations,
  };
}

module.exports = { captureSourceSnapshot };
