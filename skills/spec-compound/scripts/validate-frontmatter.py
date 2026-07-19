#!/usr/bin/env python3
"""Validate spec-compound docs/solutions/ frontmatter.

Usage:
    python3 validate-frontmatter.py <doc-path>
    python3 validate-frontmatter.py --promotion <doc-path>

Exit codes:
    0 — frontmatter passes all checks
    1 — validation failure (diagnostics on stderr)
    2 — usage error (bad arguments, missing file)

Default scope catches *parser-safety* issues — frontmatter that strict YAML
parsers will silently misread. Promotion mode adds the two mechanically
enforceable knowledge-promotion exit fields without turning this script into
a general schema or semantic validator:

    source_refs: non-empty top-level array of non-empty strings
    invalidation_condition: non-empty top-level string or block scalar

The script does not judge whether a reference is trustworthy or whether an
invalidation condition is semantically sufficient. Those remain LLM/human
judgments above this deterministic floor. Default mode stays parser-safety
only so untouched legacy docs remain compatible.

Default checks (regex-based, no YAML parser dependency):
    1. File starts and ends frontmatter with `---` lines (matched as full
       lines, not substrings — `----` and `---extra` are rejected)
    2. No top-level scalar value contains ` #` unquoted (silent comment
       truncation — what Codex caught on PR #695)
    3. No top-level scalar value contains `: ` unquoted (mapping confusion —
       what surfaced in a 2026-04-16 plan doc's `title:` field)

Default mode does NOT flag values starting with YAML reserved indicators
(`` ` ``, `*`, `&`, `!`, etc.) because those produce loud parser errors
downstream rather than silent corruption. Promotion mode conservatively
rejects such shapes when they would prevent a `source_refs` item from being
a string; it still does not attempt general YAML linting.

Pure-stdlib (no PyYAML or other third-party deps). Runs in <50ms typical.
Designed to produce concrete, actionable error messages so the calling
agent can fix and retry without ambiguity.
"""
import json
import os
import re
import sys
from typing import Optional


PROMOTION_SOURCE_REFS_ERROR = (
    "promotion requires non-empty top-level 'source_refs' array"
)
PROMOTION_INVALIDATION_ERROR = (
    "promotion requires non-empty top-level 'invalidation_condition'"
)
TOP_LEVEL_FIELD_RE = re.compile(
    r"^(?P<key>\"(?:[^\"\\]|\\.)*\"|'(?:[^']|'')*'|"
    r"[A-Za-z_][A-Za-z0-9_-]*)[ \t]*:(?:[ \t]*(?P<value>.*))?$"
)
BLOCK_SCALAR_RE = re.compile(r"^[|>](?:[1-9][+-]?|[+-][1-9]?)?$")
NON_STRING_SCALAR_RE = re.compile(
    r"^(?:null|~|true|false|yes|no|on|off|[-+]?(?:\.inf|\.nan|0b[01_]+|"
    r"0o[0-7_]+|0x[0-9a-f_]+|(?:\d[\d_]*)(?:\.[\d_]*)?(?:e[-+]?\d+)?|"
    r"\.\d+(?:e[-+]?\d+)?|\d[\d_]*(?::[0-5]?\d)+(?:\.\d+)?))$",
    re.IGNORECASE,
)
TIMESTAMP_SCALAR_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}(?:$|(?:[Tt]|[ \t]+)\d{1,2}:\d{2}:\d{2})"
)


def usage_fail(msg: str) -> "NoReturn":
    sys.stderr.write(f"validate-frontmatter: {msg}\n")
    sys.exit(2)


def parse_args(argv: list[str]) -> tuple[bool, str]:
    args = argv[1:]
    promotion = False
    if args and args[0] == "--promotion":
        promotion = True
        args = args[1:]
    if len(args) != 1 or args[0].startswith("-"):
        usage_fail(
            f"usage: {os.path.basename(argv[0])} [--promotion] <doc-path>"
        )
    return promotion, args[0]


