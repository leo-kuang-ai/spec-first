---
description: "Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows"
argument-hint: ""
---

# Runtime Setup

This source template defines Claude command metadata for the `spec-mcp-setup` runtime setup entrypoint.

During `spec-first init` for Claude Code, spec-first renders the runtime command by combining this frontmatter with the body of `skills/spec-mcp-setup/SKILL.md`. `spec-runtime-setup` remains the intended alias once the host alias contract is implemented; legacy host spellings normalize to `spec-mcp-setup` and are not separate product surfaces.

The paired skill owns the multi-repo contract: when run from a parent workspace with no `--repo <child>`, setup defaults to all child repos. `--repo <child>` narrows the run, and `--all-repos` is the explicit equivalent of the parent-workspace default.

Edit the paired skill to change workflow behavior.
