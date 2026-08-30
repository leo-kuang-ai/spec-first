#!/bin/bash
set -euo pipefail
fail() { echo "FAIL: $1" >&2; exit 1; }

[[ -f docs/architecture.md ]] || fail '缺少 docs/architecture.md'
head -1 docs/architecture.md | grep -q '^---$' || fail '缺 frontmatter'
s=$(grep -c 'spec-project-rules-start' docs/architecture.md || true); e=$(grep -c 'spec-project-rules-end' docs/architecture.md || true)
[[ "$s" == 1 && "$e" == 1 ]] || fail 'marker 不成对'
grep -q '^## 归属' docs/architecture.md || fail '缺归属小节'
grep -q '^## 约定' docs/architecture.md || fail '缺约定小节'
grep -q '^## 依赖方向' docs/architecture.md && fail '单端仓虚构跨端依赖方向小节' || true
grep -qE 'packages/[a-z-]+|apps/[a-z]+' docs/architecture.md && fail '虚构 monorepo 多端路径' || true
grep -qE 'request|src/api' docs/architecture.md || fail '未捕获 request 封装约定'
[[ ! -e AGENTS.md ]] || fail 'headless 首次嵌入规约被违反：AGENTS.md 不应被创建'
git diff --quiet -- README.md package.json src || fail '业务源码被修改'
echo 'PASS: single end degraded（最简知识库、不虚构跨端结构）'
