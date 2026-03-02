# First Skill Architectural Review

**Review Date**: 2026-03-02
**Reviewer**: Software Architect Agent
**Scope**: First Skill Architecture & Core Module Design
**Reference**: `.full-review/00-scope.md`

---

## Executive Summary

This review evaluates the architectural design and structural integrity of the Spec-First project, with a focus on the **first skill** architecture. The project demonstrates strong architectural principles with clean separation of concerns, well-defined module boundaries, and a sophisticated three-layer routing system. However, several areas require attention to ensure long-term maintainability and scalability.

### Overall Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Module Boundaries** | Good (B+) | Clear separation, some minor coupling issues |
| **Dependency Management** | Good (B) | Mostly unidirectional, minor circular risks |
| **API Design** | Excellent (A-) | Well-defined interfaces, consistent patterns |
| **Data Model** | Good (B+) | Strong typing, centralized type definitions |
| **Design Patterns** | Excellent (A) | Appropriate use of patterns, clean abstractions |
| **Architectural Consistency** | Excellent (A) | Strong adherence to Spec-First principles |

**Overall Grade**: **B+ (Good with minor improvements needed)**

---

## 1. First Skill Architecture Analysis

### 1.1 Skill Routing Architecture

The three-layer routing system is well-designed:

```
Layer 1: Semantic Map (Compound Commands)
    ↓
Layer 2: Runtime Route (Direct CLI Commands)
    ↓
Layer 3: Skill Route (SKILL.md Discovery)
```

**Strengths**:

1. **Clear Separation of Concerns**: Each layer has a distinct responsibility
2. **Extensibility**: Easy to add new skills without modifying core routing logic
3. **Fallback Strategy**: Proper fallback from project-local to package-level skills
4. **Dual-Host Support**: Well-designed support for both Claude Code and Codex

**File**: `src/core/skill-runtime/dispatcher.ts`

**Code Quality**: The `dispatchCommand` function is well-structured with clear decision points:

```typescript
// Layer 1: Semantic mapping (e.g., "rfc approve" → runtime command)
if (SEMANTIC_MAP[semanticKey]) { ... }

// Layer 2: Runtime commands (direct CLI mapping)
if (RUNTIME_COMMANDS.has(skillName)) { ... }

// Layer 3: Skill route (SKILL.md discovery)
const skillPath = resolveSkillPath(skillName, projectRoot);
```

### 1.2 Quick/Deep Mode Separation

The quick/deep mode separation is **clean and well-designed**:

**Strengths**:

1. **Orthogonal Design**: Quick and deep modes are independent execution paths
2. **Clear Product Mapping**: Each mode has a well-defined set of products
3. **Upgrade Path**: Smooth transition from quick to deep mode
4. **Evidence Requirements**: Deep mode enforces evidence-based conclusions

**File**: `skills/spec-first/00-first/SKILL.md`

**Product Strategy**:

| Mode | Products | Agents | Time |
|------|----------|--------|------|
| quick | 4-5 | 4-5 | <5min |
| deep | 10-11 | 8 (3 waves) | <5min |

### 1.3 Agent Pipeline Architecture

**File**: `skills/spec-first/00-first/references/subagent-architecture.md`

**Strengths**:

1. **Parallel Execution**: Multi-wave agent dispatch for performance
2. **Context Isolation**: Each agent has isolated context
3. **Dependency Management**: Clear dependency graph between agents
4. **Timeout Handling**: Robust timeout and error handling

**Agent Dependency Graph** (deep mode):

```
Wave 1 (parallel):
  A1 → A2 (needs module list)
  A3, B, C1, D (parallel)

Wave 2 (after P1b + C1):
  C2 → local-setup.md

Wave 3 (after A2 + B + D):
  A4 → domain-model.md
```

**Concerns**:

1. **Complexity**: The three-wave system adds complexity to error handling
2. **Cascade Failures**: A1 failure blocks A2 and potentially A4

