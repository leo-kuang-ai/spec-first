/**
 * Phase-Machine P4→P2 扩展测试 + 失败路径补齐
 * @see TASK-ORCH-014, TASK-ORCH-021
 */
import { describe, it, expect } from 'vitest';
import {
  createPhaseState,
  transition,
  canTransition,
  confirmPhase,
  getValidTransitions,
} from '../../src/core/skill-runtime/phase-machine.js';

describe('P4_WRITE → P2_GENERATE transition', () => {
  it('canTransition 返回 true', () => {
    expect(canTransition('P4_WRITE', 'P2_GENERATE')).toBe(true);
  });

  it('P4→P2 合法且递增 revisionCount', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = confirmPhase(state);
    state = transition(state, 'P4_WRITE');

    expect(state.current).toBe('P4_WRITE');
    const prev = state.revisionCount;

    state = transition(state, 'P2_GENERATE');
    expect(state.current).toBe('P2_GENERATE');
    expect(state.revisionCount).toBe(prev + 1);
    expect(state.confirmed).toBe(false);
  });

  it('P4→P5 仍然合法', () => {
    expect(canTransition('P4_WRITE', 'P5_SIDE_EFFECT')).toBe(true);
  });

  it('P4→P2 达到 maxRevisions 触发 3-Strike', () => {
    let state = createPhaseState({ maxRevisions: 1 });
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = confirmPhase(state);
    state = transition(state, 'P4_WRITE');

    expect(() => transition(state, 'P2_GENERATE')).toThrow('3-Strike');
  });

  it('P4→DONE 非法', () => {
    expect(canTransition('P4_WRITE', 'DONE')).toBe(false);
  });
});

// ─── 失败路径补齐（ORCH-021） ────────────────────────────

describe('confirmationGuard (P3→P4)', () => {
  it('未确认时 P3→P4 抛出 confirmationGuard', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    // 未调用 confirmPhase
    expect(() => transition(state, 'P4_WRITE')).toThrow('confirmationGuard');
  });

  it('确认后 P3→P4 正常通过', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = confirmPhase(state);
    state = transition(state, 'P4_WRITE');
    expect(state.current).toBe('P4_WRITE');
  });
});

describe('confirmPhase 错误路径', () => {
  it('非 P3 阶段调用 confirmPhase 抛出', () => {
    const state = createPhaseState();
    expect(() => confirmPhase(state)).toThrow('Cannot confirm in phase P0_LOCATE');
  });

  it('P2 阶段调用 confirmPhase 抛出', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    expect(() => confirmPhase(state)).toThrow('Cannot confirm in phase P2_GENERATE');
  });
});

describe('非法转换', () => {
  it('P0→P4 非法', () => {
    const state = createPhaseState();
    expect(() => transition(state, 'P4_WRITE')).toThrow('Illegal transition');
  });

  it('P2→P4 非法', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    expect(() => transition(state, 'P4_WRITE')).toThrow('Illegal transition');
  });

  it('DONE 无后续转换', () => {
    expect(canTransition('DONE', 'P0_LOCATE')).toBe(false);
  });

  it('ABORTED 无后续转换', () => {
    expect(canTransition('ABORTED', 'P0_LOCATE')).toBe(false);
  });
});

describe('P3→P2 3-Strike', () => {
  it('P3→P2 达到 maxRevisions 触发 3-Strike', () => {
    let state = createPhaseState({ maxRevisions: 1 });
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    // P3→P2 回退
    expect(() => transition(state, 'P2_GENERATE')).toThrow('3-Strike');
  });
});

describe('createPhaseState 边界', () => {
  it('maxRevisions=0 回退默认值 3', () => {
    const state = createPhaseState({ maxRevisions: 0 });
    expect(state.maxRevisions).toBe(3);
  });

  it('负数 maxRevisions 回退默认值 3', () => {
    const state = createPhaseState({ maxRevisions: -1 });
    expect(state.maxRevisions).toBe(3);
  });
});

describe('getValidTransitions', () => {
  it('P0 只能到 P1', () => {
    expect(getValidTransitions('P0_LOCATE')).toEqual(['P1_CONTEXT']);
  });

  it('P3 可到 P4/P2/ABORTED', () => {
    expect(getValidTransitions('P3_CONFIRM')).toEqual(['P4_WRITE', 'P2_GENERATE', 'ABORTED']);
  });

  it('DONE 无后续', () => {
    expect(getValidTransitions('DONE')).toEqual([]);
  });
});
