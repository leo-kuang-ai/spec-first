/**
 * postinstall 入口
 * 全局安装时自动调用 spec-first update --from-postinstall
 */
import { execFileSync, execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function isGlobalInstall(): boolean {
  if (process.env.npm_config_global === 'true') return true;
  if (process.env.PNPM_HOME && process.execPath.includes(process.env.PNPM_HOME)) return true;
  return false;
}

if (isGlobalInstall()) {
  try {
    execSync('spec-first update --from-postinstall', { stdio: 'inherit' });
  } catch {
    try {
      const entry = join(fileURLToPath(new URL('.', import.meta.url)), 'cli', 'index.js');
      execFileSync(process.execPath, [entry, 'update', '--from-postinstall'], { stdio: 'inherit' });
    } catch {
      console.error('提示：请手动执行 spec-first update 完成注册。');
    }
  }
}
