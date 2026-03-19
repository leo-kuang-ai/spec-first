/**
 * preuninstall 入口
 * npm uninstall -g 时自动调用，清理全局 Skills/Hooks/命令入口。
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectGlobalInstall, type InstallDetectionContext } from './shared/install-detection.js';

export function isGlobalInstall(context: InstallDetectionContext = {}): boolean {
  return detectGlobalInstall(context, import.meta.url);
}

if (isGlobalInstall()) {
  const entry = join(fileURLToPath(new URL('.', import.meta.url)), 'cli', 'index.js');
  try {
    execFileSync(process.execPath, [entry, 'uninstall', '--keep-mcp'], { stdio: 'inherit' });
  } catch {
    console.error('提示：请手动执行 spec-first uninstall 完成清理。');
  }
}
