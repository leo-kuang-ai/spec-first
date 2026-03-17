export const FIRST_RUNTIME_STAGES = ['spec', 'design', 'code', 'verify'] as const;
export const FIRST_RUNTIME_ROLES = ['product', 'dev', 'qa', 'architect'] as const;
// `quick` 仅作为历史 runtime 数据的兼容值保留；新的 CLI 与写入统一使用 `deep`。
export const FIRST_RUNTIME_MODES = ['quick', 'deep'] as const;

export type FirstRuntimeStage = (typeof FIRST_RUNTIME_STAGES)[number];
export type FirstRuntimeRole = (typeof FIRST_RUNTIME_ROLES)[number];
export type FirstRuntimeMode = (typeof FIRST_RUNTIME_MODES)[number];
export type FirstRuntimeStatus = 'current' | 'stale';
export type FirstRuntimeConditionalStatus = 'healthy' | 'not_applicable' | 'degraded';

export interface FirstRuntimeAssetIndexEntry {
  path: string;
  fileHash: string;
  lastUpdated: string;
  healthy: boolean;
  issues?: string[];
}

export interface FirstRuntimeConditionalAssetIndexEntry extends FirstRuntimeAssetIndexEntry {
  status: FirstRuntimeConditionalStatus;
}

export interface FirstRuntimeIndex {
  version: string;
  lastRun: string;
  mode?: FirstRuntimeMode;
  sourceCommit?: string;
  summary: FirstRuntimeAssetIndexEntry;
  roleViews: FirstRuntimeAssetIndexEntry;
  stageViews: FirstRuntimeAssetIndexEntry;
  steering: FirstRuntimeAssetIndexEntry;
  conventions: FirstRuntimeAssetIndexEntry;
  criticalFlows: FirstRuntimeAssetIndexEntry;
  changeMap: FirstRuntimeAssetIndexEntry;
  entryGuide: FirstRuntimeAssetIndexEntry;
  rebootGuide: FirstRuntimeAssetIndexEntry;
  apiContracts: FirstRuntimeAssetIndexEntry;
  structureOverview: FirstRuntimeAssetIndexEntry;
  domainModel: FirstRuntimeAssetIndexEntry;
  databaseSchema: FirstRuntimeConditionalAssetIndexEntry;
  docsProjection: Record<string, FirstRuntimeAssetIndexEntry>;
  status: FirstRuntimeStatus;
  staleReason?: string;
}

export interface FirstRuntimeSummary {
  generatedAt: string;
  mode?: FirstRuntimeMode;
  project: {
    name: string;
    platformType?: string;
    overview?: string;
  };
  techStack?: string[];
  modules: string[];
  capabilities: string[];
  entryPoints: string[];
  dataModels: string[];
  apiSurface: string[];
  risks: string[];
  evidence: string[];
}

export interface FirstRoleView {
  role: FirstRuntimeRole;
  summary: string;
  focus: string[];
  warnings: string[];
}

export interface FirstRoleViews {
  product: FirstRoleView;
  dev: FirstRoleView;
  qa: FirstRoleView;
  architect: FirstRoleView;
}

export interface FirstSteering {
  product: {
    overview: string;
    coreScenarios: string[];
    nonGoals: string[];
    glossary: string[];
  };
  tech: {
    stack: string[];
    constraints: string[];
    forbiddenPatterns: string[];
  };
  structure: {
    modules: string[];
    boundaries: string[];
    entryRules: string[];
  };
}

export interface FirstConventionBucket {
  observedPatterns: string[];
  deviations: string[];
  recommendedConvention: string;
  evidence: string[];
}

export interface FirstConventions {
  api: FirstConventionBucket;
  module: FirstConventionBucket;
  testing: FirstConventionBucket;
  projectRules: FirstConventionBucket;
}

export interface FirstApiContract {
  interfaceType: 'http' | 'cli-command' | 'page-route' | 'job' | 'event' | 'bridge' | 'other';
  name: string;
  path?: string;
  method?: string;
  handler: string;
  request: string[];
  response: string[];
  auth: string[];
  evidence: string[];
}

export interface FirstApiContracts {
  interfaces: FirstApiContract[];
  integrationPoints: string[];
  notes: string[];
}

export interface FirstStructureModule {
  name: string;
  purpose: string;
  keyPaths: string[];
  entryPoints: string[];
  dependencies?: string[];
}

export interface FirstStructureOverview {
  topology: string[];
  modules: FirstStructureModule[];
  readingOrder: string[];
  evidence: string[];
}

export interface FirstDomainEntity {
  name: string;
  kind: 'entity' | 'value-object' | 'aggregate' | 'service' | 'state' | 'concept';
  description: string;
  invariants: string[];
  relationships: string[];
  evidence: string[];
}

export interface FirstDomainModel {
  entities: FirstDomainEntity[];
  glossary: string[];
  evidence: string[];
}

export interface FirstDatabaseTable {
  name: string;
  purpose?: string;
  fields: string[];
  relations: string[];
  evidence: string[];
}

export interface FirstDatabaseSchema {
  status: FirstRuntimeConditionalStatus;
  provider?: string;
  tables: FirstDatabaseTable[];
  risks: string[];
  evidence: string[];
}

export interface FirstCriticalFlow {
  flowId: string;
  name: string;
  entryPoints: string[];
  coreModules: string[];
  invariants: string[];
  verificationHooks: string[];
}

export type FirstCriticalFlows = FirstCriticalFlow[];

export interface FirstChangeMapEntry {
  changeType: string;
  likelyModules: string[];
  likelyCommands: string[];
  likelyConfigs: string[];
  likelyTests: string[];
  riskPoints: string[];
}

export type FirstChangeMap = FirstChangeMapEntry[];

export interface FirstEntryGuideEntry {
  taskCategory: string;
  readFirst: string[];
  thenRead: string[];
  avoidEntry: string[];
  relatedFlows: string[];
}

export type FirstEntryGuide = FirstEntryGuideEntry[];

export interface FirstRebootGuide {
  projectWhat: string;
  whereToStart: string[];
  currentCriticalAreas: string[];
  commonChangePaths: string[];
  verifyChecklist: string[];
}

export interface FirstSpecView {
  stage: 'spec';
  summary: string;
  businessCapabilities: string[];
  coreEntities: string[];
  dependencies: string[];
  warnings: string[];
}

export interface FirstDesignView {
  stage: 'design';
  summary: string;
  moduleBoundaries: string[];
  integrationPoints: string[];
  technicalConstraints: string[];
  risks: string[];
}

export interface FirstCodeView {
  stage: 'code';
  summary: string;
  entryPoints: string[];
  likelyChangeAreas: string[];
  callPathHints?: string[];
  couplingPoints?: string[];
  changeHazards: string[];
  verificationHooks: string[];
}

export interface FirstVerifyView {
  stage: 'verify';
  summary: string;
  criticalFlows?: string[];
  validationFocus?: string[];
  testFocus: string[];
  riskAreas: string[];
  recommendedChecks?: string[];
  validationHooks: string[];
  releaseBlockers: string[];
}

export interface FirstStageViews {
  spec: FirstSpecView;
  design: FirstDesignView;
  code: FirstCodeView;
  verify: FirstVerifyView;
}
