/**
 * CLI 子命令路由分发
 * 注册命令处理器，统一分发与错误处理
 */
import { ExitCode } from '../shared/types.js';

export type CommandHandler = (args: string[]) => Promise<number> | number;

interface CommandEntry {
  description: string;
  handler: CommandHandler;
}

const commands = new Map<string, CommandEntry>();

/** 注册一个顶层命令 */
export function registerCommand(
  name: string,
  description: string,
  handler: CommandHandler,
): void {
  commands.set(name, { description, handler });
}

/** 获取所有已注册命令（用于 help 输出） */
export function getRegisteredCommands(): Map<string, CommandEntry> {
  return commands;
}

/** 分发命令，返回 ExitCode */
export async function dispatch(args: string[]): Promise<number> {
  const cmd = args[0];
  if (!cmd || cmd === '--help' || cmd === '-h') {
    printHelp();
    return ExitCode.SUCCESS;
  }

  const entry = commands.get(cmd);
  if (!entry) {
    console.error(`Unknown command: ${cmd}`);
    console.error('Run "spec-first --help" for usage information.');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    return await entry.handler(args.slice(1));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${msg}`);
    return ExitCode.UNKNOWN_ERROR;
  }
}

function printHelp(): void {
  console.log('Usage: spec-first <command> <subcommand> [args] [--flags]\n');
  console.log('Commands:');
  for (const [name, entry] of commands) {
    console.log(`  ${name.padEnd(14)} ${entry.description}`);
  }
}
