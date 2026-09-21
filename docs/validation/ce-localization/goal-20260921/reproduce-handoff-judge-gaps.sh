#!/bin/bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")" && pwd)
FIX=$(mktemp -d)
trap 'rm -rf "$FIX"' EXIT
cp -R "$ROOT/../../../../skills/spec-handoff/evals/fixtures/repos/mini-ledger-with-prior-handoff/." "$FIX/"
cd "$FIX"
git init -q; git config user.name test; git config user.email test@example.invalid; git switch -c main -q
printf '\nattacker write\n' >> README.md
if EVAL_FINAL_MESSAGE='进展 orientation，limitations；未执行 deploy。' "$ROOT/old-check-resume-no-side-effects.sh" >/tmp/old-resume.out 2>&1; then
  echo 'old_resume_accepted_modified_file=true'
else
  echo 'old_resume_accepted_modified_file=false'; cat /tmp/old-resume.out
fi
printf '\nattacker write\n' >> src/server.js
if EVAL_FINAL_MESSAGE='degraded，缺失上下文，无法确认进展。' "$ROOT/old-check-degraded-orientation.sh" >/tmp/old-degraded.out 2>&1; then
  echo 'old_degraded_accepted_modified_file=true'
else
  echo 'old_degraded_accepted_modified_file=false'; cat /tmp/old-degraded.out
fi
rm -rf .spec-first
mkdir -p .spec-first/workflows/spec-handoff/test
cat > .spec-first/workflows/spec-handoff/test/fake.md <<'EOF'
---
artifact_contract: "spec-handoff/v1"
summary: "x"
source_refs: ["src/server.js"]
freshness: ["now"]
limitations: ["none"]
---
EOF
if EVAL_FINAL_MESSAGE='SHA-256 receipt present; spec-handoff resume fake.md' "$ROOT/old-check-create-artifact.sh" >/tmp/old-create.out 2>&1; then
  echo 'old_create_accepted_fake_receipt=true'
else
  echo 'old_create_accepted_fake_receipt=false'; cat /tmp/old-create.out
fi
