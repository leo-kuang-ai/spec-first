import { describe, it, expect } from 'vitest';
import { parseTaskPlanContent, normalizeTaskPlanStatus, toTaskNodes } from '../../src/core/task-plan/parser.js';

describe('task-plan parser', () => {
  it('normalizes task status variants', () => {
    expect(normalizeTaskPlanStatus('in progress')).toBe('in_progress');
    expect(normalizeTaskPlanStatus('doing')).toBe('in_progress');
    expect(normalizeTaskPlanStatus('done')).toBe('done');
    expect(normalizeTaskPlanStatus('todo')).toBe('todo');
  });

  it('parses canonical task table and finds current task by title', () => {
    const plan = parseTaskPlanContent([
      '| title | status | summary | next_step |',
      '|---|---|---|---|',
      '| 初始化工程与上下文 | done | 已完成基础目录与依赖准备 | - |',
      '| 重构 API 接口 | in_progress | 正在收口响应结构 | 完成响应模型与调用方适配 |',
      '| 冒烟验证 | blocked | 等待接口结构稳定 | 完成 API 改造后恢复 |',
    ].join('\n'));

    expect(plan.currentTaskTitle).toBe('重构 API 接口');
    expect(plan.stats.total).toBe(3);
    expect(plan.stats.done).toBe(1);
    expect(plan.stats.inProgress).toBe(1);
    expect(plan.stats.blocked).toBe(1);
    expect(plan.tasks[1].next_step).toBe('完成响应模型与调用方适配');
  });

  it('converts parsed plan to batch task nodes using title as local identity', () => {
    const parsed = parseTaskPlanContent([
      '| title | status | summary | next_step |',
      '|---|---|---|---|',
      '| 登录接口改造 | in_progress | 统一响应结构 | 更新调用方适配 |',
    ].join('\n'));

    expect(toTaskNodes(parsed)).toEqual([
      {
        id: '登录接口改造',
        title: '登录接口改造',
        description: '统一响应结构',
        acceptanceCriteria: [],
        dependsOn: [],
        status: 'in_progress',
        relatedFR: [],
        relatedDS: [],
      },
    ]);
  });
});
