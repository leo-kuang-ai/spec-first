import { describe, it, expect } from 'vitest';
import { buildDependencyGraph, detectCyclicDependency, topologicalSort } from '../../../src/core/batch-executor/dependency-resolver.js';
import type { TaskNode } from '../../../src/core/batch-executor/types.js';

describe('dependency-resolver', () => {
  const mockTasks: TaskNode[] = [
    {
      id: 'TASK-A',
      title: 'Task A',
      description: '',
      acceptanceCriteria: [],
      dependsOn: [],
      status: 'todo',
      relatedFR: [],
      relatedDS: [],
    },
    {
      id: 'TASK-B',
      title: 'Task B',
      description: '',
      acceptanceCriteria: [],
      dependsOn: ['TASK-A'],
      status: 'todo',
      relatedFR: [],
      relatedDS: [],
    },
    {
      id: 'TASK-C',
      title: 'Task C',
      description: '',
      acceptanceCriteria: [],
      dependsOn: ['TASK-A'],
      status: 'todo',
      relatedFR: [],
      relatedDS: [],
    },
  ];

  it('should build dependency graph', () => {
    const graph = buildDependencyGraph(mockTasks);
    expect(graph.nodes.size).toBe(3);
    expect(graph.adjacencyList.get('TASK-B')).toEqual(['TASK-A']);
  });

  it('should detect no cycle', () => {
    const graph = buildDependencyGraph(mockTasks);
    const cycle = detectCyclicDependency(graph);
    expect(cycle).toBeNull();
  });

  it('should detect cycle', () => {
    const cyclicTasks: TaskNode[] = [
      { ...mockTasks[0], dependsOn: ['TASK-C'] },
      mockTasks[1],
      mockTasks[2],
    ];
    const graph = buildDependencyGraph(cyclicTasks);
    const cycle = detectCyclicDependency(graph);
    expect(cycle).toContain('TASK-A');
    expect(cycle).toContain('TASK-C');
  });

  it('should sort topologically', () => {
    const graph = buildDependencyGraph(mockTasks);
    const layers = topologicalSort(graph);

    expect(layers.length).toBe(2);
    expect(layers[0].tasks.map(t => t.id)).toEqual(['TASK-A']);
    expect(layers[1].tasks.map(t => t.id)).toContain('TASK-B');
    expect(layers[1].tasks.map(t => t.id)).toContain('TASK-C');
  });
});
