/**
 * Git Hook Installation & Management
 * 4 个 Git Hook: prepare-commit-msg, commit-msg, pre-push, pre-commit
 */
import { join } from 'node:path';
import { writeFileSync, chmodSync, readFileSync, unlinkSync, lstatSync, mkdirSync } from 'node:fs';
import { exists } from '../../shared/fs-utils.js';

const HOOK_NAMES = ['prepare-commit-msg', 'commit-msg', 'pre-push', 'pre-commit'] as const;

export type HookName = (typeof HOOK_NAMES)[number];

export interface HookStatus {
  name: HookName;
  installed: boolean;
  isSpecFirst: boolean;
}

const MARKER = '# spec-first-hook';

function isSymbolicLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function mergeHookContent(existing: string, generated: string): string {
  if (!existing.trim()) return generated;
  if (existing.includes(MARKER)) {
    const cleaned = removeSpecFirstBlock(existing);
    if (!cleaned.trim()) return generated;
    const suffix = cleaned.endsWith('\n') ? '' : '\n';
    return `${cleaned}${suffix}\n${generated}`;
  }
  const suffix = existing.endsWith('\n') ? '' : '\n';
  return `${existing}${suffix}\n${generated}`;
}

function removeSpecFirstBlock(content: string): string {
  const markerIdx = content.indexOf(MARKER);
  if (markerIdx < 0) return content;

  const headerIdx = content.lastIndexOf('#!/bin/sh', markerIdx);
  const start = headerIdx >= 0 ? headerIdx : markerIdx;
  return content.slice(0, start).trimEnd();
}

/** 安装 4 个 Git Hook 到 .git/hooks/ */
export function installHooks(projectRoot: string, options?: { dryRun?: boolean }): string[] {
  const hooksDir = join(projectRoot, '.git', 'hooks');
  const installed: string[] = [];

  if (!options?.dryRun) {
    mkdirSync(hooksDir, { recursive: true });
  }

  for (const name of HOOK_NAMES) {
    const hookPath = join(hooksDir, name);
    const generated = generateHookScript(name);
    const linked = isSymbolicLink(hookPath);
    const existing = exists(hookPath) ? readFileSync(hookPath, 'utf-8') : '';
    const content = mergeHookContent(existing, generated);
    if (!options?.dryRun) {
      if (linked) unlinkSync(hookPath);
      writeFileSync(hookPath, content, 'utf-8');
      chmodSync(hookPath, 0o755);
    }
    installed.push(name);
  }

  return installed;
}

/** 卸载所有 spec-first Hook */
export function uninstallHooks(projectRoot: string): string[] {
  const hooksDir = join(projectRoot, '.git', 'hooks');
  const removed: string[] = [];

  for (const name of HOOK_NAMES) {
    const hookPath = join(hooksDir, name);
    if (!exists(hookPath)) continue;

    const content = readFileSync(hookPath, 'utf-8');
    if (content.includes(MARKER)) {
      const cleaned = removeSpecFirstBlock(content);
      if (!cleaned.trim()) {
        unlinkSync(hookPath);
      } else {
        writeFileSync(hookPath, `${cleaned}\n`, 'utf-8');
      }
      removed.push(name);
    }
  }

  return removed;
}

