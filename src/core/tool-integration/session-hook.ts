import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { detectHostPaths } from '../../shared/host-paths.js';

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `"'"'"`)}'`;
}

function resolveSpecFirstBin(): string {
  const fromEnv = process.env.SPEC_FIRST_BIN?.trim();
  if (fromEnv) return fromEnv;

  try {
    const output = execFileSync('which', ['spec-first'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (output) return output;
  } catch {
    // ignore
  }

  return 'spec-first';
}

function isSpecFirstViewerCommand(command: unknown): boolean {
  if (typeof command !== 'string') return false;
  const normalized = command.toLowerCase();
  return normalized.includes('spec-first') && normalized.includes('viewer open');
}

export function registerSessionHooks(options?: { dryRun?: boolean }): {
  registered: string[];
  warnings: string[];
} {
  const registered: string[] = [];
  const warnings: string[] = [];
  const { claudeHomeDir } = detectHostPaths();
  const settingsPath = join(claudeHomeDir, 'settings.json');

  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch {
      warnings.push('无效 ~/.claude/settings.json，将仅覆盖 spec-first SessionStart hook');
      settings = {};
    }
  }

  if (!settings.hooks || typeof settings.hooks !== 'object') {
    settings.hooks = {} as Record<string, unknown>;
  }
  const hooks = settings.hooks as Record<string, unknown>;

  // 兼容历史写法：将 top-level SessionStart 迁移到 hooks.SessionStart
  if (Array.isArray(settings.SessionStart)) {
    const legacyEntries = settings.SessionStart as unknown[];
    const existingInHooks = Array.isArray(hooks.SessionStart) ? hooks.SessionStart as unknown[] : [];
    hooks.SessionStart = [...existingInHooks, ...legacyEntries];
    delete settings.SessionStart;
  }

  const existing = Array.isArray(hooks.SessionStart) ? hooks.SessionStart : [];
  const filtered = existing.filter((item: any) =>
    !item?.hooks?.some((h: any) =>
      isSpecFirstViewerCommand(h?.command)
    )
  );

  const specFirstBin = resolveSpecFirstBin();

  filtered.push({
    matcher: '*',
    hooks: [{
      type: 'command' as const,
      command: `${shellQuote(specFirstBin)} viewer open --print-url --background 2>/dev/null || true`,
      timeout: 15,
    }],
  });

  hooks.SessionStart = filtered;
  registered.push('SessionStart');

  if (!options?.dryRun) {
    mkdirSync(claudeHomeDir, { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }

  return { registered, warnings };
}
