/**
 * rfc CLI 命令组
 * spec-first rfc create|submit|transition|list|get
 */
import { ExitCode } from '../../shared/types.js';
import type { RfcStatus, RfcLevel } from '../../shared/types.js';
import { createRfc, submitRfc, transitionRfc, listRfc, getRfc } from '../../core/change-mgr/rfc.js';
import { parseFlag } from '../parse-utils.js';

const VALID_LEVELS: ReadonlySet<string> = new Set(['Minor', 'Major', 'Critical']);
const VALID_STATUSES: ReadonlySet<string> = new Set(['draft', 'approved', 'closed', 'rejected']);

export function handleRfc(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'create':     return handleCreate(rest);
    case 'submit':     return handleSubmit(rest);
    case 'transition': return handleTransition(rest);
    case 'list':       return handleList(rest);
    case 'get':        return handleGet(rest);
    default:
      console.error(`未知 rfc 子命令：${sub}`);
      printRfcHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleCreate(args: string[]): number {
  const featureId = args[0];
  const title = parseFlag(args, '--title');
  const level = parseFlag(args, '--level');
  const by = parseFlag(args, '--by') ?? 'cli';
  const motivation = parseFlag(args, '--motivation');
  const description = parseFlag(args, '--description');

  if (!featureId || !title) {
    console.error('用法：spec-first rfc create <featureId> --title "<title>" [--level <Minor|Major|Critical>] [--by <by>]');
    return ExitCode.VALIDATION_ERROR;
  }

  if (level && !VALID_LEVELS.has(level)) {
    console.error(`无效 level "${level}"：必须是 Minor、Major 或 Critical`);
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const r = createRfc(featureId, {
      title,
      level: (level as RfcLevel) ?? undefined,
      by,
      motivation: motivation ?? undefined,
      description: description ?? undefined,
    }, process.cwd());
    console.log(`已创建：${r.id}（${r.status}）`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleSubmit(args: string[]): number {
  const rfcId = args[0];
  const featureId = parseFlag(args, '--feature');

  if (!rfcId || !featureId) {
    console.error('用法：spec-first rfc submit <rfcId> --feature <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const r = submitRfc(rfcId, featureId, process.cwd());
    console.log(`已提交：${r.id} → ${r.status}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleTransition(args: string[]): number {
  const rfcId = args[0];
  const status = args[1];
  const featureId = parseFlag(args, '--feature');

  if (!rfcId || !status || !featureId) {
    console.error('用法：spec-first rfc transition <rfcId> <status> --feature <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  if (!VALID_STATUSES.has(status)) {
    console.error(`无效状态 "${status}"：必须是 draft、approved、closed 或 rejected`);
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const r = transitionRfc(rfcId, status as RfcStatus, featureId, process.cwd());
    console.log(`已流转：${r.id} → ${r.status}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleList(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first rfc list <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const list = listRfc(featureId, process.cwd());
  if (list.length === 0) {
    console.log('未找到 RFC。');
    return ExitCode.SUCCESS;
  }
  for (const r of list) {
    console.log(`${r.id}  ${r.status.padEnd(10)} ${r.level.padEnd(10)} ${r.title}`);
  }
  return ExitCode.SUCCESS;
}

function handleGet(args: string[]): number {
  const rfcId = args[0];
  const featureId = parseFlag(args, '--feature');

  if (!rfcId || !featureId) {
    console.error('用法：spec-first rfc get <rfcId> --feature <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const r = getRfc(rfcId, featureId, process.cwd());
    console.log(JSON.stringify(r, null, 2));
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function printRfcHelp(): void {
  console.log(`用法：spec-first rfc <subcommand>

子命令：
  create      创建 RFC
  submit      提交 RFC（draft → approved）
  transition  流转 RFC 状态
  list        列出 RFC
  get         查看 RFC 详情`);
}
