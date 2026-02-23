/**
 * RFC 4 态状态机
 * draft → approved / rejected
 * approved → closed / rejected
 * rejected / closed → 终态
 */
import type { RfcStatus } from '../../shared/types.js';

const RFC_TRANSITIONS: ReadonlyMap<RfcStatus, ReadonlySet<RfcStatus>> = new Map<RfcStatus, ReadonlySet<RfcStatus>>([
  ['draft', new Set(['approved', 'rejected'])],
  ['approved', new Set(['closed', 'rejected'])],
]);

const RFC_TERMINAL: ReadonlySet<RfcStatus> = new Set(['rejected', 'closed']);

export class RfcTransitionError extends Error {
  constructor(from: RfcStatus, to: RfcStatus) {
    super(`无效 RFC 状态流转：${from} → ${to}`);
    this.name = 'RfcTransitionError';
  }
}

/** 校验 RFC 状态转换合法性，非法时抛出 RfcTransitionError */
export function assertRfcTransition(from: RfcStatus, to: RfcStatus): void {
  if (isRfcTerminal(from)) {
    throw new RfcTransitionError(from, to);
  }
  const allowed = RFC_TRANSITIONS.get(from);
  if (!allowed || !allowed.has(to)) {
    throw new RfcTransitionError(from, to);
  }
}

/** RFC 终态判定 */
export function isRfcTerminal(status: RfcStatus): boolean {
  return RFC_TERMINAL.has(status);
}

/** 获取 RFC 可达状态列表 */
export function getNextRfcStatuses(status: RfcStatus): RfcStatus[] {
  if (isRfcTerminal(status)) return [];
  const allowed = RFC_TRANSITIONS.get(status);
  return allowed ? [...allowed] : [];
}