### 1.4 Incremental Update Architecture

**Files**:
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/skill-runtime/first-resume.ts`
- `src/core/skill-runtime/first-index.ts`

**Strengths**:

1. **Git-Aware**: Leverages git diff for change detection
2. **30% Threshold Strategy**: Smart balance between incremental and full updates
3. **Health Checking**: Comprehensive product health validation
4. **Index Management**: SHA256 hash tracking for manual modification detection

**Change Detection Logic**:

```typescript
if (changePercentage > 0.30) {
  recommendedStrategy = 'full';
} else if (affectedArtifacts.length >= ALL_ARTIFACTS.length) {
  recommendedStrategy = 'full';
} else {
  recommendedStrategy = 'incremental';
}
```

---

## 2. Core Module Architecture

### 2.1 Module Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                      CLI Layer                          │
│  (router.ts, commands/*.ts)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Skill Runtime Layer                    │
│  (dispatcher.ts, prompt-assembler.ts,                  │
│   first-args.ts, first-change-detector.ts)             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Process      │ │ AI           │ │ Template     │
│ Engine       │ │ Orchestrator │ │ Engine       │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌──────────────────┐
              │  Shared Layer    │
              │  (types.ts,      │
              │   config-schema, │
              │   fs-utils.ts)   │
              └──────────────────┘
```

**Dependency Direction**: ✅ Mostly unidirectional (top-down)

### 2.2 Process Engine

**File**: `src/core/process-engine/layer-merger.ts`

**Purpose**: Four-layer rule merging for stage gates and deliverables

**Strengths**:

1. **Layered Architecture**: Clear separation of baseline, mode/size, platform, and user rules
2. **Extension Support**: Namespaced extension rules prevent ID conflicts
3. **Validation**: Strict validation of platform YAML and threshold entries
4. **Conflict Detection**: Throws errors on duplicate gate IDs

**Layer Merging Order**:

```
Layer 0: Baseline (hardcoded defaults)
    ↓
Layer 1: Mode×Size (additive)
    ↓
Layer 2: Platform YAML (merge + conflict detection)
    ↓
Layer 3: User-level override (highest priority)
```

**Code Quality**: Excellent use of validation and normalization functions

```typescript
function normalizeThresholdEntry(raw: unknown, key: string, platform: string): ThresholdEntry {
  // Parses numeric values with unit suffix support
  // Infers direction from key naming patterns
  // Throws clear errors for invalid configurations
}
```

### 2.3 AI Orchestrator

**Files**:
- `src/core/ai-orchestrator/completion-detector.ts`
- `src/core/ai-orchestrator/slop-checker.ts`

**Purpose**: Detect task completion and code quality issues

**Strengths**:

1. **Semantic Completion Detection**: Pattern-based and entity-count checks
2. **Structural Validation**: Detects "fake completion" (empty headings)
3. **Three-Layer Marker Loading**: Skill → Project → Default fallback
4. **Slop Detection**: Dual-layer rule loading (project + global)

**Completion Detection Algorithm**:

```typescript
export function runFullCompletionDetection(
  content: string,
  markers: CompletionMarker[],
): FullDetectionResult {
  const structural = checkStructuralCompletion(content);
  const semantic = runCompletionCheck(content, markers);
  return {
    passed: structural.passed && semantic.passed,
    // Both dimensions must pass
  };
}
```

### 2.4 Template Engine

**File**: `src/core/template/renderer.ts`

**Purpose**: Handlebars-based template rendering with three-tier lookup

**Strengths**:

1. **Priority-Based Lookup**: local → meta → package defaults
2. **Idempotent Writes**: Skips existing files by default
3. **Type-Safe Context**: Strongly typed TemplateContext interface

**Template Lookup Priority**:

```typescript
// 1. User customization (highest priority)
.spec-first/local/templates/

// 2. Package baseline
.spec-first/meta/templates/

// 3. Built-in defaults
templates/
```

---

