'use strict';

const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('../vendor/js-yaml-3.15.1.min.js');
const {
  assertContainedPath,
  ensureContainedDirectory,
  reasonError,
} = require('./path-safety.cjs');
const {
  renderJson,
} = require('./renderer.cjs');

const LOCAL_CONFIG_RULE = '.spec-first/*.local.yaml';
const LOCAL_CONFIG_CONSUMERS = Object.freeze({
  verification_profile_path: consumer('deterministic-source-reader', 'src/verification/profile-loader.js'),
  feedback_sources: consumer('skill-prose/native-read', 'skills/spec-sweep'),
  sweep_state_path: consumer('skill-prose/native-read', 'skills/spec-sweep'),
  sweep_ack_cap: consumer('skill-prose/native-read', 'skills/spec-sweep'),
  sweep_lease_ttl_minutes: consumer('skill-prose/native-read', 'skills/spec-sweep'),
  sweep_shared_branch: consumer('skill-prose/native-read', 'skills/spec-sweep'),
  sweep_commit_approved: consumer('skill-prose/native-read', 'skills/spec-sweep'),
  sweep_branch_mutation_approved: consumer('skill-prose/native-read', 'skills/spec-sweep'),
  sweep_landing_approved: consumer('skill-prose/native-read', 'skills/spec-sweep'),
  pulse_product_name: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_lookback_default: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_primary_event: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_value_event: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_completion_events: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_quality_scoring: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_quality_dimension: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_analytics_source: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_tracing_source: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_payments_source: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_db_enabled: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_metric_sources: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_pending_metrics: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_excluded_metrics: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  pulse_schedule: consumer('skill-prose/native-read', 'skills/spec-product-pulse'),
  spec_promote_spiral_optout: consumer('skill-prose/native-read', 'skills/spec-promote'),
  plan_output: consumer('skill-prose/native-read', 'skills/spec-plan'),
  brainstorm_output: consumer('skill-prose/native-read', 'skills/spec-brainstorm'),
  ideate_output: consumer('skill-prose/native-read', 'skills/spec-ideate'),
  plan_skip_scoping_confirm: consumer('skill-prose/native-read', 'skills/spec-plan'),
});

function consumer(kind, owner) {
  return Object.freeze({ kind, owner, value_validation: 'consumer-owned' });
}

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

function inspectLocalConfigContent(raw, localPath = '.spec-first/config.local.yaml') {
  const source = String(raw || '').replace(/\r\n/g, '\n');
  let document;
  try {
    document = yaml.safeLoad(source, { json: false });
  } catch (error) {
    const duplicate = error && error.reason === 'duplicated mapping key';
    const reasonCode = duplicate ? 'local-config-duplicate-key' : 'local-config-syntax-invalid';
    return {
      status: 'invalid',
      reason_code: reasonCode,
      path: localPath,
      keys: [],
      unowned_keys: [],
      errors: [{
        line: error && error.mark ? error.mark.line + 1 : null,
        reason_code: reasonCode,
        parser_reason: error && error.reason ? error.reason : 'yaml-parse-failed',
      }],
      validation_scope: 'syntax-structure-and-consumer-ownership',
    };
  }

  if (document === undefined || document === null) document = {};
  if (typeof document !== 'object' || Array.isArray(document)) {
    return {
      status: 'invalid',
      reason_code: 'local-config-syntax-invalid',
      path: localPath,
      keys: [],
      unowned_keys: [],
      errors: [{ line: 1, reason_code: 'local-config-top-level-mapping-required' }],
      validation_scope: 'syntax-structure-and-consumer-ownership',
    };
  }

  const keys = [];
  for (const key of Object.keys(document)) {
    const registered = LOCAL_CONFIG_CONSUMERS[key];
    keys.push({
      key,
      consumer_kind: registered ? registered.kind : 'unowned',
      consumer: registered ? registered.owner : null,
      value_validation: registered ? registered.value_validation : 'not-applicable',
    });
  }

  const unownedKeys = keys.filter((entry) => entry.consumer_kind === 'unowned').map((entry) => entry.key);
  if (unownedKeys.length > 0) {
    return {
      status: 'invalid',
      reason_code: 'local-config-key-unowned',
      path: localPath,
      keys,
      unowned_keys: unownedKeys,
      errors: [],
      validation_scope: 'syntax-structure-and-consumer-ownership',
    };
  }
  return {
    status: 'valid',
    reason_code: 'local-config-structure-valid',
    path: localPath,
    keys,
    unowned_keys: [],
    errors: [],
    validation_scope: 'syntax-structure-and-consumer-ownership',
  };
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
  const localValidation = localPresent
    ? inspectLocalConfigContent(fs.readFileSync(localPath, 'utf8'), workspaceRelativePath(root, localPath))
    : null;
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
  const status = localValidation && localValidation.status === 'invalid'
    ? 'action-required'
    : exampleStatus === 'current'
      && ['ignored', 'ready-for-local-config', 'not-applicable'].includes(gitignoreStatus)
    ? 'ready'
    : (['missing', 'outdated'].includes(exampleStatus) || gitignoreStatus === 'missing'
      ? 'action-required'
      : 'partial');

  return {
    schema_version: 'project-local-config-status.v1',
    status,
    ...(localValidation && localValidation.status === 'invalid'
      ? { reason_code: localValidation.reason_code }
      : {}),
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
      status: localPresent && localValidation.status === 'invalid' ? 'invalid' : (localPresent ? 'present' : 'defaults-active'),
      next_action: localPresent && localValidation.status === 'invalid'
        ? `Review ${workspaceRelativePath(root, localPath)} and fix ${localValidation.reason_code}.`
        : null,
      ...(localValidation ? { validation: localValidation } : {}),
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
  LOCAL_CONFIG_CONSUMERS,
  applyProjectConfig,
  applyProjectConfigBatch,
  inspectProjectConfig,
  inspectLocalConfigContent,
  planProjectConfig,
};
