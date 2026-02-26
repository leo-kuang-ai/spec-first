import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Stage } from '../../src/shared/types.js';
import type { StageState } from '../../src/shared/types.js';
import { advance, cancel } from '../../src/core/process-engine/advance.js';
import { resetConfigCache } from '../../src/shared/config-schema.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-advance');
const FEAT_ID = 'FSREQ-20260211-ADV-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

function makeState(overrides: Partial<StageState> = {}): StageState {
  return {
    featureId: FEAT_ID,
    mode: 'N',
    size: 'S',
    platforms: ['backend'],
    currentStage: Stage.INIT,
    history: [],
    terminal: false,
    createdAt: '2026-02-11T00:00:00.000Z',
    updatedAt: '2026-02-11T00:00:00.000Z',
    ...overrides,
  };
}

function writeState(state: StageState): void {
  writeFileSync(join(SPEC_DIR, 'stage-state.json'), JSON.stringify(state, null, 2), 'utf-8');
}

function readState(): StageState {
  const raw = require('node:fs').readFileSync(join(SPEC_DIR, 'stage-state.json'), 'utf-8');
  return JSON.parse(raw);
}

beforeEach(() => {
  resetConfigCache();
  mkdirSync(SPEC_DIR, { recursive: true });
  // findings.md 需要存在才能追加
  writeFileSync(join(SPEC_DIR, 'findings.md'), '# Findings\n', 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  resetConfigCache();
});

describe('advance', () => {
  it('should advance INIT → SPECIFY when gate passes', () => {
    writeState(makeState());
    const result = advance(FEAT_ID, TMP);
    expect(result.from).toBe(Stage.INIT);
    expect(result.to).toBe(Stage.SPECIFY);
    expect(result.gateResult).toBe('PASS');
    const updated = readState();
    expect(updated.currentStage).toBe(Stage.SPECIFY);
    expect(updated.history).toHaveLength(1);
  });

  it('should advance with --force and write FORCE_SKIPPED', () => {
    writeState(makeState());
    const result = advance(FEAT_ID, TMP, { force: true });
    expect(result.gateResult).toBe('FORCE_SKIPPED');
    expect(readState().currentStage).toBe(Stage.SPECIFY);
  });

  it('should reject advance from terminal stage', () => {
    writeState(makeState({ currentStage: Stage.DONE, terminal: true }));
    expect(() => advance(FEAT_ID, TMP)).toThrow(/终态阶段/);
  });

  it('should reject when feature not found', () => {
    expect(() => advance('NONEXISTENT', TMP)).toThrow(/未找到 Feature/);
  });

  it('should block when gate result is FAIL', () => {
    writeState(makeState({ currentStage: Stage.SPECIFY }));
    expect(() => advance(FEAT_ID, TMP)).toThrow(/Gate 未通过/);
  });

  it('should write gate-history.jsonl on advance', () => {
    writeState(makeState());
    advance(FEAT_ID, TMP, { force: true });
    const logPath = join(SPEC_DIR, 'gate-history.jsonl');
    const lines = require('node:fs').readFileSync(logPath, 'utf-8').trim().split('\n');
    const entry = JSON.parse(lines[lines.length - 1]);
    expect(entry.action).toBe('advance');
    expect(entry.from).toBe(Stage.INIT);
    expect(entry.to).toBe(Stage.SPECIFY);
    expect(entry.event).toBe('stage_advance');
  });

  it('should chain multiple advances', () => {
    writeState(makeState());
    advance(FEAT_ID, TMP, { force: true });
    resetConfigCache();
    advance(FEAT_ID, TMP, { force: true });
    const state = readState();
    expect(state.currentStage).toBe(Stage.DESIGN);
    expect(state.history).toHaveLength(2);
  });

  it('should set terminal=true when reaching DONE', () => {
    writeState(makeState({ currentStage: Stage.RELEASE }));
    advance(FEAT_ID, TMP, { force: true });
    const state = readState();
    expect(state.currentStage).toBe(Stage.DONE);
    expect(state.terminal).toBe(true);
  });

  it('should auto-sync context file when advancing DESIGN → PLAN', () => {
    writeState(makeState({ currentStage: Stage.DESIGN }));
    writeFileSync(join(SPEC_DIR, 'design.md'), '# Design\n## API\n', 'utf-8');
    writeFileSync(join(TMP, 'CLAUDE.md'), '# CLAUDE\n', 'utf-8');

    const result = advance(FEAT_ID, TMP, { force: true });
    expect(result.from).toBe(Stage.DESIGN);
    expect(result.to).toBe(Stage.PLAN);

    const content = readFileSync(join(TMP, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('SPEC-FIRST:BEGIN AUTO-CONTEXT');
    expect(content).toContain('Spec-First Context Snapshot');
  });
});

describe('cancel', () => {
  it('should cancel from INIT', () => {
    writeState(makeState());
    const result = cancel(FEAT_ID, TMP, 'requirements changed');
    expect(result.from).toBe(Stage.INIT);
    expect(result.to).toBe(Stage.CANCELLED);
    expect(result.gateResult).toBe('CANCELLED');
    const state = readState();
    expect(state.terminal).toBe(true);
    expect(state.history[0].reason).toBe('requirements changed');
  });

  it('should cancel from mid-stage (IMPLEMENT)', () => {
    writeState(makeState({ currentStage: Stage.IMPLEMENT }));
    const result = cancel(FEAT_ID, TMP, 'budget cut');
    expect(result.to).toBe(Stage.CANCELLED);
  });

  it('should reject cancel without reason', () => {
    writeState(makeState());
    expect(() => cancel(FEAT_ID, TMP, '')).toThrow(/取消原因不能为空/);
  });

  it('should reject cancel from terminal stage', () => {
    writeState(makeState({ currentStage: Stage.DONE, terminal: true }));
    expect(() => cancel(FEAT_ID, TMP, 'too late')).toThrow(/终态阶段/);
  });

  it('should write gate-history.jsonl on cancel', () => {
    writeState(makeState());
    cancel(FEAT_ID, TMP, 'test cancel');
    const logPath = join(SPEC_DIR, 'gate-history.jsonl');
    const raw = require('node:fs').readFileSync(logPath, 'utf-8').trim();
    const entry = JSON.parse(raw);
    expect(entry.action).toBe('cancel');
    expect(entry.reason).toBe('test cancel');
    expect(entry.event).toBe('stage_cancel');
  });
});
