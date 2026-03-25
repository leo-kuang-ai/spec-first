import { ExitCode } from '../../shared/types.js';
import { loadDocumentLinks, validateDocumentLinksData } from '../../core/document-links.js';
import { exists, readMarkdown } from '../../shared/fs-utils.js';
import { join } from 'node:path';
import yaml from 'js-yaml';

export function handleDocsLinks(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'validate':
      return handleValidate(args.slice(1));
    case 'show':
      return handleShow(args.slice(1));
    default:
      printHelp();
      if (sub) console.error(`未知 docs links 子命令：${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

export function handleDocs(args: string[]): number {
  const sub = args[0];
  if (sub !== 'links') {
    printHelp();
    if (sub) console.error(`未知 docs 子命令：${sub}`);
    return ExitCode.VALIDATION_ERROR;
  }
  return handleDocsLinks(args.slice(1));
}

function handleValidate(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first docs links validate <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const filePath = join(process.cwd(), 'specs', featureId, 'document-links.yaml');
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

function handleShow(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first docs links show <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const links = loadDocumentLinks(featureId, process.cwd());
  console.log(`文档关联 — ${featureId}`);
  for (const doc of links.documents) {
    const refs = doc.references.length > 0 ? doc.references.join(', ') : '-';
    console.log(`- ${doc.path} [${doc.kind}] ${doc.stage} -> ${refs}`);
  }
  return ExitCode.SUCCESS;
}

function printHelp(): void {
  console.log('用法：spec-first docs links <subcommand>\n');
  console.log('子命令：');
  console.log('  validate  校验 document-links.yaml');
  console.log('  show      展示文档关联关系');
}
