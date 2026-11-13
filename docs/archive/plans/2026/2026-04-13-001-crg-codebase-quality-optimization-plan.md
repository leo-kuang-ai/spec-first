---
title: "CRG Codebase Quality Optimization Plan"
type: archive
status: superseded
created: 2026-04-13
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# CRG Codebase Quality Optimization Plan

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

> Date: 2026-04-13
> Scope: spec-first codebase reverse audit based on graph-bootstrap findings
> Status: Draft
> Confidence: High (all items verified against source code)

## Background

Graph-bootstrap analysis revealed:
- 513 AST nodes, 1260 edges, 59.7% unresolved edge rate
- 5 large functions (>200 LOC), 3 god nodes (fan-in 9-19)
- 8 modules without dedicated tests
- CRG `tests_for`/`impact`/`dependents_of` queries return empty

This plan is the result of deep source-code review of all identified issues, with corrections applied based on actual code evidence.

---

## P0: Correctness / Result Credibility

### P0-1. Fix incremental build unresolved_edges semantic consistency

**Problem**: `src/crg/cli/build.js:255-258` calls `replaceUnresolvedEdges(db, unresolved)` which does `DELETE FROM unresolved_edges` + full insert. During incremental builds, only changed files' unresolved edges are processed, so the table is **replaced with only the current batch's unresolved edges**, losing all historical unresolved edges.

**Impact**: `src/crg/flows.js:125-136` uses `unresolved_edges` table to compute `externalScore` (F5 factor of flow criticality). After incremental build, this score becomes incorrect.

**Evidence**:
```
graph.js:365-386  replaceUnresolvedEdges → DELETE FROM unresolved_edges + INSERT batch
build.js:255-258  only runs for parsedChanged.length > 0 || force
flows.js:128-136  SELECT DISTINCT source_id FROM unresolved_edges WHERE source_id IN (...)
```

**Fix**: Change unresolved storage to per-source_file partial replacement:
- `DELETE FROM unresolved_edges WHERE source_file IN (changed files)`
- `INSERT` only the new batch's unresolved edges
- Update `graph_meta.unresolved_edge_count` as: current_count - deleted_count + new_count

**Priority**: Highest — affects all downstream analysis correctness.

---

### P0-2. Enhance resolveEdges binding resolution (build on existing attachLocalTargetIds)

**Problem**: `src/crg/graph.js:106-311` relies on relative path guessing, basename fuzzy matching, global name matching, and same-file disambiguation. For JS/TS, this is insufficient for alias imports, re-exports, barrel files, `module.exports`, and third-party package entry points.

**Existing foundation**: `src/crg/parser.js:415-433` `attachLocalTargetIds` already does same-file symbol binding via `byFileAndName` Map — this is the prototype for a binding layer.

**Fix approach** (two-phase):
1. **Phase A** (parser enhancement): Extend `parseFile` output with import source metadata — for `require('./foo')` and `import { bar } from './foo'`, record `{ importName, sourcePath }` alongside rawEdges
2. **Phase B** (resolveEdges enhancement): Use import metadata to resolve cross-file symbol bindings before falling back to heuristic matching

**Scope**: Architecture evolution, not a simple fix. Phase A requires changing `parseFile` return format.

---

### P0-3. Model external/builtin dependencies explicitly

**Problem**: `imports_from` edges targeting `node:path`, `node:fs/promises`, `node:os`, third-party packages (better-sqlite3, tree-sitter, etc.) have no node entity to resolve to, all falling into unresolved (154 edges, 7.7% of total).

**Current**: `unresolved_edges` table treats all unresolved edges uniformly — no distinction between "truly unresolved" and "known external dependency".

**Fix**: Introduce classification in `unresolved_edges`:
- Add `resolution_status` field: `unresolved` | `external_builtin` | `external_package` | `dynamic_import`
- In `resolveEdges`, match against Node.js builtin module list (`node:*` prefix + known names) and `package.json` dependencies
- Tag appropriately instead of marking as unresolved

**Benefit**: `flows.js` externalScore can use `external_package` as a positive signal (known dependency) rather than treating it as unresolved noise.

---

### P0-4. Unify tests_for / tested_by fact generation

