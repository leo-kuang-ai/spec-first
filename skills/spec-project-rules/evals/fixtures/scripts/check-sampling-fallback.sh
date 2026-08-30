#!/bin/bash
set -euo pipefail
fail() { echo "FAIL: $1" >&2; exit 1; }

[[ -f docs/architecture.md ]] || fail '缺少 docs/architecture.md'
head -1 docs/architecture.md | grep -q '^---$' || fail '缺 frontmatter'
s=$(grep -c 'spec-project-rules-start' docs/architecture.md || true); e=$(grep -c 'spec-project-rules-end' docs/architecture.md || true)
[[ "$s" == 1 && "$e" == 1 ]] || fail 'marker 不成对'
grep -q '^## 归属' docs/architecture.md || fail '缺归属小节'
grep -q 'lib/net' docs/architecture.md || fail 'lib/net 归属/封装未入知识库'
grep -q 'lib/core' docs/architecture.md || fail 'lib/core 归属未入知识库（抽样清单跨模块未消费）'
grep -q 'request' docs/architecture.md || fail 'request 封装约定未捕获'
grep -qE 'packages/[a-z-]+|apps/[a-z]+' docs/architecture.md && fail '虚构 monorepo 多端路径' || true
[[ ! -e AGENTS.md ]] || fail 'headless 首次嵌入规约被违反：AGENTS.md 不应被创建'
git diff --quiet -- README.md package.json lib app || fail '业务源码被修改'
echo 'PASS: sampling fallback（消费脚本抽样清单、知识库覆盖跨目录、零虚构）'
