#!/bin/bash
set -euo pipefail
fail() { echo "FAIL: $1" >&2; exit 1; }

[[ -f docs/architecture.md ]] || fail '缺少 docs/architecture.md'
git diff --quiet -- AGENTS.md || fail 'AGENTS.md 被改写（归属细节不满足内嵌筛选标准；用户内容与他 skill marker 必须逐字节保留）'
grep -q 'spec-rule-miner-start' AGENTS.md || fail '他 skill marker 块丢失'
grep -q '团队手写维护' AGENTS.md || fail '用户手写说明丢失'
grep -q 'packages/ui' docs/architecture.md || fail 'packages/ui 归属未合入知识库'
s=$(grep -c 'spec-project-rules-start' docs/architecture.md || true); e=$(grep -c 'spec-project-rules-end' docs/architecture.md || true)
[[ "$s" == 1 && "$e" == 1 ]] || fail '知识库 marker 不成对'
grep -q 'apps/admin 禁止依赖 apps/web' docs/architecture.md || fail '既有规则在合入时丢失'
grep -rq 'internal-registry' docs/architecture.md && fail '敏感 URL 泄漏' || true
echo 'PASS: marker coexist（知识库增量合入、AGENTS.md 三层共存零改写）'
