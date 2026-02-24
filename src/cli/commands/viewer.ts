/**
 * viewer CLI 命令
 * spec-first viewer [start|open|url] [--host <host>] [--port <port>] [--project-root <path>] [--open] [--print-url]
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExitCode } from '../../shared/types.js';

type ViewerSubcommand = 'start' | 'open' | 'url';

function parseSubcommand(args: string[]): { subcommand: ViewerSubcommand; passthrough: string[] } | null {
  if (args.length === 0) {
    return { subcommand: 'start', passthrough: [] };
  }

  const first = args[0];
  if (first.startsWith('-')) {
    return { subcommand: 'start', passthrough: args };
  }

  if (first === 'start' || first === 'open' || first === 'url') {
    return { subcommand: first, passthrough: args.slice(1) };
  }

  return null;
}

function resolveBootstrapScript(): string | undefined {
  const base = resolve(dirname(fileURLToPath(import.meta.url)));
  const candidates = [
    join(base, '..', 'scripts', 'stage-viewer', 'bootstrap.js'),
    join(base, '..', '..', 'scripts', 'stage-viewer', 'bootstrap.js'),
    join(base, '..', '..', '..', 'scripts', 'stage-viewer', 'bootstrap.js'),
    join(base, '..', '..', '..', '..', 'scripts', 'stage-viewer', 'bootstrap.js'),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function printHelp(): void {
  console.log(`用法：spec-first viewer [start|open|url] [选项]\n`);
  console.log('子命令：');
  console.log('  start    启动或复用当前项目可视化服务（默认）');
  console.log('  open     启动/复用并自动打开浏览器');
  console.log('  url      输出当前可视化地址（会自动启动/复用）');
  console.log('\n选项：');
  console.log('  --project-root <path>  指定项目根目录（默认当前目录向上探测）');
  console.log('  --host <host>          监听地址（默认 127.0.0.1）');
  console.log('  --port <port>          指定端口（默认自动分配）');
  console.log('  --open                 自动打开浏览器');
  console.log('  --print-url            输出可视化地址');
  console.log('  --background           非阻塞模式（用于 SessionStart Hook）');
}

export function handleViewer(args: string[]): number {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return ExitCode.SUCCESS;
  }

  const parsed = parseSubcommand(args);
  if (!parsed) {
    console.error(`未知 viewer 子命令：${args[0]}`);
    printHelp();
    return ExitCode.VALIDATION_ERROR;
  }

  const bootstrapScript = resolveBootstrapScript();
  if (!bootstrapScript) {
    console.error('未找到 stage-viewer 启动脚本，请确认当前安装包包含 scripts/stage-viewer。');
    return ExitCode.CONFIG_ERROR;
  }

  const passthrough = [...parsed.passthrough];
  if (parsed.subcommand === 'open' && !passthrough.includes('--open')) {
    passthrough.unshift('--open');
  }
  if (parsed.subcommand === 'url' && !passthrough.includes('--print-url')) {
    passthrough.unshift('--print-url');
  }

  // --background: strip flag and run bootstrap synchronously (hook-friendly).
  // Bootstrap handles browser opening via python webbrowser module.
  if (passthrough.includes('--background')) {
    const idx = passthrough.indexOf('--background');
    passthrough.splice(idx, 1);

    const result = spawnSync(process.execPath, [bootstrapScript, ...passthrough], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
      timeout: 8000,
    });

    return typeof result.status === 'number' ? result.status : ExitCode.SUCCESS;
  }

  const result = spawnSync(process.execPath, [bootstrapScript, ...passthrough], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`viewer 启动失败：${result.error.message}`);
    return ExitCode.IO_ERROR;
  }

  if (typeof result.status === 'number') {
    return result.status;
  }

  return ExitCode.UNKNOWN_ERROR;
}
