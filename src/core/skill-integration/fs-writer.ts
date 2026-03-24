import { dirname } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import type { IntegrationPlan, PlannedFileWrite } from './integration-planner.js';

export interface FileWriteResult {
  path: string;
  kind: PlannedFileWrite['kind'];
  status: 'written' | 'skipped' | 'previewed';
}

export function applyIntegrationPlan(
  plan: IntegrationPlan,
  options: { dryRun?: boolean; projectRoot?: string } = {}
): FileWriteResult[] {
  const projectRoot = options.projectRoot ?? process.cwd();
  const results: FileWriteResult[] = [];

  for (const write of plan.fileWrites) {
    const outputPath = write.path.startsWith('/') ? write.path : `${projectRoot}/${write.path}`;
    if (options.dryRun) {
      results.push({ path: outputPath, kind: write.kind, status: 'previewed' });
      continue;
    }

    mkdirSync(dirname(outputPath), { recursive: true });
    if (existsSync(outputPath) && !write.overwrite) {
      results.push({ path: outputPath, kind: write.kind, status: 'skipped' });
      continue;
    }

    writeFileSync(outputPath, write.content, 'utf-8');
    results.push({ path: outputPath, kind: write.kind, status: 'written' });
  }

  return results;
}