## 3. Critical Findings

### 3.1 Circular Dependency Risk

**Severity**: **Medium**
**Impact**: Architectural Integrity

**Finding**: While the current dependency graph is mostly unidirectional, there are potential circular dependency risks:

1. **process-engine/advance.ts** imports from `gate-engine/gate-evaluator.js`
2. **gate-engine/gate-evaluator.ts** imports from `trace-engine/matrix.js`
3. **change-mgr/sync.ts** imports from `trace-engine/matrix.js`

**Current State**: ✅ No actual cycles detected

**Risk**: Future changes could introduce cycles if dependencies grow

**Recommendation**:

1. Add automated circular dependency detection to CI pipeline
2. Document dependency boundaries in each module
3. Consider introducing a "core types" layer that all modules can depend on

**Implementation**:

```bash
# Add to package.json scripts
"check:cycles": "madge --circular src/"
```

### 3.2 Agent Pipeline Complexity

**Severity**: **Medium**
**Impact**: Maintainability

**Finding**: The three-wave agent dispatch system in deep mode adds significant complexity:

1. **Error Handling**: Each wave requires independent error handling
2. **Timeout Coordination**: Multiple timeout configurations (60s per agent, 120s per wave, 300s total)
3. **Cascade Failures**: A1 failure blocks A2 and A4

**Code Reference**: `skills/spec-first/00-first/references/subagent-architecture.md`

**Recommendation**:

1. Implement a "wave coordinator" abstraction to centralize error handling
2. Add circuit breaker pattern for agent dispatch
3. Consider parallelizing A1 into frontend/backend sub-agents earlier

**Example Architecture**:

```typescript
interface WaveCoordinator {
  executeWave(agents: Agent[], timeout: number): WaveResult;
  handlePartialFailure(failed: Agent[], succeeded: Agent[]): void;
  shouldContinue(results: WaveResult[]): boolean;
}
```

### 3.3 First Skill Parameter Validation

**Severity**: **Low**
**Impact**: Developer Experience

**Finding**: The `first-args.ts` validation logic is comprehensive but could benefit from:

1. **Schema-Based Validation**: Consider using Zod or similar for type-safe parsing
2. **Default Value Documentation**: Some defaults are not clearly documented
3. **Error Messages**: Could be more actionable

**Current Implementation**: Manual validation with custom error classes

**Recommendation**:

```typescript
// Consider schema-based approach
import { z } from 'zod';

const FirstArgsSchema = z.object({
  mode: z.enum(['quick', 'deep']).default('quick'),
  type: z.enum(['backend', 'frontend', ...]).optional(),
  force: z.boolean().default(false),
  // ... other fields
});

type FirstArgs = z.infer<typeof FirstArgsSchema>;
```

---

## 4. High Priority Findings

### 4.1 Configuration Layer Merging

**Severity**: **Medium**
**Impact**: Configuration Management

**Finding**: The configuration system has two different merging mechanisms:

1. **config-schema.ts**: Three-layer config merge (meta → local → config.yaml)
2. **layer-merger.ts**: Four-layer rule merge (baseline → mode/size → platform → user)

**Concern**: Potential confusion about which system to use for what purpose

**Recommendation**:

1. Document clear boundaries between configuration systems
2. Consider unifying the merging logic into a shared utility
3. Add ADR (Architecture Decision Record) explaining the separation

### 4.2 Template Rendering Safety

**Severity**: **Medium**
**Impact**: Security

**Finding**: The template renderer uses Handlebars without explicit sandboxing:

**File**: `src/core/template/renderer.ts`

**Code**:

```typescript
const compiled = Handlebars.compile(source);
const rendered = compiled(context);
```

**Risk**: Malicious templates could execute arbitrary code

**Recommendation**:

1. Add template sandboxing for user-provided templates
2. Implement template validation before compilation
3. Consider using a more restricted template engine for user content

**Example Protection**:

