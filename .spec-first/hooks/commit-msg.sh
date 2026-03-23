#!/bin/sh

set -eu

HOOK_VERSION="0.1.0"

if [ "${1:-}" = "--version" ]; then
  echo "spec-first commit-msg hook v${HOOK_VERSION}"
  exit 0
fi

MSG_FILE="${1:-}"
if [ -z "$MSG_FILE" ] || [ ! -f "$MSG_FILE" ]; then
  echo "Commit message 校验失败：缺少 commit message 文件" >&2
  exit 1
fi

MSG="$(sed -n '1p' "$MSG_FILE" | tr -d '\r')"

if printf '%s' "$MSG" | grep -Eq '^\[(TASK|FR|DS)-[A-Z0-9]+-[0-9]+\] '; then
  exit 0
fi

if printf '%s' "$MSG" | grep -Eq '^\[RFC-[0-9]+\] '; then
  exit 0
fi

if printf '%s' "$MSG" | grep -Eq '^(feat|fix|docs|chore|ci|test|refactor|style)(\([^)]+\))?: '; then
  exit 0
fi

cat >&2 <<'EOF'
Commit message 校验失败
[What] 请使用任务标签或 conventional commit
[How] 例如：[TASK-AUTH-001] implement login
EOF
exit 1
