'use strict';

const BOOLEAN_OPTIONS = new Map([
  ['--check', 'check'],
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
      if (field === 'only' || field === 'repos') {
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

module.exports = {
  parseArgs,
  parseEntrypointOptions,
};
