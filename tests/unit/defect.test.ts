import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  registerDefect,
  getDefect,
  transitionDefect,
  listDefects,
  getEscapeRate,
} from '../../src/core/change-mgr/defect.js';
import { DefectTransitionError } from '../../src/core/change-mgr/defect-machine.js';
import { Stage } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-defect');
const FEAT = 'FSREQ-20260211-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('Defect CRUD', () => {
  it('should register defect with auto-increment seq', () => {
    const d1 = registerDefect(FEAT, { severity: 'S2', title: 'Bug A', reporter: 'Leo' }, TMP);
    expect(d1.seq).toBe(1);
    expect(d1.status).toBe('open');

    const d2 = registerDefect(FEAT, { severity: 'S1', title: 'Bug B', reporter: 'Leo' }, TMP);
    expect(d2.seq).toBe(2);
  });

  it('should get defect by seq', () => {
    registerDefect(FEAT, { severity: 'S3', title: 'Test', reporter: 'Leo' }, TMP);
    const d = getDefect(FEAT, 1, TMP);
    expect(d.title).toBe('Test');
    expect(d.severity).toBe('S3');
  });

  it('should throw when defect not found', () => {
    expect(() => getDefect(FEAT, 999, TMP)).toThrow(/未找到缺陷/);
  });

  it('should transition defect status', () => {
    registerDefect(FEAT, { severity: 'S2', title: 'Bug', reporter: 'Leo' }, TMP);
    const d = transitionDefect(FEAT, 1, 'fixing', TMP);
    expect(d.status).toBe('fixing');
  });

  it('should reject invalid transition', () => {
    registerDefect(FEAT, { severity: 'S2', title: 'Bug', reporter: 'Leo' }, TMP);
    expect(() => transitionDefect(FEAT, 1, 'verified', TMP))
      .toThrow(DefectTransitionError);
  });

  it('should support rollback path (fixing → open)', () => {
    registerDefect(FEAT, { severity: 'S2', title: 'Bug', reporter: 'Leo' }, TMP);
    transitionDefect(FEAT, 1, 'fixing', TMP);
    const d = transitionDefect(FEAT, 1, 'open', TMP);
    expect(d.status).toBe('open');
  });

  it('should list defects sorted by seq', () => {
    registerDefect(FEAT, { severity: 'S2', title: 'B', reporter: 'Leo' }, TMP);
    registerDefect(FEAT, { severity: 'S1', title: 'A', reporter: 'Leo' }, TMP);
    const list = listDefects(FEAT, TMP);
    expect(list).toHaveLength(2);
    expect(list[0].seq).toBe(1);
    expect(list[1].seq).toBe(2);
  });

  it('should filter by status', () => {
    registerDefect(FEAT, { severity: 'S2', title: 'A', reporter: 'Leo' }, TMP);
    registerDefect(FEAT, { severity: 'S2', title: 'B', reporter: 'Leo' }, TMP);
    transitionDefect(FEAT, 1, 'fixing', TMP);
    const list = listDefects(FEAT, TMP, { status: 'fixing' });
    expect(list).toHaveLength(1);
    expect(list[0].seq).toBe(1);
  });

  it('should filter by severity', () => {
    registerDefect(FEAT, { severity: 'S1', title: 'Critical', reporter: 'Leo' }, TMP);
    registerDefect(FEAT, { severity: 'S3', title: 'Minor', reporter: 'Leo' }, TMP);
    const list = listDefects(FEAT, TMP, { severity: 'S1' });
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Critical');
  });

  it('should return empty list when no defects', () => {
    expect(listDefects(FEAT, TMP)).toEqual([]);
  });

  it('should calculate escape rate', () => {
    registerDefect(FEAT, { severity: 'S2', title: 'A', reporter: 'Leo', discoveredIn: Stage.VERIFY }, TMP);
    registerDefect(FEAT, { severity: 'S1', title: 'B', reporter: 'Leo', discoveredIn: Stage.WRAP_UP }, TMP);
    registerDefect(FEAT, { severity: 'S3', title: 'C', reporter: 'Leo', discoveredIn: Stage.RELEASE }, TMP);
    const result = getEscapeRate(FEAT, TMP);
    expect(result.total).toBe(3);
    expect(result.escaped).toBe(2);
    expect(result.rate).toBeCloseTo(2 / 3);
  });

  it('should return zero escape rate when no defects', () => {
    const result = getEscapeRate(FEAT, TMP);
    expect(result).toEqual({ total: 0, escaped: 0, rate: 0 });
  });
});
