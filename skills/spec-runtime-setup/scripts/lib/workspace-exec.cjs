'use strict';

const { spawnSync } = require('node:child_process');

function defaultWorkspaceExec(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env || {}) },
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
