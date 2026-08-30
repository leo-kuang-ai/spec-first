#!/bin/bash
set -euo pipefail
fail() { echo "FAIL: $1" >&2; exit 1; }

[[ -f docs/architecture.md ]] || fail '知识库未建立'
s=$(grep -c 'spec-project-rules-start' docs/architecture.md || true); e=$(grep -c 'spec-project-rules-end' docs/architecture.md || true)
[[ "$s" == 1 && "$e" == 1 ]] || fail 'docs/architecture.md marker 不成对'
if grep -qE '函数不要过长|函数长度|写清晰注释|命名要规范|清晰注释' docs/architecture.md; then
  fail '通识条目未被准入三问拦截，写入了知识库'
fi
grep -q 'createClient' docs/architecture.md || fail '项目私有规则应保留（HTTP 封装）'
grep -q 'internal-registry' docs/architecture.md && fail '敏感 URL 泄漏' || true
echo 'PASS: admission filter（通识拒写、私有保留）'
