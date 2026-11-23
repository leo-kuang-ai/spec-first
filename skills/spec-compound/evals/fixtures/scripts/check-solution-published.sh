#!/bin/bash
set -euo pipefail

skill_dir=${EVAL_SKILL_DIR:?Publication cannot be verified without EVAL_SKILL_DIR}
validator="$skill_dir/scripts/validate-frontmatter.py"
[[ -f "$validator" && -r "$validator" ]] || { echo 'Promotion validator unavailable; publication not verified.' >&2; exit 2; }
solutions=()
while IFS= read -r -d '' file; do solutions+=("$file"); done < <(find docs/solutions -type f -name '*.md' -print0)
[[ ${#solutions[@]} -eq 1 ]] || { echo 'Expected exactly one published solution.' >&2; exit 1; }
doc=${solutions[0]}
python3 "$validator" --promotion "$doc"
awk 'NR == 1 {next} /^---[[:space:]]*$/ {exit} /^problem_type:[[:space:]]*[^[:space:]]/ {kind=1} /^date:[[:space:]]*[^[:space:]]/ {date=1} END {exit !(kind && date)}' "$doc" || { echo 'Missing problem_type or date in frontmatter.' >&2; exit 1; }
grep -Eq 'NaN|amount' "$doc" || { echo 'Missing the amount incident in the solution.' >&2; exit 1; }
grep -Eq 'docs/solutions|Documentation complete|published' <<<"${EVAL_FINAL_MESSAGE:-}" || { echo 'Missing publication report.' >&2; exit 1; }

baseline="$skill_dir/evals/fixtures/repos/solved-ledger/src/server.js"
[[ -f "$baseline" ]] || { echo 'Original fixture unavailable; source identity not verified.' >&2; exit 2; }
[[ -f src/server.js && ! -L src/server.js ]] && cmp -s "$baseline" src/server.js || { echo 'Fixture source changed.' >&2; exit 1; }
