'use strict';

// Display only: executors must continue passing argv directly to their runner.
function renderCommand(argv, { shell = process.platform === 'win32' ? 'powershell' : 'posix' } = {}) {
  if (shell === 'powershell') {
    return `# PowerShell\n& ${argv.map((value) => `'${String(value).replaceAll("'", "''")}'`).join(' ')}`;
  }
  if (shell !== 'posix') throw new Error(`Unsupported command display shell: ${shell}`);
  return argv.map((value) => {
    const text = String(value);
    return /^[A-Za-z0-9_./:-]+$/.test(text) ? text : `'${text.replaceAll("'", "'\"'\"'")}'`;
  }).join(' ');
}

module.exports = { renderCommand };
