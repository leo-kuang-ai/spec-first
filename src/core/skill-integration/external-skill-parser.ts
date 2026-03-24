import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type {
  ExternalExampleFile,
  ExternalSkillProfile,
  ExternalSkillSource,
  IntegrationCategory,
  IntegrationStage,
} from './types.js';

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'string') {
      result[key] = entry;
    } else if (entry != null) {
      result[key] = String(entry);
    }
  }
  return result;
}

function extractFrontmatter(content: string): {
  data: Record<string, string>;
  body: string;
  warning?: string;
} {
  if (!content.startsWith('---')) {
    return { data: {}, body: content };
  }

  const end = content.indexOf('\n---', 3);
  if (end < 0) {
    return { data: {}, body: content, warning: 'missing frontmatter terminator' };
  }

  const raw = content.slice(3, end).trim();
  const body = content.slice(end + 4).replace(/^\s+/, '');

  try {
    const parsed = yaml.load(raw) as unknown;
    return { data: toStringRecord(parsed), body };
  } catch {
    return { data: {}, body, warning: 'invalid frontmatter' };
  }
}

function extractCommands(body: string): string[] {
  const matches = body.match(/`([^`]*\/spec-first:[^`]+)`/g) ?? [];
  const commands = matches.map((match) => match.slice(1, -1).replace(/\s+\[.*\]$/, '').trim());
  return [...new Set(commands)];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+._-]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function detectCategory(keywords: string[]): {
  category: IntegrationCategory;
  primaryStage: IntegrationStage;
  relatedStages: IntegrationStage[];
} {
  const score = {
    frontend: 0,
    backend: 0,
    testing: 0,
    documentation: 0,
    workflow: 0,
  };

  for (const keyword of keywords) {
    if (['frontend', 'ui', 'ux', 'layout', 'style', 'component', 'components', 'css'].includes(keyword)) {
      score.frontend += 2;
    }
    if (['backend', 'api', 'server', 'mcp', 'endpoint', 'tool', 'tools', 'db'].includes(keyword)) {
      score.backend += 2;
    }
    if (['test', 'testing', 'e2e', 'playwright', 'assert', 'automation'].includes(keyword)) {
      score.testing += 2;
    }
    if (['doc', 'docs', 'markdown', 'writing', 'authoring'].includes(keyword)) {
      score.documentation += 2;
    }
    if (['workflow', 'plan', 'review', 'orchestrate', 'status', 'sync'].includes(keyword)) {
      score.workflow += 2;
    }
  }

  const entries = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const [winner, topScore] = entries[0];
  const [, runnerUpScore] = entries[1];

  if (topScore === 0 || (topScore - runnerUpScore <= 1 && runnerUpScore > 0)) {
    return { category: 'generic', primaryStage: 'none', relatedStages: [] };
  }

  switch (winner) {
    case 'frontend':
      return { category: 'frontend', primaryStage: 'design', relatedStages: ['code'] };
    case 'backend':
      return { category: 'backend', primaryStage: 'design', relatedStages: ['code'] };
    case 'testing':
      return { category: 'testing', primaryStage: 'verify', relatedStages: ['review', 'code'] };
    case 'documentation':
      return { category: 'documentation', primaryStage: 'spec', relatedStages: ['design'] };
    case 'workflow':
      return { category: 'workflow', primaryStage: 'orchestrate', relatedStages: ['feature', 'sync', 'status'] };
    default:
      return { category: 'generic', primaryStage: 'none', relatedStages: [] };
  }
}

function buildExamples(source: ExternalSkillSource, body: string): ExternalExampleFile[] {
  const examples: ExternalExampleFile[] = [];
  for (const entry of ['examples', 'templates', 'scripts']) {
    const dir = join(source.sourcePath, entry);
    if (!dir) continue;
  }

  if (body.includes('```')) {
    examples.push({ path: join(source.sourcePath, 'SKILL.md'), kind: 'doc' });
  }

  return examples;
}

export function parseExternalSkill(source: ExternalSkillSource): ExternalSkillProfile {
  const content = readFileSync(source.skillMdPath, 'utf-8');
  const fm = extractFrontmatter(content);
  const body = fm.body;
  const frontmatter = fm.data;
  const commands = extractCommands(body);

  const keywords = tokenize(
    [
      source.requestedName,
      frontmatter.name ?? '',
      frontmatter.description ?? '',
      body,
    ].join(' ')
  );

  const { category, primaryStage, relatedStages } = detectCategory(keywords);
  const parserWarnings: string[] = [];
  if (fm.warning) parserWarnings.push(fm.warning);
  if (!frontmatter.name) parserWarnings.push('missing name frontmatter');
  if (commands.length === 0) parserWarnings.push('missing command declaration');

  return {
    name: frontmatter.name ?? source.requestedName,
    description: frontmatter.description,
    sourcePath: source.sourcePath,
    commands,
    frontmatter,
    concepts: [],
    practices: [],
    caveats: [],
    examples: buildExamples(source, body),
    tools: [],
    keywords: [...new Set(keywords)],
    suggestedCategory: category,
    primaryStage,
    relatedStages,
    parserWarnings,
  };
}
