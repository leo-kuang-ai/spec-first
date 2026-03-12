import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SkillExecutionContext {
  projectRoot: string;
  featureId?: string;
}

export function readCurrentFeatureId(projectRoot: string): string | undefined {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  if (!existsSync(currentPath)) return undefined;
  const featureId = readFileSync(currentPath, 'utf-8').trim();
  return featureId || undefined;
}

export function resolveExecutionFeatureId(context: SkillExecutionContext): string | undefined {
  return context.featureId ?? readCurrentFeatureId(context.projectRoot);
}
