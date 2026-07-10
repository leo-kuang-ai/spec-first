
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { writeGlobalDeveloperFile } = require('../developer');
const { applyOperationPlan } = require('../state');
const { canonicalizeExistingPath } = require('./init-paths');
const { buildRuntimeUntrackSummary } = require('./init-result');

function applyProjectInitPlan(projectRoot, plan) {
  const normalizedRoot = canonicalizeExistingPath(projectRoot || plan.projectRoot);
  if (Array.isArray(plan.errors) && plan.errors.length > 0) {
    return {
      exit_code: 1,
      runtime_untrack: buildRuntimeUntrackSummary(plan.untrackDiagnostic),
    };
  }

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
      throw error;
    }
  } else {
    applyOperationPlan(normalizedRoot, plan.preSyncPlan);
    untrackApplyResult = applyOperationPlan(normalizedRoot, plan.writePlan);
  }

  applyGlobalDeveloperProfileWrite(plan.globalDeveloperWrite);

  return {
    exit_code: 0,
    runtime_untrack: buildRuntimeUntrackSummary(plan.untrackDiagnostic, untrackApplyResult),
  };
}

function applyGlobalDeveloperProfileWrite(globalWrite) {
  if (!globalWrite || !globalWrite.developer) {
    return;
  }
  if (globalWrite.action === 'create' || globalWrite.action === 'overwrite') {
    writeGlobalDeveloperFile(globalWrite.developer);
  }
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
  removeRuntimeRollbackBackup,
  restoreRuntimeRollbackBackup,
};
