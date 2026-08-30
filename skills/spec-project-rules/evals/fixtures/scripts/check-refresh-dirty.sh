#!/bin/bash
set -euo pipefail
fail() { echo "FAIL: $1" >&2; exit 1; }

[[ -f docs/architecture.md ]] || fail '缺少 docs/architecture.md'
git diff --quiet -- docs/architecture.md || fail '脏 refs 重验后事实未变，知识库应零写入（refresh_noop）'
git diff --quiet -- AGENTS.md || fail 'AGENTS.md 在重验结论为 noop 时被改写'
grep -q 'TOUCHED' apps/web/src/order.ts || fail '用户工作区改动被回滚（skill 不得"顺手修复"目标仓库改动）'
s=$(grep -c 'spec-project-rules-start' docs/architecture.md || true); e=$(grep -c 'spec-project-rules-end' docs/architecture.md || true)
[[ "$s" == 1 && "$e" == 1 ]] || fail '知识库 marker 不成对'
grep -q 'apps/admin 禁止依赖 apps/web' docs/architecture.md || fail '既有规则在重验中丢失'
echo 'PASS: refresh dirty（聚焦重验、零写入、用户改动保留）'
