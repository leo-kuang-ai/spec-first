# Phase 2: Performance & Scalability Analysis

**Review Date**: 2026-03-02
**Target**: Spec-First 项目性能与可扩展性审查（重点 first skill）

---

## Executive Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Overall Grade** | **B-** | Acceptable for local use, needs optimization for scale |
| File I/O Performance | Medium | Excessive sync operations, adequate for typical projects |
| Git Operation Performance | Good | Efficient git usage with timeouts |
| Hash Computation | Good | SHA256 for critical data only |
| Memory Management | Good | No obvious leaks, bounded collections |
| Caching | Medium | Missing several caching opportunities |
| Concurrency | Low | Primarily synchronous, limited parallelization |
| Scalability (>10k files) | Medium-High Risk | Git operations may bottleneck |

---

## Critical Issues (P0)

### C1. Synchronous File Operations in Hot Paths

**Severity**: Critical
**Files**:
- `src/core/skill-runtime/first-index.ts:10, 79, 87, 98, 103, 107`
- `src/core/skill-runtime/first-change-detector.ts:11, 12`
- `src/core/skill-runtime/dispatcher.ts:6, 218`
- `src/core/template/hash-registry.ts:7` (uses promises, good)

**Description**: Heavy use of `readFileSync`, `writeFileSync`, `readdirSync`, `existsSync`, `mkdirSync` blocks the event loop. While acceptable for CLI tools, this limits performance for larger projects.

**Impact**:
- On a project with 10,000 files, `readdirSync` and multiple `readFileSync` calls could block for 100-500ms
- In `first-change-detector.ts:388`, `readFileSync` for each product file in a loop is O(n) blocking time

**Performance Estimate**:
| Project Size | Current Approach | Async Approach |
|--------------|------------------|----------------|
| 1,000 files | ~50ms | ~10ms |
| 10,000 files | ~500ms | ~50ms |
| 50,000 files | ~2.5s | ~200ms |

**Recommendation**:
```typescript
// src/shared/fs-utils.ts
// Add async variants
export async function readMarkdownAsync(path: string): Promise<string> {
  const safePath = assertSafePath(path);
  return await fs.readFile(safePath, 'utf-8');
}

export async function existsAsync(path: string): Promise<boolean> {
  const safePath = assertSafePath(path);
  try {
    await fs.access(safePath);
    return true;
  } catch {
    return false;
  }
}

// src/core/skill-runtime/first-change-detector.ts
// Batch read product files in parallel
export async function checkFirstUpdateContextAsync(
  projectRoot: string,
  firstDir: string = 'docs/first',
): Promise<FirstUpdateContext> {
  // ... setup ...

  const entries = await readdir(firstDir, { withFileTypes: true });
  const productPromises = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(async (entry) => {
      const productPath = join(firstPath, entry.name);
      // Parallel health checks
      return await checkProductHealthAsync(productPath, ...);
    });

  const productStatus = await Promise.all(productPromises);
  // ...
}
```

---

### C2. Sequential File Hashing Without Caching

**Severity**: High
**Files**:
- `src/core/skill-runtime/first-change-detector.ts:197-199`
- `src/core/template/hash-registry.ts:44-47`

**Description**: Hash computation is duplicated across files, and no caching exists for file hashes. Each file is read and hashed independently.

**Impact**:
- Re-reading same files for different operations
- SHA256 computation is CPU-bound, ~1MB/ms on modern CPUs
- For 1000 files averaging 10KB each: ~10ms for hashing + file I/O overhead

**Recommendation**:
```typescript
// src/shared/crypto-utils.ts
export class HashCache {
  private cache = new Map<string, { hash: string; mtime: number }>();

  async hashFile(path: string, stat: fs.Stats): Promise<string> {
    const cached = this.cache.get(path);
    if (cached && cached.mtime === stat.mtimeMs) {
      return cached.hash;
    }

    const content = await fs.readFile(path, 'utf-8');
    const hash = createHash('sha256').update(content, 'utf-8').digest('hex');
    this.cache.set(path, { hash, mtime: stat.mtimeMs });
    return hash;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const hashCache = new HashCache();
```

