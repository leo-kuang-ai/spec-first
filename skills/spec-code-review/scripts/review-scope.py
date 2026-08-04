#!/usr/bin/env python3
"""Compute fail-closed, deterministic scope signals for spec-code-review."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path


CODE_EXTENSIONS = {
    ".rb", ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".rs",
    ".java", ".swift", ".kt", ".c", ".cc", ".cpp", ".cs", ".php",
    ".ex", ".exs", ".scala",
}

SIGNAL_PATTERNS = {
    "migrations": re.compile(
        r"db/migrate/|schema\.(rb|sql)|/migrations?/|alembic|flyway|liquibase",
        re.I,
    ),
    "frontend": re.compile(
        r"\.(tsx|jsx|vue|svelte|css|scss|html|erb|haml)$|/components?/|stimulus|turbo",
        re.I,
    ),
    "api": re.compile(
        r"/(routes?|controllers?|api|serializers?|graphql)/|\.proto$|openapi|swagger",
        re.I,
    ),
    "swift-ios": re.compile(r"\.(swift|kt|pbxproj|xcconfig|entitlements)$", re.I),
}

TEST_PATTERN = re.compile(
    r"(^|/)(tests?|spec|__tests__)/|(^|/)[^/]+[._-](test|spec)\.[^/]+$",
    re.I,
)
AGENT_SURFACE_PATTERN = re.compile(
    r"(^|/)(skills?|agents?|prompts?|tools?|mcp|commands?)(/|$)|SKILL\.md$|"
    r"(^|/)(AGENTS|CLAUDE|GEMINI)\.md$|\.cursor/|\.codex-plugin/|\.claude-plugin/",
    re.I,
)


def git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args], capture_output=True, text=True, check=False
    )


def git_bytes(*args: str) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["git", *args], capture_output=True, text=False, check=False
    )


def commit_sha(ref: str) -> str | None:
    result = git("rev-parse", "--verify", f"{ref}^{{commit}}")
    if result.returncode != 0 or not result.stdout.strip():
        return None
    return result.stdout.strip()


def unique_merge_base(base: str, head: str) -> str | None:
    result = git("merge-base", "--all", base, head)
    candidates = [line for line in result.stdout.splitlines() if line]
    if result.returncode != 0 or len(candidates) != 1:
        return None
    return candidates[0]


def repo_root() -> Path:
    """Resolve the current Git root, falling back to the current directory."""
    result = git("rev-parse", "--show-toplevel")
    if result.returncode == 0 and result.stdout.strip():
        return Path(result.stdout.strip()).resolve()
    return Path.cwd().resolve()


def has_learnings_corpus() -> bool:
    """Return whether the fixed repo-owned docs/solutions corpus exists."""
    repo = repo_root()
    return (repo / "docs" / "solutions").is_dir()


def fail_closed(reason: str, learnings_corpus: bool = False) -> dict[str, object]:
    return {
        "status": "unknown",
        "reason": reason,
        "exec_lines": None,
        "uncounted_files": 1,
        "changed_files": [],
        "signals": [],
        "test_files_changed": False,
        "agent_surface": False,
        "has_learnings_corpus": learnings_corpus,
        "lite_eligible": False,
    }


def resolve_diff_args(base: str, head: str | None) -> tuple[list[str] | None, str | None]:
    base_sha = commit_sha(base) if base else None
    if base_sha is None:
        return None, "invalid base endpoint"
    head_sha = commit_sha(head) if head else None
    if head is not None and head_sha is None:
        return None, "invalid head endpoint"
    if head_sha is None:
        return [base_sha], None
    merge_base = unique_merge_base(base_sha, head_sha)
    if merge_base is None:
        return None, "merge base unavailable or ambiguous"
    return [merge_base, head_sha], None


def compute_scope(base: str, head: str | None) -> tuple[dict[str, object] | None, str | None]:
    diff_args, reason = resolve_diff_args(base, head)
    if diff_args is None:
        return None, reason

    names = git("diff", "--name-only", *diff_args)
    numstat = git("diff", "--numstat", *diff_args)
    patch = git_bytes("diff", "--binary", "--full-index", *diff_args)
    if names.returncode != 0 or numstat.returncode != 0 or patch.returncode != 0:
        return None, "git diff failed"

    files = sorted(line for line in names.stdout.splitlines() if line)
    return {
        "base": diff_args[0],
        "head": diff_args[1] if len(diff_args) == 2 else None,
        "diff_args": diff_args,
        "changed_files": files,
        "files_changed": len(files),
        "numstat": numstat.stdout,
        "diff_sha256": "sha256:" + hashlib.sha256(patch.stdout).hexdigest(),
    }, None


def write_snapshot(path_value: str, scope: dict[str, object]) -> None:
    requested_target = Path(path_value).expanduser()
    if requested_target.is_symlink():
        raise ValueError("snapshot target must not be a symlink")
    if not requested_target.is_absolute():
        requested_target = Path.cwd() / requested_target
    target = requested_target.parent.resolve() / requested_target.name
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.is_symlink():
        raise ValueError("snapshot target must not be a symlink")
    payload = {
        "schema_version": "spec-code-review-scope-snapshot/v1",
        "base": scope["base"],
        "head": scope["head"],
        "diff_sha256": scope["diff_sha256"],
        "changed_files": scope["changed_files"],
        "files_changed": scope["files_changed"],
    }
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=target.parent, delete=False
    ) as handle:
        json.dump(payload, handle, sort_keys=True)
        handle.write("\n")
        temp_path = Path(handle.name)
    os.replace(temp_path, target)


def verify_snapshot(path_value: str) -> dict[str, object]:
    path = Path(path_value).expanduser().resolve()
    try:
        snapshot = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return {
            "status": "unknown",
            "reason_code": "scope_snapshot_unreadable",
            "reason": str(error),
            "mutation_detected": None,
            "mutated_paths": [],
        }
    if snapshot.get("schema_version") != "spec-code-review-scope-snapshot/v1":
        return {
            "status": "unknown",
            "reason_code": "scope_snapshot_invalid",
            "reason": "unsupported scope snapshot schema",
            "mutation_detected": None,
            "mutated_paths": [],
        }
    scope, reason = compute_scope(snapshot.get("base"), snapshot.get("head"))
    if scope is None:
        return {
            "status": "unknown",
            "reason_code": "scope_snapshot_recheck_failed",
            "reason": reason,
            "mutation_detected": None,
            "mutated_paths": [],
        }
    expected_files = sorted(snapshot.get("changed_files") or [])
    observed_files = sorted(scope["changed_files"])
    mutation_detected = (
        snapshot.get("diff_sha256") != scope["diff_sha256"]
        or expected_files != observed_files
    )
    mutated_paths = sorted(set(expected_files) | set(observed_files)) if mutation_detected else []
    return {
        "status": "complete",
        "reason_code": "reviewer_mutation_detected" if mutation_detected else None,
        "mutation_detected": mutation_detected,
        "mutated_paths": mutated_paths,
        "expected_diff_sha256": snapshot.get("diff_sha256"),
        "observed_diff_sha256": scope["diff_sha256"],
        "expected_files_changed": snapshot.get("files_changed"),
        "observed_files_changed": scope["files_changed"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base")
    parser.add_argument("--head")
    parser.add_argument("--snapshot-out")
    parser.add_argument("--verify-snapshot")
    args = parser.parse_args()

    if args.verify_snapshot:
        print(json.dumps(verify_snapshot(args.verify_snapshot), sort_keys=True))
        return 0

    learnings_corpus = has_learnings_corpus()
    if not args.base:
        print(json.dumps(fail_closed("base endpoint required", learnings_corpus), sort_keys=True))
        return 0
    scope, reason = compute_scope(args.base, args.head)
    if scope is None:
        print(json.dumps(fail_closed(reason or "scope computation failed", learnings_corpus), sort_keys=True))
        return 0

    files = scope["changed_files"]
    executable_lines = 0
    for line in str(scope["numstat"]).splitlines():
        parts = line.split("\t")
        if len(parts) < 3 or Path(parts[2]).suffix.lower() not in CODE_EXTENSIONS:
            continue
        try:
            executable_lines += int(parts[0]) + int(parts[1])
        except ValueError:
            # Binary/unknown counts fail the lite gate through uncounted_files below.
            pass

    uncounted = sum(
        1 for file in files if Path(file).suffix.lower() not in CODE_EXTENSIONS
    )
    signals = [
        name
        for name, pattern in SIGNAL_PATTERNS.items()
        if any(pattern.search(file) for file in files)
    ]
    lite = 1 <= executable_lines <= 39 and uncounted == 0 and not signals

    result = {
        "status": "complete",
        "reason": None,
        "exec_lines": executable_lines,
        "uncounted_files": uncounted,
        "changed_files": files,
        "files_changed": scope["files_changed"],
        "diff_sha256": scope["diff_sha256"],
        "signals": signals,
        "test_files_changed": any(TEST_PATTERN.search(file) for file in files),
        "agent_surface": any(AGENT_SURFACE_PATTERN.search(file) for file in files),
        "has_learnings_corpus": learnings_corpus,
        "lite_eligible": lite,
        "snapshot_written": False,
    }
    if args.snapshot_out:
        try:
            write_snapshot(args.snapshot_out, scope)
            result["snapshot_written"] = True
        except (OSError, ValueError) as error:
            print(json.dumps(fail_closed(f"scope snapshot write failed: {error}", learnings_corpus), sort_keys=True))
            return 0
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
