import type {
  ExternalSkillProfile,
  IntegrationCategory,
  IntegrationStage,
} from './types.js';

export interface SkillCategoryMapInput {
  name: string;
  commands: string[];
  keywords: string[];
  descriptions?: string[];
}

export interface SkillCategoryMapResult {
  category: IntegrationCategory;
  primaryStage: IntegrationStage;
  relatedStages: IntegrationStage[];
  warnings: string[];
}

const CATEGORY_KEYWORDS: Record<IntegrationCategory, string[]> = {
  frontend: ['frontend', 'ui', 'ux', 'layout', 'style', 'styles', 'component', 'components', 'css'],
  backend: ['backend', 'api', 'server', 'mcp', 'endpoint', 'tool', 'tools', 'db'],
  testing: ['test', 'testing', 'e2e', 'playwright', 'assert', 'automation'],
  documentation: ['doc', 'docs', 'markdown', 'writing', 'authoring'],
  workflow: ['workflow', 'plan', 'review', 'orchestrate', 'status', 'sync'],
  generic: [],
};

function normalizeTokens(input: string[]): string[] {
  return input.map((item) => item.toLowerCase().trim()).filter(Boolean);
}

function scoreCategory(tokens: string[], category: IntegrationCategory): number {
  if (category === 'generic') return 0;
  const keywords = CATEGORY_KEYWORDS[category];
  let score = 0;
  for (const token of tokens) {
    if (keywords.some((keyword) => token.includes(keyword))) {
      score += 2;
    }
  }
  return score;
}

function decideStage(category: IntegrationCategory): {
  primaryStage: IntegrationStage;
  relatedStages: IntegrationStage[];
} {
  switch (category) {
    case 'frontend':
      return { primaryStage: 'design', relatedStages: ['code'] };
    case 'backend':
      return { primaryStage: 'design', relatedStages: ['code'] };
    case 'testing':
      return { primaryStage: 'verify', relatedStages: ['review', 'code'] };
    case 'documentation':
      return { primaryStage: 'spec', relatedStages: ['design'] };
    case 'workflow':
      return { primaryStage: 'orchestrate', relatedStages: ['feature', 'sync', 'status'] };
    default:
      return { primaryStage: 'none', relatedStages: [] };
  }
}

export function mapSkillCategory(input: SkillCategoryMapInput): SkillCategoryMapResult {
  const tokens = normalizeTokens([
    input.name,
    ...input.commands,
    ...input.keywords,
    ...(input.descriptions ?? []),
  ]);

  const scored = (Object.keys(CATEGORY_KEYWORDS) as IntegrationCategory[])
    .map((category) => ({ category, score: scoreCategory(tokens, category) }))
    .sort((left, right) => right.score - left.score);

  const winner = scored[0];
  const runnerUp = scored[1];
  const warnings: string[] = [];

  if (!winner || winner.score === 0) {
    return { category: 'generic', ...decideStage('generic'), warnings };
  }

  if (runnerUp && runnerUp.score > 0 && winner.score - runnerUp.score <= 2) {
    warnings.push(
      `ambiguous category signals between ${winner.category} and ${runnerUp.category}`
    );
  }

  return {
    category: winner.category,
    ...decideStage(winner.category),
    warnings,
  };
}

export function mapProfileCategory(
  profile: Pick<ExternalSkillProfile, 'name' | 'keywords' | 'commands'>
): SkillCategoryMapResult {
  return mapSkillCategory({
    name: profile.name,
    keywords: profile.keywords,
    commands: profile.commands,
    descriptions: [],
  });
}