def strip_yaml_comment(value: str) -> str:
    """Strip an unquoted YAML comment from one scalar/flow line."""
    single = False
    double = False
    escaped = False
    for index, char in enumerate(value):
        if escaped:
            escaped = False
            continue
        if char == "\\" and double:
            escaped = True
            continue
        if char == "'" and not double:
            single = not single
            continue
        if char == '"' and not single:
            double = not double
            continue
        if char == "#" and not single and not double:
            if index == 0 or value[index - 1].isspace():
                return value[:index].rstrip()
    return value.rstrip()


def decode_top_level_key(raw_key: str) -> Optional[str]:
    if raw_key.startswith('"'):
        inner = raw_key[1:-1]
        inner = re.sub(
            r"\\x([0-9a-fA-F]{2})|\\U([0-9a-fA-F]{8})",
            lambda match: chr(int(match.group(1) or match.group(2), 16)),
            inner,
        )
        try:
            parsed = json.loads(f'"{inner}"')
        except (json.JSONDecodeError, TypeError, ValueError):
            return None
        return parsed if isinstance(parsed, str) else None
    if raw_key.startswith("'"):
        return raw_key[1:-1].replace("''", "'")
    return raw_key


def non_empty_yaml_string(raw_value: str) -> bool:
    value = strip_yaml_comment(raw_value).strip()
    if not value:
        return False
    if value.startswith('"'):
        try:
            parsed = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return False
        return isinstance(parsed, str) and bool(parsed.strip())
    if value.startswith("'"):
        if len(value) < 2 or not value.endswith("'"):
            return False
        return bool(value[1:-1].replace("''", "'").strip())
    if value[0] in "[{|>&*!?%@`":
        return False
    if re.search(r":\s", value) or re.match(r"^[-:]\s", value):
        return False
    return not (
        NON_STRING_SCALAR_RE.fullmatch(value)
        or TIMESTAMP_SCALAR_RE.match(value)
    )


def split_flow_array(raw_value: str) -> Optional[list[str]]:
    value = strip_yaml_comment(raw_value).strip()
    if not value.startswith("[") or not value.endswith("]"):
        return None
    inner = value[1:-1].strip()
    if not inner:
        return []

    items: list[str] = []
    current: list[str] = []
    single = False
    double = False
    escaped = False
    for char in inner:
        if escaped:
            current.append(char)
            escaped = False
            continue
        if char == "\\" and double:
            current.append(char)
            escaped = True
            continue
        if char == "'" and not double:
            single = not single
            current.append(char)
            continue
        if char == '"' and not single:
            double = not double
            current.append(char)
            continue
        if char == "," and not single and not double:
            items.append("".join(current).strip())
            current = []
            continue
        if char in "[]{}" and not single and not double:
            return None
        current.append(char)

    if single or double or escaped:
        return None
    items.append("".join(current).strip())
    return items


def collect_top_level_fields(
    fm_lines: list[str],
) -> dict[str, list[tuple[int, str]]]:
    fields: dict[str, list[tuple[int, str]]] = {}
    for index, line in enumerate(fm_lines):
        if (
            not line
            or line.startswith((" ", "\t"))
            or line.lstrip().startswith("#")
        ):
            continue
        match = TOP_LEVEL_FIELD_RE.fullmatch(line.rstrip())
        if not match:
            continue
        key = decode_top_level_key(match.group("key"))
        if key is None:
            continue
        fields.setdefault(key, []).append((index, match.group("value") or ""))
    return fields


def continuation_lines(fm_lines: list[str], start_index: int) -> list[str]:
    result: list[str] = []
    for line in fm_lines[start_index + 1 :]:
        if line and not line.startswith((" ", "\t")) and not line.startswith("#"):
            break
        result.append(line)
    return result


