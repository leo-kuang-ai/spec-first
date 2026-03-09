/**
 * 依赖图解析与拓扑排序
 */
import type { TaskNode, DependencyGraph, TaskLayer } from './types.js';

export function buildDependencyGraph(tasks: TaskNode[]): DependencyGraph {
  const nodes = new Map<string, TaskNode>();
  const adjacencyList = new Map<string, string[]>();

  for (const task of tasks) {
    nodes.set(task.id, task);
    adjacencyList.set(task.id, task.dependsOn);
  }

  return { nodes, adjacencyList };
}

export function detectCyclicDependency(graph: DependencyGraph): string | null {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(taskId: string, path: string[]): string | null {
    visited.add(taskId);
    recStack.add(taskId);
    path.push(taskId);

    const deps = graph.adjacencyList.get(taskId) || [];
    for (const dep of deps) {
      if (!visited.has(dep)) {
        const cycle = dfs(dep, path);
        if (cycle) return cycle;
      } else if (recStack.has(dep)) {
        return [...path, dep].join(' -> ');
      }
    }

    recStack.delete(taskId);
    path.pop();
    return null;
  }

  for (const taskId of graph.nodes.keys()) {
    if (!visited.has(taskId)) {
      const cycle = dfs(taskId, []);
      if (cycle) return cycle;
    }
  }

  return null;
}

export function topologicalSort(graph: DependencyGraph): TaskLayer[] {
  const layers: TaskLayer[] = [];
  const inDegree = new Map<string, number>();
  const processed = new Set<string>();

  // 初始化入度为 0
  for (const taskId of graph.nodes.keys()) {
    inDegree.set(taskId, 0);
  }

  // 计算入度：依赖别人的任务入度 +1
  for (const [taskId, deps] of graph.adjacencyList.entries()) {
    inDegree.set(taskId, (inDegree.get(taskId) || 0) + deps.length);
  }

  let layerNum = 0;
  while (processed.size < graph.nodes.size) {
    const currentLayer: TaskNode[] = [];

    for (const [taskId, degree] of inDegree.entries()) {
      if (degree === 0 && !processed.has(taskId)) {
        currentLayer.push(graph.nodes.get(taskId)!);
      }
    }

    if (currentLayer.length === 0) break;

    layers.push({
      layer: layerNum++,
      tasks: currentLayer,
      concurrent: true,
    });

    for (const task of currentLayer) {
      processed.add(task.id);
      inDegree.delete(task.id);

      // 减少依赖当前任务的其他任务的入度
      for (const [otherId, deps] of graph.adjacencyList.entries()) {
        if (deps.includes(task.id)) {
          inDegree.set(otherId, (inDegree.get(otherId) || 0) - 1);
        }
      }
    }
  }

  return layers;
}
