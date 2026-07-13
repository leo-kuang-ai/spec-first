# Per-Requirement Workspace Graph — E2E Regression Receipt

- **Date:** 2026-07-13
- **Plan:** `docs/plans/2026-07-13-001-feat-per-requirement-workspace-multi-repo-graph-plan.md`
- **Satisfies:** D8 / SC3 (real-binary end-to-end evidence for the two-layer workspace graph build)
- **Author:** leokuang

## What was exercised

A real multi-repo, non-Git parent workspace built through the implemented library vertical (`workspace-target` → `workspace-provider-runners` → `workspace-graph-build`) using the **real installed provider binaries** (not fakes). Command construction is the module code under test; provider invocation is `defaultExec` (spawnSync).

**Deviation (recorded):** the global `codegraph install` step was replaced with a no-op for this receipt to avoid mutating the host's MCP config. All graph-building/merge/exclude behavior ran against real binaries.

## Environment (real, pinned by what is installed)

| Provider | Version |
|---|---|
| CodeGraph | `1.4.1` (`@colbymchenry/codegraph`, homebrew) |
| Graphify | `graphify 0.9.12` (PyPI `graphifyy`) |

## Workspace topology

Temp non-Git parent workspace with two independently `git init`-ed child repos, each with a small JS source file (`index.js` exporting a `main` calling a `helper`):

```
<ws>/
├── svc-api/  (.git, index.js)
└── svc-web/  (.git, index.js)
```

## Result

| Signal | Observed |
|---|---|
| Build status | `complete` |
| Wall time (2 repos) | ~2445 ms |
| Per-child CodeGraph | `svc-api` ready, `svc-web` ready — each `.codegraph/codegraph.db` = 159744 bytes |
| Managed exclude | `applied` per child |
| Per-child Graphify subgraph | ready, subgraph file present under `<ws>/.graphify/<repo>/.graphify/graph.json` |
| Workspace merged graph | `merged` (cross-repo), `<ws>/.graphify/merged-graph.json` = 5583 bytes, exists |
| Child `git status` | only the deliberately-uncommitted `index.js` appears (`?? index.js`); **`.codegraph/` does NOT appear** → the `.git/info/exclude` mechanism keeps the child working tree clean, confirmed against a real repo |

## What this confirms (against real binaries)

- CodeGraph `init` builds a per-child `.codegraph/` index in a non-Git parent's child repo; `.git/info/exclude` keeps it out of `git status` (the KTD2 git-clean claim holds on a real repo).
- Graphify `extract --code-only` produces per-child subgraphs out-of-tree under the workspace `.graphify/`, and `merge-graphs` converges them into a real cross-repo merged graph — the two-layer model works with real output paths.
- Per-repo failure isolation, out-of-tree placement, and merge zero/single/many semantics are covered by the unit suite (`tests/unit/mcp-setup-workspace-*.test.js`, 59 tests); this receipt adds the real-binary end-to-end confirmation those fakes stand in for.

## D4 Provider 可行性观测：手动 refresh / merge reconvergence（real Graphify 0.9.12）

Date of observation: 2026-07-13. Temp non-Git parent with 2 `git init` children; `GRAPHIFY_OUT=.graphify`.

| Step | Result |
|---|---|
| `graphify extract <child> --out <ws>/.graphify/<id> --code-only` | rc 0 per child; subgraph at `<out>/.graphify/graph.json` |
| `graphify merge-graphs` (initial) | rc 0; `merged-graph.json` size **2801** bytes |
| `graphify hook install` in each child | rc 0; post-commit/post-checkout installed under child `.git/hooks` (local `core.hooksPath=.git/hooks` so containment-safe) |
| Mutate child source + re-extract that subgraph | rc 0 |
| Re-run `merge-graphs` (U3 reconverge semantics) | rc 0; merged size **3705** bytes; content changed (`nodes`/`links` differ) |
| `graphify hook uninstall` | rc 0 per child |

**只确认 Provider 原子能力，不确认产品自动链路：** 手动重新 extract child subgraph 后，手动执行 merge 可以更新 workspace merged graph；Graphify hook install/uninstall 也能修改真实 child git dir。后续源码核验确认 Graphify 0.9.12 native hook 在提交时读取默认 `GRAPHIFY_OUT=graphify-out`，不会自动更新 spec-first 的 out-of-tree `<workspace>/.graphify/<repo>/.graphify/graph.json`，也不会触发 workspace merge。因此本段不得作为“commit 后自动收敛”的 completion evidence；当前产品 contract 已降级为显式重跑 `--workspace-graph --repos ...`。

## Limitations / not covered by this receipt

- Global `codegraph install` (MCP host wiring) was skipped on the build pass to avoid host mutation; covered by provider-runner unit contract.
- 本回执没有证明 native child hook 能刷新 out-of-tree workspace subgraph 或 merged graph；对应旧 claim 已被当前 source/status contract 作废。
- Synthetic small repos; timing/size scale numbers are illustrative, not a performance baseline.
- Surfaces unit/entry/integration-tested with injectable exec (and host CLI wiring) beyond this real-binary build+D4 pass:
  - U5 routing inject into workspace-root `CLAUDE.md`/`AGENTS.md`
  - U4 `--workspace-graph-status` / `runWorkspaceGraphStatus`
  - U6 `spec-mcp-setup --workspace-graph-clean` and host `spec-first clean --workspace-graph`
- D6 five-host projection is closed via a **clean-sandbox** apply (not against the dirty working tree): `tests/integration/workspace-graph-five-host-projection.integration.test.js` runs `spec-first init --claude --codex --cursor --kiro --qoder -y` and asserts each host mirror of `spec-mcp-setup` carries the workspace-graph lib modules, flags in `args.cjs`/`setup.cjs`, SKILL section, Kiro/Qoder routing degradation content, and `doctor --json` reports no drift/ERROR. Concurrent unstaged manual-doc edits in the developer's tree are out of scope for that sandbox apply.

## Reproduction

Build a non-Git parent with 2+ `git init` child repos containing source, then drive
`buildWorkspaceGraphs({ workspaceRoot, repos, runners })` with runners from
`makeWorkspaceRunners({ exec: defaultExec })` (real spawnSync), overriding
`codegraphInstallGlobal` to a no-op to avoid host MCP mutation. Assert build
status `complete`, `.codegraph/codegraph.db` present per child, child `git status`
free of `.codegraph/`, and `<ws>/.graphify/merged-graph.json` present.
