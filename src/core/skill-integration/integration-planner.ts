import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type {
  ExternalSkillProfile,
  ExternalSkillSourceResolution,
  IntegrationCategory,
  IntegrationStage,
} from './types.js';
import { detectSkillIntegrationConflicts, type SkillConflict } from './conflict-detector.js';

export interface IntegrationTargetConfig {
  category: IntegrationCategory;
  primaryStage: IntegrationStage;
  relatedStages: IntegrationStage[];
  guidelineDir: string;
  examplesDir: string;
  draftSkillDir: string;
  allowDraftSkill: boolean;
}

export interface PlannedFileWrite {
  path: string;
  kind: 'report' | 'guideline' | 'example' | 'draft-skill' | 'draft-reference';
  overwrite: boolean;
  content: string;
}

export interface IntegrationPlan {
  requestedName: string;
  finalName: string;
  mode: 'report-only';
  profile: ExternalSkillProfile;
  targetConfig: IntegrationTargetConfig;
  conflicts: SkillConflict[];
  fileWrites: PlannedFileWrite[];
  reviewFocus: string[];
}

export interface BuildIntegrationPlanInput {
  projectRoot: string;
  skillName: string;
  source: ExternalSkillSourceResolution;
  profile?: Pick<
    ExternalSkillProfile,
    | 'name'
    | 'description'
    | 'sourcePath'
    | 'commands'
    | 'frontmatter'
    | 'concepts'
    | 'practices'
    | 'caveats'
    | 'examples'
    | 'tools'
    | 'keywords'
    | 'primaryStage'
    | 'relatedStages'
    | 'parserWarnings'
  > & {
    category?: IntegrationCategory;
    suggestedCategory?: IntegrationCategory;
  };
  target: 'guideline' | 'draft' | 'both';
  reportOnly: boolean;
  allowMissingSource: boolean;
  rename?: string;
}

interface SkillTargetYaml {
  categories: Record<
    string,
    {
      primary_stage: IntegrationStage;
      related_stages: IntegrationStage[];
      guideline_dir: string;
      examples_dir: string;
      draft_skill_dir: string;
      allow_draft_skill: boolean;
    }
  >;
}

function loadTargetsYaml(projectRoot: string): SkillTargetYaml | undefined {
  const candidate = join(projectRoot, 'templates', 'skill-integration', 'targets.yaml');
  if (!existsSync(candidate)) return undefined;
  const parsed = yaml.load(readFileSync(candidate, 'utf-8')) as SkillTargetYaml;
  return parsed;
}

function resolveTargetConfig(
  projectRoot: string,
  category: IntegrationCategory,
  profile: ExternalSkillProfile
): IntegrationTargetConfig {
  const yamlConfig = loadTargetsYaml(projectRoot);
  const raw = yamlConfig?.categories?.[category];
  if (raw) {
    return {
      category,
      primaryStage: raw.primary_stage ?? profile.primaryStage,
      relatedStages: raw.related_stages ?? profile.relatedStages,
      guidelineDir: raw.guideline_dir,
      examplesDir: raw.examples_dir,
      draftSkillDir: raw.draft_skill_dir,
      allowDraftSkill: raw.allow_draft_skill,
    };
  }

  return {
    category,
    primaryStage: profile.primaryStage,
    relatedStages: profile.relatedStages,
    guidelineDir: `docs/guides/${category}`,
    examplesDir: 'docs/examples/skills',
    draftSkillDir: 'skills-draft',
    allowDraftSkill: category !== 'documentation' && category !== 'workflow' && category !== 'generic',
  };
}

export function buildIntegrationPlan(input: BuildIntegrationPlanInput): IntegrationPlan {
  if (input.source.kind === 'missing') {
    if (!input.allowMissingSource) {
      throw new Error(`SOURCE_NOT_FOUND: ${input.skillName}`);
    }

    const placeholderProfile: ExternalSkillProfile = {
      name: input.skillName,
      sourcePath: input.source.sourcePath ?? '',
      commands: [],
      frontmatter: {},
      concepts: [],
      practices: [],
      caveats: [],
      examples: [],
      tools: [],
      keywords: [],
      suggestedCategory: 'generic',
      primaryStage: 'none',
      relatedStages: [],
      parserWarnings: ['source missing'],
    };

    const targetConfig = resolveTargetConfig(input.projectRoot, 'generic', placeholderProfile);
    return {
      requestedName: input.skillName,
      finalName: input.rename ?? input.skillName,
      mode: 'report-only',
      profile: placeholderProfile,
      targetConfig,
      conflicts: [],
      fileWrites: [
        {
          path: join('docs', 'reports', 'skill-integrations', `${new Date().toISOString().slice(0, 10)}-${input.rename ?? input.skillName}.md`),
          kind: 'report',
          overwrite: false,
          content: '',
        },
      ],
      reviewFocus: ['review missing source handling'],
    };
  }

  if (!input.profile) {
    throw new Error(`SOURCE_INVALID: ${input.skillName}`);
  }

  const profile: ExternalSkillProfile = {
    ...input.profile,
    suggestedCategory: input.profile.suggestedCategory ?? input.profile.category ?? 'generic',
  };

  const conflicts = detectSkillIntegrationConflicts({
    projectRoot: input.projectRoot,
    skillName: input.rename ?? input.skillName,
    profile: {
      name: profile.name,
      category: profile.suggestedCategory,
      primaryStage: profile.primaryStage,
      relatedStages: profile.relatedStages,
      keywords: profile.keywords,
      commands: profile.commands,
    },
  });

  const nameConflict = conflicts.find((conflict) => conflict.type === 'name-conflict');
  if (nameConflict && !input.rename) {
    throw new Error(`INTEGRATE_SKILL_CONFLICT: ${nameConflict.message}`);
  }

  const category = profile.suggestedCategory;
  const targetConfig = resolveTargetConfig(input.projectRoot, category, profile);
  const finalName = input.rename ?? input.skillName;

    return {
      requestedName: input.skillName,
      finalName,
      mode: 'report-only',
      profile,
      targetConfig,
      conflicts,
      fileWrites: [
      {
        path: join('docs', 'reports', 'skill-integrations', `${new Date().toISOString().slice(0, 10)}-${finalName}.md`),
        kind: 'report',
        overwrite: false,
        content: '',
      },
    ],
    reviewFocus: [
      'check category mapping',
      'check conflict handling',
      'check whether the source should be promoted',
    ],
  };
}