/** 生成 Hook 脚本内容 */
function generateHookScript(name: HookName): string {
  const header = `#!/bin/sh\n${MARKER}\n`;

  switch (name) {
    case 'prepare-commit-msg':
      // 从分支名或 .spec-first/current + task_plan.md 提取当前 TASK ID，自动填充前缀
      return (
        header +
        `
# Auto-fill TASK ID prefix in commit message
CURRENT_FILE=".spec-first/current"
if [ -f "$CURRENT_FILE" ]; then
  FEAT_ID=$(cat "$CURRENT_FILE" | head -1)
  TASK_PLAN="specs/$FEAT_ID/task_plan.md"
  if [ -f "$TASK_PLAN" ]; then
    TASK_ID=$(grep "In Progress" "$TASK_PLAN" | head -1 | awk -F'|' '{print $2}' | xargs)
    if [ -n "$TASK_ID" ]; then
      FIRST_LINE=$(head -1 "$1")
      if ! echo "$FIRST_LINE" | grep -q "^\\[TASK-"; then
        sed -i.bak "1s/^/[$TASK_ID] /" "$1"
        rm -f "$1.bak"
      fi
    fi
  fi
fi
`
      );

    case 'commit-msg':
      // 校验 commit message 格式：至少包含一个有效 ID 标识符
      return (
        header +
        `
# Validate commit message contains at least one valid ID
MSG=$(cat "$1")
if ! echo "$MSG" | grep -qE '(TASK|FR|DS|TC|RFC|FSREQ)-'; then
  echo "错误：commit message 必须至少引用一个有效 ID（TASK-xxx、FR-xxx 等）"
  echo "可用格式：[TASK-FEAT-NNN] <message>"
  exit 1
fi
`
      );

    case 'pre-push':
      // 增量 SCA 检查
      return (
        header +
        `
# Incremental SCA check before push
if command -v npx >/dev/null 2>&1; then
  FEAT_FILE=".spec-first/current"
  FEAT_ID=""
  if [ -f "$FEAT_FILE" ]; then
    FEAT_ID=$(head -1 "$FEAT_FILE" | tr -d '\\r')
  fi

  if [ -z "$FEAT_ID" ]; then
    echo "spec-first: 跳过 docs 校验（未设置当前 feature）"
    exit 0
  fi

  npx spec-first docs validate "$FEAT_ID"
  if [ $? -ne 0 ]; then
    echo "错误：$FEAT_ID 的 spec-first docs validate 失败，已阻止 push。"
    exit 1
  fi
fi
`
      );

    case 'pre-commit':
      // 基本格式校验
      return (
        header +
        `
# Pre-commit validation
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMRD 2>/dev/null || true)
if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

SOURCE_CHANGED=0
while IFS= read -r FILE; do
  [ -z "$FILE" ] && continue
  case "$FILE" in
    src/*|scripts/*|templates/*|skills/*|.spec-first/hooks/*|package.json|tsconfig.json|eslint.config.js|vitest.config.ts|tsup.config.ts)
      SOURCE_CHANGED=1
      break
      ;;
  esac
done <<__SPEC_FIRST_STAGED_FILES__
$STAGED_FILES
__SPEC_FIRST_STAGED_FILES__

if [ "$SOURCE_CHANGED" -eq 0 ]; then
  exit 0
fi

HAS_CHANGELOG=0
HAS_CLAUDE=0
while IFS= read -r FILE; do
  [ -z "$FILE" ] && continue
  [ "$FILE" = "CHANGELOG.md" ] && HAS_CHANGELOG=1
  [ "$FILE" = "CLAUDE.md" ] && HAS_CLAUDE=1
done <<__SPEC_FIRST_STAGED_FILES_2__
$STAGED_FILES
__SPEC_FIRST_STAGED_FILES_2__

if [ "$HAS_CHANGELOG" -ne 1 ]; then
  echo "错误：检测到源码变更，但暂存区缺少 CHANGELOG.md 记录"
  exit 1
fi

if [ "$HAS_CLAUDE" -ne 1 ]; then
  echo "错误：检测到源码变更，但暂存区缺少 CLAUDE.md 同步变更"
  exit 1
fi

echo "spec-first: pre-commit 检查通过"
`
      );
  }
}

/** 检查 Hook 安装状态 */
export function checkHooks(projectRoot: string): HookStatus[] {
  const hooksDir = join(projectRoot, '.git', 'hooks');

  return HOOK_NAMES.map((name) => {
    const hookPath = join(hooksDir, name);
    if (!exists(hookPath)) {
      return { name, installed: false, isSpecFirst: false };
    }
    const content = readFileSync(hookPath, 'utf-8');
    return {
      name,
      installed: true,
      isSpecFirst: content.includes(MARKER),
    };
  });
}
