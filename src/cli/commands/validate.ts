/**
 * Validate 命令组
 * validate format / validate matrix / validate all
 */
import { ExitCode } from '../../shared/types.js';
import { validateFormat } from '../../core/validators/format-validator.js';

export interface ValidateOptions {
  projectRoot?: string;
}

export function handleValidate(args: string[], options?: ValidateOptions): number {
  const sub = args[0];
  switch (sub) {
    case 'format': return handleFormatValidation(args.slice(1), options);
    case 'matrix': return handleMatrixValidation(args.slice(1), options);
    case 'all': return handleAllValidation(args.slice(1), options);
    default:
      printValidateHelp();
      if (sub) console.error(`未知 validate 子命令：${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleFormatValidation(args: string[], options?: ValidateOptions): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first validate format <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = options?.projectRoot ?? process.cwd();
  const result = validateFormat(featureId, projectRoot);

  if (result.pass) {
    console.log('✓ 格式校验通过');
    return ExitCode.SUCCESS;
  }

  console.error('✗ 格式校验失败：\n');
  result.errors.forEach(err => console.error(`  - ${err}`));
  return ExitCode.VALIDATION_ERROR;
}

function handleMatrixValidation(_args: string[], _options?: ValidateOptions): number {
  console.log('matrix 校验暂未实现');
  return ExitCode.SUCCESS;
}

function handleAllValidation(args: string[], options?: ValidateOptions): number {
  return handleFormatValidation(args, options);
}

function printValidateHelp(): void {
  console.log('用法：spec-first validate <subcommand>\n');
  console.log('子命令：');
  console.log('  format    校验产物格式（PRD/ID/路径）');
  console.log('  matrix    校验追溯矩阵');
  console.log('  all       执行全部校验');
}
