/**
 * 迁移模块导出索引
 */
export { ConflictStrategy } from './manifest-schema.js';
export type {
  MigrationManifest,
  MigrationStep,
  StepResult,
  ExecutionResult,
  ValidationResult,
} from './manifest-schema.js';
export {
  loadManifest,
  validateManifest,
  listManifests,
  findManifestForVersion,
} from './manifest-loader.js';
export {
  parseRange,
  compareVersions,
  matches,
  filterManifestsByVersion,
  rangeToString,
} from './version-matcher.js';
export { executeStep, executeManifest } from './manifest-engine.js';
