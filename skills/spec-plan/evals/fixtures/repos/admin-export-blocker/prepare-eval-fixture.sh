#!/bin/bash
set -euo pipefail

git config user.name 'Spec Plan Eval'
git config user.email 'spec-plan-eval@example.com'
git add AGENTS.md package.json src docs prepare-eval-fixture.sh
git commit -m 'test: establish spec-plan eval baseline' >/dev/null
