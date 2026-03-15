#!/usr/bin/env bash
set -euo pipefail
HOOK_VERSION="0.1.0"

# 版本检查
if [[ "${1:-}" == "--version" ]]; then
  echo "spec-first pre-push hook v${HOOK_VERSION}"
  exit 0
fi

# 增量 SCA 校验（如果 spec-first CLI 可用）
# 注意：此校验失败不会阻断推送（降级模式），符合本地开发体验
if command -v spec-first &>/dev/null; then
  spec-first sca --incremental --timeout 10000 || {
    echo "⚠️ SCA 校验失败，但不阻断推送（降级模式）"
    exit 0
  }
fi
exit 0
