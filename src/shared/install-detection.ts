import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface InstallDetectionContext {
  argv?: string[];
  currentFile?: string;
  env?: NodeJS.ProcessEnv;
  execPath?: string;
  pathExists?: (target: string) => boolean;
}

function isInGlobalNodeModules(currentPath: string): boolean {
  const lowerPath = currentPath.toLowerCase();
  const globalPatterns = ['/lib/node_modules/', '/node_modules/', '\\node_modules\\'];

  if (!globalPatterns.some((pattern) => currentPath.includes(pattern))) {
    return false;
  }

  return (
    lowerPath.includes('/usr/local/') ||
    lowerPath.includes('/usr/lib/') ||
    lowerPath.includes('.npm-global') ||
    lowerPath.includes('.npm/lib') ||
    lowerPath.includes('appdata') ||
    lowerPath.includes('program files')
  );
}

function isLocalSourceInstall(
  currentFile: string,
  initCwd: string | undefined,
  pathExists: (target: string) => boolean
): boolean {
  if (!initCwd) return false;
  if (!pathExists(join(initCwd, 'package.json'))) return false;

  const normalizedInitCwd = normalize(initCwd);
  const normalizedCurrentFile = normalize(currentFile);

  return (
    normalizedCurrentFile.startsWith(`${normalizedInitCwd}/`) &&
    !normalizedCurrentFile.includes('/node_modules/')
  );
}

export function detectGlobalInstall(
  context: InstallDetectionContext = {},
  fallbackFileUrl?: string
): boolean {
  const env = context.env ?? process.env;
  const argv = context.argv ?? process.argv;
  const execPath = context.execPath ?? process.execPath;
  const pathExists = context.pathExists ?? existsSync;
  const currentFile =
    context.currentFile ??
    argv[1] ??
    (fallbackFileUrl ? fileURLToPath(fallbackFileUrl) : undefined);

  if (env.npm_config_global === 'true') return true;
  if (!currentFile) return false;

  const initCwd = env.INIT_CWD;
  if (isLocalSourceInstall(currentFile, initCwd, pathExists)) {
    return false;
  }

  if (isInGlobalNodeModules(dirname(currentFile))) return true;
  if (env.npm_config_root && currentFile.includes(env.npm_config_root)) return true;
  if (env.npm_config_prefix && currentFile.includes(env.npm_config_prefix)) return true;
  if (env.PNPM_HOME && currentFile.includes(env.PNPM_HOME)) return true;
  if (env.VOLTA_HOME && currentFile.includes(env.VOLTA_HOME)) return true;
  if (env.npm_config_prefix && env.npm_config_prefix.includes('.yarn')) return true;

  if (initCwd) {
    const home = homedir();
    if (!pathExists(join(initCwd, 'package.json')) && initCwd === home) {
      return true;
    }
  }

  return execPath.includes('/node_modules/');
}
