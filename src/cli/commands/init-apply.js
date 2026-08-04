
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
const { buildRuntimeUntrackSummary } = require('./init-result');

function applyProjectInitPlan(projectRoot, plan, context = {}) {
  if (Array.isArray(plan.errors) && plan.errors.length > 0) {
    return {
      exit_code: 1,
      runtime_untrack: buildRuntimeUntrackSummary(plan.untrackDiagnostic),
      globalDeveloperWriteResult: null,
    };
  }
  const prerequisite = ensureGlobalDeveloperPrerequisite([plan], context);
  const normalizedRoot = canonicalizeExistingPath(projectRoot || plan.projectRoot);

  let untrackApplyResult = null;
  if (plan.destructiveResetPlan) {
    const destructiveBackup = createRuntimeRollbackBackup({
      projectRoot: normalizedRoot,
      plans: [plan.destructiveResetPlan, plan.preSyncPlan, plan.writePlan],
    });
    try {
      applyOperationPlan(normalizedRoot, plan.destructiveResetPlan);
      applyOperationPlan(normalizedRoot, plan.preSyncPlan);
      untrackApplyResult = applyOperationPlan(normalizedRoot, plan.writePlan);
      removeRuntimeRollbackBackup(destructiveBackup);
    } catch (error) {
      restoreRuntimeRollbackBackup(normalizedRoot, destructiveBackup);
      removeRuntimeRollbackBackup(destructiveBackup);
      throw annotateProjectMutationError(error, prerequisite.globalDeveloperWriteResult);
    }
  } else {
    try {
      applyOperationPlan(normalizedRoot, plan.preSyncPlan);
      untrackApplyResult = applyOperationPlan(normalizedRoot, plan.writePlan);
    } catch (error) {
      throw annotateProjectMutationError(error, prerequisite.globalDeveloperWriteResult);
    }
  }

  return {
    exit_code: 0,
    runtime_untrack: buildRuntimeUntrackSummary(plan.untrackDiagnostic, untrackApplyResult),
    globalDeveloperWriteResult: prerequisite.globalDeveloperWriteResult,
  };
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
      if (!['remove_file', 'remove_dir', 'prune_command', 'write_file', 'update_file'].includes(operation.kind)) {
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