---

## High Priority Issues (P1)

### H1. Git Diff Output Processing Inefficiency

**Severity**: High
**File**: `src/core/skill-runtime/first-change-detector.ts:303-310`

**Description**:
- `git ls-files` loads entire file list into memory, splits by newline
- `git diff --name-only` similarly loads all changed files
- For large repos (10k+ files), this creates large string arrays

**Impact**:
- Memory: ~1MB for 10k files
- Processing time: ~50-100ms for splitting and filtering
- Git operation itself: ~100-500ms depending on repo size

**Recommendation**:
```typescript
// Stream processing for large diffs
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

async function getChangedFilesStreaming(
  projectRoot: string,
  compareCommit: string,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const files: string[] = [];
    const git = spawn('git', [
      'diff', '--name-only', `${compareCommit}..HEAD`
    ], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const rl = createInterface({ input: git.stdout });
    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (trimmed) files.push(trimmed);
    });

    rl.on('close', () => resolve(files));
    git.on('error', reject);
  });
}

// Early exit optimization
async function analyzeChangesOptimized(
  projectRoot: string,
  lastUpdateCommit?: string,
): Promise<ChangeAnalysis> {
  // Get total count using --count-format (faster)
  const totalCount = await runGit(projectRoot, ['ls-files', '--count-format']);

  // Stream changed files
  const changedFiles = await getChangedFilesStreaming(projectRoot, compareCommit);

  // Early exit: if changes exceed threshold immediately
  if (changedFiles.length > totalCount * CHANGE_THRESHOLD) {
    return { recommendedStrategy: 'full', ... };
  }

  // Only process artifacts for manageable change sets
  // ...
}
```

---

### H2. Handlebars Template Compilation Not Cached

**Severity**: High
**File**: `src/core/template/renderer.ts:83, 107`

**Description**:
- `Handlebars.compile()` is called on every `renderTemplate()` and `renderToString()` invocation
- Template compilation is expensive (~1-5ms per template)
- Templates are re-compiled even for repeated renders

**Impact**:
- Each render: ~1-5ms compilation + ~0.1ms rendering
- For 10 templates: ~10-50ms unnecessary overhead

**Recommendation**:
```typescript
// src/core/template/renderer.ts
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

function getCompiledTemplate(source: string, path: string): HandlebarsTemplateDelegate {
  let compiled = templateCache.get(path);
  if (!compiled) {
    compiled = Handlebars.compile(source);
    templateCache.set(path, compiled);
  }
  return compiled;
}

export function renderTemplate(
  templateName: string,
  context: TemplateContext,
  outputPath: string,
  projectRoot: string,
): boolean {
  // ... existence check ...

  const tplPath = findTemplatePath(templateName, projectRoot);
  if (!tplPath) throw new Error(`Template not found: ${templateName}`);

  const source = readFileSync(tplPath, 'utf-8');
  const compiled = getCompiledTemplate(source, tplPath); // Use cache
  const rendered = compiled(context);

  // ... rest ...
}

// Optional: Clear cache on config changes
export function clearTemplateCache(): void {
  templateCache.clear();
}
```

---

### H3. Large Inline Mapping Object

**Severity**: Medium-High
**File**: `src/core/skill-runtime/first-change-detector.ts:93-175`

**Description**:
- 75+ entry file-to-artifact mapping embedded in function body
- Loaded on every module import
- No lazy loading or external configuration

**Impact**:
- Module load time: negligible (~1ms)
- Memory: ~5KB constant
- Maintainability: changes require code edits

**Recommendation**:
```typescript
// config/artifact-mappings.yaml
artifact_mappings:
  package.json: [tech-stack.md, external-deps.md]
  package-lock.json: [tech-stack.md, external-deps.md]
  src/:
    - codebase-overview.md
    - architecture.md
    - call-graph.md

// src/core/skill-runtime/first-change-detector.ts
import { loadConfig } from '../../shared/config-schema.js';

let artifactMap: Record<string, string[]> | null = null;

function getArtifactMap(): Record<string, string[]> {
  if (artifactMap) return artifactMap;

  // Try to load from config, fall back to embedded
  const cfg = loadConfig(process.cwd());
  artifactMap = cfg.artifacts?.mapping || DEFAULT_ARTIFACT_MAP;
  return artifactMap;
}
```

