'use strict';

const path = require('node:path');

function buildRuntimeInitCommand({ host, cwd, repo = '', allRepos = false, headless = false } = {}) {
  const args = ['init'];
  if (host) args.push(`--${host}`);
  if (allRepos) args.push('--all-repos');
  else if (repo) args.push('--repo', String(repo));
  if (headless) args.push('-y', '-u', '<name>', '--lang', '<zh|en>');
  return {
    cwd: path.resolve(cwd || process.cwd()),
    command: 'spec-first',
    args,
  };
}

function buildRuntimeInitRemediation(options = {}) {
  return {
    next_action: '在 next_action_command.cwd 指定目录按 argv 运行交互式初始化；非交互环境需替换 next_action_headless_command.args 中的 <name> 与 <zh|en> 后再执行。',
    next_action_command: buildRuntimeInitCommand(options),
    next_action_headless_command: buildRuntimeInitCommand({ ...options, headless: true }),
  };
}

function clearRuntimeInitRemediation(target) {
  target.next_action = null;
  target.next_action_command = null;
  target.next_action_headless_command = null;
  return target;
}

module.exports = {
  buildRuntimeInitCommand,
  buildRuntimeInitRemediation,
  clearRuntimeInitRemediation,
};
