import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseMatrix, checkMatrix, exportMatrix, updateMatrixRow } from '../../src/core/trace-engine/matrix.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-matrix');
const FEAT_ID = 'FSREQ-20260211-AUTH-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

const MATRIX_CONTENT = `| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| FR-AUTH-001 | FR | Login [NFR:SEC] | Planned |  | DS-AUTH-001, TASK-AUTH-001 |
| FR-AUTH-002 | FR | Logout | Planned |  |  |
| DS-AUTH-001 | DS | Auth Design | Planned | FR-AUTH-001 |  |
| TASK-AUTH-001 | TASK | Impl Login | Implemented | FR-AUTH-001 |  |
| TC-UT-AUTH-001 | TC | Unit Test | Planned | FR-AUTH-001 |  |
`;

beforeEach(() => {
  mkdirSync(SPEC_DIR, { recursive: true });
  writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), MATRIX_CONTENT, 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('parseMatrix', () => {
  it('should parse all rows from matrix', () => {
    const rows = parseMatrix(FEAT_ID, TMP);
    expect(rows).toHaveLength(5);
  });

  it('should parse NFR tag', () => {
    const rows = parseMatrix(FEAT_ID, TMP);
    expect(rows[0].nfrTag).toBe('SEC');
  });

  it('should parse upstream/downstream refs', () => {
    const rows = parseMatrix(FEAT_ID, TMP);
    const fr = rows[0];
    expect(fr.downstream).toEqual(['DS-AUTH-001', 'TASK-AUTH-001']);
    const ds = rows[2];
    expect(ds.upstream).toEqual(['FR-AUTH-001']);
  });

  it('should return empty for missing matrix', () => {
    expect(parseMatrix('FSREQ-20260211-NOPE-001', TMP)).toEqual([]);
  });
});

describe('checkMatrix', () => {
  it('should detect broken chain for FR without DS/TASK/TC', () => {
    const result = checkMatrix(FEAT_ID, TMP);
    // FR-AUTH-002 has no DS/TASK/TC mapping
    expect(result.brokenChains.length).toBeGreaterThanOrEqual(1);
    const broken = result.brokenChains.find(b => b.frId === 'FR-AUTH-002');
    expect(broken).toBeDefined();
    expect(broken!.missing).toContain('DS');
  });

  it('should report total count', () => {
    const result = checkMatrix(FEAT_ID, TMP);
    expect(result.total).toBe(5);
  });

  it('should generate warnings', () => {
    const result = checkMatrix(FEAT_ID, TMP);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should not mark TASK as missing when FR is linked via DS->TASK chain', () => {
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Planned |  | DS-AUTH-001,TASK-AUTH-001 |',
      '| DS-AUTH-001 | DS | Design | Planned | FR-AUTH-001 | TASK-AUTH-001 |',
      '| TASK-AUTH-001 | TASK | Impl | Implemented | DS-AUTH-001 |  |',
      '',
    ].join('\n'), 'utf-8');

    const result = checkMatrix(FEAT_ID, TMP);
    const broken = result.brokenChains.find((b) => b.frId === 'FR-AUTH-001');
    expect(broken).toBeDefined();
    expect(broken!.missing).not.toContain('TASK');
  });

  it('should detect missing V-Model forward/backward mappings', () => {
    const vModelMatrix = `| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| REQ-AUTH-001 | REQ | Requirement | Planned |  |  |
| ATP-AUTH-001 | ATP | Acceptance Test | Planned |  |  |
`;
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), vModelMatrix, 'utf-8');
    const result = checkMatrix(FEAT_ID, TMP);
    expect(result.vModelPairs.length).toBe(2);
    expect(result.vModelPairs.some((p) => p.id === 'REQ-AUTH-001' && p.direction === 'forward')).toBe(true);
    expect(result.vModelPairs.some((p) => p.id === 'ATP-AUTH-001' && p.direction === 'backward')).toBe(true);
  });

  it('should pass V-Model pairing when bidirectional links exist', () => {
    const vModelMatrix = `| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| REQ-AUTH-001 | REQ | Requirement | Planned |  | ATP-AUTH-001 |
| ATP-AUTH-001 | ATP | Acceptance Test | Planned | REQ-AUTH-001 |  |
| SYS-AUTH-001 | SYS | System Design | Planned | REQ-AUTH-001 | STP-AUTH-001 |
| STP-AUTH-001 | STP | System Test | Planned | SYS-AUTH-001 |  |
| ARCH-AUTH-001 | ARCH | Architecture | Planned | SYS-AUTH-001 | ITP-AUTH-001 |
| ITP-AUTH-001 | ITP | Integration Test | Planned | ARCH-AUTH-001 |  |
| MOD-AUTH-001 | MOD | Module | Planned | ARCH-AUTH-001 | UTP-AUTH-001 |
| UTP-AUTH-001 | UTP | Unit Test Plan | Planned | MOD-AUTH-001 |  |
`;
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), vModelMatrix, 'utf-8');
    const result = checkMatrix(FEAT_ID, TMP);
    expect(result.vModelPairs).toHaveLength(0);
  });
});

describe('exportMatrix', () => {
  it('should export as markdown', () => {
    const md = exportMatrix(FEAT_ID, TMP, 'markdown');
    expect(md).toContain('| ID |');
    expect(md).toContain('FR-AUTH-001');
  });

  it('should export as yaml', () => {
    const yml = exportMatrix(FEAT_ID, TMP, 'yaml');
    expect(yml).toContain('matrix:');
    expect(yml).toContain('id: "FR-AUTH-001"');
  });
});

describe('updateMatrixRow', () => {
  it('should update row status', () => {
    updateMatrixRow(FEAT_ID, TMP, 'FR-AUTH-001', { status: 'Implemented' });
    const rows = parseMatrix(FEAT_ID, TMP);
    const fr = rows.find(r => r.id === 'FR-AUTH-001');
    expect(fr!.status).toBe('Implemented');
  });

  it('should throw for unknown ID', () => {
    expect(() => updateMatrixRow(FEAT_ID, TMP, 'FR-NOPE-999', { status: 'Implemented' }))
      .toThrow('ID not found in matrix');
  });
});
