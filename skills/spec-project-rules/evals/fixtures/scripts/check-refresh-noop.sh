#!/bin/bash
set -euo pipefail
fail() { echo "FAIL: $1" >&2; exit 1; }

[[ -f docs/architecture.md ]] || fail '缺少 docs/architecture.md'
git diff --quiet -- docs/architecture.md || fail '无实质变化却重写知识库（违反 refresh_noop：frontmatter 与正文都不得重写）'
git diff --quiet -- AGENTS.md || fail 'AGENTS.md 在 no-op 保鲜中被改写'
s=$(grep -c 'spec-project-rules-start' docs/architecture.md || true); e=$(grep -c 'spec-project-rules-end' docs/architecture.md || true)
[[ "$s" == 1 && "$e" == 1 ]] || fail '知识库 marker 不成对'
grep -q 'apps/admin 禁止依赖 apps/web' docs/architecture.md || fail '既有规则在 no-op 中丢失'
grep -q 'generated_at: 2026-08-28' docs/architecture.md || fail 'no-op 却更新了 frontmatter 时间戳'
echo 'PASS: refresh noop（零写入、零重写）'
