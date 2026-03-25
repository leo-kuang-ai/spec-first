#!/usr/bin/env python3
"""
Developer management utilities.

Provides:
    init_global_developer - Initialize global developer (~/.spec-first/)
    init_developer        - Initialize developer (project-level)
    ensure_developer      - Ensure developer is initialized (exit if not)
    show_developer_info   - Show developer information
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

from .paths import (
    DIR_WORKFLOW,
    DIR_WORKSPACE,
    DIR_TASKS,
    FILE_DEVELOPER,
    FILE_JOURNAL_PREFIX,
    GLOBAL_CONFIG_DIR,
    get_repo_root,
    get_developer,
    get_global_developer,
    check_developer,
    check_global_developer,
    get_global_developer_file,
)


# =============================================================================
# Global Developer Initialization
# =============================================================================

def init_global_developer(name: str, lang: str = "zh") -> bool:
    """Initialize global developer identity.

    Creates ~/.spec-first/.developer file.
    This allows all projects to share the same developer identity.

    Args:
        name: Developer name.
        lang: Language preference ('zh' or 'en'), defaults to 'zh'.

    Returns:
        True on success, False on error.
    """
    if not name:
        print("Error: developer name is required", file=sys.stderr)
        return False

    # Validate lang
    if lang not in ("zh", "en"):
        print(f"Error: lang must be 'zh' or 'en', got '{lang}'", file=sys.stderr)
        return False

    global_dev_file = get_global_developer_file()

    # Check if already exists
    if global_dev_file.is_file():
        existing = get_global_developer()
        if existing:
            print(f"Global developer already initialized: {existing}")
            print(f"  File: {global_dev_file}")
            print()
            print("To reinitialize, remove the file first:")
            print(f"  rm {global_dev_file}")
            return True

    # Create global config directory
    try:
        GLOBAL_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    except (OSError, IOError) as e:
        print(f"Error: Failed to create global config directory: {e}", file=sys.stderr)
        return False

    # Create .developer file
    initialized_at = datetime.now().isoformat()
    try:
        global_dev_file.write_text(
            f"name={name}\nlang={lang}\ninitialized_at={initialized_at}\n",
            encoding="utf-8"
        )
    except (OSError, IOError) as e:
        print(f"Error: Failed to create global developer file: {e}", file=sys.stderr)
        return False

    print(f"Global developer initialized: {name}")
    print(f"  Language: {lang}")
    print(f"  File: {global_dev_file}")
    print()
    print("All projects will now use this identity by default.")

    return True


# =============================================================================
# Project-level Developer Initialization
# =============================================================================

def init_developer(name: str, repo_root: Path | None = None, lang: str = "zh") -> bool:
    """Initialize project-level developer.

    Creates:
        - .spec-first/.developer file with developer info
        - .spec-first/workspace/<name>/ directory structure
        - Initial journal file and index.md

    Args:
        name: Developer name.
        repo_root: Repository root path. Defaults to auto-detected.
        lang: Language preference ('zh' or 'en'), defaults to 'zh'.

    Returns:
        True on success, False on error.
    """
    if not name:
        print("Error: developer name is required", file=sys.stderr)
        return False

    if repo_root is None:
        repo_root = get_repo_root()

    dev_file = repo_root / DIR_WORKFLOW / FILE_DEVELOPER
    workspace_dir = repo_root / DIR_WORKFLOW / DIR_WORKSPACE / name

    # Create .developer file
    initialized_at = datetime.now().isoformat()
    try:
        dev_file.write_text(
            f"name={name}\nlang={lang}\ninitialized_at={initialized_at}\n",
            encoding="utf-8"
        )
    except (OSError, IOError) as e:
        print(f"Error: Failed to create .developer file: {e}", file=sys.stderr)
        return False

    # Create workspace directory structure
    try:
        workspace_dir.mkdir(parents=True, exist_ok=True)
    except (OSError, IOError) as e:
        print(f"Error: Failed to create workspace directory: {e}", file=sys.stderr)
        return False

    # Create initial journal file
    journal_file = workspace_dir / f"{FILE_JOURNAL_PREFIX}1.md"
    if not journal_file.exists():
        today = datetime.now().strftime("%Y-%m-%d")
        journal_content = f"""# Journal - {name} (Part 1)

