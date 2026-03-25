import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildSkillChecklistContext,
  evaluateSkillChecklist,
} from '../../src/core/skill-runtime/skill-checklist.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-skill-checklist');
const FEAT = 'FSREQ-20260324-NODE-001';

describe('skill checklist', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('allows skill standalone context even when current stage is different', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        featureId: FEAT,
        currentStage: '02_design',
        terminal: false,
        nodes: {
          '02_design': { status: 'in_progress', summary: '设计中' },
        },
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      }),
      'utf-8'
    );

    const result = evaluateSkillChecklist('spec', { projectRoot: TMP, featureId: FEAT });
    expect(result?.stage).toBe('01_specify');
    expect(result?.overallStatus).toBe('empty');
    expect(result?.canMarkDone).toBe(false);
  });

  it('builds checklist context for task skill using the canonical task table', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        featureId: FEAT,
        currentStage: '03_plan',
        terminal: false,
        nodes: {
          '03_plan': { status: 'in_progress', summary: '任务拆分中' },
        },
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      }),
      'utf-8'
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| title | status | summary | next_step |\n|---|---|---|---|\n| API 改造 | in_progress | 收口响应结构 | 完成调用方适配 |\n',
      'utf-8'
    );

    const notice = buildSkillChecklistContext('task', { projectRoot: TMP, featureId: FEAT });
    expect(notice).toContain('skill-checklist-context');
    expect(notice).toContain('stage: 03_plan');
    expect(notice).toContain('can_mark_done: yes');
  });

  it('marks spec checklist complete when background, goals and scope are present', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        featureId: FEAT,
        currentStage: '01_specify',
        terminal: false,
        nodes: {
          '01_specify': { status: 'in_progress', summary: '需求收口中' },
        },
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      }),
      'utf-8'
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'spec.md'),
      [
        '# Spec',
        '## 背景',
        '这是一个足够长的背景描述，确保检查通过。'.repeat(4),
        '## 目标',
        '明确目标并缩小范围。'.repeat(4),
        '## 范围',
        '定义边界与非目标。'.repeat(4),
      ].join('\n\n'),
      'utf-8'
    );

    const result = evaluateSkillChecklist('spec', { projectRoot: TMP, featureId: FEAT });
    expect(result?.overallStatus).toBe('complete');
    expect(result?.canMarkDone).toBe(true);
  });

  it('accepts wrap_up.md as wrap-up input for archive skill', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        featureId: FEAT,
        currentStage: '06_wrap_up',
        terminal: false,
        nodes: {
          '06_wrap_up': { status: 'in_progress', summary: '收尾中' },
        },
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      }),
      'utf-8'
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'wrap_up.md'),
      [
        '# Wrap Up',
        '## 最终交付摘要',
        '交付已完成，记录总结。'.repeat(4),
        '## 剩余问题',
        '暂无。'.repeat(4),
        '## 后续建议',
        '保持当前节奏。'.repeat(4),
      ].join('\n\n'),
      'utf-8'
    );

    const result = evaluateSkillChecklist('archive', { projectRoot: TMP, featureId: FEAT });
    expect(result?.overallStatus).toBe('complete');
    expect(result?.canMarkDone).toBe(true);
  });
});
