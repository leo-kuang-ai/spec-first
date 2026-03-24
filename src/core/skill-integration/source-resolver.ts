import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type {
  ExternalSkillSource,
  ExternalSkillSourceResolution,
  ResolveExternalSkillSourceInput,
} from './types.js';

function buildResolvedSource(
  requestedName: string,
  sourcePath: string,
  skillMdPath: string
): ExternalSkillSource {
  const resolvedSourcePath = resolve(sourcePath);
  return {
    requestedName,
    resolvedName: requestedName,
    sourcePath: resolvedSourcePath,
    sourceType: statSync(resolvedSourcePath).isFile() ? 'local-file' : 'local-directory',
    skillMdPath: resolve(skillMdPath),
    referencesDir: resolve(join(resolvedSourcePath, 'references')),
    templatesDir: resolve(join(resolvedSourcePath, 'templates')),
    scriptsDir: resolve(join(resolvedSourcePath, 'scripts')),
  };
}

function resolveFromCandidate(
  requestedName: string,
  candidate: string
): ExternalSkillSource | undefined {
  if (!existsSync(candidate)) return undefined;

  const stat = statSync(candidate);
  if (stat.isFile()) {
    if (!candidate.endsWith('SKILL.md')) return undefined;
    const skillDir = dirname(candidate);
    if (!existsSync(candidate)) return undefined;
    return buildResolvedSource(requestedName, skillDir, candidate);
  }

  const skillMdPath = join(candidate, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    throw new Error(`SOURCE_INVALID: missing SKILL.md at ${skillMdPath}`);
  }

  return buildResolvedSource(requestedName, candidate, skillMdPath);
}

function discoverExternalRoots(): string[] {
  const home = process.env.HOME?.trim();
  if (!home) return [];

  return [join(home, '.agents', 'skills'), join(home, '.codex', 'skills')];
}

export function resolveExternalSkillSource(
  input: ResolveExternalSkillSourceInput
): ExternalSkillSourceResolution {
  const explicitSource = input.source?.trim();

  if (explicitSource) {
    const explicitResolved = resolve(explicitSource);
    if (!existsSync(explicitResolved)) {
      if (input.reportOnly && input.allowMissingSource) {
        return {
          kind: 'missing',
          requestedName: input.skillName,
          reason: 'source-not-found',
          sourcePath: explicitResolved,
        };
      }
      throw new Error(`SOURCE_NOT_FOUND: ${input.skillName} (${explicitResolved})`);
    }

    const result = resolveFromCandidate(input.skillName, explicitResolved);
    if (result) return { kind: 'resolved', source: result };
    throw new Error(`SOURCE_INVALID: ${input.skillName} (${explicitResolved})`);
  }

  for (const root of discoverExternalRoots()) {
    const candidate = join(root, input.skillName);
    const result = resolveFromCandidate(input.skillName, candidate);
    if (result) return { kind: 'resolved', source: result };
  }

  if (input.reportOnly && input.allowMissingSource) {
    return {
      kind: 'missing',
      requestedName: input.skillName,
      reason: 'source-not-found',
    };
  }

  throw new Error(`SOURCE_NOT_FOUND: ${input.skillName}`);
}
