#!/usr/bin/env python3
"""Validate cited claims in a solution doc against the git tree.

Usage:
    python3 validate-doc-claims.py <doc-path> [--repo-root <repo>] [--target-path <final-path>]

Exit codes:
    0 — nothing flagged
    1 — one or more flags need adjudication (report on stdout)
    2 — usage error (bad arguments, missing file)

Scope: mechanical grounding checks on a written doc's *body*. Complements
validate-frontmatter.py (parser-safety) — this script checks the body's
citations against the repository:

    1. Cited repo-relative paths (backticked, containing at least one '/')
       exist in the working tree; tokens containing '../' resolve from the
       doc's directory (those escaping the repo are skipped). Misses tracked
       at HEAD or the upstream default branch still count as real paths and
       are classified (deleted/uncommitted vs stale checkout). Tokens
       missing everywhere are flagged only when path-shaped; slash-delimited
       identifiers (branch names, git refs, provider/model IDs) are skipped.
    2. Cited commit SHAs (7-40 hex chars with at least one digit and one
       a-f letter) resolve to commits, classified by reachability from
       HEAD and the upstream default branch.
    3. Relative markdown link targets resolve from the doc's location.
    4. Dangling drafting scaffold: "Learning(s) N" numbering and unresolved
       {{...}} placeholder tokens. Inline code spans and fenced code blocks are
       masked first, so documented syntax is not mistaken for leaked scaffold.

Flags are adjudication input, NOT hard failures — a doc may legitimately
cite a path deleted by the very fix it documents. The calling agent
decides per flag: fix, annotate as historical, or confirm intentional.
Only the summary exit code distinguishes "clean" from "needs a look".

The script never touches the network (no fetch); classification uses local refs.
Private candidates supply the target repo and intended final path explicitly.
Unresolved hex tokens with explicit commit cues are flags; other tokens remain
advisory notes. Cue detection is not a semantic judgment or proof of fabrication.
Pure stdlib (no third-party deps).
"""
import os
import argparse
import re
import subprocess
import sys

# Tokens containing these are placeholders/examples, not real citations.
PLACEHOLDER_CHARS = set("<>{}*$")
PLACEHOLDER_SUBSTRINGS = ("path/to", "...", "…")

SHA_RE = re.compile(r"\b[0-9a-f]{7,40}\b")
COMMIT_CUE_RE = re.compile(
    r"(?:\b(?:commit|commits|revision|rev|cherry-pick|revert)\b|提交|提交哈希)"
    r"(?:\s+(?:sha|hash))?[\s:`'\"#]*$",
    re.IGNORECASE,
)
LANDING_CUE_RE = re.compile(
    r"\b(?:fixed|landed|introduced|shipped|merged|resolved|reverted)"
    r"\s+(?:in|by|at|with)[\s:`'\"]*$", re.IGNORECASE,
)
REPO_PIN_RE = re.compile(r"(?<![\w./@-])[\w.-]+/[\w.-]+@$")
BACKTICK_RE = re.compile(r"`([^`\n]+)`")
MD_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})(.*)$")
SCAFFOLD_RES = (
    re.compile(r"\bLearnings?\s+#?\d"),
    re.compile(r"\{\{[^}\n]*\}\}"),
)


def usage_fail(msg: str) -> "NoReturn":
    sys.stderr.write(f"validate-doc-claims: {msg}\n")
    sys.exit(2)


def cites_a_commit(prefix: str) -> bool:
    return bool(
        COMMIT_CUE_RE.search(prefix)
        or LANDING_CUE_RE.search(prefix)
        or REPO_PIN_RE.search(prefix)
    )


def git(args: list[str], cwd: str) -> tuple[int, str]:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=30,
        )
        return result.returncode, result.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        return 1, ""


def split_body(text: str) -> tuple[str, int]:
    """Return (body, 1-indexed line number the body starts on).

    Skips YAML frontmatter when present so frontmatter fields are not
    scanned as body citations.
    """
    lines = text.split("\n")
    if lines and lines[0].rstrip() == "---":
        for i in range(1, len(lines)):
            if lines[i].rstrip() == "---":
                return "\n".join(lines[i + 1 :]), i + 2
    return text, 1


def is_path_candidate(token: str) -> bool:
    if any(ch.isspace() for ch in token):
        return False
    if "/" not in token:
        return False
    if "://" in token or token.startswith(("http", "#", "/", "~")):
        return False
    if token.startswith(("origin/", "upstream/", "refs/")):
        return False  # git refs, not repo paths
    if PLACEHOLDER_CHARS & set(token):
        return False
    if any(sub in token for sub in PLACEHOLDER_SUBSTRINGS):
        return False
    return True


def is_path_shaped(token: str, base: str) -> bool:
    """Distinguish a path citation from a slash-delimited identifier
    (branch name, provider/model ID) among tokens found nowhere in git."""
    segments = token.split("/")
    if re.search(r"\.[A-Za-z0-9]{1,8}$", segments[-1]):
        return True
    if token.endswith("/"):
        return True
    return os.path.isdir(os.path.join(base, segments[0]))


