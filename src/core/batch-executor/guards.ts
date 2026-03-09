/**
 * TDD 预检和文件冲突检测
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TaskNode, TaskLayer } from './types.js';

export interface TddCheckResult {
  passed: boolean;
  missingCount: number;
  totalCount: number;
  missingTasks: string[];
}

export function checkTddEvidence(
  tasks: TaskNode[],
  featureId: string,
  projectRoot: string,
): TddCheckResult {
  const findingsPath = join(projectRoot, 'specs', featureId, 'findings.md');

  if (!existsSync(findingsPath)) {
    return {
      passed: false,
      missingCount: tasks.length,
      totalCount: tasks.length,
      missingTasks: tasks.map(t => t.id),
    };
  }

  const findings = readFileSync(findingsPath, 'utf-8');
  const missingTasks: string[] = [];

  for (const task of tasks) {
    const hasRed = findings.includes(`[TDD-RED] ${task.id}`);
    const hasWaiver = findings.includes(`[TDD-WAIVER] ${task.id}`);

    if (!hasRed && !hasWaiver) {
      missingTasks.push(task.id);
    }
  }

  const missingRate = missingTasks.length / tasks.length;

  return {
    passed: missingRate <= 0.5,
    missingCount: missingTasks.length,
    totalCount: tasks.length,
    missingTasks,
  };
}

export function detectFileConflicts(layers: TaskLayer[]): TaskLayer[] {
  return layers.map(layer => {
    const fileMap = new Map<string, string[]>();

    for (const task of layer.tasks) {
      // 简化实现：从 description 提取文件路径
      const files = extractFilePaths(task.description);
      for (const file of files) {
        if (!fileMap.has(file)) {
          fileMap.set(file, []);
        }
        fileMap.get(file)!.push(task.id);
      }
    }

    const conflicts = Array.from(fileMap.entries())
      .filter(([_, tasks]) => tasks.length > 1);

    if (conflicts.length > 0) {
      return {
        ...layer,
        concurrent: false,
        conflictReason: `文件冲突: ${conflicts.map(([f]) => f).join(', ')}`,
      };
    }

    return layer;
  });
}

function extractFilePaths(text: string): string[] {
  const matches = text.match(/[\w/-]+\.(ts|tsx|js|jsx|vue|py|go|rs)/g);
  return matches || [];
}
