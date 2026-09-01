
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  getGlobalDeveloperPath,
  writeGlobalDeveloperFile,
} = require('../developer');
const { applyOperationPlan } = require('../state');
const { resolveEffectiveGlobalDeveloperWrite } = require('./init-developer');
const { canonicalizeExistingPath } = require('./init-paths');

function applyProjectInitPlan(projectRoot, plan, context = {}) {
  if (Array.isArray(plan.errors) && plan.errors.length > 0) {
    return {
      exit_code: 1,
      globalDeveloperWriteResult: null,
    };
  }
  const prerequisite = ensureGlobalDeveloperPrerequisite([plan], context);
  const normalizedRoot = canonicalizeExistingPath(projectRoot || plan.projectRoot);

  if (plan.destructiveResetPlan) {
    const destructiveBackup = createRuntimeRollbackBackup({
      projectRoot: normalizedRoot,
      plans: [plan.destructiveResetPlan, plan.preSyncPlan, plan.writePlan],
    });
    try {
      applyOperationPlan(normalizedRoot, plan.destructiveResetPlan);
      applyOperationPlan(normalizedRoot, plan.preSyncPlan);
      applyOperationPlan(normalizedRoot, plan.writePlan);
      removeRuntimeRollbackBackup(destructiveBackup);
    } catch (error) {
      const restoreOutcome = tryRestoreRuntimeRollbackBackup(normalizedRoot, destructiveBackup);
      if (restoreOutcome.status !== 'restore-failed') {
        removeRuntimeRollbackBackup(destructiveBackup);
      }
      annotateProjectMutationError(error, prerequisite.globalDeveloperWriteResult);
      annotateRuntimeRollbackOutcome(error, restoreOutcome);
      throw error;
    }
  } else {
    // 常规刷新路径与破坏性重置共享同一备份/恢复基建：中途失败（EACCES、磁盘满、
    // Windows 文件占用）不留半写状态。回滚保证来自 state.json 本身在 writePlan 的
    // 备份集合内：恢复后旧 manifest 与磁盘内容一致，doctor 仍可独立检出残余漂移。
    // 接受语义：ensure_dir 产生的空目录在回滚后可能残留，无数据损失。
    const regularBackup = createRuntimeRollbackBackup({
      projectRoot: normalizedRoot,
      plans: [plan.preSyncPlan, plan.writePlan],
    });
    try {
      applyOperationPlan(normalizedRoot, plan.preSyncPlan);
      applyOperationPlan(normalizedRoot, plan.writePlan);
      removeRuntimeRollbackBackup(regularBackup);
    } catch (error) {
      const restoreOutcome = tryRestoreRuntimeRollbackBackup(normalizedRoot, regularBackup);
      if (restoreOutcome.status !== 'restore-failed') {
        removeRuntimeRollbackBackup(regularBackup);
      }
      annotateProjectMutationError(error, prerequisite.globalDeveloperWriteResult);
      annotateRuntimeRollbackOutcome(error, restoreOutcome);
      throw error;
    }
  }

  return {
    exit_code: 0,
    globalDeveloperWriteResult: prerequisite.globalDeveloperWriteResult,
  };
}

// 恢复失败不能掩盖触发它的原始写入错误：吞掉恢复异常，把备份位置记进
// 结果，由 annotateRuntimeRollbackOutcome 引导用户手动恢复。
function tryRestoreRuntimeRollbackBackup(projectRoot, backup) {
  if (!backup) {
    return { status: 'no-backup' };
  }
  try {
    const restored = restoreRuntimeRollbackBackup(projectRoot, backup);
    return { status: restored ? 'restored' : 'no-backup' };
  } catch (error) {
    return {
      status: 'restore-failed',
      error,
      backupRoot: backup.backupRoot,
    };
  }
}

function annotateRuntimeRollbackOutcome(error, restoreOutcome) {
  if (!error || typeof error !== 'object') {
    return error;
  }
  if (restoreOutcome.status === 'restored') {
    error.runtimeRollback = 'restored';
    error.message = `${error.message}\nspec-first init 已把受管 runtime 回滚到本次写入前状态；问题排查后可安全重试。`;
  } else if (restoreOutcome.status === 'restore-failed') {
    error.runtimeRollback = 'restore-failed';
    error.message = `${error.message}\n回滚未完全成功，备份保留在 ${restoreOutcome.backupRoot}；请运行 spec-first doctor 检查漂移，必要时从该目录手动恢复后重试 init。`;
  }
  return error;
}

function ensureGlobalDeveloperPrerequisite(plans, context = {}) {
  const hasEffectiveWrite = Object.prototype.hasOwnProperty.call(
    context,
    'effectiveGlobalDeveloperWrite',
  );
  const effectiveGlobalDeveloperWrite = hasEffectiveWrite
    ? context.effectiveGlobalDeveloperWrite
    : resolveEffectiveGlobalDeveloperWrite(plans);
  if (context.globalDeveloperWriteHandled === true) {
    if (
      effectiveGlobalDeveloperWrite
      && !Object.prototype.hasOwnProperty.call(context, 'globalDeveloperWriteResult')
    ) {
      throw new Error('Handled global developer prerequisite requires its run-level result.');
    }
    return {
      effectiveGlobalDeveloperWrite,
      globalDeveloperWriteResult: context.globalDeveloperWriteResult || null,
    };
  }
  return {
    effectiveGlobalDeveloperWrite,
    globalDeveloperWriteResult: applyGlobalDeveloperProfileWrite(
      effectiveGlobalDeveloperWrite,
      context,
    ),
  };
}

