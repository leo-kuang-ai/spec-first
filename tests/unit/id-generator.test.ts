import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nextId } from '../../src/core/trace-engine/id-generator.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-idgen');
const FEAT_ID = 'FSREQ-20260211-AUTH-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

beforeEach(() => {
  mkdirSync(SPEC_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('nextId', () => {
  it('should generate first FR ID (seq=001)', () => {
    const r = nextId({ type: 'FR', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    expect(r.id).toBe('FR-AUTH-001');
    expect(r.seq).toBe(1);
  });

  it('should increment seq for consecutive calls', () => {
    nextId({ type: 'FR', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    const r2 = nextId({ type: 'FR', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    expect(r2.id).toBe('FR-AUTH-002');
    expect(r2.seq).toBe(2);
  });

  it('should generate DS ID', () => {
    const r = nextId({ type: 'DS', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    expect(r.id).toBe('DS-AUTH-001');
  });

  it('should generate TASK ID', () => {
    const r = nextId({ type: 'TASK', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    expect(r.id).toBe('TASK-AUTH-001');
  });

  it('should generate TC ID with level prefix', () => {
    const r = nextId({ type: 'TC', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP, tcLevel: 'UT' });
    expect(r.id).toBe('TC-UT-AUTH-001');
  });

  it('should throw when TC missing tcLevel', () => {
    expect(() => nextId({ type: 'TC', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP }))
      .toThrow('TC 类型必须提供 tcLevel');
  });

  it('should generate RFC ID (no abbr in ID)', () => {
    const r = nextId({ type: 'RFC', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    expect(r.id).toBe('RFC-001');
  });

  it('should reject invalid abbreviation', () => {
    expect(() => nextId({ type: 'FR', abbr: 'auth', featureId: FEAT_ID, projectRoot: TMP }))
      .toThrow('无效缩写');
    expect(() => nextId({ type: 'FR', abbr: '', featureId: FEAT_ID, projectRoot: TMP }))
      .toThrow('无效缩写');
  });

  it('should write to reservation file', () => {
    nextId({ type: 'FR', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    const matrixPath = join(SPEC_DIR, '.id-reservations.json');
    const content = readFileSync(matrixPath, 'utf-8');
    expect(content).toContain('FR-AUTH-001');
    expect(content).toContain('reservedIds');
  });

  it('should handle existing reserved IDs', () => {
    const matrixPath = join(SPEC_DIR, '.id-reservations.json');
    const existing = JSON.stringify({ reservedIds: ['FR-AUTH-001', 'FR-AUTH-002'] }, null, 2);
    writeFileSync(matrixPath, existing, 'utf-8');

    const r = nextId({ type: 'FR', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    expect(r.id).toBe('FR-AUTH-003');
    expect(r.seq).toBe(3);
  });

  it('should keep different types independent', () => {
    nextId({ type: 'FR', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    const r = nextId({ type: 'DS', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    expect(r.id).toBe('DS-AUTH-001');
  });

  it('should generate V-Model IDs via nextId', () => {
    const req = nextId({ type: 'REQ', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    const atp = nextId({ type: 'ATP', abbr: 'AUTH', featureId: FEAT_ID, projectRoot: TMP });
    expect(req.id).toBe('REQ-AUTH-001');
    expect(atp.id).toBe('ATP-AUTH-001');
  });
});
