import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Stage } from '../../src/shared/types.js';
import type { StageState } from '../../src/shared/types.js';
import {
  currentFeature,
  switchFeature,
  getFeatureState,
  listFeatures,
} from '../../src/core/process-engine/feature.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-feature');

function writeState(featureId: string, overrides: Partial<StageState> = {}): void {
  const dir = join(TMP, 'specs', featureId);
  mkdirSync(dir, { recursive: true });
  const state: StageState = {
    featureId,
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
  writeFileSync(join(dir, 'stage-state.json'), JSON.stringify(state, null, 2), 'utf-8');
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs'), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('currentFeature', () => {
  it('should return null when current file missing', () => {
    expect(currentFeature(TMP)).toBeNull();
  });

  it('should return featureId from current file', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), 'FSREQ-20260211-AUTH-001\n', 'utf-8');
    expect(currentFeature(TMP)).toBe('FSREQ-20260211-AUTH-001');
  });
});

describe('switchFeature', () => {
  it('should write featureId to current file', () => {
    const fid = 'FSREQ-20260211-SW-001';
    writeState(fid);
    switchFeature(fid, TMP);
    expect(currentFeature(TMP)).toBe(fid);
  });

  it('should reject non-existent feature', () => {
    expect(() => switchFeature('NONEXISTENT', TMP)).toThrow(/not found/);
  });
});

describe('getFeatureState', () => {
  it('should return stage-state.json content', () => {
    const fid = 'FSREQ-20260211-GS-001';
    writeState(fid, { currentStage: Stage.DESIGN });
    const state = getFeatureState(fid, TMP);
    expect(state.currentStage).toBe(Stage.DESIGN);
    expect(state.featureId).toBe(fid);
  });

  it('should throw for missing feature', () => {
    expect(() => getFeatureState('MISSING', TMP)).toThrow(/not found/);
  });
});

describe('listFeatures', () => {
  it('should return empty array when no features', () => {
    expect(listFeatures(TMP)).toEqual([]);
  });

  it('should list features sorted by updatedAt desc', () => {
    writeState('FSREQ-20260211-A-001', { updatedAt: '2026-02-11T01:00:00.000Z' });
    writeState('FSREQ-20260211-B-001', { updatedAt: '2026-02-11T03:00:00.000Z' });
    writeState('FSREQ-20260211-C-001', { updatedAt: '2026-02-11T02:00:00.000Z' });
    const list = listFeatures(TMP);
    expect(list).toHaveLength(3);
    expect(list[0].featureId).toBe('FSREQ-20260211-B-001');
    expect(list[1].featureId).toBe('FSREQ-20260211-C-001');
    expect(list[2].featureId).toBe('FSREQ-20260211-A-001');
  });

  it('should return empty when specs dir missing', () => {
    rmSync(join(TMP, 'specs'), { recursive: true, force: true });
    expect(listFeatures(TMP)).toEqual([]);
  });
});