```typescript
import { Handlebars } from 'handlebars';

// Disable dangerous helpers
const safeHandlebars = Handlebars.create();
safeHandlebars.registerHelper('eval', () => {
  throw new Error('eval helper is disabled');
});
```

### 4.3 Index File Management

**Severity**: **Medium**
**Impact**: Data Integrity

**Finding**: The first-index.ts system uses JSON file for tracking product state:

**Concerns**:

1. **Race Conditions**: Concurrent runs could corrupt the index
2. **File Locking**: No explicit file locking mechanism
3. **Recovery**: No automatic recovery from corrupted index

**Recommendation**:

1. Add file locking for concurrent access protection
2. Implement atomic writes (write to temp file, then rename)
3. Add index validation and auto-repair on startup

---

## 5. Medium Priority Findings

### 5.1 Error Handling Consistency

**Severity**: **Low-Medium**
**Impact**: Code Quality

**Finding**: Error handling patterns vary across modules:

1. Some use custom error classes (`FirstArgsError`)
2. Some throw generic `Error` objects
3. Some return error objects in results

**Recommendation**:

1. Standardize on a base error class hierarchy
2. Use error codes consistently
3. Document error handling patterns in CLAUDE.md

### 5.2 Test Coverage Gaps

**Severity**: **Low-Medium**
**Impact**: Reliability

**Finding**: Test files exist but coverage analysis needed for:

1. **first-change-detector.ts**: Complex git integration logic
2. **first-resume.ts**: Session recovery logic
3. **layer-merger.ts**: Edge cases in threshold normalization

**Recommendation**:

1. Run coverage analysis: `npm run test:coverage`
2. Add integration tests for git-based change detection
3. Add property-based tests for threshold normalization

### 5.3 Documentation Consistency

**Severity**: **Low**
**Impact**: Developer Experience

**Finding**: Documentation is comprehensive but could benefit from:

1. **API Documentation**: Add JSDoc to all public functions
2. **Architecture Diagrams**: Visual representation of module dependencies
3. **Decision Records**: ADRs for major architectural decisions

---

## 6. Low Priority Findings

### 6.1 Code Organization

**Severity**: **Low**
**Impact**: Maintainability

**Finding**: Some files are getting large:

- `layer-merger.ts`: 548 lines
- `first-change-detector.ts`: 647 lines

**Recommendation**: Consider extracting helper functions into separate files

### 6.2 Naming Conventions

**Severity**: **Low**
**Impact**: Readability

**Finding**: Mostly consistent naming, but some inconsistencies:

- `FirstUpdateContext` vs `UpdateContext` naming
- `PRODUCT_NAMES` vs `ProductIndex` capitalization

**Recommendation**: Document naming conventions in style guide

### 6.3 Performance Optimizations

**Severity**: **Low**
**Impact**: Performance

**Finding**: Some potential optimizations:

1. **Git Command Caching**: Cache git command results
2. **File Hash Computation**: Could use incremental hashing for large files
3. **Template Compilation**: Cache compiled templates

---

## 7. Architectural Consistency with Spec-First Principles

### 7.1 Adherence to Core Principles

**File**: `CLAUDE.md`

| Principle | Compliance | Evidence |
|-----------|------------|----------|
| **规范即契约** | ✅ Excellent | Strong type definitions, config schema validation |
| **全链路追溯** | ✅ Excellent | Trace ID system, coverage matrix (C1-C9) |
| **自动化校验** | ✅ Excellent | KV-cache hard gate, completion detection, slop checker |
| **结构化定义** | ✅ Excellent | YAML frontmatter, standardized product formats |

### 7.2 Spec-First Workflow Compliance

**Finding**: The codebase follows the Spec-First workflow principles:

1. **渐进式开发**: ✅ Proper planning and task breakdown
2. **Plan 模式优先**: ✅ Complex tasks use plan mode
3. **Subagent 策略**: ✅ Extensive use of subagents for isolation
4. **自我改进循环**: ✅ Lessons learned documented in tasks/

