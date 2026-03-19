/**
 * 执行计划生成器
 */
import type { TaskNode, ExecutionPlan } from './types.js';
import {
  buildDependencyGraph,
  detectCyclicDependency,
  topologicalSort,
} from './dependency-resolver.js';
import { detectFileConflicts } from './guards.js';

export function generateExecutionPlan(
  tasks: TaskNode[],
  featureId: string,
  _projectRoot: string
): ExecutionPlan {
  const graph = buildDependencyGraph(tasks);
  const cycle = detectCyclicDependency(graph);

  if (cycle) {
    throw new Error(`循环依赖检测失败: ${cycle}`);
  }

  let layers = topologicalSort(graph);
  layers = detectFileConflicts(layers);
  const riskWarnings: string[] = [];

  const hasConflicts = layers.some((l) => !l.concurrent);
  if (hasConflicts) {
    riskWarnings.push('检测到文件冲突，部分层将串行执行');
  }

  riskWarnings.push('批量执行属于高风险操作，建议在 worktree 中执行');

  return {
    featureId,
    totalTasks: tasks.length,
    layers,
    riskWarnings,
  };
}