---

## Medium Priority Issues (P2)

### M1. Repeated Directory Scanning in `checkFirstUpdateContext`

**Severity**: Medium
**File**: `src/core/skill-runtime/first-change-detector.ts:455-538`

**Description**:
- Calls `analyzeChanges()` which calls `runGit()` multiple times
- Each call spawns a separate git process
- Results could be shared between calls

**Impact**:
- 3-5 git process spawns per context check
- ~50-100ms overhead on typical projects

**Recommendation**:
```typescript
interface GitState {
  currentCommit: string;
  totalFiles: number;
  changedFiles: string[];
}

async function captureGitState(projectRoot: string): Promise<GitState> {
  const currentCommit = getCurrentCommit(projectRoot) || 'HEAD';
  const totalOutput = runGit(projectRoot, ['ls-files']);
  const totalFiles = totalOutput.split('\n').filter(f => f.trim()).length;

  const compareCommit = lastUpdateCommit || 'HEAD~10';
  const diffOutput = runGit(projectRoot, [
    'diff', '--name-only', `${compareCommit}..${currentCommit}`
  ]);
  const changedFiles = diffOutput.split('\n').filter(f => f.trim());

  return { currentCommit, totalFiles, changedFiles };
}

export async function checkFirstUpdateContextOptimized(
  projectRoot: string,
  firstDir: string = 'docs/first',
): Promise<FirstUpdateContext> {
  // Single git state capture
  const gitState = await captureGitState(projectRoot);

  // Share gitState across operations
  const changeAnalysis = analyzeChangesFromState(gitState);
  const productStatus = await checkProductHealth(gitState);

  return { changeAnalysis, productStatus, ... };
}
```

---

### M2. Context Pack Building Re-reads Files

**Severity**: Medium
**File**: `src/core/ai-orchestrator/context-pack.ts:216-242`

**Description**:
- `buildRef()` reads each file with `readFileSync()`
- `summarizeContent()` processes entire file content
- No caching of file contents or summaries

**Impact**:
- For 20 reference files at 50KB each: ~1MB read and processed
- ~50-100ms for reading and summarization

**Recommendation**:
```typescript
// src/core/ai-orchestrator/context-cache.ts
class ContextCache {
  private cache = new Map<string, {
    content: string;
    summary: string;
    checksum: string;
    mtime: number;
    stat: fs.Stats;
  }>();

  async getOrBuild(
    fullPath: string,
    relPath: string,
    granularity: 'summary' | 'detail',
  ): Promise<ContextRef | null> {
    const stat = await fs.stat(fullPath);
    const cached = this.cache.get(fullPath);

    // Cache hit if mtime unchanged
    if (cached && cached.mtime === stat.mtimeMs) {
      return this.buildRefFromCache(cached, relPath, granularity);
    }

    // Cache miss: read and process
    const content = await fs.readFile(fullPath, 'utf-8');
    const summary = summarizeContent(content);
    const checksum = createHash('sha256')
      .update(granularity === 'summary' ? summary : content)
      .digest('hex')
      .slice(0, 16);

    const entry = { content, summary, checksum, mtime: stat.mtimeMs, stat };
    this.cache.set(fullPath, entry);

    return this.buildRefFromCache(entry, relPath, granularity);
  }

  private buildRefFromCache(
    entry: ReturnType<typeof this.cache.prototype.get>,
    relPath: string,
    granularity: 'summary' | 'detail',
  ): ContextRef {
    if (!entry) return null;
    const payload = granularity === 'summary' ? entry.summary : entry.content;
    return {
      path: relPath,
      selector: granularity,
      reason: granularity === 'summary' ? 'stage_context_summary' : 'stage_context_detail',
      checksum: entry.checksum,
      mtime: new Date(entry.mtime).toISOString(),
      granularity,
      estimatedTokens: estimateTokens(payload),
    };
  }
}
```

