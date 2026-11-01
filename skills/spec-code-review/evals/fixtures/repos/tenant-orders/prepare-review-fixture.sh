#!/bin/bash
set -euo pipefail

git add AGENTS.md package.json prepare-review-fixture.sh tenant-bypass.patch src test
git commit -m 'test: establish review baseline'
git ls-files --stage -z > .git/eval-baseline-index
git apply tenant-bypass.patch

# Keep baseline facts in .git so judges can distinguish evaluated changes from
# the fixture's pending patch. Legacy report-only judges still consume this diff
# digest; the applied-fix judge checks actual tenant behavior and index identity.
hash_stdin() {
  if command -v shasum >/dev/null 2>&1; then shasum | cut -d' ' -f1
  elif command -v sha256sum >/dev/null 2>&1; then sha256sum | cut -d' ' -f1
  else git hash-object --stdin
  fi
}
git_dir="$(git rev-parse --git-dir)"
git rev-parse HEAD > "$git_dir/eval-baseline-head"
git diff HEAD | hash_stdin > "$git_dir/eval-baseline-diff-sha"
