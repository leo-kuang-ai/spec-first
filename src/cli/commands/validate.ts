/**
 * validate 命令组
 * validate format|links|show
 */
import { join } from 'node:path';
import { exists } from '../../shared/fs-utils.js';
import { ExitCode } from '../../shared/types.js';
import { loadDocumentLinks, validateDocumentLinksData } from '../../core/document-links.js';
import { validateFormat } from '../../core/validators/format-validator.js';
import { readMarkdown } from '../../shared/fs-utils.js';
import yaml from 'js-yaml';

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
    case 'show':
      return handleLinksShow(args.slice(1), options);
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
  const filePath = join(projectRoot, 'specs', featureId, 'document-links.yaml');
  if (!exists(filePath)) {
    console.error(`未找到 document-links.yaml：${filePath}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const parsed = yaml.load(readMarkdown(filePath), { schema: yaml.JSON_SCHEMA });
  const result = validateDocumentLinksData(parsed);
  if (!result.valid) {
    console.error('✗ 文档关联校验失败：');
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    return ExitCode.VALIDATION_ERROR;
  }

  console.log(`✓ 文档关联校验通过：${featureId}`);
  return ExitCode.SUCCESS;
}

function handleLinksShow(args: string[], options?: ValidateOptions): number {
  const featureId = requireFeatureId(args, '用法：spec-first validate show <featureId>');
  if (!featureId) return ExitCode.VALIDATION_ERROR;

  const projectRoot = options?.projectRoot ?? process.cwd();
  const links = loadDocumentLinks(featureId, projectRoot);
  console.log(`文档关联 — ${featureId}`);
  for (const doc of links.documents) {
    const refs = doc.references.length > 0 ? doc.references.join(', ') : '-';
    console.log(`- ${doc.path} [${doc.kind}] ${doc.stage} -> ${refs}`);
  }
  return ExitCode.SUCCESS;
}

function printValidateHelp(): void {
  console.log('用法：spec-first validate <subcommand>\n');
  console.log('子命令：');
  console.log('  format    校验产物格式');
  console.log('  links     校验 document-links.yaml');
  console.log('  show      展示文档关联关系');
}
