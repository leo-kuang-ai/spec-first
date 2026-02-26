#!/usr/bin/env bash
set -euo pipefail
HOOK_VERSION="0.1.0"
COMMIT_MSG_FILE="$1"
if [[ "${1:-}" == "--version" ]]; then
  echo "spec-first commit-msg hook v${HOOK_VERSION}"
  exit 0
fi
# 基础校验：commit message 包含 ID 标签
MSG=$(cat "$COMMIT_MSG_FILE")
if echo "$MSG" | grep -qE '^\[(FR|NFR|DS|API|TASK|TC|ADR|RFC)-'; then
  exit 0
elif echo "$MSG" | grep -qiE '^(feat|fix|docs|style|refactor|test|chore|ci)(\(.+\))?:'; then
  exit 0
else
  echo "❌ Commit message 校验失败"
  echo "[What] Commit message 缺少合法标签"
  echo "[How]  格式: [TASK-XXX-001] 描述 或 feat(scope): 描述"
  exit 1
fi
