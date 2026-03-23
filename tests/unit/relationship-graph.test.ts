import { describe, it, expect } from 'vitest';
import {
  MAIN_CHAIN_NODE_TYPES,
  RELATION_LABELS,
  SUPPLEMENTARY_NODE_TYPES,
  splitCanonicalTraceIds,
  isMainChainNodeType,
  isRelationLabel,
  isSupplementaryNodeType,
} from '../../src/core/trace-engine/relationship-graph.js';

describe('relationship graph taxonomy', () => {
  it('should expose the canonical main chain node types', () => {
    expect([...MAIN_CHAIN_NODE_TYPES]).toEqual(['Feature', 'REQ', 'FR', 'DS', 'TASK']);
    expect(isMainChainNodeType('FR')).toBe(true);
    expect(isMainChainNodeType('TC')).toBe(false);
  });

  it('should expose the canonical supplementary node types', () => {
    expect([...SUPPLEMENTARY_NODE_TYPES]).toEqual(['TC', 'RFC']);
    expect(isSupplementaryNodeType('TC')).toBe(true);
    expect(isSupplementaryNodeType('FR')).toBe(false);
    expect(isSupplementaryNodeType('EX')).toBe(false);
  });

  it('should expose the canonical relation labels', () => {
    expect([...RELATION_LABELS]).toEqual(['upstream', 'downstream', 'link', 'waiver']);
    expect(isRelationLabel('waiver')).toBe(true);
    expect(isRelationLabel('other')).toBe(false);
  });

  it('should split canonical trace ids by tier', () => {
    expect(
      splitCanonicalTraceIds([
        'FSREQ-20260211-AUTH-001',
        'REQ-AUTH-001',
        'FR-AUTH-001',
        'DS-AUTH-001',
        'TASK-AUTH-001',
        'TC-UT-AUTH-001',
        'RFC-001',
        'SYS-AUTH-001',
        'not-an-id',
      ])
    ).toEqual({
      mainChainIds: [
        'FSREQ-20260211-AUTH-001',
        'REQ-AUTH-001',
        'FR-AUTH-001',
        'DS-AUTH-001',
        'TASK-AUTH-001',
      ],
      supplementaryIds: ['TC-UT-AUTH-001', 'RFC-001'],
      untrackedIds: ['SYS-AUTH-001', 'not-an-id'],
      relatedFRIds: ['FR-AUTH-001'],
      relatedDSIds: ['DS-AUTH-001'],
    });
  });
});
