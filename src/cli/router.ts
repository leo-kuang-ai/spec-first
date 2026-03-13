/**
 * CLI 子命令路由分发
 * 注册命令处理器，统一分发与错误处理
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExitCode } from '../shared/types.js';
import { evaluatePolicy } from '../core/skill-runtime/confirm-policy.js';
import { parseFlag } from './parse-utils.js';

export type CommandHandler = (args: string[]) => Promise<number> | number;
type ConfirmationRequirement = boolean | ((args: string[]) => boolean);
export type ArgsValidator = (args: string[]) => string | undefined;

interface CommandEntry {
  description: string;
  handler: CommandHandler;
  requiresConfirmation?: ConfirmationRequirement;
  validateArgs?: ArgsValidator;
}

interface RegisterCommandOptions {
  requiresConfirmation?: ConfirmationRequirement;
  validateArgs?: ArgsValidator;
}

const commands = new Map<string, CommandEntry>();

/** 注册一个顶层命令 */
export function registerCommand(
  name: string,
  description: string,
  handler: CommandHandler,
  options?: RegisterCommandOptions
): void {
  commands.set(name, {
    description,
    handler,
    requiresConfirmation: options?.requiresConfirmation,
    validateArgs: options?.validateArgs,
  });
}

/** 获取所有已注册命令（用于 help 输出） */
export function getRegisteredCommands(): Map<string, CommandEntry> {
  return commands;
}

function shouldRequireConfirmation(
  requirement: ConfirmationRequirement | undefined,
  args: string[]
): boolean {
  if (typeof requirement === 'function') return requirement(args);
  return requirement ?? false;
}

function isMode(value: string | undefined): value is 'N' | 'I' {
  return value === 'N' || value === 'I';
}

function isSize(value: string | undefined): value is 'S' | 'M' | 'L' {
  return value === 'S' || value === 'M' || value === 'L';
}

function resolveConfirmPolicy(args: string[]) {
  const mode = parseFlag(args, '--mode');
  const size = parseFlag(args, '--size');

  return evaluatePolicy({
    mode: isMode(mode) ? mode : 'N',
    size: isSize(size) ? size : 'M',
    hasNfrSec: false,
    hasNewExternalApi: false,
  });
}

/** 分发命令，返回 ExitCode */
export async function dispatch(args: string[]): Promise<number> {
  const cmd = args[0];
  if (!cmd || cmd === '--help' || cmd === '-h') {
    printHelp();
    return ExitCode.SUCCESS;
  }
  if (cmd === '--version' || cmd === '-v') {
    printVersion();
    return ExitCode.SUCCESS;
  }

  const entry = commands.get(cmd);
  if (!entry) {
    console.error(`未知命令：${cmd}`);
    console.error('请运行 `spec-first --help` 查看帮助。');
    return ExitCode.VALIDATION_ERROR;
  }

  const rawSubArgs = args.slice(1);
  const confirmed = rawSubArgs.includes('--yes');
  const subArgs = rawSubArgs.filter((arg) => arg !== '--yes');
  const validationError = entry.validateArgs?.(subArgs);

  if (validationError) {
    console.error(validationError);
    return ExitCode.VALIDATION_ERROR;
  }

  if (shouldRequireConfirmation(entry.requiresConfirmation, subArgs)) {
    const policy = resolveConfirmPolicy(subArgs);
    if (policy !== 'auto' && !confirmed) {
      console.error(`命令 ${cmd} 需要确认：policy=${policy}。请追加 --yes 重试。`);
      return ExitCode.VALIDATION_ERROR;
    }
  }

  try {
    return await entry.handler(subArgs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`错误：${msg}`);
    return ExitCode.UNKNOWN_ERROR;
  }
}

function printHelp(): void {
  console.log('用法：spec-first <command> <subcommand> [args] [--flags]\n');
  console.log('命令：');
  for (const [name, entry] of commands) {
    console.log(`  ${name.padEnd(14)} ${entry.description}`);
  }
}

function printVersion(): void {
  console.log(getCliVersion());
}

export function getCliVersion(): string {
  const fromEnv = process.env.npm_package_version?.trim();
  if (fromEnv) return fromEnv;

  const baseDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(baseDir, '../package.json'), join(baseDir, '../../package.json')];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
      if (typeof parsed.version === 'string' && parsed.version.trim() !== '') {
        return parsed.version;
      }
    } catch {
      // ignore and fallback
    }
  }

  return 'unknown';
}
