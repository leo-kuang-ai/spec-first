/**
 * validate 命令组
 * validate format / validate links / validate all
 */
import { ExitCode } from '../../shared/types.js';
import { validateFormat, validateLinks } from '../../core/validators/format-validator.js';
import { evaluateGate } from '../../core/gate-engine/gate-evaluator.js';

export interface ValidateOptions {
  projectRoot?: string;
}

export function handleValidate(args: string[], options?: ValidateOptions): number {
  const sub = args[0];
  switch (sub) {
    case 'format':
      return handleFormatValidation(args.slice(1), options);
    case 'links':
      return handleLinksValidation(args.slice(1), options);
    case 'all':
      return handleAllValidation(args.slice(1), options);
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

function handleLinksValidation(args: string[], options?: ValidateOptions): number {
  const featureId = requireFeatureId(args, '用法：spec-first validate links <featureId>');
  if (!featureId) return ExitCode.VALIDATION_ERROR;

  const projectRoot = options?.projectRoot ?? process.cwd();
  const result = validateLinks(featureId, projectRoot);
  if (result.pass) {
    console.log('✓ 文档关联校验通过');
    return ExitCode.SUCCESS;
  }

  console.error('✗ 文档关联校验失败：\n');
  result.errors.forEach((error) => console.error(`  - ${error}`));
  return ExitCode.VALIDATION_ERROR;
}

function handleAllValidation(args: string[], options?: ValidateOptions): number {
  const featureId = requireFeatureId(args, '用法：spec-first validate all <featureId>');
  if (!featureId) return ExitCode.VALIDATION_ERROR;

  const projectRoot = options?.projectRoot ?? process.cwd();
  const formatCode = handleFormatValidation([featureId], options);
  if (formatCode !== ExitCode.SUCCESS) return formatCode;

  const linksCode = handleLinksValidation([featureId], options);
  if (linksCode !== ExitCode.SUCCESS) return linksCode;

  try {
    const gate = evaluateGate(featureId, projectRoot);
    if (gate.status === 'FAIL') {
      console.error(`✗ Gate 校验失败：${gate.stage} (${gate.status})`);
      return ExitCode.VALIDATION_ERROR;
    }

    console.log(`✓ Gate 校验通过：${gate.stage} (${gate.status})`);
    console.log('✓ 全量校验通过');
    return ExitCode.SUCCESS;
  } catch (error) {
    console.error(`Gate 校验执行失败：${error instanceof Error ? error.message : String(error)}`);
    return ExitCode.IO_ERROR;
  }
}

function printValidateHelp(): void {
  console.log('用法：spec-first validate <subcommand>\n');
  console.log('子命令：');
  console.log('  format    校验产物格式');
  console.log('  links     校验 document-links.yaml');
  console.log('  all       执行全部校验');
}
