/**
 * preuninstall 入口
 * npm uninstall -g 时自动调用，清理全局 Skills/Hooks/命令入口。
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 检测当前包是否安装在全局 node_modules 中
 */
function isInGlobalNodeModules(): boolean {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const globalPatterns = ['/lib/node_modules/', '/node_modules/', '\\node_modules\\'];

  for (const pattern of globalPatterns) {
    if (currentDir.includes(pattern)) {
      const lowerPath = currentDir.toLowerCase();
      if (
        lowerPath.includes('/usr/local/') ||
        lowerPath.includes('/usr/lib/') ||
        lowerPath.includes('.npm-global') ||
        lowerPath.includes('.npm/lib') ||
        lowerPath.includes('appdata') ||
        lowerPath.includes('program files')
      ) {
        return true;
      }
    }
  }
  return false;
}

function isGlobalInstall(): boolean {
  // 1. npm 官方标记
  if (process.env.npm_config_global === 'true') return true;
  // 2. pnpm global
  if (process.env.PNPM_HOME && process.execPath.includes(process.env.PNPM_HOME)) return true;
  // 3. yarn global
  if (process.env.npm_config_prefix && process.env.npm_config_prefix.includes('.yarn')) return true;
  // 4. volta managed
  if (process.env.VOLTA_HOME && process.execPath.includes(process.env.VOLTA_HOME)) return true;
  // 5. npm_config_prefix 检测
  if (process.env.npm_config_prefix && process.argv[1]?.includes(process.env.npm_config_prefix)) return true;
  // 6. INIT_CWD 检测
  const initCwd = process.env.INIT_CWD;
  if (initCwd) {
    const home = homedir();
    const hasProjectPkg = existsSync(join(initCwd, 'package.json'));
    if (!hasProjectPkg && initCwd === home) return true;
  }
  // 7. 全局 node_modules 路径检测
  if (isInGlobalNodeModules()) return true;
  // 8. npm_config_root 检测
  if (process.env.npm_config_root && process.argv[1]?.includes(process.env.npm_config_root)) return true;

  return false;
}

if (isGlobalInstall()) {
  const entry = join(fileURLToPath(new URL('.', import.meta.url)), 'cli', 'index.js');
  try {
    execFileSync(process.execPath, [entry, 'uninstall', '--keep-mcp'], { stdio: 'inherit' });
  } catch {
    console.error('提示：请手动执行 spec-first uninstall 完成清理。');
  }
}
