/**
 * update-decision 变更决策逻辑测试 (TEST-COV-003)
 */
import { describe, it, expect } from 'vitest';
import {
  decideUpdate,
  filterByAction,
  formatDecisionSummary,
} from '../../src/core/template/update-decision.js';
import type { HashChange } from '../../src/core/template/hash-registry.js';
import type { BatchUpdateDecision } from '../../src/core/template/update-decision.js';

function makeChange(overrides: Partial<HashChange> = {}): HashChange {
  return { template: 'test', oldHash: 'a', newHash: 'b', level: 'Minor', changeType: 'modified', ...overrides };
}

describe('update-decision', () => {
  describe('decideUpdate', () => {
    it('unchanged → SKIP', () => {
      const r = decideUpdate(makeChange({ changeType: 'unchanged' }), false);
      expect(r.action).toBe('SKIP');
    });

    it('Critical → BLOCK', () => {
      const r = decideUpdate(makeChange({ level: 'Critical' }), false);
      expect(r.action).toBe('BLOCK');
    });

    it('deleted → PROMPT', () => {
      const r = decideUpdate(makeChange({ changeType: 'deleted', level: 'Minor' }), false);
      expect(r.action).toBe('PROMPT');
    });

    it('modified + local override → PROMPT', () => {
      const r = decideUpdate(makeChange({ level: 'Major' }), true);
      expect(r.action).toBe('PROMPT');
      expect(r.hasLocalOverride).toBe(true);
    });

    it('modified + no override → AUTO_UPDATE', () => {
      const r = decideUpdate(makeChange({ level: 'Major' }), false);
      expect(r.action).toBe('AUTO_UPDATE');
    });

    it('added + no override → AUTO_UPDATE', () => {
      const r = decideUpdate(makeChange({ changeType: 'added' }), false);
      expect(r.action).toBe('AUTO_UPDATE');
    });
  });

  describe('filterByAction', () => {
    it('按 action 过滤', () => {
      const batch: BatchUpdateDecision = {
        decisions: [
          { template: 'a', action: 'SKIP', reason: '', level: 'Minor', hasLocalOverride: false },
          { template: 'b', action: 'BLOCK', reason: '', level: 'Critical', hasLocalOverride: false },
        ],
        summary: { skip: 1, autoUpdate: 0, prompt: 0, block: 1 },
        requiresUserInput: true,
      };
      expect(filterByAction(batch, 'BLOCK')).toHaveLength(1);
      expect(filterByAction(batch, 'SKIP')).toHaveLength(1);
      expect(filterByAction(batch, 'AUTO_UPDATE')).toHaveLength(0);
    });
  });

  describe('formatDecisionSummary', () => {
    it('输出包含摘要信息', () => {
      const batch: BatchUpdateDecision = {
        decisions: [
          { template: 'cfg', action: 'BLOCK', reason: '关键变更', level: 'Critical', hasLocalOverride: false },
          { template: 'doc', action: 'AUTO_UPDATE', reason: '自动', level: 'Minor', hasLocalOverride: false },
        ],
        summary: { skip: 0, autoUpdate: 1, prompt: 0, block: 1 },
        requiresUserInput: true,
      };
      const output = formatDecisionSummary(batch);
      expect(output).toContain('模板更新决策摘要');
      expect(output).toContain('阻断更新: 1');
      expect(output).toContain('自动更新: 1');
      expect(output).toContain('[BLOCK] cfg');
      expect(output).toContain('[AUTO] doc');
    });
  });
});
