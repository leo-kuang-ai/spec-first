import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FIRST_RUNTIME_ARTIFACTS } from './first-artifact-mapping.js';
import { checkFirstDocsExistence } from './first-docs-check.js';
import { validateFirstRuntime } from './first-runtime-validator.js';
import { readFirstRuntimeSummary } from './first-runtime-store.js';
import type { FirstRuntimeSummary } from './first-runtime-types.js';

export interface BootstrapFirstRuntimeResult {
  source: 'validated';
  summary: FirstRuntimeSummary;
  runtimeArtifacts: string[];
  docsOutputs: string[];
}

function collectExistingDocsOutputs(projectRoot: string): string[] {
  const result = checkFirstDocsExistence(projectRoot);
  if (!result.ok) {
    throw new Error(`first docs 缺失: ${result.missing.join('；')}`);
  }

  return result.expected.filter((docPath) => existsSync(join(projectRoot, docPath)));
}

export function bootstrapFirstRuntime(
  projectRoot: string
): BootstrapFirstRuntimeResult {
  const validation = validateFirstRuntime(projectRoot);
  if (!validation.valid) {
    throw new Error(`first runtime 校验失败: ${validation.issues.join('；')}`);
  }

  const summary = readFirstRuntimeSummary(projectRoot);
  if (!summary) {
    throw new Error('missing first runtime summary');
  }

  const docsOutputs = collectExistingDocsOutputs(projectRoot);

  return {
    source: 'validated',
    summary,
    runtimeArtifacts: [...FIRST_RUNTIME_ARTIFACTS],
    docsOutputs,
  };
}
