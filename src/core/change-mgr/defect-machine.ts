/**
 * 缺陷 5 态状态机
 * open → fixing / wontfix
 * fixing → fixed / open
 * fixed → verified / open
 * verified / wontfix → 终态
 */
import type { DefectStatus } from '../../shared/types.js';

const DEFECT_TRANSITIONS: ReadonlyMap<DefectStatus, ReadonlySet<DefectStatus>> = new Map<
  DefectStatus,
  ReadonlySet<DefectStatus>
>([
  ['open', new Set(['fixing', 'wontfix'])],
  ['fixing', new Set(['fixed', 'open'])],
  ['fixed', new Set(['verified', 'open'])],
]);

const DEFECT_TERMINAL: ReadonlySet<DefectStatus> = new Set(['verified', 'wontfix']);

export class DefectTransitionError extends Error {
  constructor(from: DefectStatus, to: DefectStatus) {
    super(`无效缺陷状态流转：${from} → ${to}`);
    this.name = 'DefectTransitionError';
  }
}

/** 校验缺陷状态转换合法性 */
export function assertDefectTransition(from: DefectStatus, to: DefectStatus): void {
  if (isDefectTerminal(from)) {
    throw new DefectTransitionError(from, to);
  }
  const allowed = DEFECT_TRANSITIONS.get(from);
  if (!allowed || !allowed.has(to)) {
    throw new DefectTransitionError(from, to);
  }
}

/** 缺陷终态判定 */
export function isDefectTerminal(status: DefectStatus): boolean {
  return DEFECT_TERMINAL.has(status);
}

/** 获取缺陷可达状态列表 */
export function getNextDefectStatuses(status: DefectStatus): DefectStatus[] {
  if (isDefectTerminal(status)) return [];
  const allowed = DEFECT_TRANSITIONS.get(status);
  return allowed ? [...allowed] : [];
}
