'use strict';

const { spawnSync } = require('node:child_process');

function defaultWorkspaceExec(command, args, opts = {}) {
  const env = { ...process.env, ...(opts.env || {}) };
  for (const name of opts.unsetEnv || []) delete env[name];
  const result = spawnSync(command, args, {
    cwd: opts.cwd,
    env,
    encoding: 'utf8',
    timeout: opts.timeoutMs || 300000,
    windowsHide: true,
  });
  return {
    status: typeof result.status === 'number' ? result.status : 1,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || ''),
  };
}

module.exports = {
  defaultWorkspaceExec,
};
