#!/usr/bin/env python3
"""
Common path utilities for spec-first workflow.

Provides:
    get_repo_root          - Get repository root directory
    get_developer          - Get developer name (project > global > git)
    get_global_developer   - Get global developer name
    get_workspace_dir      - Get developer workspace directory
    get_tasks_dir          - Get tasks directory
    get_active_journal_file - Get current journal file
"""

from __future__ import annotations

import os
import re
from datetime import datetime
from pathlib import Path


# =============================================================================
# Path Constants (change here to rename directories)
# =============================================================================

# Directory names
DIR_WORKFLOW = ".spec-first"
DIR_WORKSPACE = "workspace"
DIR_TASKS = "tasks"
DIR_ARCHIVE = "archive"
DIR_SPEC = "spec"
DIR_SCRIPTS = "scripts"

# File names
FILE_DEVELOPER = ".developer"
FILE_CURRENT_TASK = ".current-task"
FILE_TASK_JSON = "task.json"
FILE_JOURNAL_PREFIX = "journal-"

# Global config directory (user home)
GLOBAL_CONFIG_DIR = Path.home() / DIR_WORKFLOW


# =============================================================================
# Repository Root
# =============================================================================

def get_repo_root(start_path: Path | None = None) -> Path:
    """Find the nearest directory containing .spec-first/ folder.

    This handles nested git repos correctly (e.g., test project inside another repo).

    Args:
        start_path: Starting directory to search from. Defaults to current directory.

    Returns:
        Path to repository root, or current directory if no .spec-first/ found.
    """
    current = (start_path or Path.cwd()).resolve()

    while current != current.parent:
        if (current / DIR_WORKFLOW).is_dir():
            return current
        current = current.parent

    # Fallback to current directory if no .spec-first/ found
    return Path.cwd().resolve()


# =============================================================================
# Global Developer (User Home)
# =============================================================================

def get_global_developer_file() -> Path:
    """Get global developer file path (~/.spec-first/.developer).

    Returns:
        Path to global developer file.
    """
    return GLOBAL_CONFIG_DIR / FILE_DEVELOPER


def get_global_developer() -> str | None:
    """Get developer name from global config (~/.spec-first/.developer).

    Returns:
        Developer name or None if not set globally.
    """
    global_dev_file = get_global_developer_file()

    if not global_dev_file.is_file():
        return None

    try:
        content = global_dev_file.read_text(encoding="utf-8")
        for line in content.splitlines():
            if line.startswith("name="):
                return line.split("=", 1)[1].strip()
    except (OSError, IOError):
        pass

    return None


def get_global_lang() -> str:
    """Get language preference from global config.

    Returns:
        Language code ('zh' or 'en'), defaults to 'zh'.
    """
    global_dev_file = get_global_developer_file()

    if not global_dev_file.is_file():
        return "zh"

    try:
        content = global_dev_file.read_text(encoding="utf-8")
        for line in content.splitlines():
            if line.startswith("lang="):
                lang = line.split("=", 1)[1].strip()
                return lang if lang in ("zh", "en") else "zh"
    except (OSError, IOError):
        pass

    return "zh"


def check_global_developer() -> bool:
    """Check if global developer is configured.

    Returns:
        True if global developer is set.
    """
    return get_global_developer() is not None


# =============================================================================
# Developer (Project-level with Global Fallback)
# =============================================================================

def get_developer(repo_root: Path | None = None) -> str | None:
    """Get developer name with fallback chain.

    Priority:
        1. Project-level: .spec-first/.developer
        2. Global: ~/.spec-first/.developer

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        Developer name or None if not initialized anywhere.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    # 1. Check project-level first
    dev_file = repo_root / DIR_WORKFLOW / FILE_DEVELOPER
    if dev_file.is_file():
        try:
            content = dev_file.read_text(encoding="utf-8")
            for line in content.splitlines():
                if line.startswith("name="):
                    return line.split("=", 1)[1].strip()
        except (OSError, IOError):
            pass

    # 2. Fallback to global
    return get_global_developer()


def check_developer(repo_root: Path | None = None) -> bool:
    """Check if developer is initialized (project or global).

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        True if developer is initialized anywhere.
    """
    return get_developer(repo_root) is not None


def get_lang(repo_root: Path | None = None) -> str:
    """Get language preference with fallback chain.

    Priority:
        1. Project-level: .spec-first/.developer (lang=)
        2. Global: ~/.spec-first/.developer (lang=)

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        Language code ('zh' or 'en'), defaults to 'zh'.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    # 1. Check project-level first
    dev_file = repo_root / DIR_WORKFLOW / FILE_DEVELOPER
    if dev_file.is_file():
        try:
            content = dev_file.read_text(encoding="utf-8")
            for line in content.splitlines():
                if line.startswith("lang="):
                    lang = line.split("=", 1)[1].strip()
                    return lang if lang in ("zh", "en") else "zh"
        except (OSError, IOError):
            pass

    # 2. Fallback to global
    return get_global_lang()


# =============================================================================
# Tasks Directory
# =============================================================================

def get_tasks_dir(repo_root: Path | None = None) -> Path:
    """Get tasks directory path.

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        Path to tasks directory.
    """
    if repo_root is None:
        repo_root = get_repo_root()
    return repo_root / DIR_WORKFLOW / DIR_TASKS