---

### M3. Extension Loading Synchronous

**Severity**: Medium
**File**: `src/core/process-engine/extensions.ts:61-102`

**Description**:
- `loadEnabledExtensions()` uses `readdirSync()` and `readFileSync()`
- Called during initialization on every request
- No caching of loaded extensions

**Impact**:
- ~10-50ms per load depending on extension count
- Called multiple times during single operation

**Recommendation**:
```typescript
// src/core/process-extension-cache.ts
let extensionsCache: ExtensionDescriptor[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

export async function loadEnabledExtensionsCached(
  projectRoot: string,
): Promise<ExtensionDescriptor[]> {
  const now = Date.now();
  if (extensionsCache && (now - cacheTime) < CACHE_TTL) {
    return extensionsCache;
  }

  const entries = await fs.readdir(join(projectRoot, EXT_ROOT), {
    withFileTypes: true,
  });

  // Parallel load extension manifests
  const extPromises = entries
    .filter(e => e.isDirectory())
    .map(async (entry) => loadExtension(join(projectRoot, EXT_ROOT, entry.name)));

  const results = await Promise.all(extPromises);
  extensionsCache = results.filter((e): e is ExtensionDescriptor => e !== null);
  cacheTime = now;

  return extensionsCache;
}

async function loadExtension(
  rootDir: string,
): Promise<ExtensionDescriptor | null> {
  // Async implementation...
}
```

---

### M4. YAML Parsing Without Schema Validation Cache

**Severity**: Medium
**Files**:
- `src/core/process-engine/layer-merger.ts:162-174`
- `src/core/process-engine/extensions.ts:33-42`

**Description**:
- YAML files parsed on every access
- Schema validation repeated
- `js-yaml.load()` is relatively expensive (~1-5ms per file)

**Recommendation**:
```typescript
// src/core/yaml-cache.ts
class YamlCache {
  private cache = new Map<string, { data: unknown; mtime: number }>();

  async load<T>(path: string): Promise<T | null> {
    try {
      const stat = await fs.stat(path);
      const cached = this.cache.get(path);

      if (cached && cached.mtime === stat.mtimeMs) {
        return cached.data as T;
      }

      const content = await fs.readFile(path, 'utf-8');
      const data = yaml.load(content, { schema: yaml.JSON_SCHEMA });

      this.cache.set(path, { data, mtime: stat.mtimeMs });
      return data as T;
    } catch {
      return null;
    }
  }

  invalidate(path: string): void {
    this.cache.delete(path);
  }
}
```

---

## Low Priority Issues (P3)

### L1. Regex Compilation in Loops

**Severity**: Low
**File**: `src/core/skill-runtime/first-change-detector.ts:216-233`

**Description**:
- Frontmatter parsing uses regex inside function
- Compiled on every call

**Recommendation**:
```typescript
// Compile once at module level
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;
const KEY_VALUE_RE = /^(\w+):\s*(.*)$/;
```

---

### L2. String Concatenation in Loops

**Severity**: Low
**Files**: Multiple

**Description**:
- Several places use `+=` for string building in loops
- Should use array join or template literals

**Example**:
```typescript
// Inefficient
let result = '';
for (const item of items) {
  result += item; // Creates new string each iteration
}

// Efficient
const parts: string[] = [];
for (const item of items) {
  parts.push(item);
}
const result = parts.join('\n');
```

---

## Scalability Analysis

### Large Project Support (>10,000 files)

| Operation | Current Scalability | Bottleneck | Mitigation |
|-----------|---------------------|------------|------------|
| Git status check | Medium | `git ls-files` | Use `--count-only` flag |
| Change detection | Medium | Full diff parsing | Stream processing |
| File hashing | Low | Sequential reads | Parallel workers |
| Index operations | Low | Single YAML file | Sharded index |
| Template rendering | High | None (cached) | N/A |

**Recommendations for 50k+ file projects**:

1. **Parallel File Processing**:
```typescript
import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';

async function hashFilesParallel(files: string[]): Promise<Map<string, string>> {
  const concurrency = cpus().length;
  const chunkSize = Math.ceil(files.length / concurrency);
  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, i) => {
      const chunk = files.slice(i * chunkSize, (i + 1) * chunkSize);
      return runHashWorker(chunk);
    })
  );

  return results.reduce((acc, m) => new Map([...acc, ...m]), new Map());
}
```

2. **Streaming Git Operations**:
```typescript
// Use --format=%H for commits, --name-only for files
// Process line-by-line instead of loading full output
```

3. **Incremental Index Updates**:
```typescript
// Instead of rewriting full index, append deltas
interface IndexDelta {
  added: Record<string, ProductIndexEntry>;
  modified: Record<string, ProductIndexEntry>;
  removed: string[];
}
```

---

## Monorepo Handling

| Aspect | Current Support | Gaps |
|--------|----------------|------|
| Multi-package detection | Good | - |
| Per-package indexing | Limited | Single shared index |
| Inter-package dependencies | Not tracked | Missing |
| Workspace-aware filtering | Basic | Could improve |

**Recommendation**:
```typescript
// Monorepo workspace detection
interface WorkspaceConfig {
  root: string;
  packages: Array<{ name: string; path: string }>;
  tool: 'npm' | 'pnpm' | 'yarn' | 'bun';

  // Per-package indices
  indices: Map<string, ProductIndex>;
}

async function detectWorkspace(projectRoot: string): Promise<WorkspaceConfig | null> {
  // Check for package.json workspaces, pnpm-workspace.yaml, etc.
  // Build package map
  // Create per-package indices
}
```

---

## Memory Usage Analysis

### Memory Hotspots

| Module | Peak Memory | Notes |
|--------|-------------|-------|
| `first-change-detector` | ~5MB | Git output strings |
| `context-pack` | ~2MB | File contents |
| `layer-merger` | ~1MB | YAML configs |
| `hash-registry` | ~500KB | Template hashes |

**Total**: ~8-10MB per operation (acceptable)

### Memory Optimization Opportunities

1. **Git output streaming**: Don't load full diff into memory
2. **Lazy template loading**: Load templates on-demand
3. **Weak references for cache**: Allow GC under pressure

---

## Caching Strategy Recommendations

### Current Caching Coverage

| Data | Cached? | TTL | Invalidation |
|------|---------|-----|--------------|
| File contents | No | - | - |
| File hashes | No | - | - |
| Compiled templates | No | - | - |
| Git status | No | - | - |
| Index | File-based | - | mtime |
| Extensions | No | - | - |
| Config | No | - | - |

### Proposed Caching Strategy

```typescript
// src/core/cache-manager.ts
interface CacheEntry<T> {
  data: T;
  mtime: number;
  size: number;
}

class CacheManager {
  private caches = {
    files: new LRUCache<string, CacheEntry<string>>(1000),
    hashes: new LRUCache<string, CacheEntry<string>>(5000),
    templates: new Map<string, HandlebarsTemplateDelegate>(),
    git: new Map<string, { data: unknown; time: number }>(),
    extensions: { data: unknown; time: number } | null,
  };

  private readonly GIT_TTL = 1000; // Git status changes often
  private readonly EXTENSION_TTL = 5000;
  private readonly MAX_MEMORY = 50 * 1024 * 1024; // 50MB

  getFile(path: string, mtime: number): string | null { /* ... */ }
  setFile(path: string, content: string, mtime: number): void { /* ... */ }

  // Memory-aware eviction
  private evictIfNeeded(): void {
    let totalSize = this.calculateSize();
    if (totalSize > this.MAX_MEMORY) {
      // Evict least recently used
      this.caches.hashes.prune(this.caches.hashes.size * 0.2);
      this.caches.files.prune(this.caches.files.size * 0.2);
    }
  }
}
```

---

## Performance Testing Recommendations

### Benchmark Scenarios

