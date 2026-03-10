/**
 * id CLI 命令组
 * spec-first id next|validate|search|list
 */
import type { NextIdType, TcLevel, IdType } from '../../shared/types.js';
import { ExitCode } from '../../shared/types.js';
import { nextId } from '../../core/trace-engine/id-generator.js';
import { validateId } from '../../core/trace-engine/id-validator.js';
import { searchId, listIds } from '../../core/trace-engine/id-search.js';
import { resolveFeatureId } from '../../core/process-engine/feature.js';
import { parseFlag } from '../parse-utils.js';

// 有效的 NextIdType 值
const VALID_NEXT_TYPES: ReadonlySet<NextIdType> = new Set([
  'FR', 'DS', 'TASK', 'TC', 'RFC', 'REQ', 'SYS', 'ARCH', 'MOD', 'ATP', 'STP', 'ITP', 'UTP',
]);

// 有效的 IdType 值（用于 search/list）
// 注意：只包含 IdType 类型的值（NFR/API 不在 IdType 中）
const VALID_ID_TYPES: ReadonlySet<string> = new Set([
  'FR', 'DS', 'TASK', 'TC', 'RFC', 'Feature',
]);

// 有效的 TcLevel 值
const VALID_TC_LEVELS: ReadonlySet<TcLevel> = new Set(['UT', 'IT', 'E2E', 'ST']);

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
  const typeArg = args[0]?.toUpperCase();
  const abbr = args[1];
  const feature = parseFlag(args, '--feature');
  const tcLevelArg = parseFlag(args, '--level')?.toUpperCase();

  if (!typeArg || !abbr || !feature) {
    console.error('用法：spec-first id next <type> <abbr> --feature <featureId> [--level <UT|IT|E2E|ST>]');
    console.error('  <type>: FR|DS|TASK|TC|RFC|REQ|SYS|ARCH|MOD|ATP|STP|ITP|UTP');
    return ExitCode.VALIDATION_ERROR;
  }

  // 校验 type 参数
  if (!VALID_NEXT_TYPES.has(typeArg as NextIdType)) {
    console.error(`错误：无效的 type "${typeArg}"`);
    console.error(`有效值：${Array.from(VALID_NEXT_TYPES).join(', ')}`);
    return ExitCode.VALIDATION_ERROR;
  }

  // 校验 tcLevel 参数（如果提供）
  let tcLevel: TcLevel | undefined;
  if (tcLevelArg) {
    if (!VALID_TC_LEVELS.has(tcLevelArg as TcLevel)) {
      console.error(`错误：无效的 level "${tcLevelArg}"`);
      console.error(`有效值：${Array.from(VALID_TC_LEVELS).join(', ')}`);
      return ExitCode.VALIDATION_ERROR;
    }
    tcLevel = tcLevelArg as TcLevel;
  }

  const type = typeArg as NextIdType;

  try {
    const resolvedFeatureId = resolveFeatureId(feature, process.cwd()).featureId;
    const result = nextId({ type, abbr, featureId: resolvedFeatureId, projectRoot: process.cwd(), tcLevel });
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
  const typeArg = parseFlag(args, '--type')?.toUpperCase();

  if (!query || !feature) {
    console.error('用法：spec-first id search <query> --feature <featureId> [--type <type>]');
    return ExitCode.VALIDATION_ERROR;
  }

  // 校验 type 参数（如果提供）
  let type: IdType | undefined;
  if (typeArg) {
    if (!VALID_ID_TYPES.has(typeArg as IdType)) {
      console.error(`错误：无效的 type "${typeArg}"`);
      console.error(`有效值：${Array.from(VALID_ID_TYPES).join(', ')}`);
      return ExitCode.VALIDATION_ERROR;
    }
    type = typeArg as IdType;
  }

  const resolvedFeatureId = resolveFeatureId(feature, process.cwd()).featureId;
  const results = searchId(query, resolvedFeatureId, process.cwd(), type);
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
  const typeArg = parseFlag(args, '--type')?.toUpperCase();

  if (!feature) {
    console.error('用法：spec-first id list --feature <featureId> [--type <type>]');
    return ExitCode.VALIDATION_ERROR;
  }

  // 校验 type 参数（如果提供）
  let type: IdType | undefined;
  if (typeArg) {
    if (!VALID_ID_TYPES.has(typeArg as IdType)) {
      console.error(`错误：无效的 type "${typeArg}"`);
      console.error(`有效值：${Array.from(VALID_ID_TYPES).join(', ')}`);
      return ExitCode.VALIDATION_ERROR;
    }
    type = typeArg as IdType;
  }

  const resolvedFeatureId = resolveFeatureId(feature, process.cwd()).featureId;
  const results = listIds(resolvedFeatureId, process.cwd(), type);
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