**Problem**: `crg query --pattern=tests_for` returns 0 for all tested symbols, yet test coverage inference is scattered across:
- `src/crg/changes.js:108-129` — `assessNodeRisk` F3 factor: checks `imports_from` edges from `is_test` nodes
- `src/crg/commands/review-context.js:111-147` — file name patterns (`*.test.*`, `*.spec.*`) + `is_test` node lookup

These use inconsistent heuristics and produce different results.

**Fix**:
1. Move test association inference into `src/crg/cli/postprocess.js` as a dedicated step (after `writeCommunities`, before `rebuildFTS`)
2. Create `tested_by` edges in the `edges` table with `confidence: 'Inferred'` and appropriate `inference_reason`
3. All commands consume `tested_by` edges only — no more ad-hoc inference

---

### P0-5. Improve JS calls edge generation with receiver context

**Problem**: `src/crg/parser.js:370-381` generates `calls` rawEdges with only `target_name` (the method name). `extractJsCallTargetName` (L400-413) already distinguishes `identifier` vs `member_expression`, but only saves the property name for member expressions.

Example: `obj.push()` → rawEdge with `target_name="push"`, no receiver info.
Result: `push`, `indexOf`, `parse`, `readFile` etc. generate 1817 unresolved `calls` edges (90.8% of all unresolved).

**Fix**: Extend rawEdge format to include receiver context:
```js
// For member_expression: obj.push()
rawEdges.push({
  source_id: currentSymbolId,
  target_name: 'push',
  target_receiver: 'obj',        // NEW
  call_type: 'member_expression', // NEW: 'identifier' | 'member_expression'
  target_path_raw: null,
  kind: 'calls',
});
```

Post-processing can then:
- Skip known stdlib patterns (`Array.prototype.*`, `Object.*`, `JSON.*`, `fs.*`) with high confidence
- Attempt receiver type inference for project-specific objects
- Preserve all `identifier` calls without filtering

**Note**: This is superior to a blanket blacklist (P2-36) because it preserves user-defined methods with common names while still reducing noise.

---

## P1: Architecture / Testability

### P1-6. Separate CLI exit from helper error propagation

**Problem**: `src/crg/cli/open-db.js:16-17,27` calls `process.exit()` directly, making it untestable in-process.

**Fix**: Core helper throws structured errors, command handlers catch and decide exit strategy:
```js
// open-db.js core
function openDbCore(argv) {
  // ... validation ...
  if (!repoArg) throw new UserError('--repo=<path> is required');
  return { db, repoRoot };
}

// command handler
function run(argv) {
  try { const { db } = openDbCore(argv); ... }
  catch (e) { e instanceof UserError ? process.exit(1) : process.exit(2); }
}
```

**Existing openDb should be reused** — `postprocess.js`, `context.js`, `query.js` all have duplicate --repo parsing + DB opening logic. After throw-based refactoring, these commands should call `openDbCore` instead of reimplementing.

---

### P1-7. Extract shared sqlite native loader

**Problem**: Identical `requireSqlite()` function in 5 files:
- `src/crg/cli/build.js:25-37`
- `src/crg/cli/context.js:19-31`
- `src/crg/cli/postprocess.js:28-40`
- `src/crg/cli/query.js:67-79`
- `src/crg/cli/open-db.js:41-47`

**Fix**: Create `src/crg/cli/native-loader.js`:
```js
function requireSqlite() { ... }
module.exports = { requireSqlite };
```

**Note**: `postprocess.js:28`'s `requireSqlite()` is redundant when called via `build.js:269 tryPostprocess(db)` (sqlite already loaded at build.js:140). Only needed when postprocess runs as standalone CLI.

---

### P1-8. Unify repo/DB opening via existing openDb

**Problem**: `--repo` parsing + graph.db existence check + sqlite loading is duplicated in `postprocess.js:86-114`, `context.js:38-60`, `query.js` (inside `run` function).

**Note**: `open-db.js` already provides this unified interface (L12-54), but the commands above don't use it.

**Fix**: After P1-6 refactors openDb to throw-based, have all commands call `openDbCore(argv)` instead of reimplementing the pattern.

---

### P1-9. Refactor large functions to "pure rules + thin shell"

Functions to refactor (in priority order):

