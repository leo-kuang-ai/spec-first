import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

function hasSkillChildren(dir: string): boolean {
  if (!existsSync(dir)) return false;

  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (existsSync(join(dir, entry.name, 'SKILL.md'))) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

function findSkillRootWithin(dir: string): string | undefined {
  const resolved = resolve(dir);
  if (hasSkillChildren(resolved)) return resolved;

  try {
    for (const entry of readdirSync(resolved, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = join(resolved, entry.name);
      if (hasSkillChildren(candidate)) {
        return candidate;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function resolveSkillRootWithin(dir: string): string | undefined {
  return findSkillRootWithin(dir);
}

export function resolveSkillRootUpwards(dir: string): string | undefined {
  let currentDir = resolve(dir);

  while (true) {
    const found = findSkillRootWithin(currentDir);
    if (found) return found;

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) return undefined;
    currentDir = parentDir;
  }
}
