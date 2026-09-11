'use strict';

const BOOLEAN_OPTIONS = new Map([
  ['--check', 'check'],
  ['--installation-only', 'installationOnly'],
  ['--verify-only', 'verifyOnly'],
  ['--refresh-facts', 'refreshFacts'],
  ['--plan', 'plan'],
  ['--project-config', 'projectConfig'],
  ['--refresh', 'refresh'],
  ['--all-repos', 'allRepos'],
  ['--user-scope', 'userScope'],
  ['--repair-host-config', 'repairHostConfig'],
  ['--workspace-graph', 'workspaceGraph'],
  ['--workspace-graph-clean', 'workspaceGraphClean'],
  ['--workspace-graph-status', 'workspaceGraphStatus'],
]);

const VALUE_OPTIONS = new Map([
  ['--only', 'only'],
  ['--workflow', 'workflows'],
  ['--repo', 'repo'],
  ['--folder', 'folder'],
  ['--requirement-workspace', 'requirementWorkspace'],
  ['--repos', 'repos'],
]);

const OUTPUT_FLAGS = new Set([
  '--json',
  '--help',
  '-h',
  '--refresh-example',
  '--create-local',
  '--ensure-gitignore',
  '--delete-legacy-markdown',
]);

function parseEntrypointOptions(argv = []) {
  const modeArgv = [];
  const options = {
    json: false,
    help: false,
    pluginVersion: '',
    refreshExample: false,
    createLocal: false,
    ensureGitignore: false,
    deleteLegacyMarkdown: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index]);
    if (token === '--json') options.json = true;
    else if (token === '--help' || token === '-h') options.help = true;
    else if (token === '--refresh-example') options.refreshExample = true;
    else if (token === '--create-local') options.createLocal = true;
    else if (token === '--ensure-gitignore') options.ensureGitignore = true;
    else if (token === '--delete-legacy-markdown') options.deleteLegacyMarkdown = true;
    else if (token === '--version') {
      const value = argv[index + 1];
      if (value !== undefined && !String(value).startsWith('--')) {
        options.pluginVersion = String(value);
        index += 1;
      }
    } else if (!OUTPUT_FLAGS.has(token)) {
      modeArgv.push(token);
    }
  }
  return { options, modeArgv };
}

function parseArgs(argv = []) {
  const input = Array.isArray(argv) ? argv.map(String) : [];
  const result = {
    check: false,
    installationOnly: false,
    verifyOnly: false,
    refreshFacts: false,
    plan: false,
    projectConfig: false,
    refresh: false,
    allRepos: false,
    userScope: false,
    repairHostConfig: false,
    workspaceGraph: false,
    workspaceGraphClean: false,
    workspaceGraphStatus: false,
    only: [],
    workflows: [],
    repos: [],
    repo: '',
    folder: '',
    requirementWorkspace: '',
    errors: [],
    argv: input,
  };

  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (!token.startsWith('--')) {
      result.errors.push({ reason_code: 'unexpected-positional', value: token });
      continue;
    }

    const separator = token.indexOf('=');
    const option = separator >= 0 ? token.slice(0, separator) : token;
    const inlineValue = separator >= 0 ? token.slice(separator + 1) : null;

    if (BOOLEAN_OPTIONS.has(option)) {
      if (inlineValue !== null) {
        result.errors.push({ reason_code: 'option-does-not-take-value', option });
        continue;
      }
      result[BOOLEAN_OPTIONS.get(option)] = true;
      continue;
    }

    if (VALUE_OPTIONS.has(option)) {
      let value = inlineValue;
      if (value === null) {
        const candidate = input[index + 1];
        if (candidate !== undefined && !candidate.startsWith('--')) {
          value = candidate;
          index += 1;
        }
      }
      if (value === null || value === '') {
        result.errors.push({ reason_code: 'missing-option-value', option });
        continue;
      }

      const field = VALUE_OPTIONS.get(option);
      if (field === 'only' || field === 'repos' || field === 'workflows') {
        const selected = String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
        if (selected.length === 0) {
          result.errors.push({ reason_code: 'missing-option-value', option });
          continue;
        }
        result[field] = uniqueStrings([
          ...result[field],
          ...selected,
        ]);
      } else {
        result[field] = String(value);
      }
      continue;
    }

    result.errors.push({ reason_code: 'unknown-option', option });
  }

  return result;
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function helpResult() {
  const human = [
    '用法：node <loaded-skill-root>/scripts/setup.cjs [options]',
    '',
    '需求：--workflow <ids> 精确匹配 registry required_for；--only <ids> 显式选择 provider/tool/helper。',
    '模式：--check | --verify-only | --refresh-facts | --plan | --project-config | --only <ids> | --repair-host-config',
    '安装与接线：--installation-only；搭配 --plan 只预览，搭配 --verify-only 只验证并写 facts；不构图/query。',
    'Graphify 刷新：--only graphify --refresh',
    '目标：--repo <path> | --folder <path> | --all-repos',
    '  --repo 仅接受精确 Git root；--folder 接受精确逻辑目录且不要求 Git。',
    '  folder 内的 Provider artifact/facts 不会提升到父 Git root；仅 generated runtime 可复用父 root。',
    'Workspace 双层图构建：--only codegraph,graphify --workspace-graph [--repos <a,b>]',
    'Workspace 双层图状态：--workspace-graph-status [--repos <a,b>]',
    'Workspace 双层图清理：--workspace-graph-clean [--repos <a,b>]',
    '约束：workspace-graph action 互斥，且不可与 --all-repos 组合；contained child Git 事件异步刷新，hook 不可用、失败或需即时刷新时显式重跑。',
    '',
  ].join('\n');
  return { exit_code: 0, mode: 'help', reason_code: 'help', payload: { help: human }, human, target: null };
}

module.exports = {
  helpResult,
  parseArgs,
  parseEntrypointOptions,
};
