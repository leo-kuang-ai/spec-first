/**
 * hooks CLI 命令
 * spec-first hooks install | uninstall | status
 */
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { ExitCode } from '../../shared/types.js';
import { checkHooks, installHooks, uninstallHooks } from '../../core/tool-integration/hook-installer.js';

export function handleHooks(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'install':
      return handleInstall();
    case 'uninstall':
      return handleUninstall();
    case 'status':
      return handleStatus();
    default:
      if (sub) console.error(`未知 hooks 子命令：${sub}`);
      printHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleInstall(): number {
  const projectRoot = process.cwd();
  if (!existsSync(join(projectRoot, '.git'))) {
    console.error('未检测到 .git 目录，无法安装 Git hooks。');
    console.error('请先执行 git init，或在 Git 仓库目录中运行该命令。');
    return ExitCode.VALIDATION_ERROR;
  }
  const installed = installHooks(projectRoot);
  console.log(`已安装 ${installed.length} 个 hooks：${installed.join(', ')}`);
  return ExitCode.SUCCESS;
}

function handleUninstall(): number {
  const projectRoot = process.cwd();
  if (!existsSync(join(projectRoot, '.git'))) {
    console.error('未检测到 .git 目录，无法卸载 Git hooks。');
    return ExitCode.VALIDATION_ERROR;
  }
  const removed = uninstallHooks(projectRoot);
  if (removed.length === 0) {
    console.log('未发现可卸载的 spec-first hooks。');
    return ExitCode.SUCCESS;
  }
  console.log(`已卸载 ${removed.length} 个 hooks：${removed.join(', ')}`);
  return ExitCode.SUCCESS;
}

function handleStatus(): number {
  const projectRoot = process.cwd();
  if (!existsSync(join(projectRoot, '.git'))) {
    console.log('未检测到 .git 目录，跳过 hooks 状态检查。');
    return ExitCode.SUCCESS;
  }
  const statuses = checkHooks(projectRoot);
  for (const status of statuses) {
    const icon = status.installed
      ? status.isSpecFirst ? '[OK]' : '[WARN]'
      : '[WARN]';
    const msg = status.installed
      ? status.isSpecFirst ? '已安装（spec-first）' : '已安装（非 spec-first）'
      : '未安装';
    console.log(`${icon} ${status.name}: ${msg}`);
  }
  return ExitCode.SUCCESS;
}

function printHelp(): void {
  console.log(`用法：spec-first hooks <subcommand>

子命令：
  install    安装 spec-first Git hooks
  uninstall  卸载 spec-first Git hooks
  status     查看 hooks 安装状态`);
}