| Function | LOC | File | Refactoring approach |
|---|---|---|---|
| writeCommunities | 297 | src/crg/communities.js:71 | Extract: `groupModulesByDirectory()`, `computeModuleEdges()`, `classifyCommunityHealth()`, `refineOversizedCommunity()`, `writeCommunitiesToDb()` |
| runBuildAsync | 250 | src/crg/cli/build.js:115 | Extract: `detectIosProject()`, `processChangedFiles()`, `buildQualityWarnings()`, `buildOutputEnvelope()` |
| collectInputFiles | 243 | src/crg/input-convergence.js:470 | Extract: `resolveEffectiveMode()`, `buildFilterChain()`, `applyFilters()`, `computeStats()` |
| review-context.run | 228 | src/crg/commands/review-context.js:30 | Extract: `collectAffectedNodes()`, `inferCandidateTests()`, `expandCallers()`, `buildReviewGuidance()` |
| resolveEdges | 206 | src/crg/graph.js:106 | Extract: cache builders + individual resolution stages as named functions |

**Principle**: Each stage returns intermediate results; side effects (DB writes) only at the outermost layer. Enables narrow unit testing.

---

### P1-10. Unify CLI argument parsing

**Problem**: `--repo` parsing duplicated in build.js:73-88, build.js:391-397, postprocess.js:91-98, context.js:41-49. `--force` in build.js:84. `--since` in review-context.js:32-37.

**Fix**: Extract helpers:
```js
function parseRepoArg(argv) → { repo: string|null }
function parseFlag(argv, name) → boolean
function parseRequiredOption(argv, name) → string | throws UserError
```

---

### P1-11. Extract community health classification

**Problem**: Four-quadrant classification (density/independence → health_status) duplicated at `communities.js:206-215` and `communities.js:276-285`.

**Fix**:
```js
function classifyCommunityHealth(density, independence) {
  if (density > 0.3 && independence > 0.5) return 'healthy';
  if (density <= 0.3 && independence > 0.5) return 'isolated';
  if (density > 0.3 && independence <= 0.5) return 'fragmented';
  return 'scattered';
}
```

---

### P1-12. Separate community detection "grouping" from "DB writing"

**Problem**: `writeCommunities` (communities.js:71) simultaneously handles: directory grouping, module edge projection, health calculation, BFS refinement, and DB writing.

**Fix**: Split into:
1. `computeCommunities(db)` → returns `finalCommunities[]` (pure computation)
2. `writeCommunitiesToDb(db, communities)` → transactional write (side effects)

---

### P1-13. Reduce full-table scanning in analysis modules

**Problem**: `analyze.js:59-144` (`surprisingConnections`) loads all edges + all nodes into memory. `flows.js:93-144` (`computeFlowCriticality`) queries nodes + unresolved_edges per flow.

**Scale note**: At current 513 nodes, this is millisecond-level. Becomes important at 10k+ nodes.

**Fix** (when scale warrants):
- Extract scoring constants into named config
- Materialize degree/community stats into intermediate tables during postprocess
- Consider pagination for large result sets

---

### P1-14. Unify risk scoring model

**Problem**: `src/crg/changes.js:81-146` has `assessNodeRisk` (single-node, 5 queries) and `assessNodeRiskBatch` (batch, ~6 queries). Same 5 factors but different implementations — risk of drift over time.

**Fix**: Make `assessNodeRisk` a degenerate case of batch:
```js
function assessNodeRisk(nodeId, db) {
  return assessNodeRiskBatch([nodeId], db).get(nodeId) || 0;
}
```

---

### P1-15. Extract review-context helpers for reuse

**Problem**: `review-context.js:149-224` inlines reverse adjacency building, 2-hop BFS, and test file heuristic — logic that other commands may need.

**Fix**: Extract:
- `buildReverseAdjacency(db)` → `Map<targetId, sourceId[]>`
- `expandAffectedCallers(startIds, reverseAdj, maxDepth)` → expansion results
- `inferCandidateTests(changedFiles, db, repoRoot)` → candidate test FactItems

---

## P1: Plugin / Asset Sync

### P1-16. Add module-level cache to loadPluginManifest

**Problem**: `src/cli/plugin.js:18-26` does `readFileSync + JSON.parse` on every call. Called via `getBundledPath` (in_degree=9), `listBundledCommands`, `listBundledSkills`, `listBundledAgents` — single `init` may trigger 10+ file reads.

