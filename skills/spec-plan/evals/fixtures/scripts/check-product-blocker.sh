#!/bin/bash
set -euo pipefail

plan='docs/plans/2026-07-31-001-feat-admin-export-plan.md'

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

[[ -f "$plan" ]] || fail 'requirements-only 计划丢失'
git diff --quiet -- "$plan" || fail '未决产品 blocker 下不应改写 Product Contract'
git diff --quiet -- src package.json AGENTS.md || fail '未决产品 blocker 下修改了源码或配置'

grep -q '^artifact_readiness: requirements-only$' "$plan" || fail 'blocker 未决却提升了 readiness'
grep -q '^can_enter_spec_plan: no$' "$plan" || fail 'can_enter_spec_plan gate 被移除'
if grep -q '^## Implementation Units$' "$plan"; then
  fail 'blocker 未决却写入 Implementation Units'
fi

message="${EVAL_FINAL_MESSAGE:-}"
printf '%s' "$message" | grep -Eqi 'BLOCKER-1|blocker|阻断|未决|产品.*决定|spec-brainstorm' \
  || fail '最终响应未明确暴露产品 blocker'

exit 0
