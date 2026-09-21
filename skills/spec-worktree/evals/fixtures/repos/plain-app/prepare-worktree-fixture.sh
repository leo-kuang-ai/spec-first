#!/bin/bash
# 评测环境准备:建立初始提交,使 fixture 成为有提交历史的普通仓库。
# 仅用于准备评测环境,不属于被测行为。
set -euo pipefail
git add -A
git commit -q -m "fixture: initial commit" || true
