/**
 * id CLI 命令组
 * spec-first id next|validate|search|list
 */
import type { NextIdType, TcLevel, IdType } from '../../shared/types.js';
import { ExitCode } from '../../shared/types.js';
import { nextId } from '../../core/trace-engine/id-generator.js';
import { validateId } from '../../core/trace-engine/id-validator.js';
import { searchId, listIds } from '../../core/trace-engine/id-search.js';

export function handleId(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'next':    return handleNext(rest);
    case 'validate': return handleValidate(rest);
    case 'search':  return handleSearch(rest);
    case 'list':    return handleList(rest);
    default:
      console.error(`未知 id 子命令：${sub}`);
      printIdHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleNext(args: string[]): number {
  const type = args[0] as NextIdType | undefined;
  const abbr = args[1];
  const feature = parseFlag(args, '--feature');
  const tcLevel = parseFlag(args, '--level') as TcLevel | undefined;

  if (!type || !abbr || !feature) {
    console.error('用法：spec-first id next <type> <abbr> --feature <featureId> [--level <UT|IT|E2E|ST>]');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const result = nextId({ type, abbr, featureId: feature, projectRoot: process.cwd(), tcLevel });
    console.log(`已生成：${result.id}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleValidate(args: string[]): number {
  const id = args[0];
  if (!id) {
    console.error('用法：spec-first id validate <id>');
    return ExitCode.VALIDATION_ERROR;
  }

  const result = validateId(id);
  if (result.valid) {
    console.log(`有效的 ${result.type} ID：${id}`);
    return ExitCode.SUCCESS;
  }
  console.error(`无效：${result.error}`);
  return ExitCode.VALIDATION_ERROR;
}

function handleSearch(args: string[]): number {
  const query = args[0];
  const feature = parseFlag(args, '--feature');
  const type = parseFlag(args, '--type') as IdType | undefined;

  if (!query || !feature) {
    console.error('用法：spec-first id search <query> --feature <featureId> [--type <type>]');
    return ExitCode.VALIDATION_ERROR;
  }

  const results = searchId(query, feature, process.cwd(), type);
  if (results.length === 0) {
    console.log('未找到匹配的 ID。');
    return ExitCode.SUCCESS;
  }
  for (const r of results) {
    console.log(`${r.id}  (${r.type})`);
  }
  return ExitCode.SUCCESS;
}

function handleList(args: string[]): number {
  const feature = parseFlag(args, '--feature');
  const type = parseFlag(args, '--type') as IdType | undefined;

  if (!feature) {
    console.error('用法：spec-first id list --feature <featureId> [--type <type>]');
    return ExitCode.VALIDATION_ERROR;
  }

  const results = listIds(feature, process.cwd(), type);
  if (results.length === 0) {
    console.log('未找到 ID。');
    return ExitCode.SUCCESS;
  }
  for (const r of results) {
    console.log(`${r.id}  (${r.type})`);
  }
  return ExitCode.SUCCESS;
}

function printIdHelp(): void {
  console.log(`用法：spec-first id <subcommand>

子命令：
  next      生成下一个 ID
  validate  校验 ID 格式
  search    按关键字搜索 ID
  list      列出全部 ID`);
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}