**Fix**:
```js
let _manifestCache = null;
function loadPluginManifest() {
  if (_manifestCache) return _manifestCache;
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  validateManifest(manifest);
  _manifestCache = manifest;
  return manifest;
}
```

---

### P1-17. Cache bundled asset catalog

**Problem**: `listBundledSkills` (L74-85) and `listBundledAgents` (L87-97) each call `getBundledPath` → `loadPluginManifest` + `readdirSync`/`walkAgentEntries`. `syncBundledAssets` calls all three, causing redundant directory scans.

**Fix**: One-pass catalog initialization:
```js
function buildAssetCatalog() {
  return {
    manifest: loadPluginManifest(),
    commands: listBundledCommands(),
    skills: listBundledSkills(),
    agents: listBundledAgents(),
  };
}
```

---

### P1-18. Parameterize doctor.js asset checks

**Problem**: `checkGeneratedCommands` (L155-191), `checkInstalledSkills` (L193-229), `checkInstalledAgents` (L231-267) have near-identical structure.

**Fix**:
```js
function checkAssetCategory(category, projectRoot, adapter) {
  const status = inspectInstalledAssets(projectRoot, adapter)[category];
  // unified PASS/WARNING/ERROR logic
}
```

---

### P1-19. Clarify getBundledPath responsibility boundary

**Problem**: `getBundledPath` (plugin.js:52-55) is only 3 lines, but as the center of the manifest reading chain, its high fan-in (9) causes amplified I/O due to uncached `loadPluginManifest`.

**Fix**: After P1-16/P1-17, getBundledPath naturally becomes cheap (cached manifest + catalog). No structural change needed beyond the caching fixes.

---

## P2: Test Coverage

### Test Priority Matrix

| Priority | Module | Risk | Test Type | Key Assertions |
|---|---|---|---|---|
| **High** | `adapters/claude.js` | Core correctness: canonical name rewrite, Task reference replacement | Jest unit | `spec-first:category:name` → `category:name`; runtime file inspection |
| **High** | `adapters/codex.js` | Platform parity: shared path rewrite, agent path conversion | Jest unit | Full format preserved; legacy cleanup |
| **High** | `plugin.js` syncBundledAssets | Init core: asset sync correctness | Jest + temp dir | File tree matches manifest; content transforms applied |
| **Medium** | `doctor.js` | Most-used diagnostic command | Mock + unit | parseDoctorArgs; asset missing→WARNING; platform detection |
| **Medium** | `changes.js` | Risk scoring | Jest unit | assessNodeRisk batch=degenerate single; scoring factor weights |
| **Medium** | `flows.js` | Flow detection | Jest unit | Entry node identification; criticality calculation; BFS limits |
| **Medium** | `analyze.js` | Graph analysis | Jest unit | surprisingConnections scoring factors; godNodes threshold |
| **Low** | `open-db.js` | DB opening (after throw-based refactor) | Jest unit | Error types; validation logic |

### P2-28. Critical regression test: incremental build + unresolved consistency

**This is more important than individual unit tests** because P0-1 confirms an actual correctness bug.

**Test scenario**:
1. Full build → record `unresolved_edges` count and samples
2. Incremental build (1 file changed) → verify `unresolved_edges` preserved for unchanged files
3. Verify `graph_meta.unresolved_edge_count` reflects cumulative state

---

## P2: Performance / Engineering Details

### P2-29. Early directory pruning in all-files mode

`src/crg/input-convergence.js:349-365` `walkDir` recursively enumerates all subdirectories before filtering. For `node_modules/`, `vendor/`, etc., this wastes I/O.

**Fix**: Check directory name against `DEFAULT_EXCLUDES` before recursing:
```js
if (entry.isDirectory()) {
  if (isDefaultExcluded(entry.name)) continue; // early prune
  walkDir(full, base, result);
}
```

---

### P2-30. Single-pass sub-community edge counting in writeCommunities

`communities.js:254-270` iterates `moduleEdges` twice (once for intra, once for inter). Merge into one pass:
```js
for (const { src, tgt } of moduleEdges) {
  const srcIn = component.has(src), tgtIn = component.has(tgt);
  if (srcIn && tgtIn) subIntraEdges++;
  else if (srcIn !== tgtIn) subInterEdges++;
}
```

