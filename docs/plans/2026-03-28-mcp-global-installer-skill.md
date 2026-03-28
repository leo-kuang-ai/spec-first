# MCP Global Installer Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a marketplace skill that detects already-installed AI coding platforms, lets the user choose targets, and installs or updates the mandatory MCP bundle globally with safe rollback.

**Architecture:** The skill is a docs-only marketplace package under `marketplace/skills/mcp-global-installer/`. It will use a fixed MCP registry derived from `docs/01-需求分析/MCP工具/mcp工具.md`, a platform-detection layer based on the existing template/platform matrix, and a per-platform adapter model so each host runtime can be updated independently and safely.

**Tech Stack:** Markdown skill docs, marketplace skill packaging conventions, existing spec-first platform documentation, shell-friendly validation commands.

---

### Task 1: Create the skill package scaffold

**Files:**
- Create: `marketplace/skills/mcp-global-installer/SKILL.md`

**Step 1: Write the skill metadata and scope**

Add frontmatter that names the skill, explains that it installs mandatory MCPs globally, and states the trigger conditions in plain language.

**Step 2: Add the top-level workflow**

Document the user flow: detect installed platforms, show a multi-select choice, install/update only selected targets, and summarize results.

**Step 3: Commit**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md
git commit -m "feat(skill): add MCP global installer skill scaffold"
```

### Task 2: Encode platform detection and selection rules

**Files:**
- Modify: `marketplace/skills/mcp-global-installer/SKILL.md`
- Create: `marketplace/skills/mcp-global-installer/references/platform-matrix.md`

**Step 1: Write the platform matrix**

Add a reference table that maps the existing `packages/cli/src/templates` folder names to supported host tools, excluding internal template folders like `markdown` and `spec-first`.

**Step 2: Define detection heuristics**

Describe how the skill decides whether a platform is installed and writable before it appears in the selection UI.

**Step 3: Commit**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md marketplace/skills/mcp-global-installer/references/platform-matrix.md
git commit -m "docs(skill): add platform detection matrix"
```

### Task 3: Add install/update and rollback behavior

**Files:**
- Modify: `marketplace/skills/mcp-global-installer/SKILL.md`
- Create: `marketplace/skills/mcp-global-installer/references/install-recovery.md`

**Step 1: Write the install/update rules**

Document the idempotent merge behavior: install if missing, update if present, skip if unchanged.

**Step 2: Write the recovery rules**

Add the backup, temp-file, atomic-write, verification, and rollback steps for per-platform isolation.

**Step 3: Commit**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md marketplace/skills/mcp-global-installer/references/install-recovery.md
git commit -m "docs(skill): add safe update and rollback flow"
```

### Task 4: Add validation guidance and examples

**Files:**
- Modify: `marketplace/skills/mcp-global-installer/SKILL.md`
- Create: `marketplace/skills/mcp-global-installer/references/validation.md`

**Step 1: Add validation checklist**

List the checks that must pass after each platform write: parse success, target MCP present, unrelated entries preserved, and readable result summary.

**Step 2: Add example outputs**

Show a success case, an update case, a skipped case, and a failure-with-rollback case so the skill output is predictable.

**Step 3: Commit**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md marketplace/skills/mcp-global-installer/references/validation.md
git commit -m "docs(skill): add validation guidance"
```

### Task 5: Smoke-test the skill package layout

**Files:**
- Read: `marketplace/README.md`
- Read: `marketplace/skills/mcp-global-installer/SKILL.md`

**Step 1: Verify marketplace placement**

Confirm the new skill follows the same package shape as existing marketplace skills and does not require any CLI source changes.

**Step 2: Verify discoverability**

Check that the folder name, skill name, and references are all internally consistent and that the docs do not mention unsupported platform folders as install targets.

**Step 3: Commit**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md marketplace/skills/mcp-global-installer/references/*.md
git commit -m "docs(skill): finalize MCP global installer package"
```

