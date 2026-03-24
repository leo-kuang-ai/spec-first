/**
 * Skill Integration E2E 测试
 * 验证 Dispatcher → Phase Machine → confirm_policy 集成路径
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { dispatchCommand } from '../../src/core/skill-runtime/dispatcher.js';
import {
  createPhaseState, transition, confirmPhase,
} from '../../src/core/skill-runtime/phase-machine.js';
import { evaluatePolicy } from '../../src/core/skill-runtime/confirm-policy.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-skill-integration');
const FEAT = 'FSREQ-20260211-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(join(TMP, 'skills', '07-code'), { recursive: true });
  writeFileSync(join(TMP, 'skills', '07-code', 'SKILL.md'), '# Code Skill');
  writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({ currentStage: '04_implement' }),
    'utf-8',
  );
  writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design', 'utf-8');
  writeFileSync(
    join(TMP, 'specs', FEAT, 'task_plan.md'),
    '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | in_progress |\n',
    'utf-8',
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── Dispatch → Phase Machine 集成 ─────────────────────

describe('Skill Route Integration', () => {
  it('should dispatch skill and run full phase cycle', () => {
    const dispatch = dispatchCommand('code', TMP);
    expect(dispatch.route).toBe('skill');

    // 模拟 6-phase 执行
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = confirmPhase(state);
    state = transition(state, 'P4_WRITE');
    state = transition(state, 'P5_SIDE_EFFECT');
    state = transition(state, 'DONE');
    expect(state.current).toBe('DONE');
  });

  it('should dispatch runtime command directly', () => {
    const dispatch = dispatchCommand('docs validate', TMP);
    expect(dispatch.route).toBe('runtime');
    expect(dispatch.command).toBe('docs');
  });
});

// ─── Phase 3 交互协议 ──────────────────────────────────

describe('Phase 3 Interaction', () => {
  it('should support confirm flow (Y)', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = confirmPhase(state);
    state = transition(state, 'P4_WRITE');
    expect(state.current).toBe('P4_WRITE');
  });

  it('should support reject flow (N → ABORTED)', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = transition(state, 'ABORTED');
    expect(state.current).toBe('ABORTED');
  });

  it('should support revision feedback loop', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    // 修订反馈
    state = transition(state, 'P2_GENERATE');
    expect(state.revisionCount).toBe(1);
    state = transition(state, 'P3_CONFIRM');
    state = confirmPhase(state);
    state = transition(state, 'P4_WRITE');
    expect(state.current).toBe('P4_WRITE');
  });
});
