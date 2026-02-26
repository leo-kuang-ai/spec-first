/**
 * AI Runtime Hook Registration & Execution
 * PreToolUse / PostToolUse / Stop 三个 Hook
 */
import { join } from 'node:path';
import { appendFileSync, chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { exists } from '../../shared/fs-utils.js';

export type AIHookType = 'PreToolUse' | 'PostToolUse' | 'Stop';

export interface AIHookConfig {
  type: AIHookType;
  matcher?: string;
  command: string;
}

export interface AIHookResult {
  type: AIHookType;
  success: boolean;
  message: string;
  softBlock?: boolean;
}

const TASK_CONTEXT_SCRIPT = '.spec-first/hooks/task-context.sh';
const STOP_GUARD_SCRIPT = '.spec-first/hooks/stop-guard.sh';
const PROGRESS_SYNC_SCRIPT = '.spec-first/hooks/progress-sync.sh';
const MANAGED_HOOK_COMMAND_MARKERS = [
  'npx spec-first gate check',
  'npx spec-first matrix check',
  'npx spec-first ai stats',
  `sh ${TASK_CONTEXT_SCRIPT}`,
  `sh ${STOP_GUARD_SCRIPT}`,
  `sh ${PROGRESS_SYNC_SCRIPT}`,
] as const;

const TASK_CONTEXT_SCRIPT_CONTENT = String.raw`#!/usr/bin/env sh
set -eu

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
[ -n "$FEAT" ] && [ -f "$FILE" ] || exit 0

echo "=== TASK 上下文刷新 ==="
awk -F'|' '
  BEGIN { found=0 }
  /^\|/ {
    n=0; taskid=""; title=""; last=""
    for (i=1; i<=NF; i++) {
      c=$i
      gsub(/^[ \t]+|[ \t]+$/, "", c)
      if (c != "") {
        n++
        if (c ~ /^TASK-/ && taskid == "") taskid=c
        if (n==1 || n==2) { if (taskid != "" && title == "") { title=c } }
        last=c
      }
    }
    if (taskid == "") next
    if (title == taskid) title=""
    s=tolower(last)
    if (s=="in_progress" || s=="in progress") {
      printf("Current TASK: %s | %s | %s\n", taskid, title, last)
      found=1
    }
  }
  END {
    if (!found) print "Current TASK: (no in_progress task found)"
  }
' "$FILE"
`;

const STOP_GUARD_SCRIPT_CONTENT = String.raw`#!/usr/bin/env sh
set -eu

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
if [ -z "$FEAT" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

PENDING_IDS="$(
  awk -F'|' '
    /^\|/ {
      taskid=""; last=""
      for (i=1; i<=NF; i++) {
        c=$i
        gsub(/^[ \t]+|[ \t]+$/, "", c)
        if (c != "") {
          if (c ~ /^TASK-/ && taskid == "") taskid=c
          last=c
        }
      }
      if (taskid == "") next
      s=tolower(last)
      if (s != "complete" && s != "done" && s != "verified") print taskid
    }
  ' "$FILE"
)"

if [ -n "$PENDING_IDS" ]; then
  echo "⚠️ 仍有未完成 TASK：" >&2
  echo "$PENDING_IDS" >&2
  exit 2
fi
`;

// Planning-with-Files P1-2: PostToolUse 进度同步提醒脚本
const PROGRESS_SYNC_SCRIPT_CONTENT = String.raw`#!/usr/bin/env sh
set -eu

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
[ -n "$FEAT" ] && [ -f "$FILE" ] || exit 0

echo "=== 进度同步提醒 ==="
echo "文件已修改。如果此次修改完成了一个 TASK 或 AC，请检查是否需要更新 task_plan.md 中的完成状态。"
echo "当前 in_progress TASK:"
awk -F'|' '
  /^\|/ && !/---/ {
    taskid=""; title=""; status=""
    for (i=1; i<=NF; i++) {
      c=$i; gsub(/^[ \t]+|[ \t]+$/, "", c)
      if (c ~ /^TASK-/ && taskid == "") { taskid=c; next }
      if (c ~ /in_progress/i) status=c
      if (title=="" && c!~/^TASK-/ && c!~/status/i && c!="") title=c
    }
    if (taskid!="") {
      printf("  - %s | %s | %s\n", taskid, title, status)
      exit
    }
  }
' "$FILE" || echo "  (无 in_progress TASK)"
`;

function wrapSoftHook(command: string, hookName: string): string {
  return `sh -c '${command} || echo "spec-first: ${hookName} hook 执行失败（已降级）" >&2'`;
}

/** 生成 AI Runtime Hook 配置（用于写入 .claude/settings.json） */
export function generateAIHookConfigs(_projectRoot: string): AIHookConfig[] {
  const bin = 'npx spec-first';

  return [
    {
      type: 'PreToolUse',
      matcher: 'write|edit|create',
      command: wrapSoftHook(`sh ${TASK_CONTEXT_SCRIPT}`, 'task-context'),
    },
    {
      type: 'PreToolUse',
      matcher: 'write|edit|create',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} gate check "$FEAT" || echo "spec-first: 跳过 gate 检查（无当前 feature）"'`,
    },
    {
      type: 'PostToolUse',
      matcher: 'write|edit|create',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); if [ -n "$FEAT" ]; then ${bin} matrix check "$FEAT" || echo "spec-first: matrix check 执行失败（已降级）" >&2; else echo "spec-first: 跳过 matrix 检查（无当前 feature）"; fi'`,
    },
    {
      type: 'PostToolUse',
      matcher: 'write|edit|create',
      command: wrapSoftHook(`sh ${PROGRESS_SYNC_SCRIPT}`, 'progress-sync'),
    },
    {
      type: 'Stop',
      command: `sh -c 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && ${bin} ai stats "$FEAT" >/dev/null || true'`,
    },
    {
      type: 'Stop',
      command: `sh ${STOP_GUARD_SCRIPT}`,
    },
  ];
}

