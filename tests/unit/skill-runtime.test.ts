/**
 * Skill Runtime 单元测试
 * Dispatcher + Phase Machine + confirm_policy
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { dispatchCommand, resolveSkillPath } from '../../src/core/skill-runtime/dispatcher.js';
import {
  createPhaseState, canTransition, transition, confirmPhase,
  preWriteArchive, getValidTransitions,
} from '../../src/core/skill-runtime/phase-machine.js';
import { evaluatePolicy, writeAutoAudit } from '../../src/core/skill-runtime/confirm-policy.js';
import type { Phase } from '../../src/core/skill-runtime/phase-machine.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-skill-runtime');
const FEAT = 'FSREQ-20260211-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, 'skills', 'spec-first', '07-code'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── Dispatcher Tests ───────────────────────────────────

describe('dispatchCommand', () => {
  it('should dispatch runtime command', () => {
    const result = dispatchCommand('rfc list', TMP);
    expect(result.route).toBe('runtime');
    expect(result.command).toBe('rfc');
    expect(result.args).toEqual(['list']);
  });

  it('should dispatch with namespace prefix', () => {
    const result = dispatchCommand('spec-first:matrix check', TMP);
    expect(result.route).toBe('runtime');
    expect(result.command).toBe('matrix');
  });

  it('should map semantic subcommand', () => {
    const result = dispatchCommand('rfc approve RFC-001', TMP);
    expect(result.route).toBe('runtime');
    expect(result.command).toBe('rfc');
    expect(result.args).toContain('approved');
  });

  it('should dispatch to skill route', () => {
    writeFileSync(join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md'), '# Code Skill');
    const result = dispatchCommand('code', TMP);
    expect(result.route).toBe('skill');
    expect(result.skillName).toBe('code');
    expect(result.skillPath).toBeDefined();
  });

  it('should return error for unknown command', () => {
    const result = dispatchCommand('nonexistent', TMP);
    expect(result.route).toBe('error');
    expect(result.error).toContain('SKILL_NOT_FOUND');
  });

  it('should return error for empty command', () => {
    const result = dispatchCommand(':', TMP);
    expect(result.route).toBe('error');
  });
});

// ─── Phase Machine Tests ────────────────────────────────

describe('Phase Machine', () => {
  it('should create initial state at P0_LOCATE', () => {
    const state = createPhaseState();
    expect(state.current).toBe('P0_LOCATE');
    expect(state.revisionCount).toBe(0);
  });

  it('should allow legal transitions', () => {
    expect(canTransition('P0_LOCATE', 'P1_CONTEXT')).toBe(true);
    expect(canTransition('P1_CONTEXT', 'P2_GENERATE')).toBe(true);
    expect(canTransition('P3_CONFIRM', 'P2_GENERATE')).toBe(true);
    expect(canTransition('P3_CONFIRM', 'ABORTED')).toBe(true);
  });

  it('should block illegal transitions', () => {
    expect(canTransition('P0_LOCATE', 'P3_CONFIRM')).toBe(false);
    expect(canTransition('DONE', 'P0_LOCATE')).toBe(false);
    expect(canTransition('P2_GENERATE', 'P4_WRITE')).toBe(false);
  });

  it('should transition through full happy path', () => {
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

  it('should block P3→P4 without confirmation', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    expect(() => transition(state, 'P4_WRITE')).toThrow('confirmationGuard');
  });

  it('should allow P3→P2 revision and increment counter', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = transition(state, 'P2_GENERATE');
    expect(state.revisionCount).toBe(1);
    expect(state.current).toBe('P2_GENERATE');
  });

  it('should throw on illegal transition', () => {
    const state = createPhaseState();
    expect(() => transition(state, 'P4_WRITE')).toThrow('Illegal transition');
  });

  it('should return valid transitions for each phase', () => {
    expect(getValidTransitions('P0_LOCATE')).toEqual(['P1_CONTEXT']);
    expect(getValidTransitions('DONE')).toEqual([]);
    expect(getValidTransitions('P3_CONFIRM')).toHaveLength(3);
  });

  it('should archive oversized runtime file and keep tail lines', () => {
    const findingsPath = join(TMP, 'specs', FEAT, 'findings.md');
    const lines = Array.from({ length: 550 }, (_, i) => `line-${i + 1}`).join('\n');
    writeFileSync(findingsPath, lines, 'utf-8');

    const archived = preWriteArchive(FEAT, TMP);
    expect(archived).toContain('findings.md');

    const kept = readFileSync(findingsPath, 'utf-8').split('\n');
    expect(kept.length).toBeLessThanOrEqual(200);
    expect(kept[0]).toBe('line-351');

    const files = readdirSync(join(TMP, 'specs', FEAT));
    expect(files.some((f) => /^findings-\d{4}-\d{2}-\d{2}-\d+\.md$/.test(f))).toBe(true);
  });
});

// ─── confirm_policy Tests ───────────────────────────────

describe('evaluatePolicy', () => {
  it('should return strict for mode N', () => {
    expect(evaluatePolicy({ mode: 'N', size: 'S', hasNfrSec: false, hasNewExternalApi: false })).toBe('strict');
  });

  it('should return auto for mode I + size S + no security', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'S', hasNfrSec: false, hasNewExternalApi: false })).toBe('auto');
  });

  it('should return strict for mode I + size S + has NFR-SEC', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'S', hasNfrSec: true, hasNewExternalApi: false })).toBe('strict');
  });

  it('should return strict for mode I + size S + new external API', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'S', hasNfrSec: false, hasNewExternalApi: true })).toBe('strict');
  });

  it('should return assisted for mode I + size M', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'M', hasNfrSec: false, hasNewExternalApi: false })).toBe('assisted');
  });

  it('should return assisted for mode I + size L', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'L', hasNfrSec: true, hasNewExternalApi: true })).toBe('assisted');
  });
});
