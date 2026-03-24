import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IntegrationStage } from './types.js';

export interface SkillConflict {
  type: 'name-conflict' | 'stage-conflict' | 'capability-overlap' | 'tech-stack-mismatch' | 'source-invalid';
  severity: 'info' | 'warning' | 'error';
  message: string;
  relatedPaths: string[];
  recommendedAction: 'report-only' | 'rename' | 'guideline-only' | 'block';
}

export interface ConflictDetectionInput {
  projectRoot: string;
  skillName: string;
  profile: {
    name: string;
    category: string;
    primaryStage: IntegrationStage;
    relatedStages: IntegrationStage[];
    keywords: string[];
    commands: string[];
  };
}

const TECH_STACK_MISMATCH_TOKENS = new Set([
  'rust',
  'python',
  'go',
  'java',
  'php',
  'c#',
  'dotnet',
  'csharp',
  'ruby',
  'perl',
]);

function collectSkillFiles(skillsRoot: string): string[] {
  if (!existsSync(skillsRoot)) return [];
  const entries = readdirSync(skillsRoot, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillMd = join(skillsRoot, entry.name, 'SKILL.md');
    if (existsSync(skillMd)) {
      result.push(skillMd);
    }
  }
  return result;
}

function lower(text: string): string {
  return text.toLowerCase();
}

export function detectSkillIntegrationConflicts(
  input: ConflictDetectionInput
): SkillConflict[] {
  const conflicts: SkillConflict[] = [];
  const skillsRoot = join(input.projectRoot, 'skills');
  const normalizedTarget = lower(input.skillName);

  for (const skillFile of collectSkillFiles(skillsRoot)) {
    const content = readFileSync(skillFile, 'utf-8');
    const dirName = lower(skillFile.split('/').at(-2) ?? '');
    const fileContent = lower(content);

    if (dirName === normalizedTarget || fileContent.includes(`name: "${normalizedTarget}"`) || fileContent.includes(`name: '${normalizedTarget}'`)) {
      conflicts.push({
        type: 'name-conflict',
        severity: 'error',
        message: `skill name already exists: ${input.skillName}`,
        relatedPaths: [skillFile],
        recommendedAction: 'rename',
      });
    }

    const stageTokens = new Set<IntegrationStage>([
      input.profile.primaryStage,
      ...input.profile.relatedStages,
    ]);
    const overlapHit =
      [...stageTokens].some((stage) => stage !== 'none' && fileContent.includes(stage)) ||
      input.profile.keywords.some((keyword) => fileContent.includes(lower(keyword))) ||
      input.profile.commands.some((command) => fileContent.includes(lower(command)));

    if (overlapHit) {
      conflicts.push({
        type: 'capability-overlap',
        severity: 'warning',
        message: `skill overlaps with existing staged capability: ${skillFile}`,
        relatedPaths: [skillFile],
        recommendedAction: 'guideline-only',
      });
    }
  }

  if (input.profile.keywords.some((keyword) => TECH_STACK_MISMATCH_TOKENS.has(lower(keyword)))) {
    conflicts.push({
      type: 'tech-stack-mismatch',
      severity: 'warning',
      message: `profile mentions unsupported tech stack for this repo: ${input.profile.keywords.join(', ')}`,
      relatedPaths: [],
      recommendedAction: 'report-only',
    });
  }

  return conflicts;
}

