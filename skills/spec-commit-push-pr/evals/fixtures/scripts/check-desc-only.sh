#!/bin/bash
# 硬断言:description-only 下无新 commit。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
count=$(git rev-list --count HEAD 2>/dev/null || echo 0)
if [[ "$count" -gt 1 ]]; then echo "出现新 commit($count)——description-only 违规变异"; exit 1; fi
exit 0
