import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { detectHostPaths } from '../../shared/host-paths.js';
import {
  getSessionStartManagedMarker,
  isManagedSessionStartEntry,
} from './session-hook-managed.js';

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

function shellQuote(value: string): string {
  if (value.length === 0) return "''";
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function buildSessionStartCommand(specFirstBin: string): string {
  const fallbackBin = shellQuote(specFirstBin);
  const managedMarker = getSessionStartManagedMarker();
  // Session Hook 决策树（P1-15 + Superpowers P0-1）：
  // 1) 输出技能路由表 + 1% 规则
  // 2) 若检测到 .spec-first/current，根据 catchup.trigger 执行 auto|prompt|off（P1-07）
  // 3) 再启动 viewer，失败静默，不阻断会话
  return [
    `${managedMarker} SPEC_FIRST_BIN_FALLBACK=${fallbackBin} sh -c '`,
    // 技能路由表 + 1% 规则（Superpowers P0-1）
    'echo "[spec-first] 技能路由表: init→spec→design→task→code→code-review→verify→catchup"; ',
    'echo "[spec-first] 1%规则: 有1%相关性也先走skill检查，不要直接执行"; ',
    // 自动恢复策略（默认 prompt）
    'TRIGGER=prompt; ',
    'CFG_FILE=""; ',
    'if [ -f .spec-first/meta/config.yaml ]; then CFG_FILE=.spec-first/meta/config.yaml; fi; ',
    'if [ -n "$CFG_FILE" ]; then ',
    '  CFG_TRIGGER=$(awk "BEGIN{inCatchup=0} /^[[:space:]]*catchup:[[:space:]]*$/ {inCatchup=1; next} inCatchup && /^[^[:space:]]/ {inCatchup=0} inCatchup && /^[[:space:]]*trigger:[[:space:]]*/ {sub(/^[[:space:]]*trigger:[[:space:]]*/, "", $0); gsub(/[[\\][:space:]]/, "", $0); print $0; exit}" "$CFG_FILE" 2>/dev/null || true); ',
    '  case "$CFG_TRIGGER" in auto|prompt|off) TRIGGER=$CFG_TRIGGER ;; esac; ',
    'fi; ',
    'if [ -f .spec-first/current ]; then ',
    '  FEAT=$(head -1 .spec-first/current 2>/dev/null || true); ',
    '  if [ -n "$FEAT" ]; then ',
    '    if [ "$TRIGGER" = "auto" ]; then ',
    '      echo "[spec-first] 检测到可恢复会话，自动执行: spec-first ai catchup \\"$FEAT\\""; ',
    '      SPEC_FIRST_BIN_RESOLVED=${SPEC_FIRST_BIN:-$SPEC_FIRST_BIN_FALLBACK}; ',
    '      "$SPEC_FIRST_BIN_RESOLVED" ai catchup "$FEAT" 2>/dev/null || true; ',
    '    elif [ "$TRIGGER" = "prompt" ]; then ',
    '      echo "[spec-first] 检测到可恢复会话，建议执行: spec-first ai catchup \\"$FEAT\\""; ',
    '    fi; ',
    '  fi; ',
    'fi; ',
    // viewer 启动（静默降级）
    'SPEC_FIRST_BIN_RESOLVED=${SPEC_FIRST_BIN:-$SPEC_FIRST_BIN_FALLBACK}; ',
    '"$SPEC_FIRST_BIN_RESOLVED" viewer open --print-url --background 2>/dev/null || true',
    "'",
  ].join('');
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
  const filtered = existing.filter((item: unknown) => !isManagedSessionStartEntry(item));

  const specFirstBin = resolveSpecFirstBin();

  filtered.push({
    matcher: '*',
    hooks: [{
      type: 'command' as const,
      command: buildSessionStartCommand(specFirstBin),
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
