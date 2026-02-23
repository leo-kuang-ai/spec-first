import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { detectHostPaths } from '../../shared/host-paths.js';

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

  // Filter existing spec-first viewer entries from SessionStart
  const existing = Array.isArray(settings.SessionStart) ? settings.SessionStart : [];
  const filtered = existing.filter((item: any) =>
    !item?.hooks?.some((h: any) => typeof h.command === 'string' && h.command.includes('spec-first viewer'))
  );

  filtered.push({
    matcher: '*',
    hooks: [{
      type: 'command' as const,
      command: 'spec-first viewer open --print-url --background 2>/dev/null || true',
      timeout: 10,
    }],
  });

  settings.SessionStart = filtered;
  registered.push('SessionStart');

  if (!options?.dryRun) {
    mkdirSync(claudeHomeDir, { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }

  return { registered, warnings };
}
