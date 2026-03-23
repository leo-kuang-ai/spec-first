import { describe, it, expect } from 'vitest';
import { createTraceContext } from '../../src/core/trace-engine/trace-context.js';
import type { MatrixRow } from '../../src/shared/types.js';

describe('trace context', () => {
  it('should split rows into main chain, supplementary, and untracked tiers', () => {
    const rows: MatrixRow[] = [
      { id: 'FSREQ-20260211-AUTH-001', type: 'Feature', title: 'Feature', status: 'Accepted' },
      { id: 'REQ-AUTH-001', type: 'REQ', title: 'REQ', status: 'Planned' },
      { id: 'FR-AUTH-001', type: 'FR', title: 'FR', status: 'Implemented' },
      { id: 'TC-UT-AUTH-001', type: 'TC', title: 'TC', status: 'Verified' },
      { id: 'RFC-001', type: 'RFC', title: 'RFC', status: 'Accepted' },
      { id: 'SYS-AUTH-001', type: 'SYS', title: 'SYS', status: 'Planned' },
    ];

    const context = createTraceContext(rows);

    expect(context.mainChainRows.map((row) => row.id)).toEqual([
      'FSREQ-20260211-AUTH-001',
      'REQ-AUTH-001',
      'FR-AUTH-001',
    ]);
    expect(context.supplementaryRows.map((row) => row.id)).toEqual([
      'TC-UT-AUTH-001',
      'RFC-001',
    ]);
    expect(context.untrackedRows.map((row) => row.id)).toEqual(['SYS-AUTH-001']);
    expect(context.lineage.getAncestors('FR-AUTH-001')).toEqual(new Set());
  });
});
