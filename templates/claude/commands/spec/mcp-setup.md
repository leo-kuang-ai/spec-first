---
description: "Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows"
argument-hint: ""
---

# Runtime Setup

This source template defines Claude command metadata for the `spec-mcp-setup` runtime setup entrypoint.

During `spec-first init` for Claude Code, spec-first renders the runtime command by combining this frontmatter with the body of `skills/spec-mcp-setup/SKILL.md`. `spec-runtime-setup` remains the intended alias once the host alias contract is implemented; legacy host spellings normalize to `spec-mcp-setup` and are not separate product surfaces.

渲染后的命令必须将 companion `spec-mcp-setup` skill 目录解析为 loaded skill root，并调用 `node <loaded-skill-root>/scripts/setup.cjs`。支持 mutation 的 mode 通过 per-call environment 传入 `MCP_SETUP_HOST=claude`。绝不能调用相对项目 cwd 的 setup 入口或 platform-specific wrapper。

The paired skill owns the multi-repo contract: when run from a parent workspace with no `--repo <child>`, setup defaults to all child repos. `--repo <child>` narrows the run, and `--all-repos` is the explicit equivalent of the parent-workspace default.

Edit the paired skill to change workflow behavior.