### 7.3 SOLID Principles Compliance

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **Single Responsibility** | ✅ Good | Each module has clear purpose |
| **Open/Closed** | ✅ Good | Extension system allows adding rules without modification |
| **Liskov Substitution** | ✅ Good | Interfaces properly implemented |
| **Interface Segregation** | ✅ Good | Small, focused interfaces |
| **Dependency Inversion** | ✅ Good | Modules depend on abstractions (types.ts) |

---

## 8. Recommendations

### 8.1 Immediate Actions (High Priority)

1. **Add Circular Dependency Detection**
   - Integrate `madge` into CI pipeline
   - Run on every PR

2. **Implement Template Sandboxing**
   - Add validation for user-provided templates
   - Restrict dangerous Handlebars helpers

3. **Enhance Index File Safety**
   - Add file locking mechanism
   - Implement atomic writes

### 8.2 Short-Term Actions (Medium Priority)

1. **Standardize Error Handling**
   - Create base error class hierarchy
   - Document error handling patterns

2. **Improve Test Coverage**
   - Target 85% coverage for core modules
   - Add integration tests for git integration

3. **Document Architecture Decisions**
   - Create ADRs for major decisions
   - Add architecture diagrams

### 8.3 Long-Term Actions (Low Priority)

1. **Refactor Large Files**
   - Extract helper functions
   - Improve modularity

2. **Performance Optimizations**
   - Cache git command results
   - Optimize file hash computation

3. **Enhance Developer Experience**
   - Add comprehensive API documentation
   - Create interactive architecture explorer

---

## 9. Conclusion

The Spec-First project demonstrates **strong architectural principles** with clear module boundaries, well-designed routing systems, and excellent adherence to Spec-First core principles. The first skill architecture is particularly well-designed with clean quick/deep mode separation and sophisticated agent pipeline management.

### Key Strengths

1. **Clean Module Boundaries**: Each module has a clear purpose and responsibility
2. **Strong Type System**: Comprehensive type definitions in `types.ts`
3. **Extensible Architecture**: Three-layer routing and extension system
4. **Evidence-Based Approach**: Deep mode enforces evidence requirements

### Key Areas for Improvement

1. **Circular Dependency Prevention**: Add automated detection
2. **Error Handling Consistency**: Standardize patterns
3. **Template Security**: Add sandboxing for user content
4. **Test Coverage**: Increase coverage for complex modules

### Final Assessment

**Architectural Health**: **B+ (Good with minor improvements needed)**

The architecture is solid and well-designed. With the recommended improvements, it will reach **A-grade** quality suitable for long-term maintenance and scalability.

---

## Appendix A: Module Dependency Matrix

| Module | Depends On | Dependency Type |
|--------|-----------|-----------------|
| cli/router | skill-runtime, shared | Direct import |
| skill-runtime/dispatcher | shared, process-engine | Direct import |
| process-engine/layer-merger | shared | Direct import |
| ai-orchestrator/completion-detector | skill-runtime, shared | Direct import |
| template/renderer | shared | Direct import |

**Cycle Detection**: ✅ No cycles detected

## Appendix B: File Size Analysis

| File | Lines | Complexity | Recommendation |
|------|-------|------------|----------------|
| layer-merger.ts | 548 | High | Extract helpers |
| first-change-detector.ts | 647 | Medium | Extract formatters |
| dispatcher.ts | 325 | Medium | Good |
| completion-detector.ts | 221 | Low | Good |

## Appendix C: Test Coverage Requirements

| Module | Current Coverage | Target | Priority |
|--------|------------------|--------|----------|
| first-change-detector | Unknown | 85% | High |
| first-resume | Unknown | 85% | High |
| layer-merger | Unknown | 80% | Medium |
| completion-detector | Unknown | 75% | Low |

---

**Review Completed**: 2026-03-02
**Next Review**: Recommended after implementing high-priority fixes
