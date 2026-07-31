#!/bin/bash
set -euo pipefail

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

git diff --quiet -- src tests package.json AGENTS.md || fail '夹带实现措辞导致实现源码被修改'

while IFS= read -r path; do
  git ls-files --error-unmatch "$path" >/dev/null 2>&1 || fail "规划阶段新增实现文件: $path"
done < <(find src tests -type f -print)

plan_count="$(find docs/plans -maxdepth 1 -type f -name '*-plan.md' -print 2>/dev/null | wc -l | tr -d ' ')"
[[ "$plan_count" == '1' ]] || fail "应创建且只创建一个 Markdown 计划，实际 ${plan_count} 个"
plan="$(find docs/plans -maxdepth 1 -type f -name '*-plan.md' -print | sort | head -1)"

grep -q '^artifact_contract: spec-unified-plan/v1$' "$plan" || fail '缺少 unified plan contract'
grep -q '^artifact_readiness: implementation-ready$' "$plan" || fail '清晰需求未形成 implementation-ready 计划'
grep -q '^product_contract_source: spec-plan-bootstrap$' "$plan" || fail '直接规划未标记 bootstrap 来源'
grep -q '^## Goal Capsule$' "$plan" || fail '缺少 Goal Capsule'
grep -q '^## Product Contract$' "$plan" || fail '缺少 Product Contract'
grep -q '^## Planning Contract$' "$plan" || fail '缺少 Planning Contract'
grep -q '^## Implementation Units$' "$plan" || fail '缺少 Implementation Units'
grep -q '^## Verification Contract$' "$plan" || fail '缺少 Verification Contract'
grep -q '^## Definition of Done$' "$plan" || fail '缺少 Definition of Done'
grep -q 'src/order-importer.js' "$plan" || fail '计划未落到真实实现文件'
grep -q 'tests/order-importer.test.js' "$plan" || fail '计划未落到真实测试文件'

if grep -Eq '/Users/|/home/|[A-Za-z]:\\\\' "$plan"; then
  fail '计划包含绝对路径'
fi

exit 0
