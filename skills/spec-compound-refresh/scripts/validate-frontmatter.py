#!/usr/bin/env python3
"""Validate spec-first docs/solutions frontmatter for parser-safety issues.

Usage:
    python3 validate-frontmatter.py <doc-path>

Exit codes:
    0: frontmatter passes parser-safety checks
    1: validation failure, with diagnostics on stderr
    2: usage error, such as bad arguments or missing file

Scope: this script catches frontmatter that strict YAML parsers can silently
misread. It does not validate required fields or enum values; those remain
separate schema concerns. The goal is to prevent silent data loss from YAML
quoting rules.

Intentional copy: byte-identical copies live at
skills/spec-compound/scripts/validate-frontmatter.py and
skills/spec-compound-refresh/scripts/validate-frontmatter.py. The skill
projection mechanism only ships each skill's own scripts/, so the two skills
cannot share one file. Edit both copies together; tests/unit/frontmatter-validator.test.js
asserts they stay byte-identical.
"""

import os
import re
import sys


def usage_fail(msg: str) -> "NoReturn":
    sys.stderr.write(f"validate-frontmatter: {msg}\n")
    sys.exit(2)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        usage_fail(f"usage: {os.path.basename(argv[0])} <doc-path>")

    doc_path = argv[1]
    if not os.path.isfile(doc_path):
        usage_fail(f"file not found: {doc_path}")

    # 显式 UTF-8:Windows 非 UTF-8 locale 下默认编码可能误读或抛 UnicodeDecodeError,
    # 而 docs/solutions frontmatter 常含中文。newline='' 保留原始换行,交由下方逻辑处理。
    with open(doc_path, encoding="utf-8", newline="") as f:
        text = f.read()

    lines = text.split("\n")
    if not lines or lines[0].rstrip() != "---":
        sys.stderr.write(
            f"FAIL: {doc_path}\n"
            "  file does not start with '---' frontmatter delimiter line\n"
        )
        return 1

    end_idx: int | None = None
    for i in range(1, len(lines)):
        if lines[i].rstrip() == "---":
            end_idx = i
            break

    if end_idx is None:
        sys.stderr.write(
            f"FAIL: {doc_path}\n"
            "  frontmatter not closed (no '---' line after the opening delimiter)\n"
        )
        return 1

    issues: list[str] = []
    frontmatter_text = "\n".join(lines[1:end_idx])

    # 只检查顶层 scalar，避免把 nested list / block 当成 frontmatter 标量。
    for lineno, line in enumerate(frontmatter_text.split("\n"), start=2):
        stripped = line.lstrip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in line:
            continue
        if line.startswith((" ", "\t")):
            continue
        if stripped.startswith("- "):
            continue

        key, _, val = line.partition(":")
        val_stripped = val.strip()
        if not val_stripped:
            continue
        if val_stripped[0] in '"\'[{|>':
            continue

        if re.search(r"\s#", val_stripped):
            issues.append(
                f"line {lineno}: '{key.strip()}' value contains ' #' - quote it. "
                "YAML treats space-then-# as a comment delimiter and silently "
                "drops the rest of the value."
            )
        if re.search(r":\s", val_stripped):
            issues.append(
                f"line {lineno}: '{key.strip()}' value contains ': ' - quote it. "
                "Strict YAML parsers may treat this as a nested mapping."
            )

    if issues:
        sys.stderr.write(f"FAIL: {doc_path}\n")
        for issue in issues:
            sys.stderr.write(f"  {issue}\n")
        return 1

    print(f"OK: {doc_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
