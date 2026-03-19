import {
  readFirstApiContracts,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstDatabaseSchema,
  readFirstDomainModel,
  readFirstEntryGuide,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstSteering,
  readFirstStructureOverview,
} from './first-runtime-store.js';

export interface FirstRuntimeValidationResult {
  valid: boolean;
  issues: string[];
}

export function validateFirstRuntime(projectRoot: string): FirstRuntimeValidationResult {
  const issues: string[] = [];
  const index = readFirstRuntimeIndex(projectRoot);

  if (!index) {
    return {
      valid: false,
      issues: ['missing runtime index'],
    };
  }

  if (!readFirstRuntimeSummary(projectRoot)) issues.push('missing summary.json');
  if (!readFirstSteering(projectRoot)) issues.push('missing steering.json');
  if (!readFirstConventions(projectRoot)) issues.push('missing conventions.json');
  if (!readFirstCriticalFlows(projectRoot)) issues.push('missing critical-flows.json');
  if (!readFirstEntryGuide(projectRoot)) issues.push('missing entry-guide.json');
  if (!readFirstApiContracts(projectRoot)) issues.push('missing api-contracts.json');
  if (!readFirstStructureOverview(projectRoot)) issues.push('missing structure-overview.json');
  if (!readFirstDomainModel(projectRoot)) issues.push('missing domain-model.json');

  if (index.databaseSchema.status === 'healthy' && !readFirstDatabaseSchema(projectRoot)) {
    issues.push('missing database-schema.json');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function assertValidFirstRuntime(projectRoot: string): void {
  const result = validateFirstRuntime(projectRoot);
  if (!result.valid) {
    throw new Error(`first runtime 校验失败: ${result.issues.join('；')}`);
  }
}
