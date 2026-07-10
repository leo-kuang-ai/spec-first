'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  getGlobalDeveloperPath,
  readDeveloperFile,
} = require('../developer');
const { summarizeOperationPlan } = require('../state');

const LEGACY_PROJECT_DEVELOPER_PATHS = [
  '.claude/spec-first/.developer',
  '.codex/spec-first/.developer',
];
const GLOBAL_DEVELOPER_RELATIVE_DISPLAY = path.join('~', '.spec-first', '.developer');

function planLegacyDeveloperProfileCleanup(projectRoot) {
  const operations = [];
  for (const relativePath of LEGACY_PROJECT_DEVELOPER_PATHS) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (fs.existsSync(absolutePath)) {
      operations.push({
        kind: 'remove_file',
        path: relativePath,
        reason: 'legacy_project_developer_profile',
      });
    }
  }
  return {
    operations,
    summary: summarizeOperationPlan(operations),
  };
}

function readLegacyProjectDeveloperFiles(projectRoot) {
  const records = [];
  for (const relativePath of LEGACY_PROJECT_DEVELOPER_PATHS) {
    const absolutePath = path.join(projectRoot, relativePath);
    const developer = readDeveloperFile(absolutePath);
    if (developer && developer.name) {
      records.push({ relativePath, developer });
    }
  }
  return records;
}

function resolveGlobalDeveloperWriteAction(developer, options = {}) {
  const globalPath = getGlobalDeveloperPath();
  const existing = readDeveloperFile(globalPath);
  if (!existing || !existing.name) {
    return {
      action: 'create',
      developer: preserveSyncUserLanguage(developer, existing),
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  // 空列表视为"本次未表达 host 选择",不应抹掉既有记录(例如 dryRun、
  // 异常路径或编程式调用未传 platforms);此时沿用既有 hosts。
  const nextHosts = Array.isArray(developer.hosts) ? developer.hosts : [];
  const effectiveHosts = nextHosts.length > 0 ? nextHosts : existing.hosts;
  if (options.confirmedOverwrite || options.explicitName || options.explicitLang) {
    // profile 已存在(上方已排除 create),initialized_at 语义是"首次初始化时间",
    // re-install 改名/改语言不应刷新它;与下方 host-change 分支保持一致,只刷新
    // name/lang/version 与 hosts,保留既有 initialized_at。
    return {
      action: 'overwrite',
      developer: preserveSyncUserLanguage(
        { ...developer, initializedAt: existing.initializedAt, hosts: effectiveHosts },
        existing,
      ),
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  // name/lang 未变是最常见的重装路径。此处若 host 选择变化仍需落盘,
  // 否则用户改动的 host 选择会被静默丢弃。仅更新 hosts,保留既有
  // name/lang/initialized_at/version,避免无谓抖动。
  // 此处用 nextHosts 而非 effectiveHosts:仅当本次有实际勾选才覆写,
  // 空选择走下方 preserve,不应借 fallback 误触发覆写。
  if (nextHosts.length > 0 && !sameHosts(existing.hosts, nextHosts)) {
    return {
      action: 'overwrite',
      developer: { ...existing, hosts: nextHosts },
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  return {
    action: 'preserve',
    developer: existing,
    globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
  };
}

function preserveSyncUserLanguage(developer, existing) {
  if (
    existing &&
    typeof existing.syncUserLanguage === 'boolean' &&
    (!developer || typeof developer.syncUserLanguage !== 'boolean')
  ) {
    return {
      ...(developer || {}),
      syncUserLanguage: existing.syncUserLanguage,
    };
  }
  return developer;
}

// 比较两个 host 集合是否相同。内部各自排序,不依赖调用方传入已排序数组,
// 使比较对输入顺序鲁棒(集合语义,而非序列语义)。
function sameHosts(left, right) {
  const a = (Array.isArray(left) ? [...left] : []).sort((x, y) => x.localeCompare(y));
  const b = (Array.isArray(right) ? [...right] : []).sort((x, y) => x.localeCompare(y));
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function normalizeOperationPathLike(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = {
  planLegacyDeveloperProfileCleanup,
  readLegacyProjectDeveloperFiles,
  resolveGlobalDeveloperWriteAction,
};
