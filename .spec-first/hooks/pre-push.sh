#!/bin/sh
set -eu
HOOK_VERSION="0.1.0"

# 版本检查
if [ "${1:-}" = "--version" ]; then
  echo "spec-first pre-push hook v${HOOK_VERSION}"
  exit 0
fi

# 增量 SCA 校验（如果 spec-first CLI 可用）
# 注意：此校验失败不会阻断推送（降级模式），符合本地开发体验
if command -v spec-first >/dev/null 2>&1; then
  if ! spec-first sca --incremental --timeout 10000; then
    echo "⚠️ SCA 校验失败，但不阻断推送（降级模式）"
    exit 0
  fi
fi
exit 0

#!/bin/sh
# spec-first-hook

# Incremental SCA check before push
if command -v npx >/dev/null 2>&1; then
  FEAT_FILE=".spec-first/current"
  FEAT_ID=""
  if [ -f "$FEAT_FILE" ]; then
    FEAT_ID=$(head -1 "$FEAT_FILE" | tr -d '\r')
  fi

  if [ -z "$FEAT_ID" ]; then
    echo "spec-first: 跳过 matrix 检查（未设置当前 feature）"
    exit 0
  fi

  npx spec-first matrix check "$FEAT_ID"
  if [ $? -ne 0 ]; then
    echo "错误：$FEAT_ID 的 spec-first matrix check 失败，已阻止 push。"
    exit 1
  fi
fi
