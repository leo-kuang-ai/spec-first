#!/bin/bash
set -euo pipefail
fail() { echo "FAIL: $1" >&2; exit 1; }

[[ -f docs/architecture.md ]] || fail '缺少 docs/architecture.md（v2 单文件知识库）'
s=$(grep -c 'spec-project-rules-start' docs/architecture.md || true); e=$(grep -c 'spec-project-rules-end' docs/architecture.md || true)
[[ "$s" == 1 && "$e" == 1 ]] || fail 'docs/architecture.md marker 不成对'
head -1 docs/architecture.md | grep -q '^---$' || fail 'docs/architecture.md 缺 frontmatter'
grep -q 'generated_at' docs/architecture.md || fail '缺 generated_at'
grep -q 'source_commit' docs/architecture.md || fail '缺 source_commit'
grep -q '^## 归属' docs/architecture.md || fail '缺归属小节'
grep -q '^## 依赖方向' docs/architecture.md || fail '缺依赖方向小节'
grep -q '^## 复用' docs/architecture.md || fail '缺复用小节'
grep -q '^## 约定' docs/architecture.md || fail '缺约定小节'
[[ ! -d docs/architecture ]] || fail '仍产出 v1 五文件目录（已废弃）'
# headless 环境（自动化 runner 无交互确认原语）首次嵌入必须跳过并记录 agents_embed_skipped：
# AGENTS.md 不得被创建或改写（宁可少写不错写）。
[[ ! -e AGENTS.md ]] || fail 'headless 首次嵌入规约被违反：AGENTS.md 不应被创建（应记录 agents_embed_skipped）'
grep -rq 'internal-registry' docs/architecture.md && fail '敏感 URL 泄漏' || true
grep -q 'apps/admin' docs/architecture.md || fail '知识库缺 admin 归属/依赖行'
grep -qE '禁止|不得' docs/architecture.md || fail 'README 明文边界未被吸收为禁止方向规则'
grep -qE 'createClient|api-client' docs/architecture.md || fail '未捕获 HTTP 封装规则'
git diff --quiet -- README.md package.json apps packages || fail '业务源码被修改'
echo 'PASS: bootstrap gold（headless：首次嵌入跳过）'
