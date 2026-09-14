#!/bin/bash
set -euo pipefail

git add AGENTS.md package.json prepare-review-fixture.sh tenant-bypass.patch src test
git commit -m 'test: establish review baseline'
git apply tenant-bypass.patch

# 记录评测基线到 .git/ 内部（不进工作区、不入 diff、不会被 git add 收走），
# 供 judge 区分「模型真实改动」与「fixture 自带的未提交补丁」。
# 哈希器回退链与 check-r2-preset-applied-fix.sh 保持一致(极简 Linux 无 shasum
# 时退到 sha256sum,再退到 git hash-object)。
hash_stdin() {
  if command -v shasum >/dev/null 2>&1; then shasum | cut -d' ' -f1
  elif command -v sha256sum >/dev/null 2>&1; then sha256sum | cut -d' ' -f1
  else git hash-object --stdin
  fi
}
git_dir="$(git rev-parse --git-dir)"
git rev-parse HEAD > "$git_dir/eval-baseline-head"
git diff HEAD | hash_stdin > "$git_dir/eval-baseline-diff-sha"
