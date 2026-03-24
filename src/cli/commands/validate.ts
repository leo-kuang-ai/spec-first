/**
 * validate 命令组
 * validate format
 */
import { ExitCode } from '../../shared/types.js';
import { validateFormat } from '../../core/validators/format-validator.js';

export interface ValidateOptions {
  projectRoot?: string;
}

export function handleValidate(args: string[], options?: ValidateOptions): number {
  const sub = args[0];
  switch (sub) {
    case 'format':
      return handleFormatValidation(args.slice(1), options);
    default:
      printValidateHelp();
      if (sub) console.error(`未知 validate 子命令：${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

function requireFeatureId(args: string[], usage: string): string | undefined {
  const featureId = args[0];
  if (!featureId) {
    console.error(usage);
    return undefined;
  }
  return featureId;
}

function handleFormatValidation(args: string[], options?: ValidateOptions): number {
  const featureId = requireFeatureId(args, '用法：spec-first validate format <featureId>');
  if (!featureId) return ExitCode.VALIDATION_ERROR;

  const projectRoot = options?.projectRoot ?? process.cwd();
  const result = validateFormat(featureId, projectRoot);
  if (result.pass) {
    console.log('✓ 格式校验通过');
    return ExitCode.SUCCESS;
  }

  console.error('✗ 格式校验失败：\n');
  result.errors.forEach((error) => console.error(`  - ${error}`));
  return ExitCode.VALIDATION_ERROR;
}

function printValidateHelp(): void {
  console.log('用法：spec-first validate <subcommand>\n');
  console.log('子命令：');
  console.log('  format    校验产物格式');
}
