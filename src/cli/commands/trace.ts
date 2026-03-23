/**
 * Trace 命令组
 * trace validate
 */
import { ExitCode } from '../../shared/types.js';
import { handleDocsLinks } from './docs-links.js';

export function handleTrace(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'fix':
      console.error('trace fix 已移除：不再支持自动修复条目级追踪链');
      return ExitCode.VALIDATION_ERROR;
    case 'validate':
      return handleValidate(args.slice(1));
    default:
      printTraceHelp();
      if (sub) console.error(`未知 trace 子命令：${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleValidate(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first trace validate <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }
  return handleDocsLinks(['validate', featureId]);
}

function printTraceHelp(): void {
  console.log('用法：spec-first trace <subcommand>\n');
  console.log('子命令：');
  console.log('  validate  校验 document-links.yaml');
}