function applyGlobalDeveloperProfileWrite(globalWrite, options = {}) {
  if (!globalWrite || !globalWrite.developer) {
    return null;
  }
  const resolvedPath = globalWrite.resolvedPath
    || (options.getGlobalDeveloperPath || getGlobalDeveloperPath)();
  if (globalWrite.action === 'create' || globalWrite.action === 'overwrite') {
    try {
      (options.writeGlobalDeveloperFile || writeGlobalDeveloperFile)(globalWrite.developer);
    } catch (error) {
      throw annotateGlobalDeveloperWriteError(error, resolvedPath);
    }
  }
  const applied = globalWrite.action === 'create' || globalWrite.action === 'overwrite';
  return {
    action: globalWrite.action,
    status: applied ? 'applied' : 'no-op',
    applied,
    globalPath: globalWrite.globalPath,
    resolvedPath,
    developer: {
      ...globalWrite.developer,
      hosts: Array.isArray(globalWrite.developer.hosts)
        ? [...globalWrite.developer.hosts]
        : [],
    },
  };
}

function annotateGlobalDeveloperWriteError(error, resolvedPath) {
  if (error && typeof error === 'object') {
    error.globalDeveloperTargetPath = resolvedPath;
    if (typeof error.message === 'string' && !error.message.includes(resolvedPath)) {
      error.message = `${error.message}\nGlobal developer profile target: ${resolvedPath}`;
    }
    return error;
  }
  const normalized = new Error(
    `${String(error)}\nGlobal developer profile target: ${resolvedPath}`,
  );
  normalized.globalDeveloperTargetPath = resolvedPath;
  return normalized;
}

function annotateProjectMutationError(error, globalDeveloperWriteResult) {
  if (error && (typeof error === 'object' || typeof error === 'function')) {
    error.globalDeveloperWriteResult = globalDeveloperWriteResult || null;
  }
  return error;
}

function createRuntimeRollbackBackup({ projectRoot, plans = [] } = {}) {
  const pathKinds = new Map();

  for (const plan of plans) {
    if (!plan || !Array.isArray(plan.operations)) continue;
    for (const operation of plan.operations) {
      if (!operation || !operation.path) continue;
      if (!['remove_file', 'remove_dir', 'write_file', 'update_file'].includes(operation.kind)) {
        continue;
      }

      const kinds = pathKinds.get(operation.path) || new Set();
      kinds.add(operation.kind);
      pathKinds.set(operation.path, kinds);
    }
  }

  const orderedPaths = [...pathKinds.keys()]
    .sort((left, right) => left.length - right.length || left.localeCompare(right));
  const selectedEntries = [];

  for (const relativePath of orderedPaths) {
    const kinds = pathKinds.get(relativePath);
    const absolutePath = path.join(projectRoot, relativePath);
    const stats = fs.existsSync(absolutePath) ? fs.lstatSync(absolutePath) : null;
    const isDirectory = kinds.has('remove_dir') || Boolean(stats && stats.isDirectory());

    if (selectedEntries.some((entry) => entry.isDirectory && isNestedPath(relativePath, entry.relativePath))) {
      continue;
    }

    selectedEntries.push({
      relativePath,
      absolutePath,
      isDirectory,
      existed: Boolean(stats),
      mode: stats ? (stats.mode & 0o777) : null,
    });
  }

  if (selectedEntries.length === 0) {
    return null;
  }

  const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-backup-'));
  for (const entry of selectedEntries) {
    if (!entry.existed) continue;
    const backupPath = path.join(backupRoot, entry.relativePath);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.cpSync(entry.absolutePath, backupPath, { recursive: entry.isDirectory });
  }

  return {
    backupRoot,
    entries: selectedEntries.map((entry) => ({
      relativePath: entry.relativePath,
      isDirectory: entry.isDirectory,
      existed: entry.existed,
      mode: entry.mode,
    })),
  };
}

function restoreRuntimeRollbackBackup(projectRoot, backup) {
  if (!backup || !backup.backupRoot || !Array.isArray(backup.entries)) {
    return false;
  }

  const restoreEntries = [...backup.entries]
    .sort((left, right) => right.relativePath.length - left.relativePath.length || right.relativePath.localeCompare(left.relativePath));

  for (const entry of restoreEntries) {
    const targetPath = path.join(projectRoot, entry.relativePath);
    fs.rmSync(targetPath, { recursive: true, force: true });
    if (!entry.existed) continue;

    const backupPath = path.join(backup.backupRoot, entry.relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.cpSync(backupPath, targetPath, { recursive: entry.isDirectory });
    if (typeof entry.mode === 'number' && !entry.isDirectory) {
      fs.chmodSync(targetPath, entry.mode);
    }
  }

  return true;
}

function removeRuntimeRollbackBackup(backup) {
  if (!backup || !backup.backupRoot || !fs.existsSync(backup.backupRoot)) {
    return false;
  }

  fs.rmSync(backup.backupRoot, { recursive: true, force: true });
  return true;
}

function isNestedPath(childPath, parentPath) {
  return childPath === parentPath || childPath.startsWith(`${parentPath}/`);
}

module.exports = {
  applyGlobalDeveloperProfileWrite,
  applyProjectInitPlan,
  createRuntimeRollbackBackup,
  ensureGlobalDeveloperPrerequisite,
  removeRuntimeRollbackBackup,
  restoreRuntimeRollbackBackup,
};