function groupHookConfigs(configs: AIHookConfig[]): Map<AIHookType, AIHookConfig[]> {
  const grouped = new Map<AIHookType, AIHookConfig[]>();
  for (const config of configs) {
    const list = grouped.get(config.type) ?? [];
    list.push(config);
    grouped.set(config.type, list);
  }
  return grouped;
}

function buildHookEntry(config: AIHookConfig): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    hooks: [{ type: 'command', command: config.command }],
  };
  if (config.matcher) entry.matcher = config.matcher;
  return entry;
}

function isManagedHookEntry(item: unknown): boolean {
  const entry = item as Record<string, unknown> | undefined;
  const hooks = entry?.hooks;
  if (!Array.isArray(hooks)) return false;
  return hooks.some((hook: Record<string, unknown>) =>
    typeof hook.command === 'string'
    && MANAGED_HOOK_COMMAND_MARKERS.some((marker) => (hook.command as string).includes(marker)));
}

function ensureManagedHookScripts(projectRoot: string, dryRun: boolean): void {
  if (dryRun) return;

  const scriptSpecs = [
    {
      path: join(projectRoot, TASK_CONTEXT_SCRIPT),
      content: TASK_CONTEXT_SCRIPT_CONTENT,
    },
    {
      path: join(projectRoot, STOP_GUARD_SCRIPT),
      content: STOP_GUARD_SCRIPT_CONTENT,
    },
    {
      path: join(projectRoot, PROGRESS_SYNC_SCRIPT),
      content: PROGRESS_SYNC_SCRIPT_CONTENT,
    },
  ];

  mkdirSync(join(projectRoot, '.spec-first', 'hooks'), { recursive: true });
  for (const script of scriptSpecs) {
    writeFileSync(script.path, `${script.content.trimEnd()}\n`, 'utf-8');
    chmodSync(script.path, 0o755);
  }
}

/** 注册 AI Hook 到宿主环境配置 */
export function registerAIHooks(projectRoot: string, options?: { dryRun?: boolean }): { registered: string[]; warnings: string[] } {
  const configs = generateAIHookConfigs(projectRoot);
  const groupedConfigs = groupHookConfigs(configs);
  const registered: string[] = [];
  const warnings: string[] = [];

  try {
    ensureManagedHookScripts(projectRoot, Boolean(options?.dryRun));
  } catch (error) {
    warnings.push(`写入托管 Hook 脚本失败：${(error as Error).message}`);
  }

  // 检查宿主环境是否支持 AI Hook
  const claudeDir = join(projectRoot, '.claude');
  if (!exists(claudeDir)) {
    warnings.push('未找到 .claude/ 目录 —— AI Hooks 需要 Claude Code 环境');
    warnings.push('已降级：Gate 校验回退为 Layer B CLI 命令');
    return { registered, warnings };
  }

  const settingsPath = join(claudeDir, 'settings.json');
  let settings: Record<string, unknown> = {};
  if (exists(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      warnings.push('检测到无效 .claude/settings.json —— 将仅覆盖 spec-first hooks');
      settings = {};
    }
  }

  // Claude Code requires hooks nested under "hooks" key: {"hooks":{"PreToolUse":[...]}}
  if (!settings.hooks || typeof settings.hooks !== 'object') {
    settings.hooks = {} as Record<string, unknown>;
  }
  const hooksObj = settings.hooks as Record<string, unknown>;

  for (const [hookType, hookConfigs] of groupedConfigs) {
    // Migrate legacy top-level entries into hooks wrapper
    if (Array.isArray(settings[hookType])) {
      const legacy = settings[hookType] as unknown[];
      const existingInHooks = Array.isArray(hooksObj[hookType]) ? hooksObj[hookType] as unknown[] : [];
      hooksObj[hookType] = [...existingInHooks, ...legacy];
      delete settings[hookType];
    }

    const existing = Array.isArray(hooksObj[hookType]) ? hooksObj[hookType] as unknown[] : [];
    const filtered = existing.filter((item: unknown) => !isManagedHookEntry(item));
    hooksObj[hookType] = [...filtered, ...hookConfigs.map((config) => buildHookEntry(config))];
    registered.push(hookType);
  }

  if (!options?.dryRun) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }

  return { registered, warnings };
}

/** 模拟 PreToolUse Hook 执行：检查 Gate 条件 */
export function executePreToolUse(
  featureId: string,
  projectRoot: string,
): AIHookResult {
  // 简化实现：检查 stage-state 是否存在
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) {
    return {
      type: 'PreToolUse',
      success: false,
      message: '未找到 stage-state.json —— 请先初始化 Feature',
      softBlock: true,
    };
  }

  return {
    type: 'PreToolUse',
    success: true,
    message: 'Gate 预检查通过',
  };
}

/** 模拟 Stop Hook 执行：追加 findings.md 会话摘要 */
export function executeStopHook(
  featureId: string,
  projectRoot: string,
  summary: string,
): AIHookResult {
  const findingsPath = join(projectRoot, 'specs', featureId, 'findings.md');
  const timestamp = new Date().toISOString();
  const entry = `\n- [${timestamp}] Session summary: ${summary}\n`;

  try {
    appendFileSync(findingsPath, entry);
    return { type: 'Stop', success: true, message: 'findings.md 已更新' };
  } catch {
    return { type: 'Stop', success: false, message: '更新 findings.md 失败' };
  }
}