> AI development session journal
> Started: {today}

---

"""
        try:
            journal_file.write_text(journal_content, encoding="utf-8")
        except (OSError, IOError) as e:
            print(f"Error: Failed to create journal file: {e}", file=sys.stderr)
            return False

    # Create index.md with markers for auto-update
    index_file = workspace_dir / "index.md"
    if not index_file.exists():
        index_content = f"""# Workspace Index - {name}

> Journal tracking for AI development sessions.

---

## Current Status

<!-- @@@auto:current-status -->
- **Active File**: `journal-1.md`
- **Total Sessions**: 0
- **Last Active**: -
<!-- @@@/auto:current-status -->

---

## Active Documents

<!-- @@@auto:active-documents -->
| File | Lines | Status |
|------|-------|--------|
| `journal-1.md` | ~0 | Active |
<!-- @@@/auto:active-documents -->

---

## Session History

<!-- @@@auto:session-history -->
| # | Date | Title | Commits | Branch |
|---|------|-------|---------|--------|
<!-- @@@/auto:session-history -->

---

## Notes

- Sessions are appended to journal files
- New journal file created when current exceeds 2000 lines
- Use `add_session.py` to record sessions
"""
        try:
            index_file.write_text(index_content, encoding="utf-8")
        except (OSError, IOError) as e:
            print(f"Error: Failed to create index.md: {e}", file=sys.stderr)
            return False

    print(f"Developer initialized: {name}")
    print(f"  .developer file: {dev_file}")
    print(f"  Workspace dir: {workspace_dir}")

    return True


# =============================================================================
# Developer Validation
# =============================================================================

def ensure_developer(repo_root: Path | None = None) -> None:
    """Ensure developer is initialized (project or global), exit if not.

    Args:
        repo_root: Repository root path. Defaults to auto-detected.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    if not check_developer(repo_root):
        print("Error: Developer not initialized.", file=sys.stderr)
        print()
        print("Quick setup (global - recommended):", file=sys.stderr)
        print("  spec-first init --global -u <your-name>", file=sys.stderr)
        print()
        print("Or project-level only:", file=sys.stderr)
        print(f"  python3 ./{DIR_WORKFLOW}/scripts/init_developer.py <your-name>", file=sys.stderr)
        sys.exit(1)


def show_developer_info(repo_root: Path | None = None) -> None:
    """Show developer information (project and global).

    Args:
        repo_root: Repository root path. Defaults to auto-detected.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    # Check project-level
    dev_file = repo_root / DIR_WORKFLOW / FILE_DEVELOPER
    project_dev = None
    if dev_file.is_file():
        try:
            content = dev_file.read_text(encoding="utf-8")
            for line in content.splitlines():
                if line.startswith("name="):
                    project_dev = line.split("=", 1)[1].strip()
                    break
        except (OSError, IOError):
            pass

    # Check global
    global_dev = get_global_developer()

    # Display
    if project_dev:
        print(f"Developer: {project_dev} (project-level)")
        print(f"  Workspace: {DIR_WORKFLOW}/{DIR_WORKSPACE}/{project_dev}/")
        print(f"  Tasks: {DIR_WORKFLOW}/{DIR_TASKS}/")
    elif global_dev:
        print(f"Developer: {global_dev} (global)")
        print(f"  Global file: {get_global_developer_file()}")
        print(f"  Workspace: {DIR_WORKFLOW}/{DIR_WORKSPACE}/{global_dev}/")
        print(f"  Tasks: {DIR_WORKFLOW}/{DIR_TASKS}/")
    else:
        print("Developer: (not initialized)")
        print()
        print("Quick setup:")
        print("  spec-first init --global -u <your-name>")


# =============================================================================
# Main Entry (for testing)
# =============================================================================

if __name__ == "__main__":
    show_developer_info()
