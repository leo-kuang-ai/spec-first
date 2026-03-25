# MCP Setup Guide

How to install and configure GitNexus and ABCoder as MCP servers for both Claude Code and Codex.

---

## GitNexus

### What It Does
Transforms a codebase into an interactive knowledge graph using Tree-sitter (AST parsing) and KuzuDB (property graph database). Provides module clustering, execution flow tracing, impact analysis, and Cypher graph queries.

### Install & Index

```bash
# Index your repo (run from repo root)
npx gitnexus analyze

# Check index status
npx gitnexus status

# Re-index after code changes
npx gitnexus analyze
```

Output: `.gitnexus/` directory with KuzuDB database (~50-200MB depending on repo size).

Stats reported: nodes (symbols), edges (relationships), clusters (module groups), flows (execution traces).

### Configure MCP — Claude Code

```bash
# One-time setup
npx gitnexus setup          # Auto-detects editors, writes MCP configs
# OR manually:
claude mcp add gitnexus -- npx -y gitnexus mcp
```

### Configure MCP — Codex

```bash
codex mcp add gitnexus -- npx -y gitnexus mcp
```

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `gitnexus_query` | Search execution flows by concept/keyword |
| `gitnexus_context` | 360-degree view of a symbol (callers, callees, flows, cluster) |
| `gitnexus_impact` | Blast radius analysis before editing a symbol |
| `gitnexus_detect_changes` | Pre-commit scope check — what did your changes affect |
| `gitnexus_rename` | Safe multi-file rename using call graph |
| `gitnexus_cypher` | Direct Cypher queries against the KuzuDB graph |
| `gitnexus_list_repos` | List indexed repositories |

### Useful Cypher Patterns

```cypher
-- Find all classes in a directory
MATCH (n:Class) WHERE n.file CONTAINS 'src/core' RETURN n.name, n.file

-- Find functions that call a specific function
MATCH (a:Function)-[:CALLS]->(b:Function {name: 'fetchData'}) RETURN a.name, a.file

-- Cross-package dependencies
MATCH (a)-[r]->(b) WHERE a.file CONTAINS 'package-a' AND b.file CONTAINS 'package-b'
RETURN a.name, type(r), b.name LIMIT 20

-- Most connected symbols (architectural hubs)
MATCH (n)-[r]-() RETURN n.name, n.file, count(r) as connections ORDER BY connections DESC LIMIT 20
```

---

## ABCoder

### What It Does
Parses codebases into UniAST (Universal Abstract Syntax Tree) using ts-morph (TypeScript) or tree-sitter (other languages). Provides 4-layer drill-down: repo → package → file → AST node, with cross-file dependency tracking and reverse reference resolution.

### Install

```bash
# Install globally
npm install -g abcoder

# Verify
abcoder --help
```

### Parse a Repository

```bash
# Parse a TypeScript package
abcoder parse /absolute/path/to/package \
  --lang typescript \
  --name my-package \
  --output ~/abcoder-asts

# Parse multiple packages (for monorepos)
abcoder parse /path/to/packages/pkg-a --lang typescript --name pkg-a --output ~/abcoder-asts
abcoder parse /path/to/packages/pkg-b --lang typescript --name pkg-b --output ~/abcoder-asts
```

Output: `~/abcoder-asts/<name>-ast.json` (~1-10MB per package).

### Start MCP Server (standalone)

```bash
abcoder mcp ~/abcoder-asts
```

### Configure MCP — Claude Code

```bash
claude mcp add abcoder -- abcoder mcp ~/abcoder-asts
```

### Configure MCP — Codex

```bash
codex mcp add abcoder -- abcoder mcp ~/abcoder-asts
```

### Available MCP Tools

| Tool | Layer | Purpose |
|------|-------|---------|
| `list_repos` | 1 | List all parsed repositories |
| `get_repo_structure` | 2 | Full file/package listing for a repo |
| `get_package_structure` | 3 | Nodes within a package (with node_ids for drill-down) |
| `get_file_structure` | 3 | All nodes in a specific file (functions, types, vars, signatures) |
| `get_ast_node` | 4 | Full code + dependencies + references + implementations for specific nodes |

### 4-Layer Drill-Down Pattern

```
Layer 1: list_repos()
  → ["pkg-a", "pkg-b"]

Layer 2: get_repo_structure({repo_name: "pkg-a"})
  → files grouped by package path

Layer 3: get_file_structure({repo_name: "pkg-a", file_path: "src/core/types.ts"})
  → [{name: "Plugin", type: "TYPE", signature: "...", line: 13}, ...]

Layer 4: get_ast_node({repo_name: "pkg-a", node_ids: [{mod_path: "pkg-a", pkg_path: "src/core/types.ts", name: "Plugin"}]})
  → {codes: "...", dependencies: [...], references: [...], implements: [...]}
```

### Key Capabilities

- **Cross-file dependencies**: `get_ast_node` returns which symbols a node depends on (imports, calls)
- **Reverse references**: `get_ast_node` returns which other symbols reference this node
- **Inheritance tracking**: `implements` field shows parent classes/interfaces
- **Full code extraction**: `codes` field contains the complete source code of the node

### Limitations

- Each repo is an independent AST tree — cross-package dependencies are tracked to the interface boundary but not resolved across packages
- Best for TypeScript (uses ts-morph for full type resolution); other languages use tree-sitter with less type information

---

## Verification Checklist

After setup, verify everything works:

```bash
# Claude Code
claude mcp list | grep -E "gitnexus|abcoder"

# Codex
codex mcp list | grep -E "gitnexus|abcoder"

# GitNexus index exists
ls .gitnexus/meta.json

# ABCoder ASTs exist
ls ~/abcoder-asts/*.json
```

Both Claude Code and Codex should show `gitnexus` and `abcoder` as enabled MCP servers.
