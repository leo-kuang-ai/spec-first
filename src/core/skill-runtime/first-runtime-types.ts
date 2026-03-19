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
  sourceCommit?: string;
  
  // 9 个项目级 runtime 资产
  summary: FirstRuntimeAssetIndexEntry;
  steering: FirstRuntimeAssetIndexEntry;
  conventions: FirstRuntimeAssetIndexEntry;
  criticalFlows: FirstRuntimeAssetIndexEntry;
  entryGuide: FirstRuntimeAssetIndexEntry;
  apiContracts: FirstRuntimeAssetIndexEntry;
  structureOverview: FirstRuntimeAssetIndexEntry;
  domainModel: FirstRuntimeAssetIndexEntry;
  databaseSchema: FirstRuntimeConditionalAssetIndexEntry;
  
  // 投影文档索引
  docsProjection: Record<string, FirstRuntimeAssetIndexEntry>;
  
  // 健康状态
  status: FirstRuntimeStatus;
  staleReason?: string;
}

export interface FirstRuntimeSummary {
  generatedAt: string;
  mode: 'deep';
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
  errors?: string[];
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

export interface FirstEntryGuideEntry {
  taskCategory: string;
  readFirst: string[];
  thenRead: string[];
  avoidEntry: string[];
  relatedFlows: string[];
}

export type FirstEntryGuide = FirstEntryGuideEntry[];

export interface FirstDocsIndexEntry {
  path: string;
  title: string;
  purpose: string;
  relatedRuntimeAssets: string[];
  recommendedWhen: string[];
  priority: 'primary' | 'secondary' | 'optional';
}

export interface FirstDocsIndex {
  generatedAt: string;
  mode: 'deep';
  quickStart: string[];
  entries: FirstDocsIndexEntry[];
  notes: string[];
}
