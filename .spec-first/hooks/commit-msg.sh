#!/usr/bin/env bash
set -euo pipefail
HOOK_VERSION="0.1.0"

# 版本检查优先（避免 $1 为空时报错）
if [[ "${1:-}" == "--version" ]]; then
  echo "spec-first commit-msg hook v${HOOK_VERSION}"
  exit 0
fi

# 现在可以安全使用 $1（已排除 --version 分支，正常流程 $1 必须存在）
COMMIT_MSG_FILE="$1"

# 基础校验：commit message 包含 ID 标签或遵循 conventional commits
MSG=$(cat "$COMMIT_MSG_FILE")
if echo "$MSG" | grep -qE '^\[(FR|NFR|DS|API|TASK|TC|ADR|RFC)-'; then
  exit 0
elif echo "$MSG" | grep -qiE '^(feat|fix|docs|style|refactor|test|chore|ci|perf)(\(.+\))?:'; then
  exit 0
else
  echo "❌ Commit message 校验失败"
  echo "[What] Commit message 缺少合法标签"
  echo "[How]  格式: [TASK-XXX-001] 描述 或 feat(scope): 描述"
  exit 1
fi

#!/bin/sh
# spec-first-hook

# Validate commit message contains at least one valid ID
MSG=$(cat "$1")
if ! echo "$MSG" | grep -qE '(TASK|FR|DS|TC|RFC|FSREQ)-'; then
  echo "错误：commit message 必须至少引用一个有效 ID（TASK-xxx、FR-xxx 等）"
  echo "可用格式：[TASK-FEAT-NNN] <message>"
  exit 1
fi
