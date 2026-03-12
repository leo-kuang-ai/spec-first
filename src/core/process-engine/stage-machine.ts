/**
 * 阶段状态机核心
 * 8+2 阶段合法转换校验，终态不可逆
 */
import { Stage, TERMINAL_STAGES } from '../../shared/types.js';

/** 合法转换表：key → 允许的下一阶段集合 */
const TRANSITIONS = new Map<Stage, ReadonlySet<Stage>>([
  [Stage.INIT, new Set([Stage.SPECIFY, Stage.CANCELLED])],
  [Stage.SPECIFY, new Set([Stage.DESIGN, Stage.CANCELLED])],
  [Stage.DESIGN, new Set([Stage.PLAN, Stage.CANCELLED])],
  [Stage.PLAN, new Set([Stage.IMPLEMENT, Stage.CANCELLED])],
  [Stage.IMPLEMENT, new Set([Stage.VERIFY, Stage.CANCELLED])],
  [Stage.VERIFY, new Set([Stage.WRAP_UP, Stage.CANCELLED])],
  [Stage.WRAP_UP, new Set([Stage.RELEASE, Stage.CANCELLED])],
  [Stage.RELEASE, new Set([Stage.DONE, Stage.CANCELLED])],
]);

export class TransitionError extends Error {
  constructor(from: Stage, to: Stage, reason: string) {
    super(`Cannot transition ${from} → ${to}: ${reason}`);
    this.name = 'TransitionError';
  }
}

/**
 * 校验阶段转换是否合法
 * @throws TransitionError 非法转换时抛出
 */
export function assertTransitionAllowed(from: Stage, to: Stage): void {
  if (TERMINAL_STAGES.has(from)) {
    throw new TransitionError(from, to, 'source stage is terminal');
  }

  const allowed = TRANSITIONS.get(from);
  if (!allowed || !allowed.has(to)) {
    throw new TransitionError(from, to, 'transition not allowed');
  }
}

/** 判断阶段是否为终态 */
export function isTerminal(stage: Stage): boolean {
  return TERMINAL_STAGES.has(stage);
}

/** 获取阶段的合法下一阶段列表 */
export function getNextStages(stage: Stage): Stage[] {
  if (TERMINAL_STAGES.has(stage)) return [];
  const allowed = TRANSITIONS.get(stage);
  return allowed ? [...allowed] : [];
}