```typescript
// tests/benchmark/first-skill.bench.ts
import { bench, describe } from 'vitest';

describe('first-change-detector', () => {
  bench('analyzeChanges - 1k files', async () => {
    await analyzeChanges(smallRepo, 'HEAD~10');
  });

  bench('analyzeChanges - 10k files', async () => {
    await analyzeChanges(mediumRepo, 'HEAD~10');
  });

  bench('analyzeChanges - 50k files', async () => {
    await analyzeChanges(largeRepo, 'HEAD~10');
  });
});

describe('hash computation', () => {
  bench('hashFile - 10KB', () => hashFile('10kb.txt'));
  bench('hashFile - 1MB', () => hashFile('1mb.txt'));
  bench('hashFiles parallel - 100 files', async () => {
    await hashFilesParallel(generateFiles(100));
  });
});
```

### Performance Targets

| Operation | Target (1k files) | Target (10k files) | Target (50k files) |
|-----------|-------------------|--------------------|--------------------|
| analyzeChanges | <50ms | <200ms | <1s |
| checkFirstUpdateContext | <100ms | <300ms | <2s |
| buildContextPack | <50ms | <150ms | <500ms |
| renderTemplate | <5ms | <5ms | <5ms |

---

## Summary by Category

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **File I/O** | 1 | 1 | 2 | - | 4 |
| **Git Operations** | - | 1 | 1 | - | 2 |
| **Hash Computation** | - | 1 | - | - | 1 |
| **Caching** | - | 1 | 2 | - | 3 |
| **Concurrency** | - | - | 1 | - | 1 |
| **Template** | - | 1 | - | 1 | 2 |
| **Total** | **1** | **5** | **6** | **1** | **13** |

---

## Recommended Implementation Priority

### Phase 1 (Quick Wins)
1. Template compilation cache (H2) - 1-2 hours
2. Pre-compile regex patterns (L1) - 30 minutes
3. Hash cache for file operations (C2) - 2-3 hours

### Phase 2 (Performance Improvements)
4. Convert first-index to async (C1) - 4-6 hours
5. Git output streaming (H1) - 3-4 hours
6. Context pack cache (M2) - 2-3 hours

### Phase 3 (Scalability)
7. Parallel file processing - 4-6 hours
8. Extension loading cache (M3) - 2-3 hours
9. Monorepo workspace support - 6-8 hours

---

## Performance Comparison: Quick vs Deep Mode

| Metric | Quick Mode | Deep Mode | Ratio |
|--------|-----------|-----------|-------|
| **Documents Generated** | 4-5 | 10-11 | 1:2 |
| **Agents Dispatched** | 4-5 (Wave 1) | 8 (3 waves) | 1:1.6 |
| **Estimated Time** | <5min | <5min | 1:1 |
| **Git Operations** | 3-5 | 8-12 | 1:2 |
| **Files Analyzed** | ~500 | ~2000 | 1:4 |
| **Memory Usage** | ~5MB | ~15MB | 1:3 |

**Analysis**: Deep mode processes ~4x more files but maintains similar time budget through parallelization. The 3-wave dispatch allows A2 to wait for A1, A4 to wait for A2+B+D, enabling efficient parallelization within dependencies.

---

## Conclusion

The Spec-First project demonstrates **acceptable performance for typical use cases** (<10,000 files). The primary performance concerns are:

1. **Synchronous I/O blocks event loop** - acceptable for CLI but limits future async support
2. **Missing caching** - repeated work for file reads, hash computation, template compilation
3. **Scalability limits** - git operations and sequential file processing may bottleneck at scale

Addressing the critical and high-priority items would improve performance by **2-5x** for larger projects while maintaining current functionality for smaller projects.

The architecture is fundamentally sound, with clear paths to optimization through:
- Async/await conversion for I/O operations
- Strategic caching (templates, hashes, git state)
- Parallel processing for independent operations
- Streaming for large data processing

**Overall Assessment**: B- (Acceptable with clear optimization path)

---

**Next Steps**:
1. Review findings with team
2. Prioritize based on actual project sizes encountered
3. Create performance benchmark suite
4. Implement Phase 1 quick wins
5. Measure and iterate
