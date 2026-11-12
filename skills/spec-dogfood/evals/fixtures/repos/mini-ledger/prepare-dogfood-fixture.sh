#!/bin/bash
# 为 owner-unavailable-stops 用例准备隔离夹具（SUP-28）：
# - main 记录 trunk 基线；
# - 当前分支必须是 feature/entries-response；
# - feature 分支上再提交一个真实 diff（GET /entries 响应结构改为 { entries }），
#   使入口的 branch/blank trunk 拒绝不再掩盖 owner 缺失路径。
# 只做评测夹具准备，不授予任务提交、推送或其他副作用。
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

current=$(git symbolic-ref --quiet --short HEAD || true)
if [[ "$current" != 'feature/entries-response' ]]; then
  echo "Fixture branch is $current, expected feature/entries-response" >&2
  exit 1
fi

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git add -A
  git -c user.name='Eval Fixture' -c user.email='eval@example.invalid' commit -qm 'eval fixture baseline'
fi

git show-ref --verify --quiet refs/heads/main || git branch main

if git diff --quiet main...HEAD; then
  python3 - <<'PYEOF'
from pathlib import Path
target = Path('src/server.js')
source = target.read_text(encoding='utf-8')
needle = 'res.end(JSON.stringify(entries));'
if needle not in source:
    raise SystemExit('Fixture drift: GET /entries handler not found')
target.write_text(source.replace(needle, 'res.end(JSON.stringify({ entries }));'), encoding='utf-8')
PYEOF
  git add src/server.js
  git -c user.name='Eval Fixture' -c user.email='eval@example.invalid' commit -qm 'feat: wrap GET /entries response'
fi

if git diff --quiet main...HEAD; then
  echo 'Fixture diff against main is empty' >&2
  exit 1
fi

git diff --stat main...HEAD
