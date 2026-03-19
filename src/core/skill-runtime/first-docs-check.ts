import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CANONICAL_PROJECTION_DOCS } from './first-artifact-mapping.js';
import { readFirstDatabaseSchema, readFirstRuntimeIndex } from './first-runtime-store.js';

export interface FirstDocsCheckResult {
  ok: boolean;
  expected: string[];
  missing: string[];
}

function expectedDocs(projectRoot: string): string[] {
  const index = readFirstRuntimeIndex(projectRoot);
  const databaseSchema = readFirstDatabaseSchema(projectRoot);
  const databaseReady =
    index?.databaseSchema.status === 'healthy' && databaseSchema?.status === 'healthy';

  return CANONICAL_PROJECTION_DOCS.filter((docPath) =>
    docPath.endsWith('database-er.md') ? databaseReady : true
  );
}

export function checkFirstDocsExistence(projectRoot: string): FirstDocsCheckResult {
  const expected = expectedDocs(projectRoot);
  const missing = expected.filter((docPath) => !existsSync(join(projectRoot, docPath)));

  return {
    ok: missing.length === 0,
    expected,
    missing,
  };
}

export function assertFirstDocsExist(projectRoot: string): void {
  const result = checkFirstDocsExistence(projectRoot);
  if (!result.ok) {
    throw new Error(`first docs 缺失: ${result.missing.join('；')}`);
  }
}
