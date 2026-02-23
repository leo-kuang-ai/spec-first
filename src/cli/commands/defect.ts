/**
 * defect CLI 命令组
 * spec-first defect register|update|list|get|escape-rate
 */
import { ExitCode } from '../../shared/types.js';
import type { DefectStatus, SecuritySeverity, Stage } from '../../shared/types.js';
import {
  registerDefect,
  getDefect,
  transitionDefect,
  listDefects,
  getEscapeRate,
} from '../../core/change-mgr/defect.js';

const VALID_SEVERITIES: ReadonlySet<string> = new Set(['S1', 'S2', 'S3', 'S4']);
const VALID_STATUSES: ReadonlySet<string> = new Set(['open', 'fixing', 'fixed', 'verified', 'wontfix']);

export function handleDefect(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'register':    return handleRegister(rest);
    case 'update':      return handleUpdate(rest);
    case 'list':        return handleList(rest);
    case 'get':         return handleGet(rest);
    case 'escape-rate': return handleEscapeRate(rest);
    default:
      console.error(`未知 defect 子命令：${sub}`);
      printDefectHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleRegister(args: string[]): number {
  const featureId = args[0];
  const severity = parseFlag(args, '--severity');
  const title = parseFlag(args, '--title');
  const reporter = parseFlag(args, '--reporter') ?? 'cli';
  const description = parseFlag(args, '--description');
  const discoveredIn = parseFlag(args, '--discovered-in') as Stage | undefined;
  const linkedFr = parseFlag(args, '--linked-fr');

  if (!featureId || !severity || !title) {
    console.error('用法：spec-first defect register <featureId> --severity <S1|S2|S3|S4> --title "<title>" --reporter "<name>"');
    return ExitCode.VALIDATION_ERROR;
  }

  if (!VALID_SEVERITIES.has(severity)) {
    console.error(`无效严重级别 "${severity}"：必须是 S1、S2、S3 或 S4`);
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const d = registerDefect(featureId, {
      severity: severity as SecuritySeverity,
      title,
      reporter,
      description: description ?? undefined,
      discoveredIn,
      linkedFr: linkedFr ?? undefined,
    }, process.cwd());
    console.log(`已登记：缺陷 #${d.seq} (${d.severity})`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleUpdate(args: string[]): number {
  const featureId = args[0];
  const seqStr = args[1];
  const status = parseFlag(args, '--status') ?? args[2];
  const _actor = parseFlag(args, '--actor'); // 阶段 A 暂不持久化 actor，仅保留参数兼容

  if (!featureId || !seqStr || !status) {
    console.error('用法：spec-first defect update <featureId> <seq> --status <status> [--actor <actor>]');
    return ExitCode.VALIDATION_ERROR;
  }

  const seq = parseInt(seqStr, 10);
  if (Number.isNaN(seq) || seq <= 0) {
    console.error(`无效序号 "${seqStr}"：必须是正整数`);
    return ExitCode.VALIDATION_ERROR;
  }

  if (!VALID_STATUSES.has(status)) {
    console.error(`无效状态 "${status}"：必须是 open、fixing、fixed、verified 或 wontfix`);
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const d = transitionDefect(featureId, seq, status as DefectStatus, process.cwd());
    console.log(`已更新：缺陷 #${d.seq} → ${d.status}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleList(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first defect list <featureId> [--status <status>] [--severity <severity>]');
    return ExitCode.VALIDATION_ERROR;
  }

  const statusFilter = parseFlag(args, '--status') as DefectStatus | undefined;
  const severityFilter = parseFlag(args, '--severity') as SecuritySeverity | undefined;

  const list = listDefects(featureId, process.cwd(), {
    status: statusFilter,
    severity: severityFilter,
  });

  if (list.length === 0) {
    console.log('未找到缺陷。');
    return ExitCode.SUCCESS;
  }
  for (const d of list) {
    console.log(`#${d.seq}  ${d.severity.padEnd(4)} ${d.status.padEnd(10)} ${d.title}`);
  }
  return ExitCode.SUCCESS;
}

function handleGet(args: string[]): number {
  const featureId = args[0];
  const seqStr = args[1];

  if (!featureId || !seqStr) {
    console.error('用法：spec-first defect get <featureId> <seq>');
    return ExitCode.VALIDATION_ERROR;
  }

  const seq = parseInt(seqStr, 10);
  if (Number.isNaN(seq) || seq <= 0) {
    console.error(`无效序号 "${seqStr}"：必须是正整数`);
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const d = getDefect(featureId, seq, process.cwd());
    console.log(JSON.stringify(d, null, 2));
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleEscapeRate(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first defect escape-rate <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const result = getEscapeRate(featureId, process.cwd());
  console.log(`总数：${result.total}，逃逸：${result.escaped}，逃逸率：${(result.rate * 100).toFixed(1)}%`);
  return ExitCode.SUCCESS;
}

function printDefectHelp(): void {
  console.log(`用法：spec-first defect <subcommand>

子命令：
  register     登记新缺陷
  update       变更缺陷状态
  list         列出缺陷（可筛选）
  get          查看缺陷详情
  escape-rate  计算缺陷逃逸率`);
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}
