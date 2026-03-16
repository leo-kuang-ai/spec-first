import { ExitCode } from '../../shared/types.js';
import { loadSkill, resolveSkillPath } from '../../core/skill-runtime/dispatcher.js';

interface RenderOptions {
  featureId?: string;
  input?: string;
}

function printUsage(): void {
  console.error('用法：spec-first skill render <skill-name> [--feature <featureId>] [--input <rawUserInput>]');
}

const FEATURE_ID_RE = /\bFSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}\b/i;

function inferFeatureIdFromInput(input?: string): string | undefined {
  if (!input) return undefined;
  const match = input.match(FEATURE_ID_RE);
  return match?.[0]?.toUpperCase();
}

function parseRenderArgs(args: string[]): { skillName?: string; options: RenderOptions } | null {
  const options: RenderOptions = {};
  let skillName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--feature') {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        return null;
      }
      options.featureId = value;
      i++;
      continue;
    }

    if (arg.startsWith('--feature=')) {
      const value = arg.slice('--feature='.length);
      if (!value) return null;
      options.featureId = value;
      continue;
    }

    if (arg === '--input') {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        return null;
      }
      options.input = value || undefined;
      i++;
      continue;
    }

    if (arg.startsWith('--input=')) {
      const value = arg.slice('--input='.length);
      options.input = value || undefined;
      continue;
    }

    if (arg.startsWith('--')) {
      return null;
    }

    if (!skillName) {
      skillName = arg;
      continue;
    }

    return null;
  }

  return { skillName, options };
}

export function handleSkill(args: string[]): number {
  const subcommand = args[0];
  if (subcommand !== 'render') {
    printUsage();
    return ExitCode.VALIDATION_ERROR;
  }

  const parsed = parseRenderArgs(args.slice(1));
  if (!parsed?.skillName) {
    printUsage();
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();
  const skillPath = resolveSkillPath(parsed.skillName, projectRoot);
  if (!skillPath) {
    console.error(`SKILL_NOT_FOUND: ${parsed.skillName}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const rendered = loadSkill(skillPath, {
    projectRoot,
    featureId: parsed.options.featureId ?? inferFeatureIdFromInput(parsed.options.input),
  });
  console.log(rendered);
  return ExitCode.SUCCESS;
}
