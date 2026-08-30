#!/bin/bash
set -euo pipefail
git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@x commit -qm 'fixture baseline'
