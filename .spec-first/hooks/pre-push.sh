#!/bin/sh

set -eu

HOOK_VERSION="0.1.0"

if [ "${1:-}" = "--version" ]; then
  echo "spec-first pre-push hook v${HOOK_VERSION}"
  exit 0
fi

if ! command -v spec-first >/dev/null 2>&1; then
  echo "spec-first 不可用，跳过 pre-push 校验（降级模式）" >&2
  exit 0
fi

if spec-first docs validate >/dev/null 2>&1; then
  exit 0
fi

echo "SCA 校验失败，按降级模式继续 push" >&2
exit 0
