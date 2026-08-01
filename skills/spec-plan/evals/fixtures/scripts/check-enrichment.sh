#!/bin/bash
set -euo pipefail

plan='docs/plans/2026-07-31-001-feat-order-import-plan.md'

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

[[ -f "$plan" ]] || fail '原始 unified plan 不存在'
[[ ! -f 'docs/plans/2026-07-31-002-feat-order-import-plan.md' ]] || fail '不应创建重复计划'

cmp -s \
  <(git show HEAD:"$plan" | sed -n '/<!-- PRODUCT_CONTRACT_START -->/,/<!-- PRODUCT_CONTRACT_END -->/p') \
  <(sed -n '/<!-- PRODUCT_CONTRACT_START -->/,/<!-- PRODUCT_CONTRACT_END -->/p' "$plan") \
  || fail 'Product Contract region changed'

grep -q '^artifact_readiness: implementation-ready$' "$plan" || fail '未提升为 implementation-ready'
grep -q '^product_contract_source: spec-brainstorm$' "$plan" || fail 'Product Contract 来源被改写'
grep -q '^execution: code$' "$plan" || fail '缺少 code execution metadata'
grep -q '^## Planning Contract$' "$plan" || fail '缺少 Planning Contract'
grep -q '^## Implementation Units$' "$plan" || fail '缺少 Implementation Units'
grep -q '^## Verification Contract$' "$plan" || fail '缺少 Verification Contract'
grep -q '^## Definition of Done$' "$plan" || fail '缺少 Definition of Done'
grep -Eq '^### U[0-9]+\.' "$plan" || fail '缺少稳定 U-ID'
grep -q 'tests/order-importer.test.js' "$plan" || fail 'feature-bearing unit 未引用测试文件'
grep -Eq 'R1|R2|R3' "$plan" || fail 'Implementation plan 未追踪需求 ID'
grep -q 'Product Contract unchanged\|Product Contract 未变更' "$plan" || fail '缺少 Product Contract preservation 说明'

for required in \
  '**R1:** 临时网络错误最多重试 3 次。' \
  '**R2:** 校验错误必须立即失败，不得重试。' \
  '**R3:** 保持现有 CLI 成功与失败输出兼容。' \
  '**F1:** 运营人员提交有效订单；首次请求遇到临时网络错误；系统重试并成功返回。' \
  '**AE1:** 给定前两次请求返回临时网络错误，第三次成功时，导入成功且总调用次数为 3。' \
  '**AE2:** 给定输入校验失败时，导入立即失败且只调用一次。'; do
  grep -Fq -- "$required" "$plan" || fail "Product Contract 内容丢失: $required"
done

if grep -Eq '/Users/|/home/|[A-Za-z]:\\\\' "$plan"; then
  fail '计划包含绝对路径'
fi

git diff --quiet -- src tests package.json AGENTS.md || fail '规划阶段修改了实现或仓库配置'
if find src tests -type f -not -path '*/.git/*' | grep -q .; then
  while IFS= read -r path; do
    git ls-files --error-unmatch "$path" >/dev/null 2>&1 || fail "规划阶段新增实现文件: $path"
  done < <(find src tests -type f -print)
fi

exit 0
