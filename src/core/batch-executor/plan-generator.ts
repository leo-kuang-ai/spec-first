/**
 * 执行计划生成器
 */
import type { TaskNode, ExecutionPlan } from './types.js';
import {
  buildDependencyGraph,
  detectCyclicDependency,
  topologicalSort,
} from './dependency-resolver.js';
import { checkTddEvidence, detectFileConflicts } from './guards.js';

export function generateExecutionPlan(
  tasks: TaskNode[],
  featureId: string,
  projectRoot: string
): ExecutionPlan {
  const graph = buildDependencyGraph(tasks);
  const cycle = detectCyclicDependency(graph);

  if (cycle) {
    throw new Error(`循环依赖检测失败: ${cycle}`);
  }

  let layers = topologicalSort(graph);
  layers = detectFileConflicts(layers);

  const tddCheck = checkTddEvidence(tasks, featureId, projectRoot);
  const tddWarnings: string[] = [];
  const riskWarnings: string[] = [];

  if (!tddCheck.passed) {
    throw new Error(
      `TDD 预检失败: ${tddCheck.missingCount}/${tddCheck.totalCount} 个 TASK 缺少 RED 证据 (> 50%)`
    );
  }

  if (tddCheck.missingCount > 0) {
    tddWarnings.push(
      `${tddCheck.missingCount} 个 TASK 缺少 TDD 证据: ${tddCheck.missingTasks.join(', ')}`
    );
  }

  const hasConflicts = layers.some((l) => !l.concurrent);
  if (hasConflicts) {
    riskWarnings.push('检测到文件冲突，部分层将串行执行');
  }

  riskWarnings.push('批量执行属于高风险操作，建议在 worktree 中执行');

  return {
    featureId,
    totalTasks: tasks.length,
    layers,
    tddWarnings,
    riskWarnings,
  };
}
