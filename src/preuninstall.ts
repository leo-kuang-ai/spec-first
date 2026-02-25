/**
 * preuninstall 入口
 * npm uninstall -g 时自动调用，清理全局 Skills/Hooks/命令入口。
 */
import { execFileSync, execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function isGlobalInstall(): boolean {
  if (process.env.npm_config_global === 'true') return true;
  if (process.env.PNPM_HOME && process.execPath.includes(process.env.PNPM_HOME)) return true;
  if (process.env.npm_config_prefix && process.env.npm_config_prefix.includes('.yarn')) return true;
  if (process.env.VOLTA_HOME && process.execPath.includes(process.env.VOLTA_HOME)) return true;
  if (process.env.npm_config_prefix && process.argv[1]?.includes(process.env.npm_config_prefix)) return true;
  return false;
}

if (isGlobalInstall()) {
  const entry = join(fileURLToPath(new URL('.', import.meta.url)), 'cli', 'index.js');
  try {
    execFileSync(process.execPath, [entry, 'uninstall', '--keep-mcp'], { stdio: 'inherit' });
  } catch {
    try {
      execSync('spec-first uninstall --keep-mcp', { stdio: 'inherit' });
    } catch {
      console.error('提示：请手动执行 spec-first uninstall 完成清理。');
    }
  }
}
