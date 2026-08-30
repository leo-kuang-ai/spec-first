#!/bin/bash
set -euo pipefail
fail() { echo "FAIL: $1" >&2; exit 1; }

[[ -f docs/architecture.md ]] || fail '缺少 docs/architecture.md'
head -1 docs/architecture.md | grep -q '^---$' || fail '缺 frontmatter'
s=$(grep -c 'spec-project-rules-start' docs/architecture.md || true); e=$(grep -c 'spec-project-rules-end' docs/architecture.md || true)
[[ "$s" == 1 && "$e" == 1 ]] || fail 'marker 不成对'
grep -q '^## 归属' docs/architecture.md || fail '缺归属小节（骨架条目未合入）'
grep -q '^## 依赖方向' docs/architecture.md || fail '缺依赖方向小节（L0 事实未合入）'
grep -qE '禁止|不得' docs/architecture.md || fail 'README 明文边界未被吸收进骨架'
grep -q 'packages/api-client\|@shop/api-client' docs/architecture.md || fail 'L0 依赖边事实未入条目'
[[ ! -e AGENTS.md ]] || fail 'headless 首次嵌入规约被违反：AGENTS.md 不应被创建'
git diff --quiet -- README.md package.json apps packages || fail '业务源码被修改'
stray=$(ls docs/ 2>/dev/null | grep -v '^architecture.md$' || true)
[[ -z "$stray" ]] || fail "大仓分批留下中间产物文件于 docs/: $stray"
if find . -maxdepth 2 \( -name '*-batch*.md' -o -name '*candidates*.json' -o -name '*-skeleton*.md' \) -not -path './.git/*' | grep -q .; then
  fail '发现批次中间产物文件（应增量合入单文件知识库，不留独立产物）'
fi
echo 'PASS: large repo batched（骨架先行、增量合入、零中间产物）'
