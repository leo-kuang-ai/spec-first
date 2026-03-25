#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

CHECK_DIRS=(
  "packages/cli/src/templates"
  ".claude"
  ".cursor"
  ".opencode"
  ".codex"
  "marketplace/skills"
)

LEGACY_PATTERNS=(
  "\\bspec init\\b"
  "\\bspec update\\b"
  "spec --version"
)

found=0
for rel in "${CHECK_DIRS[@]}"; do
  dir="$ROOT_DIR/$rel"
  if [ ! -d "$dir" ]; then
    continue
  fi

  for pattern in "${LEGACY_PATTERNS[@]}"; do
    matches="$(
      rg -n -e "$pattern" "$dir" \
        -g "*.md" \
        -g "*.yaml" \
        -g "*.yml" \
        -g "*.toml" \
        2>/dev/null || true
    )"
    if [ -z "$matches" ]; then
      continue
    fi

    echo "❌ $rel contains legacy pattern: $pattern"
    printf '%s\n' "$matches" | head -5
    found=$((found + 1))
  done
done

if [ "$found" -eq 0 ]; then
  echo "✅ Skill docs validation passed"
else
  echo "❌ Found $found legacy pattern group(s)"
fi

exit "$found"