# =============================================================================
# Workspace Directory
# =============================================================================

def get_workspace_dir(repo_root: Path | None = None) -> Path | None:
    """Get developer workspace directory.

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        Path to workspace directory or None if developer not set.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    developer = get_developer(repo_root)
    if developer:
        return repo_root / DIR_WORKFLOW / DIR_WORKSPACE / developer
    return None


# =============================================================================
# Journal File
# =============================================================================

def get_active_journal_file(repo_root: Path | None = None) -> Path | None:
    """Get the current active journal file.

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        Path to active journal file or None if not found.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    workspace_dir = get_workspace_dir(repo_root)
    if workspace_dir is None or not workspace_dir.is_dir():
        return None

    latest: Path | None = None
    highest = 0

    for f in workspace_dir.glob(f"{FILE_JOURNAL_PREFIX}*.md"):
        if not f.is_file():
            continue

        # Extract number from filename
        name = f.stem  # e.g., "journal-1"
        match = re.search(r"(\d+)$", name)
        if match:
            num = int(match.group(1))
            if num > highest:
                highest = num
                latest = f

    return latest


def count_lines(file_path: Path) -> int:
    """Count lines in a file.

    Args:
        file_path: Path to file.

    Returns:
        Number of lines, or 0 if file doesn't exist.
    """
    if not file_path.is_file():
        return 0

    try:
        return len(file_path.read_text(encoding="utf-8").splitlines())
    except (OSError, IOError):
        return 0


# =============================================================================
# Current Task Management
# =============================================================================

def _get_current_task_file(repo_root: Path | None = None) -> Path:
    """Get .current-task file path.

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        Path to .current-task file.
    """
    if repo_root is None:
        repo_root = get_repo_root()
    return repo_root / DIR_WORKFLOW / FILE_CURRENT_TASK


def get_current_task(repo_root: Path | None = None) -> str | None:
    """Get current task directory path (relative to repo_root).

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        Relative path to current task directory or None.
    """
    current_file = _get_current_task_file(repo_root)

    if not current_file.is_file():
        return None

    try:
        return current_file.read_text(encoding="utf-8").strip()
    except (OSError, IOError):
        return None


def get_current_task_abs(repo_root: Path | None = None) -> Path | None:
    """Get current task directory absolute path.

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        Absolute path to current task directory or None.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    relative = get_current_task(repo_root)
    if relative:
        return repo_root / relative
    return None


def set_current_task(task_path: str, repo_root: Path | None = None) -> bool:
    """Set current task.

    Args:
        task_path: Task directory path (relative to repo_root).
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        True on success, False on error.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    if not task_path:
        return False

    # Verify task directory exists
    full_path = repo_root / task_path
    if not full_path.is_dir():
        return False

    current_file = _get_current_task_file(repo_root)

    try:
        current_file.write_text(task_path, encoding="utf-8")
        return True
    except (OSError, IOError):
        return False


def clear_current_task(repo_root: Path | None = None) -> bool:
    """Clear current task.

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        True on success.
    """
    current_file = _get_current_task_file(repo_root)

    try:
        if current_file.is_file():
            current_file.unlink()
        return True
    except (OSError, IOError):
        return False


def has_current_task(repo_root: Path | None = None) -> bool:
    """Check if has current task.

    Args:
        repo_root: Repository root path. Defaults to auto-detected.

    Returns:
        True if current task is set.
    """
    return get_current_task(repo_root) is not None


# =============================================================================
# Task ID Generation
# =============================================================================

def generate_task_date_prefix() -> str:
    """Generate task ID based on date (MM-DD format).

    Returns:
        Date prefix string (e.g., "01-21").
    """
    return datetime.now().strftime("%m-%d")


# =============================================================================
# Monorepo / Package Paths
# =============================================================================


def get_spec_dir(package: str | None = None, repo_root: Path | None = None) -> Path:
    """Get the spec directory path.

    Single-repo: .spec-first/spec
    Monorepo with package: .spec-first/spec/<package>

    Uses lazy import to avoid circular dependency with config.py.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    from .config import get_spec_base

    base = get_spec_base(package, repo_root)
    return repo_root / DIR_WORKFLOW / base


def get_package_path(package: str, repo_root: Path | None = None) -> Path | None:
    """Get a package's source directory absolute path from config.

    Returns:
        Absolute path to the package directory, or None if not found.
    """
    if repo_root is None:
        repo_root = get_repo_root()

    from .config import get_packages

    packages = get_packages(repo_root)
    if not packages or package not in packages:
        return None

    info = packages[package]
    if isinstance(info, dict):
        rel_path = info.get("path", package)
    else:
        rel_path = str(info)

    return repo_root / rel_path


# =============================================================================
# Main Entry (for testing)
# =============================================================================

if __name__ == "__main__":
    repo = get_repo_root()
    print(f"Repository root: {repo}")
    print(f"Developer: {get_developer(repo)}")
    print(f"Tasks dir: {get_tasks_dir(repo)}")
    print(f"Workspace dir: {get_workspace_dir(repo)}")
    print(f"Journal file: {get_active_journal_file(repo)}")
    print(f"Current task: {get_current_task(repo)}")
