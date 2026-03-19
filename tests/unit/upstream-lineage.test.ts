import { describe, expect, it } from 'vitest';
import type { MatrixRow } from '../../src/shared/types.js';
import { createUpstreamLineage } from '../../src/core/trace-engine/upstream-lineage.js';

describe('createUpstreamLineage', () => {
  it('should resolve transitive upstream ancestors once', () => {
    const rows: MatrixRow[] = [
      { id: 'FR-AUTH-001', type: 'FR', title: 'Login', status: 'Planned' },
      { id: 'DS-AUTH-001', type: 'DS', title: 'Design', status: 'Planned', upstream: ['FR-AUTH-001'] },
      { id: 'TASK-AUTH-001', type: 'TASK', title: 'Impl', status: 'Planned', upstream: ['DS-AUTH-001'] },
    ];

    const lineage = createUpstreamLineage(rows);

    expect(Array.from(lineage.getAncestors('TASK-AUTH-001')).sort()).toEqual([
      'DS-AUTH-001',
      'FR-AUTH-001',
    ]);
    expect(lineage.hasAnyAncestor('TASK-AUTH-001', new Set(['FR-AUTH-001']))).toBe(true);
    expect(Array.from(lineage.collectCoveredTargetIds(['TASK-AUTH-001'], new Set(['FR-AUTH-001'])))).toEqual([
      'FR-AUTH-001',
    ]);
  });

  it('should handle cycles without including self as ancestor', () => {
    const rows: MatrixRow[] = [
      { id: 'FR-AUTH-001', type: 'FR', title: 'Login', status: 'Planned' },
      { id: 'DS-AUTH-001', type: 'DS', title: 'Design', status: 'Planned', upstream: ['TASK-AUTH-001', 'FR-AUTH-001'] },
      { id: 'TASK-AUTH-001', type: 'TASK', title: 'Impl', status: 'Planned', upstream: ['DS-AUTH-001'] },
    ];

    const lineage = createUpstreamLineage(rows);
    const ancestors = lineage.getAncestors('TASK-AUTH-001');

    expect(ancestors.has('TASK-AUTH-001')).toBe(false);
    expect(ancestors.has('DS-AUTH-001')).toBe(true);
    expect(ancestors.has('FR-AUTH-001')).toBe(true);
  });
});
