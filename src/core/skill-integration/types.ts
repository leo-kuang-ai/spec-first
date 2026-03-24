export type IntegrationCategory =
  | 'frontend'
  | 'backend'
  | 'testing'
  | 'documentation'
  | 'workflow'
  | 'generic';

export type IntegrationStage =
  | 'first'
  | 'onboarding'
  | 'spec'
  | 'design'
  | 'research'
  | 'task'
  | 'code'
  | 'review'
  | 'verify'
  | 'orchestrate'
  | 'status'
  | 'doctor'
  | 'sync'
  | 'feature'
  | 'none';

export interface ExternalSkillSource {
  requestedName: string;
  resolvedName: string;
  sourcePath: string;
  sourceType: 'local-directory' | 'local-file';
  skillMdPath: string;
  referencesDir?: string;
  templatesDir?: string;
  scriptsDir?: string;
}

export interface ResolvedExternalSkillSource {
  kind: 'resolved';
  source: ExternalSkillSource;
}

export interface MissingExternalSkillSource {
  kind: 'missing';
  requestedName: string;
  reason: 'source-not-found';
  sourcePath?: string;
}

export type ExternalSkillSourceResolution =
  | ResolvedExternalSkillSource
  | MissingExternalSkillSource;

export interface ResolveExternalSkillSourceInput {
  skillName: string;
  source?: string;
  reportOnly: boolean;
  allowMissingSource: boolean;
}

export interface ExternalExampleFile {
  path: string;
  kind: 'code' | 'config' | 'doc' | 'template' | 'unknown';
  language?: string;
}

export interface ExternalSkillProfile {
  name: string;
  description?: string;
  sourcePath: string;
  commands: string[];
  frontmatter: Record<string, string>;
  concepts: string[];
  practices: string[];
  caveats: string[];
  examples: ExternalExampleFile[];
  tools: string[];
  keywords: string[];
  suggestedCategory: IntegrationCategory;
  primaryStage: IntegrationStage;
  relatedStages: IntegrationStage[];
  parserWarnings: string[];
}
