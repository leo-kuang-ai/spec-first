'use strict';

const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {
  assertContainedPath,
  ensureContainedDirectory,
  reasonError,
} = require('./path-safety.cjs');
const {
  renderJson,
} = require('./renderer.cjs');

const LOCAL_CONFIG_RULE = '.spec-first/*.local.yaml';

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function isDirectory(directoryPath) {
  try {
    return fs.statSync(directoryPath).isDirectory();
  } catch (_error) {
    return false;
  }
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (_error) {
    return false;
  }
}

function quoteCommandArgument(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function projectConfigNextAction(root, flag) {
  return `spec-runtime-setup --project-config ${flag} --repo ${quoteCommandArgument(root)}`;
}

function workspaceRelativePath(root, target) {
  return path.relative(root, target).split(path.sep).join('/');
}

function gitIgnores(root, filePath) {
  const result = childProcess.spawnSync(
    'git',
    ['-C', root, 'check-ignore', '-q', '--', filePath],
    { encoding: 'utf8', windowsHide: true },
  );
  return !result.error && result.status === 0;
}

function inspectProjectConfig({ repoRoot, templatePath }) {
  if (!repoRoot || !isDirectory(repoRoot)) {
    return {
      schema_version: 'project-local-config-status.v1',
      status: 'not-applicable',
      reason_code: 'target-root-unavailable',
      example_config: { status: 'not-applicable', next_action: null },
      local_config: { status: 'not-applicable', next_action: null },
      local_config_gitignore: { status: 'not-applicable', next_action: null },
      legacy_markdown_config: { status: 'not-applicable', next_action: null },
      legacy_local_config: { status: 'not-applicable', next_action: null },
    };
  }

  const root = path.resolve(repoRoot);
  const specDir = path.join(root, '.spec-first');
  const examplePath = path.join(specDir, 'config.local.example.yaml');
  const localPath = path.join(specDir, 'config.local.yaml');
  const gitignorePath = path.join(root, '.gitignore');
  const legacyMarkdownPath = path.join(root, 'compound-engineering.local.md');
  const template = templatePath && isFile(templatePath) ? fs.readFileSync(templatePath, 'utf8') : null;
  const example = isFile(examplePath) ? fs.readFileSync(examplePath, 'utf8') : null;
  const localPresent = isFile(localPath);
  const gitignore = readIfExists(gitignorePath) || '';
  const legacyMarkdownPresent = isFile(legacyMarkdownPath);
  const exampleStatus = example === null
    ? 'missing'
    : (template !== null && example === template ? 'current' : 'outdated');
  let gitignoreStatus = 'not-applicable';
  if (localPresent) {
    gitignoreStatus = gitIgnores(root, localPath) ? 'ignored' : 'missing';
  } else if (gitignore.split(/\r?\n/).includes(LOCAL_CONFIG_RULE)) {
    gitignoreStatus = 'ready-for-local-config';
  }
  const status = exampleStatus === 'current'
      && ['ignored', 'ready-for-local-config', 'not-applicable'].includes(gitignoreStatus)
    ? 'ready'
    : (['missing', 'outdated'].includes(exampleStatus) || gitignoreStatus === 'missing'
      ? 'action-required'
      : 'partial');

  return {
    schema_version: 'project-local-config-status.v1',
    status,
    repo_root: root,
    example_config: {
      path: examplePath,
      status: exampleStatus,
      next_action: exampleStatus === 'current'
        ? null
        : projectConfigNextAction(root, '--refresh-example'),
    },
    local_config: {
      path: localPath,
      status: localPresent ? 'present' : 'defaults-active',
      next_action: null,
    },
    local_config_gitignore: {
      path: gitignorePath,
      status: gitignoreStatus,
      next_action: gitignoreStatus === 'missing'
        ? projectConfigNextAction(root, '--ensure-gitignore')
        : null,
    },
    legacy_markdown_config: {
      path: legacyMarkdownPath,
      status: legacyMarkdownPresent ? 'present' : 'missing',
      next_action: legacyMarkdownPresent
        ? '需要人工审查；仅在显式批准后删除'
        : null,
    },
    legacy_local_config: {
      path: '',
      status: 'retired',
      next_action: null,
    },
  };
}

function planProjectConfig(options = {}) {
  const root = path.resolve(options.repoRoot || process.cwd());
  const actions = [];
  if (options.refreshExample) actions.push(action('refresh-example', path.join(root, '.spec-first', 'config.local.example.yaml')));
  if (options.createLocal) actions.push(action('create-local', path.join(root, '.spec-first', 'config.local.yaml')));
  if (options.ensureGitignore) actions.push(action('ensure-gitignore', path.join(root, '.gitignore')));
  if (options.deleteLegacyMarkdown) actions.push(action('delete-legacy-markdown', path.join(root, 'compound-engineering.local.md')));
  return {
    schema_version: 'project-config-action-plan.v1',
    repo_root: root,
    target_kind: options.targetKind || 'git-repo',
    mutation: actions.length > 0,
    blocked: false,
    actions,
  };
}

function action(kind, targetPath) {
  return { kind, capability: 'write-project-config', target_path: targetPath };
}

function atomicWriteContained(root, filePath, contents, reasonCode) {
  const target = assertContainedPath(root, filePath, { reasonCode });
  const directory = ensureContainedDirectory(root, path.dirname(target), { reasonCode, mode: 0o700 });
  assertContainedPath(root, target, { reasonCode });
  const existingMode = fs.existsSync(target) ? (fs.statSync(target).mode & 0o777) : 0o600;
  const tempPath = path.join(directory, `.${path.basename(target)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  assertContainedPath(root, tempPath, { reasonCode });
  try {
    fs.writeFileSync(tempPath, contents, { encoding: 'utf8', mode: existingMode });
    fs.chmodSync(tempPath, existingMode);
    assertContainedPath(root, target, { reasonCode });
    fs.renameSync(tempPath, target);
    fs.chmodSync(target, existingMode);
  } catch (error) {
    try { fs.rmSync(tempPath, { force: true }); } catch (_cleanupError) { /* 保留主错误 */ }
    throw error;
  }
}

function applyProjectConfig({ plan, templatePath }) {
  if (!plan || plan.schema_version !== 'project-config-action-plan.v1') {
    throw reasonError('project-config-plan-invalid', 'project config 需要经过验证的 action plan');
  }
  const root = path.resolve(plan.repo_root);
  const template = fs.readFileSync(templatePath, 'utf8');
  const result = {
    schema_version: 'project-config-bootstrap.v1',
    overall_status: 'ready',
    reason: '',
    repo_root: root,
    target_kind: plan.target_kind,
    project: {
      example_config_status: 'skipped',
      local_config_status: 'skipped',
      local_config_gitignore_status: 'skipped',
    },
    legacy: {
      legacy_markdown_status: fs.existsSync(path.join(root, 'compound-engineering.local.md')) ? 'present' : 'missing',
      legacy_local_config_status: 'retired',
    },
  };

  for (const plannedAction of plan.actions) {
    if (plannedAction.capability !== 'write-project-config') {
      throw reasonError('project-config-capability-denied', `不支持的 capability：${plannedAction.capability}`);
    }
    const target = assertContainedPath(root, plannedAction.target_path, {
      reasonCode: plannedAction.kind === 'ensure-gitignore'
        ? 'gitignore-symlink-escape'
        : 'project-config-symlink-escape',
    });
    if (plannedAction.kind === 'refresh-example') {
      const current = readIfExists(target);
      if (current === template) {
        result.project.example_config_status = 'unchanged';
      } else {
        atomicWriteContained(root, target, template, 'project-config-symlink-escape');
        result.project.example_config_status = 'refreshed';
      }
    } else if (plannedAction.kind === 'create-local') {
      if (fs.existsSync(target)) {
        result.project.local_config_status = 'already-exists';
      } else {
        atomicWriteContained(root, target, template, 'project-config-symlink-escape');
        result.project.local_config_status = 'created';
      }
    } else if (plannedAction.kind === 'ensure-gitignore') {
      if (plan.target_kind === 'non-git-folder') {
        result.project.local_config_gitignore_status = 'not-applicable-non-git-folder';
      } else {
        const current = readIfExists(target) || '';
        if (current.split(/\r?\n/).includes(LOCAL_CONFIG_RULE)) {
          result.project.local_config_gitignore_status = 'already-present';
        } else {
          const prefix = current.length > 0 && !current.endsWith('\n') ? `${current}\n` : current;
          atomicWriteContained(root, target, `${prefix}${LOCAL_CONFIG_RULE}\n`, 'gitignore-symlink-escape');
          result.project.local_config_gitignore_status = 'added';
        }
      }
    } else if (plannedAction.kind === 'delete-legacy-markdown') {
      if (fs.existsSync(target)) {
        assertContainedPath(root, target, { reasonCode: 'project-config-symlink-escape' });
        fs.rmSync(target);
        result.legacy.legacy_markdown_status = 'deleted';
      } else {
        result.legacy.legacy_markdown_status = 'missing';
      }
    } else {
      throw reasonError('project-config-action-unknown', `未知的 project config action：${plannedAction.kind}`);
    }
  }
  return result;
}

function applyProjectConfigBatch({ workspaceRoot, selectionSource, plans, templatePath }) {
  const root = path.resolve(workspaceRoot);
  const results = [];
  for (const plan of plans || []) {
    if (plan.blocked) {
      results.push({
        repo_label: workspaceRelativePath(root, plan.repo_root) || path.basename(plan.repo_root),
        workspace_relative_path: workspaceRelativePath(root, plan.repo_root),
        exit_code: 1,
        overall_status: 'action-required',
        reason_code: plan.reason_code || 'project-config-plan-blocked',
        result: {
          schema_version: 'project-config-bootstrap.v1',
          overall_status: 'action-required',
          reason: plan.reason_code || 'project-config-plan-blocked',
          repo_root: plan.repo_root,
        },
      });
      continue;
    }
    try {
      const result = applyProjectConfig({ plan, templatePath });
      results.push({
        repo_label: workspaceRelativePath(root, plan.repo_root) || path.basename(plan.repo_root),
        workspace_relative_path: workspaceRelativePath(root, plan.repo_root),
        exit_code: 0,
        overall_status: result.overall_status,
        reason_code: result.reason || null,
        result,
      });
    } catch (error) {
      results.push({
        repo_label: workspaceRelativePath(root, plan.repo_root) || path.basename(plan.repo_root),
        workspace_relative_path: workspaceRelativePath(root, plan.repo_root),
        exit_code: 1,
        overall_status: 'action-required',
        reason_code: error.reason_code || 'project-config-apply-failed',
        result: { diagnostic: error.message },
      });
    }
  }
  const ready = results.filter((entry) => entry.overall_status === 'ready').length;
  const actionRequired = results.length - ready;
  const childOverallStatus = actionRequired === 0 ? 'ready' : (ready > 0 ? 'partial' : 'action-required');
  const summary = {
    schema_version: 'workspace-project-config-bootstrap-summary.v1',
    generated_at: new Date().toISOString(),
    advisory: true,
    workflow_mode: 'all-repos',
    selection_source: selectionSource || 'explicit-all-repos',
    workspace_root: root,
    parent_writes_repo_local_artifacts: false,
    results,
    counts: { total: results.length, ready, action_required: actionRequired },
    overall_status: childOverallStatus,
    reason_code: actionRequired === 0 ? null : 'all-repos-partial-or-action-required',
    summary_write_status: 'ready',
    summary_write_reason_code: null,
  };
  const summaryPath = path.join(root, '.spec-first', 'workspace', 'project-config-bootstrap-summary.json');
  try {
    atomicWriteContained(root, summaryPath, renderJson(summary), 'workspace-summary-symlink-escape');
  } catch (error) {
    const reasonCode = error.reason_code || 'workspace-summary-write-failed';
    summary.overall_status = 'failed';
    summary.reason_code = reasonCode;
    summary.summary_write_status = 'failed';
    summary.summary_write_reason_code = reasonCode;
  }
  return summary;
}

module.exports = {
  applyProjectConfig,
  applyProjectConfigBatch,
  inspectProjectConfig,
  planProjectConfig,
};
