#!/bin/bash
set -euo pipefail

git add AGENTS.md package.json prepare-review-fixture.sh tenant-bypass.patch src test
git commit -m 'test: establish review baseline'
git apply tenant-bypass.patch
