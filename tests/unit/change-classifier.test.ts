/**
 * change-classifier 变更分级分类器测试 (TEST-COV-003)
 */
import { describe, it, expect } from 'vitest';
import {
  isCriticalTemplate,
  isMajorTemplate,
  isMinorTemplate,
  classifyChange,
  getMaxLevel,
  toRfcLevel,
} from '../../src/core/template/change-classifier.js';

describe('change-classifier', () => {
  describe('isCriticalTemplate', () => {
    it('匹配 config 模板', () => expect(isCriticalTemplate('meta-config')).toBe(true));
    it('匹配 rule 模板', () => expect(isCriticalTemplate('gate-rule')).toBe(true));
    it('匹配 gate 模板', () => expect(isCriticalTemplate('quality-gate')).toBe(true));
    it('匹配 settings 模板', () => expect(isCriticalTemplate('settings')).toBe(true));
    it('不匹配普通模板', () => expect(isCriticalTemplate('readme')).toBe(false));
  });

  describe('isMajorTemplate', () => {
    it('匹配 skill 模板', () => expect(isMajorTemplate('my-skill')).toBe(true));
    it('匹配阶段模板', () => expect(isMajorTemplate('01_specify')).toBe(true));
    it('匹配 workflow 模板', () => expect(isMajorTemplate('workflow-main')).toBe(true));
    it('匹配 design 模板', () => expect(isMajorTemplate('design-doc')).toBe(true));
    it('Critical 优先于 Major', () => expect(isMajorTemplate('skill-config')).toBe(false));
    it('不匹配普通模板', () => expect(isMajorTemplate('changelog')).toBe(false));
  });

  describe('isMinorTemplate', () => {
    it('普通模板为 Minor', () => expect(isMinorTemplate('readme')).toBe(true));
    it('changelog 为 Minor', () => expect(isMinorTemplate('changelog')).toBe(true));
    it('Critical 不是 Minor', () => expect(isMinorTemplate('config')).toBe(false));
    it('Major 不是 Minor', () => expect(isMinorTemplate('skill-doc')).toBe(false));
  });

  describe('classifyChange', () => {
    it('unchanged 返回 Minor', () => {
      const r = classifyChange('config', 'unchanged');
      expect(r.level).toBe('Minor');
      expect(r.autoUpdateSafe).toBe(true);
    });

    it('Critical 模板变更需确认', () => {
      const r = classifyChange('gate-rule', 'modified');
      expect(r.level).toBe('Critical');
      expect(r.requiresConfirmation).toBe(true);
      expect(r.autoUpdateSafe).toBe(false);
    });

    it('Major 模板变更需确认', () => {
      const r = classifyChange('01_specify', 'added');
      expect(r.level).toBe('Major');
      expect(r.requiresConfirmation).toBe(true);
    });

    it('Minor 模板变更可自动更新', () => {
      const r = classifyChange('readme', 'modified');
      expect(r.level).toBe('Minor');
      expect(r.autoUpdateSafe).toBe(true);
    });
  });

  describe('getMaxLevel', () => {
    it('有 Critical 返回 Critical', () => {
      expect(getMaxLevel([
        { level: 'Minor', reason: '', requiresConfirmation: false, autoUpdateSafe: true },
        { level: 'Critical', reason: '', requiresConfirmation: true, autoUpdateSafe: false },
      ])).toBe('Critical');
    });

    it('无 Critical 有 Major 返回 Major', () => {
      expect(getMaxLevel([
        { level: 'Minor', reason: '', requiresConfirmation: false, autoUpdateSafe: true },
        { level: 'Major', reason: '', requiresConfirmation: true, autoUpdateSafe: false },
      ])).toBe('Major');
    });

    it('全 Minor 返回 Minor', () => {
      expect(getMaxLevel([
        { level: 'Minor', reason: '', requiresConfirmation: false, autoUpdateSafe: true },
      ])).toBe('Minor');
    });
  });

  describe('toRfcLevel', () => {
    it('Minor → Minor', () => expect(toRfcLevel('Minor')).toBe('Minor'));
    it('Major → Major', () => expect(toRfcLevel('Major')).toBe('Major'));
    it('Critical → Critical', () => expect(toRfcLevel('Critical')).toBe('Critical'));
  });
});
