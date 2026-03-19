import { describe, expect, it } from 'vitest';
import type { MatrixRow } from '../../src/shared/types.js';
import { createTraceContext } from '../../src/core/trace-engine/trace-context.js';

describe('createTraceContext', () => {
  it('should group rows by type and expose reusable lineage data', () => {
    const rows: MatrixRow[] = [
      { id: 'FR-AUTH-001', type: 'FR', title: 'Login', status: 'Planned' },
      { id: 'DS-AUTH-001', type: 'DS', title: 'Design', status: 'Planned', upstream: ['FR-AUTH-001'] },
      { id: 'TASK-AUTH-001', type: 'TASK', title: 'Impl', status: 'Implemented', upstream: ['DS-AUTH-001'] },
      { id: 'TC-AUTH-001', type: 'TC', title: 'Test', status: 'Planned', upstream: ['FR-AUTH-001'] },
    ];

    const ctx = createTraceContext(rows);

    expect(ctx.frRows.map((row) => row.id)).toEqual(['FR-AUTH-001']);
    expect(ctx.dsRows.map((row) => row.id)).toEqual(['DS-AUTH-001']);
    expect(ctx.taskRows.map((row) => row.id)).toEqual(['TASK-AUTH-001']);
    expect(ctx.tcRows.map((row) => row.id)).toEqual(['TC-AUTH-001']);
    expect(ctx.frIds.has('FR-AUTH-001')).toBe(true);
    expect(ctx.lineage.hasAnyAncestor('TASK-AUTH-001', ctx.frIds)).toBe(true);
  });
});
