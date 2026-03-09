/**
 * 上下文打包器（< 2KB）
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { TaskNode } from './types.js';

export interface ContextPack {
  task: {
    id: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
  };
  relatedSpecs: {
    fr: string;
    ds: string;
  };
  constitution: string[];
  tddRequirement: string[];
  dependencies: string[];
}

export function packContext(
  task: TaskNode,
  featureId: string,
  projectRoot: string,
): ContextPack {
  const pack: ContextPack = {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      acceptanceCriteria: task.acceptanceCriteria,
    },
    relatedSpecs: {
      fr: extractRelatedContent(task.relatedFR, featureId, projectRoot, 'spec.md'),
      ds: extractRelatedContent(task.relatedDS, featureId, projectRoot, 'design.md'),
    },
    constitution: loadConstitution(projectRoot),
    tddRequirement: [
      '必须有 RED 证据或 WAIVER',
      '测试先行原则',
    ],
    dependencies: task.dependsOn.map(id => `依赖 ${id} 已完成`),
  };

  // 验证大小 < 2KB
  const size = JSON.stringify(pack).length;
  if (size > 2048) {
    throw new Error(`上下文包过大: ${size} bytes > 2048 bytes`);
  }

  return pack;
}

function extractRelatedContent(
  ids: string[],
  featureId: string,
  projectRoot: string,
  filename: string,
): string {
  if (ids.length === 0) return '';

  const path = join(projectRoot, 'specs', featureId, filename);
  if (!existsSync(path)) return '';

  const content = readFileSync(path, 'utf-8');

  // 提取相关段落（简化实现）
  const excerpts = ids.map(id => {
    const regex = new RegExp(`## ${id}[\\s\\S]{0,300}`, 'i');
    const match = content.match(regex);
    return match ? match[0] : '';
  }).filter(Boolean);

  return excerpts.join('\n\n').slice(0, 500); // 限制 500 字符
}

function loadConstitution(projectRoot: string): string[] {
  const path = join(projectRoot, 'constitution.md');
  if (!existsSync(path)) return [];

  const content = readFileSync(path, 'utf-8');
  return content.split('\n')
    .filter(line => line.startsWith('- '))
    .map(line => line.slice(2))
    .slice(0, 5); // 最多 5 条约束
}
