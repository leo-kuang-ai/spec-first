/**
 * 文件冲突检测
 */
import type { TaskLayer } from './types.js';

export function detectFileConflicts(layers: TaskLayer[]): TaskLayer[] {
  return layers.map((layer) => {
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

    const conflicts = Array.from(fileMap.entries()).filter(([_, tasks]) => tasks.length > 1);

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