def mask_code(lines: list[str]) -> list[str]:
    """Mask fenced and inline code while preserving line positions."""
    masked: list[str] = []
    fence: str | None = None
    for line in lines:
        match = FENCE_RE.match(line)
        if fence is None and match:
            fence = match.group(1)
            masked.append(" " * len(line))
            continue
        if fence is not None:
            if (
                match
                and match.group(1)[0] == fence[0]
                and len(match.group(1)) >= len(fence)
                and not match.group(2).strip()
            ):
                fence = None
            masked.append(" " * len(line))
            continue
        masked.append(BACKTICK_RE.sub(lambda value: " " * len(value.group(0)), line))
    return masked


def normalize_path(token: str) -> str:
    token = token.strip().rstrip(".,;")
    token = re.sub(r":\d+(-\d+)?$", "", token)  # strip `:line` / `:a-b` refs
    if token.startswith("./"):
        token = token[2:]
    return token


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('doc_path')
    parser.add_argument('--repo-root')
    parser.add_argument('--target-path')
    args = parser.parse_args(argv[1:])
    doc_path = args.doc_path
    if args.repo_root:
        args.repo_root = os.path.abspath(args.repo_root)
        if not os.path.isdir(args.repo_root) or not os.access(args.repo_root, os.R_OK | os.X_OK):
            usage_fail("explicit repo-root is not a readable directory")
    if not os.path.isfile(doc_path):
        usage_fail(f"file not found: {doc_path}")

    with open(doc_path, encoding="utf-8", errors="replace") as f:
        text = f.read()

    target_path = args.target_path or doc_path
    if args.target_path and args.repo_root and not os.path.isabs(target_path):
        target_path = os.path.join(args.repo_root, target_path)
    doc_dir = os.path.dirname(os.path.abspath(target_path))
    body, body_start = split_body(text)
    body_lines = body.split("\n")

    def loc_suffix(needle: str) -> str:
        for i, line in enumerate(body_lines):
            if needle in line:
                return f" (line {body_start + i})"
        return ""

    infos: list[str] = []
    notes: list[str] = []
    flags: list[str] = []

    # --- Repo context -----------------------------------------------------
    code, repo_root = git(["rev-parse", "--show-toplevel"], args.repo_root or doc_dir)
    in_git = code == 0 and bool(repo_root)
    upstream: str | None = None
    if in_git:
        code, ref = git(["rev-parse", "--abbrev-ref", "origin/HEAD"], repo_root)
        if code == 0 and ref:
            upstream = ref
        else:
            for candidate in ("origin/main", "origin/master"):
                code, _ = git(
                    ["rev-parse", "--verify", "--quiet", candidate], repo_root
                )
                if code == 0:
                    upstream = candidate
                    break
        if upstream:
            code, behind = git(
                ["rev-list", "--count", f"HEAD..{upstream}"], repo_root
            )
            if code == 0 and behind.isdigit() and int(behind) > 0:
                infos.append(
                    f"INFO: worktree is {behind} commits behind {upstream} — "
                    "verify merge-state claims against remote truth (gh pr view), "
                    "not this checkout"
                )
        else:
            infos.append(
                "INFO: no upstream default branch found — "
                "path/SHA classification limited to HEAD"
            )
    else:
        infos.append(
            "INFO: Git path/SHA classification unavailable — no usable Git context; "
            "commit claims remain unverified (filesystem, scaffold and link checks still apply)"
        )

    def upstream_has_path(path: str) -> bool:
        if not (in_git and upstream):
            return False
        code, _ = git(["cat-file", "-e", f"{upstream}:{path}"], repo_root)
        return code == 0

    def head_has_path(path: str) -> bool:
        if not in_git:
            return False
        code, _ = git(["cat-file", "-e", f"HEAD:{path}"], repo_root)
        return code == 0

    # --- 1. Cited repo paths ----------------------------------------------
    checked_paths = 0
    seen_paths: set[str] = set()
    base = repo_root if in_git else (args.repo_root or os.getcwd())
    for raw in BACKTICK_RE.findall(body):
        token = normalize_path(raw)
        if os.path.isabs(token):
            relative = os.path.relpath(os.path.realpath(token), os.path.realpath(base))
            if relative != ".." and not relative.startswith(".." + os.sep):
                token = "./" + relative
        if not is_path_candidate(token):
            continue
        check = token
        if token.startswith("../") or "/../" in token:
            # A `../` citation is doc-relative (matching how markdown links
            # resolve), so map it to a repo-root path before checking.
            resolved = os.path.realpath(os.path.join(doc_dir, token))
            check = os.path.relpath(resolved, os.path.realpath(base))
            if check == ".." or check.startswith(".." + os.sep):
                continue  # escapes the repo — not checkable as a repo path
        if check in seen_paths:
            continue
        seen_paths.add(check)
        if os.path.exists(os.path.join(base, check)):
            checked_paths += 1
            continue
        tracked_head = head_has_path(check)
        tracked_upstream = upstream_has_path(check)
        if not (tracked_head or tracked_upstream) and not is_path_shaped(
            check, base
        ):
            continue  # branch name / provider ID, not a path citation
        checked_paths += 1
        loc = loc_suffix(raw)
        if tracked_head:
            flags.append(
                f"FLAG path `{token}`{loc} — tracked at HEAD but missing from "
                "the working tree: deleted or uncommitted removal? Annotate as "
                "historical (e.g. removed by this fix) or restore it."
            )
        elif tracked_upstream:
            flags.append(
                f"FLAG path `{token}`{loc} — not in working tree but exists at "
                f"{upstream}: stale checkout? Annotate or verify against upstream."
            )
        else:
            where = (
                f"working tree or {upstream}" if upstream else "working tree"
            )
            flags.append(
                f"FLAG path `{token}`{loc} — not found in {where}. Fix the "
                "citation, or annotate it as historical (e.g. removed by this fix)."
            )

    # --- 2. Cited commit SHAs ----------------------------------------------
    checked_shas = 0
    seen_shas: dict[str, tuple[int, bool]] = {}
    if in_git:
        for m in SHA_RE.finditer(body):
            sha = m.group(0)
            if not (any(c.isdigit() for c in sha) and any(c in "abcdef" for c in sha)):
                continue  # dates and decimal ids are not SHAs
            line_start = body.rfind("\n", 0, m.start()) + 1
            cited = cites_a_commit(body[line_start:m.start()])
            line_number = body_start + body.count("\n", 0, m.start())
            # 同一编号后续被明确用作提交引用时，保留更强信号及其行号。
            if sha not in seen_shas or (cited and not seen_shas[sha][1]):
                seen_shas[sha] = (line_number, cited)
        for sha, (line_number, cited) in seen_shas.items():
            checked_shas += 1
            loc = f" (line {line_number})"
            code, _ = git(["cat-file", "-e", f"{sha}^{{commit}}"], repo_root)
            if code != 0:
                if cited:
                    flags.append(
                        f"FLAG sha {sha}{loc} — explicitly cited as a commit but "
                        "does not resolve in this repository. Verify the citation; "
                        "correct, soften, or drop an unsupported claim."
                    )
                else:
                    notes.append(
                        f"NOTE hex {sha}{loc} — does not resolve to a commit in this "
                        "repository; may be a session/content identifier. Adjudicate "
                        "whether the document actually cites a commit and verify that claim."
                    )
                continue
            in_head = (
                git(["merge-base", "--is-ancestor", sha, "HEAD"], repo_root)[0] == 0
            )
            in_up = (
                upstream is not None
                and git(["merge-base", "--is-ancestor", sha, upstream], repo_root)[0]
                == 0
            )
            if in_head and (in_up or upstream is None):
                continue
            if in_head and not in_up:
                flags.append(
                    f"FLAG sha {sha}{loc} — reachable from HEAD but not {upstream}: "
                    "local-only commit whose SHA may be rewritten on merge "
                    "(rebase/squash). Prefer citing the PR number."
                )
            elif in_up:
                flags.append(
                    f"FLAG sha {sha}{loc} — not reachable from HEAD but reachable "
                    f"from {upstream}: this checkout predates the merge. Add a "
                    "temporal qualifier or verify the claim via gh."
                )
            else:
                flags.append(
                    f"FLAG sha {sha}{loc} — exists but unreachable from HEAD"
                    + (f" or {upstream}" if upstream else "")
                    + ": likely a rebased-away commit. Prefer citing the PR number."
                )

    # --- 3. Relative markdown links -----------------------------------------
    checked_links = 0
    seen_links: set[str] = set()
    for target in MD_LINK_RE.findall(body):
        if re.match(r"^[a-z][a-z0-9+.-]*:", target, re.IGNORECASE):
            continue  # URL scheme
        if target.startswith("#"):
            continue  # intra-doc anchor
        bare = target.split("#", 1)[0]
        if not bare or bare in seen_links:
            continue
        seen_links.add(bare)
        checked_links += 1
        if not os.path.exists(os.path.normpath(os.path.join(doc_dir, bare))):
            loc = loc_suffix(target)
            flags.append(
                f"FLAG link ({target}){loc} — relative target does not resolve "
                "from the doc's location. Fix the path."
            )

    # --- 4. Dangling drafting scaffold ---------------------------------------
    for i, line_text in enumerate(mask_code(body_lines)):
        for pattern in SCAFFOLD_RES:
            m = pattern.search(line_text)
            if m:
                flags.append(
                    f'FLAG scaffold "{m.group(0)}" (line {body_start + i}) — '
                    "drafting-context reference leaked into the doc. Rewrite it "
                    "as a real path or link."
                )

    # --- Report ---------------------------------------------------------------
    for info in infos:
        print(info)
    for note in notes:
        print(note)
    for flag in flags:
        print(flag)
    print(
        f"checked {checked_paths} paths, {checked_shas} SHAs, "
        f"{checked_links} links; {len(flags)} flags"
    )
    if flags:
        return 1
    print(f"OK: {doc_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
