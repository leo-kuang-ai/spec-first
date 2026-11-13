'use strict';

const { spawnSync } = require('node:child_process');

function defaultWorkspaceExec(command, args, opts = {}) {
  const env = { ...process.env, ...(opts.env || {}) };
  for (const name of opts.unsetEnv || []) delete env[name];
  const launch = require('../providers/codegraph-launcher.cjs').prepareCodegraphLaunch({ command, args, env, cwd: opts.cwd });
  if (!launch.ok) return { status: 1, stdout: '', stderr: launch.reason_code, reason_code: launch.reason_code, next_action: launch.next_action };
  const result = spawnSync(launch.command, launch.args, {
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
    signal: result.signal || null,
    error: result.error ? result.error.code || 'workspace-command-failed' : null,
    timed_out: Boolean(result.error && result.error.code === 'ETIMEDOUT'),
  };
}

module.exports = {
  defaultWorkspaceExec,
};
