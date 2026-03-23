import { describe, it, expect } from 'vitest';
import { parseTaskPlanContent, normalizeTaskPlanStatus, toTaskNodes } from '../../src/core/task-plan/parser.js';

describe('task-plan parser', () => {
  it('normalizes task status variants', () => {
    expect(normalizeTaskPlanStatus('in progress')).toBe('in_progress');
    expect(normalizeTaskPlanStatus('doing')).toBe('in_progress');
    expect(normalizeTaskPlanStatus('done')).toBe('complete');
    expect(normalizeTaskPlanStatus('todo')).toBe('pending');
  });

  it('parses canonical task table and finds current task', () => {
    const plan = parseTaskPlanContent([
      '| Task ID | 标题 | Owner | traces | depends_on | 状态 |',
      '|---|---|---|---|---|---|',
      '| TASK-AUTH-001 | Login | FE | FR-AUTH-001 | - | done |',
      '| TASK-AUTH-002 | Register | BE | FR-AUTH-002, DS-AUTH-001 | TASK-AUTH-001 | in progress |',
    ].join('\n'));

    expect(plan.currentTaskId).toBe('TASK-AUTH-002');
    expect(plan.stats.total).toBe(2);
    expect(plan.stats.completed).toBe(1);
    expect(plan.stats.inProgress).toBe(1);
    expect(plan.tasks[1].dependsOn).toEqual(['TASK-AUTH-001']);
    expect(plan.tasks[1].traces).toEqual(['FR-AUTH-002', 'DS-AUTH-001']);
  });

  it('supports Task ID column not being first', () => {
    const plan = parseTaskPlanContent([
      '| 标题 | 状态 | Task ID | depends_on |',
      '|---|---|---|---|',
      '| Login | in_progress | TASK-AUTH-001 | - |',
    ].join('\n'));

    expect(plan.currentTaskId).toBe('TASK-AUTH-001');
  });

  it('converts parsed plan to batch task nodes', () => {
    const parsed = parseTaskPlanContent([
      '| Task ID | 标题 | traces | depends_on | 状态 |',
      '|---|---|---|---|---|',
      '| TASK-AUTH-001 | Login | FR-AUTH-001, DS-AUTH-001, TC-UT-AUTH-001 | - | in_progress |',
    ].join('\n'));

    expect(toTaskNodes(parsed)).toEqual([
      {
        id: 'TASK-AUTH-001',
        title: 'Login',
        description: '',
        acceptanceCriteria: [],
        dependsOn: [],
        status: 'in_progress',
        relatedFR: ['FR-AUTH-001'],
        relatedDS: ['DS-AUTH-001'],
      },
    ]);
  });
});
