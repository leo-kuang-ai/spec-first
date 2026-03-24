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
});
