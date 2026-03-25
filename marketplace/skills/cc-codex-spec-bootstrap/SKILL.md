---
name: cc-codex-spec-bootstrap
description: "Claude Code + Codex parallel pipeline for bootstrapping spec-first coding specs. CC analyzes the repo with GitNexus (knowledge graph) + ABCoder (AST), creates spec-first task PRDs with full architectural context and MCP tool instructions, then Codex agents run those tasks in parallel to fill spec files. Use when: bootstrapping coding guidelines, setting up spec-first specs, 'bootstrap specs for codex', 'create spec tasks', 'CC + Codex spec pipeline', 'initialize coding guidelines with code intelligence'. Also triggers when user wants to set up GitNexus or ABCoder MCP for multi-agent spec generation."
---

# CC + Codex Spec Bootstrap Pipeline

A multi-agent pipeline where **Claude Code** (CC) orchestrates and **Codex** executes in parallel. CC analyzes the repo with GitNexus + ABCoder, creates spec-first task PRDs, then Codex agents fill the coding specs — each with access to the same code intelligence MCP tools.

## Why This Exists

AI coding agents produce better code when they have project-specific coding guidelines (not generic templates). But filling those guidelines manually is tedious. This skill automates the bootstrap:

1. **You** (Claude Code) analyze the repo architecture using GitNexus + ABCoder
2. **You** create spec-first tasks with rich PRDs containing architectural context + MCP tool instructions
3. **Codex agents** run those tasks in parallel, each filling one spec directory using the same MCP tools

The result: every spec file contains real code examples, actual patterns, and project-specific anti-patterns — not placeholder text.

---

## Prerequisites

Before running this skill, ensure these tools are set up. See [references/mcp-setup.md](references/mcp-setup.md) for detailed installation instructions.

