#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

python3 - "$ROOT_DIR" <<'PY'
from __future__ import annotations

import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()

target_dirs = [
    "packages/cli/src/templates/claude/commands/spec",
    "packages/cli/src/templates/codex/skills/update-spec",
    "packages/cli/src/templates/cursor",
    "packages/cli/src/templates/iflow/commands/spec",
    "packages/cli/src/templates/opencode/commands/spec",
    "packages/cli/src/templates/codex/commands/spec",
    "packages/cli/src/templates/kilo/workflows",
    "packages/cli/src/templates/kiro/skills/update-spec",
    "packages/cli/src/templates/kiro/commands/spec",
    "packages/cli/src/templates/gemini/commands/spec",
    "packages/cli/src/templates/antigravity/workflows",
    "packages/cli/src/templates/qoder/commands/spec",
    "packages/cli/src/templates/qoder/skills/update-spec",
    "packages/cli/src/templates/codebuddy/commands/spec",
    ".claude/commands/spec",
    ".cursor",
    ".opencode/commands/spec",
    ".codex/commands/spec",
    "marketplace/skills",
]

suffixes = {".md", ".yaml", ".yml", ".toml"}
replacements = [
    ("spec init", "spec-first init"),
    ("spec update", "spec-first update"),
    ("spec --version", "spec-first --version"),
    ("@mindfoldhq/trellis", "@leokuang/spec-first"),
    ("TRELLIS FEATURE LAYERS", "SPEC-FIRST FEATURE LAYERS"),
]

seen: set[Path] = set()
files: list[Path] = []
for rel in target_dirs:
    base = root / rel
    if not base.is_dir():
        continue
    for path in base.rglob("*"):
        if path in seen or path.suffix not in suffixes or not path.is_file():
            continue
        seen.add(path)
        files.append(path)

updated: list[Path] = []
for path in sorted(files):
    original = path.read_text(encoding="utf-8")
    updated_text = original
    for old, new in replacements:
        updated_text = updated_text.replace(old, new)
    if updated_text != original:
        path.write_text(updated_text, encoding="utf-8")
        updated.append(path)
        print(f"updated: {path.relative_to(root)}")

print(f"updated_files={len(updated)}")
PY
