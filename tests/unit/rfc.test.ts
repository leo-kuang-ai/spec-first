import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRfc, getRfc, transitionRfc, submitRfc, listRfc } from '../../src/core/change-mgr/rfc.js';
import { RfcTransitionError } from '../../src/core/change-mgr/rfc-machine.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-rfc');
const FEAT = 'FSREQ-20260211-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('RFC CRUD', () => {
  it('should create RFC with auto-increment ID', () => {
    const r1 = createRfc(FEAT, { title: 'Change API', by: 'Leo' }, TMP);
    expect(r1.id).toBe('RFC-001');
    expect(r1.status).toBe('draft');
    expect(r1.level).toBe('Minor');

    const r2 = createRfc(FEAT, { title: 'Add field', by: 'Leo', level: 'Major' }, TMP);
    expect(r2.id).toBe('RFC-002');
    expect(r2.level).toBe('Major');
  });

  it('should get RFC by ID', () => {
    createRfc(FEAT, { title: 'Test', by: 'Leo' }, TMP);
    const r = getRfc('RFC-001', FEAT, TMP);
    expect(r.title).toBe('Test');
  });

  it('should throw when RFC not found', () => {
    expect(() => getRfc('RFC-999', FEAT, TMP)).toThrow(/not found/);
  });

  it('should transition RFC status', () => {
    createRfc(FEAT, { title: 'Test', by: 'Leo' }, TMP);
    const r = transitionRfc('RFC-001', 'approved', FEAT, TMP);
    expect(r.status).toBe('approved');
  });

  it('should reject invalid transition', () => {
    createRfc(FEAT, { title: 'Test', by: 'Leo' }, TMP);
    expect(() => transitionRfc('RFC-001', 'closed', FEAT, TMP))
      .toThrow(RfcTransitionError);
  });

  it('should submit RFC (draft → approved)', () => {
    createRfc(FEAT, { title: 'Test', by: 'Leo' }, TMP);
    const r = submitRfc('RFC-001', FEAT, TMP);
    expect(r.status).toBe('approved');
  });

  it('should list all RFCs sorted by ID', () => {
    createRfc(FEAT, { title: 'First', by: 'Leo' }, TMP);
    createRfc(FEAT, { title: 'Second', by: 'Leo' }, TMP);
    const list = listRfc(FEAT, TMP);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('RFC-001');
    expect(list[1].id).toBe('RFC-002');
  });

  it('should return empty list when no RFCs', () => {
    expect(listRfc(FEAT, TMP)).toEqual([]);
  });

  it('should preserve impactIds and motivation', () => {
    const r = createRfc(FEAT, {
      title: 'Test',
      by: 'Leo',
      motivation: 'Performance',
      impactIds: ['FR-AUTH-001', 'DS-AUTH-001'],
    }, TMP);
    expect(r.motivation).toBe('Performance');
    expect(r.impactIds).toEqual(['FR-AUTH-001', 'DS-AUTH-001']);
  });

  it('should write known-exceptions.md when submitting RFC with waivers', () => {
    createRfc(FEAT, {
      title: 'Waive temporary risk',
      by: 'Leo',
      waivers: [{
        frId: 'FR-AUTH-001',
        reason: 'temporary workaround',
        expiresAt: '2099-12-31T00:00:00Z',
        rollbackPoint: 'v1.0.0',
      }],
    }, TMP);

    submitRfc('RFC-001', FEAT, TMP);
    const content = readFileSync(join(TMP, 'specs', FEAT, 'known-exceptions.md'), 'utf-8');
    expect(content).toContain('| RFC-001 | FR-AUTH-001 |');
    expect(content).toContain('temporary workaround');
  });
});