| Tool | Purpose | Required |
|------|---------|----------|
| [spec-first](https://github.com/mindfold/spec) | Workflow framework with `.spec-first/spec/` structure | Yes |
| [GitNexus](https://github.com/abhigyanpatwari/GitNexus) | Code → knowledge graph (Tree-sitter + KuzuDB) | Yes |
| [ABCoder](https://github.com/nicepkg/abcoder) | Code → UniAST (ts-morph for TS, tree-sitter for others) | Yes |
| [Codex CLI](https://github.com/openai/codex) | Parallel task execution agent | Yes |

Quick check:
```bash
# Verify all tools
npx gitnexus status          # GitNexus indexed?
abcoder list-repos            # ABCoder has ASTs?
codex mcp list                # Codex has MCP servers?
python3 .spec-first/scripts/get_context.py  # spec-first initialized?
```

---

## Phase 1: Analyze the Repository

### Step 1: Index with GitNexus

```bash
npx gitnexus analyze
```

This builds a knowledge graph: nodes (symbols), edges (dependencies), clusters (module groups), and execution flows. Takes ~5s for a typical monorepo.

After indexing, use GitNexus MCP tools to understand the architecture:

```
gitnexus_query({query: "plugin system"})        # Find execution flows
gitnexus_context({name: "SomeClass"})            # 360-degree symbol view
gitnexus_cypher({query: "MATCH (n:Class) RETURN n.name, n.file LIMIT 30"})  # Graph queries
```

### Step 2: Parse with ABCoder

ABCoder provides precise AST analysis — function signatures, type definitions, cross-file dependency chains.

```bash
# Parse each package
abcoder parse /path/to/package --lang typescript --name package-name --output ~/abcoder-asts
```

Then use ABCoder MCP tools:
```
get_repo_structure({repo_name: "package-name"})
get_file_structure({repo_name: "package-name", file_path: "src/core/types.ts"})
get_ast_node({repo_name: "package-name", node_ids: [{mod_path: "...", pkg_path: "...", name: "ClassName"}]})
```

### Step 3: Map the Architecture

Combine insights from both tools to understand:

- **Package boundaries** — which packages exist, what each one does
- **Module clusters** — GitNexus `clusters` resource shows functional groupings
- **Key patterns** — Fetcher/Provider/Plugin/Adapter/Router patterns
- **Cross-package data flows** — how data moves between packages
- **Error handling patterns** — how errors propagate
- **State management** — what's stateless vs stateful

Write down your findings — they go into the PRDs.

---

## Phase 2: Create spec-first Tasks

### Task Decomposition Strategy

Create **one task per (package, layer)** combination. Each task is independently executable by a Codex agent.

Typical decomposition for a monorepo:
```
package-a/backend    → Task 1
package-a/frontend   → Task 2
package-b/backend    → Task 3
package-b/frontend   → Task 4
cross-layer-guide    → Task 5
```

Skip layers that don't apply (e.g., no frontend task for a pure CLI library).

### Create Task Directories

```bash
python3 .spec-first/scripts/task.py create "Fill <package> <layer> spec" --slug <package>-<layer>-spec
```

### Write PRDs

Each PRD must contain these sections. This is the critical part — the PRD is the entire context a Codex agent receives.

```markdown
# Fill <package> <layer> spec

## Goal
One sentence: what to analyze, what files to fill.

## Context
Project-specific architectural knowledge you gathered in Phase 1.
Key concepts, patterns, abstractions — everything the agent needs
to understand the codebase without reading every file.

## Tools Available
[Use the MCP Tools Template below]

## Files to Fill
List each spec file with bullet points on what to document.
Include hints about which source files to analyze.

## Important Rules

### Spec files are NOT fixed — adapt to reality
- Delete template files that don't apply
- Create new files for patterns templates don't cover
- Rename files if template names don't fit
- Update index.md to reflect the final set

### Parallel agents — stay in your lane
- ONLY modify files under your assigned spec directory
- DO NOT modify source code, other spec directories, or task files
- DO NOT run git commands
- You may read any file for analysis

## Acceptance Criteria
- [ ] Real code examples from the actual codebase (with file paths)
- [ ] Anti-patterns documented
- [ ] No placeholder text remaining
- [ ] index.md reflects actual file set

## Technical Notes
Package path, language, framework, build tools, key deps.
```

### MCP Tools Template for PRDs

Include this in every PRD so Codex knows how to call the tools:

```markdown
## Tools Available

You have two MCP servers configured — use both for accurate specs:

### GitNexus MCP (architecture-level: clusters, execution flows, impact)
| Tool | Purpose | Example |
|------|---------|---------|
| `gitnexus_query` | Find execution flows by concept | `gitnexus_query({query: "..."})` |
| `gitnexus_context` | 360-degree symbol view | `gitnexus_context({name: "ClassName"})` |
| `gitnexus_impact` | Blast radius analysis | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `gitnexus_cypher` | Direct graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

### ABCoder MCP (symbol-level: AST nodes, signatures, cross-file deps)
| Tool | Purpose | Example |
|------|---------|---------|
| `get_repo_structure` | Full file listing | `get_repo_structure({repo_name: "pkg"})` |
| `get_file_structure` | All nodes in a file | `get_file_structure({repo_name: "pkg", file_path: "src/..."})` |
| `get_ast_node` | Code + deps + refs | `get_ast_node({repo_name: "pkg", node_ids: [...]})` |

### Recommended Workflow
1. GitNexus first — find relevant execution flows and clusters
2. ABCoder second — get exact code patterns and signatures
3. Read source files — for full context where needed
4. Write specs — with real code examples from steps 2-3
```

---

## Phase 3: Launch Codex Agents

### Run in Parallel

Each task is independent — launch all agents simultaneously:

```bash
# One terminal per task
codex -q "Read .spec-first/tasks/<task-slug>/prd.md and execute the task. Use GitNexus and ABCoder MCP tools to analyze the codebase, then fill all spec files listed in the PRD."
```

### Monitor Progress

Check which spec files have been filled:

```bash
# Line counts — 0 or ~50 means still template
find .spec-first/spec -name "*.md" -exec sh -c 'echo "$(wc -l < "$1") $1"' _ {} \; | sort -rn

# Check for remaining placeholders
grep -rl "To be filled" .spec-first/spec/

# Newly created or modified files
find .spec-first/spec -name "*.md" -newer .spec-first/tasks/ -exec ls -la {} \;
```

### Review Results

After all agents complete:
1. Check line counts — substantive files should be 80+ lines
2. Grep for leftover placeholders
3. Spot-check a few files for real code examples vs generic advice
4. Verify `index.md` in each directory reflects actual files

---

## Checklist

- [ ] GitNexus analyzed (`npx gitnexus analyze`)
- [ ] ABCoder parsed all packages
- [ ] GitNexus + ABCoder MCP configured for both Claude Code and Codex
- [ ] Architecture mapped (packages, patterns, boundaries)
- [ ] One task per (package, layer) created with `task.py create`
- [ ] Each PRD has: Context, MCP Tools, Files to Fill, Rules, Acceptance Criteria
- [ ] Codex agents launched in parallel
- [ ] Results reviewed — no placeholders, real code examples present