---

### P2-31. Evaluate in-memory community_id propagation

`communities.js:346-354` uses SQL subquery for community_id propagation:
```sql
UPDATE nodes SET community_id = (SELECT m.community_id FROM nodes m WHERE m.file_path = nodes.file_path AND m.kind = 'module' LIMIT 1) WHERE kind != 'module'
```
At 10k+ nodes, in-memory Map + batch UPDATE would be faster. Current scale: not urgent.

---

### P2-32. Complete resolveEdges extension suffix list

`graph.js:262` tries `['', '.js', '.mjs', '.ts', '/index.js']`. Missing: `.cjs`, `.jsx`, `.tsx`, `.mts`, `/index.ts`, `/index.tsx`, `/index.mjs`.

---

### P2-33. Escape SQL LIKE wildcards in getModuleByBasename

`graph.js:152` uses `'%/' + basename` — if basename contains `%` or `_`, produces incorrect LIKE matches. Add ESCAPE clause or pre-escape wildcards.

---

### P2-34. Re-number collectInputFiles step annotations

`input-convergence.js` filter loop comments show steps 6→7→3→3.5→5→4→8 (out of order). Renumber to match actual execution order.

---

### P2-35. Extract parseRepoArg from runBuildAsync/runStats

Same as P1-10 but specifically for the two functions in `build.js` (L73-88 and L391-397).

---

## Approaches NOT Recommended

### P2-36. Do NOT use blanket stdlib method blacklist

A simple blacklist of `push`, `indexOf`, `forEach` etc. would:
- Filter user-defined methods with common names (e.g., a custom `Stack.push()`)
- Reduce unresolved count artificially without improving actual resolution quality

**Better approach**: P0-5 (save receiver context) enables intelligent filtering — `Array.prototype.push` can be distinguished from `myStack.push()`.

### P2-37. Do NOT promote caching/dedup to P0

`loadPluginManifest` caching and `requireSqlite` dedup are genuine improvements (P1), but they don't affect correctness or result credibility. They should not block or delay P0 fixes.

---

## Implementation Sequence

### Phase 1: Correctness (P0)

```
Step 1: Fix unresolved_edges incremental semantic (P0-1)
        → graph.js: replaceUnresolvedEdges → partial delete+insert
        → build.js: update count calculation
        → Regression test (P2-28)

Step 2: Add receiver context to calls edges (P0-5)
        → parser.js: extend rawEdge format
        → graph.js: use receiver context in resolveEdges

Step 3: Model external dependencies (P0-3)
        → graph.js: builtin/package classification in resolveEdges
        → migrations.js: add resolution_status to unresolved_edges

Step 4: Unify tests_for generation (P0-4)
        → postprocess.js: new test association step
        → changes.js, review-context.js: consume tested_by edges only

Step 5: Enhance cross-file binding (P0-2)
        → parser.js: export import source metadata
        → graph.js: use import metadata for resolution
```

### Phase 2: Architecture (P1)

```
Step 6: Refactor openDb to throw-based (P1-6)
Step 7: Extract native-loader.js (P1-7)
Step 8: Unify command DB opening via openDbCore (P1-8)
Step 9: Extract CLI arg helpers (P1-10)
Step 10: Refactor large functions (P1-9, P1-11, P1-12)
Step 11: Cache plugin manifest + asset catalog (P1-16, P1-17)
Step 12: Parameterize doctor checks (P1-18)
Step 13: Unify risk scoring (P1-14)
Step 14: Extract review-context helpers (P1-15)
```

### Phase 3: Tests + Polish (P2)

```
Step 15: Add critical regression test (P2-28)
Step 16: Add adapter/plugin/doctor tests (P2-20 to P2-27)
Step 17: Performance and detail fixes (P2-29 to P2-35)
```

---

## Verification Criteria

- [ ] Incremental build preserves unresolved_edges for unchanged files
- [ ] Unresolved edge rate drops below 20% (from 59.7%)
- [ ] `crg query --pattern=tests_for` returns non-empty results
- [ ] All P1 large functions broken into testable sub-functions
- [ ] New test coverage: adapters/, plugin.js, doctor.js, changes.js, flows.js, analyze.js
- [ ] No process.exit() in shared helper functions
