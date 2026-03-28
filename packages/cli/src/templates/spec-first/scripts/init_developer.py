#!/usr/bin/env python3
"""
Initialize developer for workflow.

Usage:
    # Global (recommended - all projects share identity)
    python3 init_developer.py --global <developer-name>

    # With language preference
    python3 init_developer.py --global <developer-name> --lang en

    # Project-level only
    python3 init_developer.py <developer-name>

This creates:
    Global mode:
        - ~/.spec-first/.developer file

    Project mode:
        - .spec-first/.developer file with developer info
        - .spec-first/workspace/<name>/ directory structure
"""

from __future__ import annotations

import argparse
import sys

from common.paths import (
    DIR_WORKFLOW,
    FILE_DEVELOPER,
    get_developer,
    get_global_developer,
)
from common.developer import init_developer, init_global_developer


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Initialize developer identity for spec-first workflow",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Global identity with Chinese (default)
    %(prog)s --global kuang

    # Global identity with English
    %(prog)s --global kuang --lang en

    # Project-level only (overrides global for this project)
    %(prog)s kuang

    # Project-level with English
    %(prog)s kuang --lang en
        """
    )
    parser.add_argument(
        "name",
        nargs="?",
        help="Developer name"
    )
    parser.add_argument(
        "-g", "--global",
        action="store_true",
        dest="global_mode",
        help="Initialize global identity (~/.spec-first/.developer)"
    )
    parser.add_argument(
        "-l", "--lang",
        choices=["zh", "en"],
        default="zh",
        help="Language preference (default: zh)"
    )

    args = parser.parse_args()

    if not args.name:
        parser.print_help()
        print()
        print("Error: developer name is required", file=sys.stderr)
        sys.exit(1)

    name = args.name
    lang = args.lang

    if args.global_mode:
        # Global mode
        if init_global_developer(name, lang):
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        # Project mode
        existing = get_developer()
        if existing:
            print(f"Developer already initialized: {existing}")
            print()
            print(f"To reinitialize, remove {DIR_WORKFLOW}/{FILE_DEVELOPER} first")
            sys.exit(0)

        if init_developer(name, lang=lang):
            sys.exit(0)
        else:
            sys.exit(1)


if __name__ == "__main__":
    main()
