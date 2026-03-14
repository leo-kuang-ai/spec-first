import { join } from 'node:path';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';

export const TASK_CONTEXT_SCRIPT = '.spec-first/hooks/task-context.sh';
export const STOP_GUARD_SCRIPT = '.spec-first/hooks/stop-guard.sh';
export const PROGRESS_SYNC_SCRIPT = '.spec-first/hooks/progress-sync.sh';
export const EXTENSION_HOOK_SCRIPT = '.spec-first/hooks/extension-hook.mjs';

export const MANAGED_HOOK_COMMAND_MARKERS = [
  'npx spec-first gate check',
  'npx spec-first matrix check',
  'npx spec-first ai stats',
  `sh ${TASK_CONTEXT_SCRIPT}`,
  `sh ${STOP_GUARD_SCRIPT}`,
  `sh ${PROGRESS_SYNC_SCRIPT}`,
  EXTENSION_HOOK_SCRIPT,
] as const;

const TASK_CONTEXT_SCRIPT_CONTENT = String.raw`#!/usr/bin/env sh
# Spec-First AI Runtime Hook - Task Context
# Requires: POSIX sh, Git (optional for root detection)

set -eu

# 跨平台项目根目录发现
find_root() {
  # 方法1: 向上查找包含 specs/ 目录的项目根
  dir="$(pwd)"
  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    # 检查是否为真正的项目根（同时有 .spec-first 和 specs 目录）
    if [ -d "$dir/.spec-first" ] && [ -d "$dir/specs" ]; then
      printf '%s' "$dir"
      return 0
    fi
    parent="$(dirname "$dir")"
    [ "$parent" = "$dir" ] && break
    dir="$parent"
  done
  # 方法2: Git root (Windows Git Bash / macOS / Linux)
  if git rev-parse --show-toplevel 2>/dev/null; then
    return 0
  fi
  return 1
}

ROOT="$(find_root)" || exit 0
cd "$ROOT" 2>/dev/null || exit 0

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
STAGE_FILE="specs/$FEAT/stage-state.json"
[ -n "$FEAT" ] && [ -f "$FILE" ] || exit 0

echo "=== TASK 上下文刷新 ==="
if [ -f "$STAGE_FILE" ]; then
  STAGE="$(awk -F'"' '/"currentStage"[[:space:]]*:/ {print $4; exit}' "$STAGE_FILE" 2>/dev/null || true)"
  [ -n "$STAGE" ] && echo "Current Stage: $STAGE"
fi

OPEN_TASKS="$(
  awk -F'|' '
    BEGIN { count=0 }
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
      if (s == "complete" || s == "verified") s="done"
      if (s != "done") count++
    }
    END { print count + 0 }
  ' "$FILE"
)"
echo "Open TASKs: $OPEN_TASKS"

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
# Spec-First AI Runtime Hook - Stop Guard
# Requires: POSIX sh, Git (optional for root detection)

set -eu

# 跨平台项目根目录发现
find_root() {
  dir="$(pwd)"
  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    [ -d "$dir/.spec-first" ] && printf '%s' "$dir" && return 0
    parent="$(dirname "$dir")"
    [ "$parent" = "$dir" ] && break
    dir="$parent"
  done
  git rev-parse --show-toplevel 2>/dev/null && return 0
  return 1
}

ROOT="$(find_root)" || exit 0
cd "$ROOT" 2>/dev/null || exit 0

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
[ -z "$FEAT" ] && exit 0

STAGE_FILE="specs/$FEAT/stage-state.json"
TASK_FILE="specs/$FEAT/task_plan.md"

# 仅在 04_implement 阶段检查 in_progress 任务
if [ -f "$STAGE_FILE" ]; then
  STAGE="$(awk -F'"' '/"currentStage"[[:space:]]*:/ {print $4; exit}' "$STAGE_FILE" 2>/dev/null || true)"
  [ "$STAGE" != "04_implement" ] && exit 0
fi

[ ! -f "$TASK_FILE" ] && exit 0

IN_PROGRESS_IDS="$(
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
      if (s == "in_progress" || s == "in progress") print taskid
    }
  ' "$TASK_FILE" 2>/dev/null || true
)"

# 只输出提醒，不返回错误码（避免触发 AI 死循环）
if [ -n "$IN_PROGRESS_IDS" ]; then
  echo "💡 提示：仍有进行中的 TASK，建议完成或更新状态：" >&2
  echo "$IN_PROGRESS_IDS" >&2
fi

exit 0
`;

// Planning-with-Files P1-2: PostToolUse 进度同步提醒脚本
const PROGRESS_SYNC_SCRIPT_CONTENT = String.raw`#!/usr/bin/env sh
# Spec-First AI Runtime Hook - Progress Sync
# Requires: POSIX sh, Git (optional for root detection)

set -eu

# 跨平台项目根目录发现
find_root() {
  dir="$(pwd)"
  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    [ -d "$dir/.spec-first" ] && printf '%s' "$dir" && return 0
    parent="$(dirname "$dir")"
    [ "$parent" = "$dir" ] && break
    dir="$parent"
  done
  git rev-parse --show-toplevel 2>/dev/null && return 0
  return 1
}

ROOT="$(find_root)" || exit 0
cd "$ROOT" 2>/dev/null || exit 0

FEAT="$(head -1 .spec-first/current 2>/dev/null || true)"
FILE="specs/$FEAT/task_plan.md"
[ -n "$FEAT" ] && [ -f "$FILE" ] || exit 0

echo "=== 进度同步提醒 ==="
echo "文件已修改。如果此次修改完成了一个 TASK 或 AC，请检查是否需要更新 task_plan.md 中的完成状态。"
echo "当前 in_progress TASK:"
awk -F'|' '
  BEGIN { found=0 }
  /^\|/ && !/---/ {
    taskid=""; title=""; status=""
    for (i=1; i<=NF; i++) {
      c=$i; gsub(/^[ \t]+|[ \t]+$/, "", c)
      s=tolower(c)
      if (c ~ /^TASK-/ && taskid == "") taskid=c
      if (s=="in_progress" || s=="in progress") status=c
      if (title=="" && c!~/^TASK-/ && s!="status" && s!="in_progress" && s!="in progress" && c!="") title=c
    }
    if (taskid!="" && status!="") {
      printf("  - %s | %s | %s\n", taskid, title, status)
      found=1
      exit
    }
  }
  END {
    if (!found) print "  (无 in_progress TASK)"
  }
' "$FILE"
`;

const EXTENSION_HOOK_SCRIPT_CONTENT = String.raw`#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const [namespaceEncoded = '', commandEncoded = ''] = process.argv.slice(2);

function decode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

try {
  const namespace = decode(namespaceEncoded);
  const command = decode(commandEncoded);
  execFileSync('sh', ['-lc', command], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SPEC_FIRST_EXTENSION_NAMESPACE: namespace,
    },
  });
} catch (error) {
  const status =
    error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
      ? error.status
      : 1;
  process.exit(status);
}
`;

export function ensureManagedHookScripts(projectRoot: string, dryRun: boolean): void {
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
    {
      path: join(projectRoot, EXTENSION_HOOK_SCRIPT),
      content: EXTENSION_HOOK_SCRIPT_CONTENT,
    },
  ];

  mkdirSync(join(projectRoot, '.spec-first', 'hooks'), { recursive: true });
  for (const script of scriptSpecs) {
    writeFileSync(script.path, `${script.content.trimEnd()}\n`, 'utf-8');
    chmodSync(script.path, 0o755);
  }
}