def valid_source_refs(fm_lines: list[str], occurrences: list[tuple[int, str]]) -> bool:
    if len(occurrences) != 1:
        return False
    index, raw_value = occurrences[0]
    value = strip_yaml_comment(raw_value).strip()
    if value:
        items = split_flow_array(value)
        return items is not None and bool(items) and all(
            non_empty_yaml_string(item) for item in items
        )

    items: list[str] = []
    for line in continuation_lines(fm_lines, index):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        match = re.fullmatch(r"[ \t]+-[ \t]*(.*)", line)
        if not match or not non_empty_yaml_string(match.group(1)):
            return False
        items.append(match.group(1))
    return bool(items)


def valid_invalidation_condition(
    fm_lines: list[str], occurrences: list[tuple[int, str]]
) -> bool:
    if len(occurrences) != 1:
        return False
    index, raw_value = occurrences[0]
    value = strip_yaml_comment(raw_value).strip()
    if BLOCK_SCALAR_RE.fullmatch(value):
        return any(
            line.strip() and not line.lstrip().startswith("#")
            for line in continuation_lines(fm_lines, index)
            if line.startswith((" ", "\t"))
        )
    return non_empty_yaml_string(value)


def promotion_issues(fm_lines: list[str]) -> list[str]:
    fields = collect_top_level_fields(fm_lines)
    issues: list[str] = []
    if not valid_source_refs(fm_lines, fields.get("source_refs", [])):
        issues.append(PROMOTION_SOURCE_REFS_ERROR)
    if not valid_invalidation_condition(
        fm_lines, fields.get("invalidation_condition", [])
    ):
        issues.append(PROMOTION_INVALIDATION_ERROR)
    return issues


def main(argv: list[str]) -> int:
    promotion, doc_path = parse_args(argv)
    if not os.path.isfile(doc_path):
        usage_fail(f"file not found: {doc_path}")

    with open(doc_path, encoding="utf-8") as f:
        text = f.read()

    issues: list[str] = []

    # Check 1: frontmatter delimiters. Match the delimiter as a complete
    # line whose stripped content is exactly `---` — substring matching
    # (e.g. `text.find("\n---", 4)`) would falsely accept `----` or
    # `---extra` as a terminator and let malformed docs slip through to
    # downstream parsers that require a strict `---` line.
    lines = text.split("\n")
    if not lines or lines[0].rstrip() != "---":
        sys.stderr.write(
            f"FAIL: {doc_path}\n"
            f"  file does not start with '---' frontmatter delimiter line\n"
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
            f"  frontmatter not closed (no '---' line after the opening delimiter)\n"
        )
        return 1

    fm_lines = lines[1:end_idx]

    # Checks 2 & 3: silent-corruption quoting risks on top-level scalar
    # fields. We scan line-by-line and only flag top-level mapping entries
    # (no leading whitespace) whose value isn't already quoted/structured.
    for lineno, line in enumerate(fm_lines, start=2):
        stripped = line.lstrip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in line:
            continue
        # Top-level mapping keys only — skip nested values, array items
        if line.startswith((" ", "\t")):
            continue
        # Skip pure list-marker lines like "- item" (these can't be top-level
        # in our frontmatter convention, but be defensive)
        if stripped.startswith("- "):
            continue

        key, _, val = line.partition(":")
        val_stripped = val.strip()
        if not val_stripped:
            # Key with no value on this line — likely a parent of a nested
            # block (`tags:` followed by `- foo`). Nothing to validate here.
            continue
        # Already quoted or structured (block scalar, flow collection)
        if val_stripped[0] in '"\'[{|>':
            continue

        if re.search(r"\s#", val_stripped):
            issues.append(
                f"line {lineno}: '{key.strip()}' value contains ' #' — quote it. "
                "YAML treats space-then-# as a comment delimiter and silently "
                "drops the rest of the value."
            )
        if re.search(r":\s", val_stripped):
            issues.append(
                f"line {lineno}: '{key.strip()}' value contains ': ' — quote it. "
                "Strict YAML parsers may treat this as a nested mapping."
            )

    if promotion:
        issues.extend(promotion_issues(fm_lines))

    if issues:
        sys.stderr.write(f"FAIL: {doc_path}\n")
        for issue in issues:
            sys.stderr.write(f"  {issue}\n")
        return 1

    print(f"OK: {doc_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
