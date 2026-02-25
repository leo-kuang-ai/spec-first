/**
 * postinstall 入口
 * 全局安装时自动调用 spec-first update --from-postinstall
 */
import { execFileSync, execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function isGlobalInstall(): boolean {
  // npm global
  if (process.env.npm_config_global === 'true') return true;
  // pnpm global
  if (process.env.PNPM_HOME && process.execPath.includes(process.env.PNPM_HOME)) return true;
  // yarn global (yarn 设置 npm_config_global 不一定为 true)
  if (process.env.npm_config_prefix && process.env.npm_config_prefix.includes('.yarn')) return true;
  // volta managed
  if (process.env.VOLTA_HOME && process.execPath.includes(process.env.VOLTA_HOME)) return true;
  // 通用检测：npm prefix --global 路径包含在安装路径中
  if (process.env.npm_config_prefix && process.argv[1]?.includes(process.env.npm_config_prefix)) return true;
  return false;
}

if (isGlobalInstall()) {
  const entry = join(fileURLToPath(new URL('.', import.meta.url)), 'cli', 'index.js');
  try {
    execFileSync(process.execPath, [entry, 'update', '--from-postinstall'], { stdio: 'inherit' });
  } catch {
    try {
      execSync('spec-first update --from-postinstall', { stdio: 'inherit' });
    } catch {
      console.error('提示：请手动执行 spec-first update 完成注册。');
    }
  }
}
