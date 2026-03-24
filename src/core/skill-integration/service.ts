import {
  resolveExternalSkillSource,
} from './source-resolver.js';
import { parseExternalSkill } from './external-skill-parser.js';
import { mapSkillCategory } from './category-mapper.js';
import { buildIntegrationPlan, type IntegrationPlan } from './integration-planner.js';
import { renderIntegrationReport } from './generators/report-generator.js';
import { applyIntegrationPlan } from './fs-writer.js';
import { formatIntegrationResult } from './result-formatter.js';
import type { IntegrationCategory, ExternalSkillSourceResolution } from './types.js';

export interface IntegrateSkillCliOptions {
  skillName: string;
  source?: string;
  target?: 'guideline' | 'draft' | 'both';
  category?: IntegrationCategory;
  reportOnly: boolean;
  allowMissingSource: boolean;
  dryRun: boolean;
  rename?: string;
}

export interface IntegrateSkillRunResult {
  exitCode: number;
  plan?: IntegrationPlan;
  sourceResolution?: ExternalSkillSourceResolution;
  output?: string;
  reportPath?: string;
}

export function runIntegrateSkill(
  options: IntegrateSkillCliOptions,
  projectRoot = process.cwd()
): IntegrateSkillRunResult {
  const sourceResolution = resolveExternalSkillSource({
    skillName: options.skillName,
    source: options.source,
    reportOnly: options.reportOnly,
    allowMissingSource: options.allowMissingSource,
  });

  const profile =
    sourceResolution.kind === 'resolved'
      ? parseExternalSkill(sourceResolution.source)
      : undefined;

  const mapped = profile
    ? mapSkillCategory({
        name: profile.name,
        commands: profile.commands,
        keywords: profile.keywords,
        descriptions: [profile.description ?? ''],
      })
    : undefined;

  const plan = buildIntegrationPlan({
    projectRoot,
    skillName: options.skillName,
    source: sourceResolution,
    profile: profile
      ? {
          ...profile,
          suggestedCategory: options.category ?? mapped?.category ?? profile.suggestedCategory,
          primaryStage: mapped?.primaryStage ?? profile.primaryStage,
          relatedStages: mapped?.relatedStages ?? profile.relatedStages,
        }
      : undefined,
    target: options.target ?? 'guideline',
    reportOnly: options.reportOnly,
    allowMissingSource: options.allowMissingSource,
    rename: options.rename,
  });

  const report = renderIntegrationReport(plan, projectRoot);
  plan.fileWrites[0].content = report;
  const results = applyIntegrationPlan(plan, { dryRun: options.dryRun, projectRoot });
  const reportResult = results.find((result) => result.kind === 'report');
  const reportPath = reportResult?.path;

  return {
    exitCode: 0,
    plan,
    sourceResolution,
    output: [
      formatIntegrationResult(plan),
      reportPath ? `Report: ${reportPath}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
    reportPath,
  };
}
