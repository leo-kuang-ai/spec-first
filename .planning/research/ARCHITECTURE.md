# Architecture Research

**Domain:** AI Agent Skill System (spec-first)
**Researched:** 2026-03-23
**Confidence:** HIGH

## Standard Architecture

### Three-Layer Skill System Model

The industry-standard skill system architecture follows a three-layer model, as documented in [AI Agent Architecture guides](https://shuji-bonji.github.io/ai-agent-architecture/):

```
+------------------------------------------------------------------+
|                        LAYER 1: HOST RUNTIME                       |
|  +-------------------------------------------------------------+  |
|  |  Claude Code / Cursor / Cline / Codex                      |  |
|  |  - Tool definition injection (Skill tool with <skills>)    |  |
|  |  - Runtime dispatch (command → skill folder lookup)        |  |
|  |  - Context window management                                |  |
|  +-------------------------------------------------------------+  |
+------------------------------------------------------------------+
                                 |
                                 v (invoke skill by name)
+------------------------------------------------------------------+
|                      LAYER 2: SKILL REGISTRY                       |
|  +----------------+  +----------------+  +----------------+        |
|  | skill-a/       |  | skill-b/       |  | skill-c/       |        |
|  | SKILL.md       |  | SKILL.md       |  | SKILL.md       |        |
|  | scripts/       |  | templates/     |  | utils/         |        |
|  | resources/     |  | helpers/       |  | data/          |        |
|  +----------------+  +----------------+  +----------------+        |
+------------------------------------------------------------------+
                                 |
                                 v (expand prompt + execute helpers)
+------------------------------------------------------------------+
|                      LAYER 3: EXECUTION LAYER                      |
|  +----------------+  +----------------+  +----------------+        |
|  | Bash tools     |  | External tools |  | Shared libs    |        |
|  | (binaries,     |  | (MCP servers,  |  | (validators,   |        |
|  |  scripts)      |  |  APIs)         |  |  generators)   |        |
|  +----------------+  +----------------+  +----------------+        |
+------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Host Runtime** | Tool injection, skill discovery, context management | Claude Code, Cursor, Cline |
| **SKILL.md** | Declarative skill definition (YAML frontmatter + instructions) | Markdown with YAML metadata |
| **Template System** | Generate SKILL.md from .tmpl sources with placeholders | gen-skill-docs.ts pattern |
| **Validation Layer** | Static validation of commands, structure, freshness | skill-parser.ts + skill-check.ts |
| **Test Infrastructure** | E2E tests, LLM-as-judge, eval persistence | session-runner.ts + eval-store.ts |
| **Execution Helpers** | Binaries, scripts, external tools invoked by skills | bin/ folder, browse CLI |

## Current spec-first Architecture

### System Overview

```
+------------------------------------------------------------------+
|                        Claude Code Runtime                         |
|  +-------------------------------------------------------------+  |
|  |  Skill tool definition (injected via <skills> section)      |  |
|  |  - Discovers skills in ~/.claude/skills/spec-first/         |  |
|  |  - Dispatches to skill folder on invocation                 |  |
|  +-------------------------------------------------------------+  |
+------------------------------------------------------------------+
                                 |
                                 v
+------------------------------------------------------------------+
|                      SKILL REGISTRY (~27 skills)                   |
|  +--------------+  +--------------+  +--------------+              |
|  | spec-first/  |  | brainstorm/  |  | ship/        | ...          |
|  | SKILL.md     |  | SKILL.md     |  | SKILL.md     |              |
|  | SKILL.md.tmpl|  | SKILL.md.tmpl|  | SKILL.md.tmpl|              |
|  +--------------+  +--------------+  +--------------+              |
+------------------------------------------------------------------+
                                 |
                                 v
+------------------------------------------------------------------+
|                      INFRASTRUCTURE LAYER                          |
|  +-----------------+  +-----------------+  +-----------------+     |
|  | gen-skill-docs  |  | skill-check     |  | skill-parser    |     |
|  | (template → md) |  | (health report) |  | (validation)    |     |
|  +-----------------+  +-----------------+  +-----------------+     |
|  +-----------------+  +-----------------+  +-----------------+     |
|  | session-runner  |  | eval-store      |  | llm-judge       |     |
|  | (E2E testing)   |  | (eval results)  |  | (quality eval)  |     |
|  +-----------------+  +-----------------+  +-----------------+     |
|  +-----------------+  +-----------------+                         |
|  | browse CLI      |  | commands.ts     |                         |
|  | (Playwright)    |  | (cmd registry)  |                         |
|  +-----------------+  +-----------------+                         |
+------------------------------------------------------------------+
```

### Current Project Structure

```
spec-first/
+-- browse/                    # Headless browser (Playwright)
|   +-- src/
|   |   +-- commands.ts        # Command registry (single source of truth)
|   |   +-- snapshot.ts        # Snapshot flags metadata
|   |   +-- server.ts          # Runtime dispatch
|   +-- dist/                  # Compiled binary
+-- scripts/                   # Build + DX tooling
|   +-- gen-skill-docs.ts      # Template → SKILL.md generator
|   +-- skill-check.ts         # Health dashboard
|   +-- dev-skill.ts           # Watch mode
|   +-- eval-*.ts              # Eval management CLIs
+-- test/                      # Validation + eval tests
|   +-- helpers/
|   |   +-- skill-parser.ts    # Static validation
|   |   +-- session-runner.ts  # Claude CLI subprocess runner
|   |   +-- eval-store.ts      # Eval persistence + comparison
|   |   +-- llm-judge.ts       # LLM-as-judge quality scoring
|   +-- skill-validation.test.ts   # Tier 1: static (free)
|   +-- gen-skill-docs.test.ts     # Tier 1: generator quality
|   +-- skill-llm-eval.test.ts     # Tier 3: LLM judge (~$0.15)
|   +-- skill-e2e-*.test.ts        # Tier 2: E2E (~$3.85)
+-- {skill-name}/              # Each skill is a folder
|   +-- SKILL.md.tmpl          # Template (source of truth)
|   +-- SKILL.md               # Generated (DO NOT EDIT)
+-- bin/                       # Helper binaries
    +-- spec-first-config      # Config CLI
    +-- spec-first-update-check # Version checker
```

### Key Architectural Decisions (Current)

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| `.tmpl` → generated `SKILL.md` | Single source of truth, prevents drift | Extra build step |
| Command registry in `commands.ts` | Centralized validation | Coupling to browse module |
| Preamble via `{{PLACEHOLDER}}` | Consistent session setup | Template complexity |
| Multi-host support (Claude/Codex) | Cross-platform skills | Path abstraction layer |

## Architectural Patterns

### Pattern 1: Progressive Disclosure

**What:** Skills expose metadata (name, description) first, then expand full instructions only when invoked.

**When to use:** All skills — this is how Claude Code's Skill tool works.

**Example from [mikhail.io](https://mikhail.io/2025/10/claude-code-skills/):**
```yaml
# SKILL.md frontmatter (always visible)
---
name: brainstorm
description: |
  Brainstorm — two modes. Startup mode: six forcing questions...
---

# Full instructions (loaded on invoke)
# Brainstorm
You are a brainstorm partner...
```

**Trade-offs:**
- (+) Keeps context window lean
- (+) Claude can choose appropriate skill without loading all
- (-) Requires careful description writing for accurate routing

### Pattern 2: Template-Generated Skill Files

**What:** SKILL.md files are generated from .tmpl templates with placeholder resolution.

**When to use:** When skills share common sections (preambles, command references) or need host-specific paths.

**Example:**
```markdown
<!-- SKILL.md.tmpl -->
---
name: {{SKILL_NAME}}
description: {{DESCRIPTION}}
---

{{PREAMBLE}}

## Commands
{{COMMAND_REFERENCE}}
```

```typescript
// gen-skill-docs.ts resolver
function generateCommandReference(ctx: TemplateContext): string {
  // Build markdown table from COMMAND_DESCRIPTIONS registry
}
```

**Trade-offs:**
- (+) DRY — shared sections defined once
- (+) Type-safe placeholder resolution
- (+) Freshness checks (dry-run mode)
- (-) Extra build step
- (-) Merge conflicts on generated files require template resolution

### Pattern 3: Command Registry + Validation

**What:** Central registry of valid commands, used by both runtime (server.ts) and static validation (skill-parser.ts).

**When to use:** When skills invoke external tools that need validation.

**Example:**
```typescript
// commands.ts (single source of truth)
export const ALL_COMMANDS = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);

export const COMMAND_DESCRIPTIONS: Record<string, {...}> = {
  'goto': { category: 'Navigation', description: 'Navigate to URL', usage: 'goto <url>' },
  // ...
};

// skill-parser.ts (validation)
export function validateSkill(skillPath: string): ValidationResult {
  for (const cmd of commands) {
    if (!ALL_COMMANDS.has(cmd.command)) {
      result.invalid.push(cmd);
    }
  }
}
```

**Trade-offs:**
- (+) Single source of truth
- (+) Static validation catches errors early
- (+) Auto-generated documentation
- (-) Coupling between modules

### Pattern 4: E2E Session Runner

**What:** Spawn `claude -p` as independent subprocess, stream NDJSON output, accumulate tool calls.

**When to use:** Testing skills in real Claude Code environment.

**Example from session-runner.ts:**
```typescript
export interface SkillTestResult {
  toolCalls: Array<{ tool: string; input: any; output: string }>;
  browseErrors: string[];
  exitReason: string;
  duration: number;
  costEstimate: CostEstimate;
}
```

**Trade-offs:**
- (+) Real-world validation (actual Claude behavior)
- (+) Independent of Agent SDK (works inside Claude Code)
- (-) Paid API calls (~$3.85/run for full suite)
- (-) Latency (30-45 min for full suite)

### Pattern 5: Eval Persistence + Comparison

**What:** Store eval results with git metadata, auto-compare with previous run.

**When to use:** Tracking quality over time, detecting regressions.

**Example from eval-store.ts:**
```typescript
export interface EvalResult {
  schema_version: number;
  version: string;
  branch: string;
  git_sha: string;
  timestamp: string;
  tests: EvalTestEntry[];
}
```

**Trade-offs:**
- (+) Historical tracking
- (+) Diff-based test selection (cost optimization)
- (-) Storage growth over time
- (-) Schema versioning complexity

## Data Flow

### Skill Invocation Flow

```
[User: "brainstorm this idea"]
         |
         v
[Claude Code: Match skill description]
         |
         v
[Tool Use: Skill(command: "brainstorm")]
         |
         v
[Claude Code: Resolve skill folder]
         |
         v
[Tool Result: Base path + SKILL.md body]
         |
         v
[Claude: Follow expanded instructions]
         |
         v
[Claude: Execute bash blocks, call tools]
         |
         v
[Output: Design doc in ~/.spec-first/projects/]
```

### Template Generation Flow

```
[SKILL.md.tmpl]
         |
         v
[gen-skill-docs.ts: Find {{PLACEHOLDERS}}]
         |
         +---> [generatePreambleBash(ctx)]
         +---> [generateCommandReference(ctx)]
         +---> [generateSnapshotFlags(ctx)]
         |
         v
[Resolve paths for host (Claude/Codex)]
         |
         v
[Write SKILL.md]
         |
         v
[skill-check.ts: Freshness validation]
```

### Validation Flow

```
[SKILL.md]
         |
         v
[skill-parser.ts: Extract $B commands]
         |
         v
[Check against ALL_COMMANDS registry]
         |
         +---> [valid: known commands]
         +---> [invalid: unknown commands]
         +---> [snapshotFlagErrors: bad flags]
         |
         v
[ValidationResult: {valid, invalid, warnings}]
```

### E2E Test Flow

```
[Test: skill-e2e-*.test.ts]
         |
         v
[session-runner.ts: Spawn claude -p]
         |
         v
[Stream NDJSON output]
         |
         +---> [Parse transcript events]
         +---> [Accumulate tool calls]
         +---> [Scan for browse errors]
         |
         v
[llm-judge.ts: Score output quality]
         |
         v
[eval-store.ts: Persist result + compare]
```

## Recommended Architecture Improvements

Based on research into skill system design patterns from [AI Agent Architecture](https://shuji-bonji.github.io/ai-agent-architecture/), [Thesys Agent Skills](https://www.thesys.dev/blogs/agent-skill), and [Google Cloud Agentic AI Patterns](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system):

### Improvement 1: Skill Interface Abstraction

**Current issue:** Skills are loosely structured folders with no formal interface.

**Recommendation:** Define a `SkillManifest` interface that all skills must implement.

```typescript
interface SkillManifest {
  name: string;
  version: string;
  description: string;
  allowedTools: string[];
  dependencies?: string[];      // Other skills this skill invokes
  phases?: PhaseDefinition[];   // Structured workflow phases
  outputs?: OutputDefinition[]; // Expected outputs
}
```

**Build order implication:** Implement in Phase 1 (foundation) before other improvements.

### Improvement 2: Shared Library Extraction

**Current issue:** Common patterns (preamble, base branch detection, project context) duplicated across skills.

**Recommendation:** Extract to `lib/` with clear APIs.

```
lib/
+-- context.ts        # Project context gathering (CLAUDE.md, git, etc.)
+-- preamble.ts       # Session setup helpers
+-- output.ts         # Output file management
+-- validation.ts     # Cross-skill validation utilities
```

**Build order implication:** Can be done incrementally per-skill refactoring.

### Improvement 3: Phase-Based Workflow Engine

**Current issue:** Each skill implements its own phase structure in prose.

**Recommendation:** Optional phase definitions that enable progress tracking.

```yaml
# SKILL.md.tmpl
phases:
  - name: context-gathering
    required: true
    tools: [Read, Grep, Glob]
  - name: brainstorm
    required: true
    tools: [AskUserQuestion, WebSearch]
  - name: output
    required: true
    tools: [Write]
```

**Build order implication:** Phase 2-3, after foundation is solid.

### Improvement 4: Dependency Graph

**Current issue:** Skill relationships (e.g., brainstorm → plan-ceo-review) are implicit in descriptions.

**Recommendation:** Explicit dependency declaration for better orchestration.

```yaml
# brainstorm/SKILL.md.tmpl
dependencies:
  suggests:
    - plan-ceo-review
    - plan-eng-review
```

**Build order implication:** Phase 2, after interface abstraction.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Generated File Editing

**What people do:** Edit SKILL.md directly instead of SKILL.md.tmpl

**Why it's wrong:** Changes are overwritten on next `bun run gen:skill-docs`, causing confusion and lost work.

**Do this instead:**
1. Always edit `.tmpl` files
2. Run `bun run gen:skill-docs` to regenerate
3. Commit both `.tmpl` and `.md` files together
4. Use `bun run skill:check` to verify freshness

### Anti-Pattern 2: Merge Conflicts on Generated Files

**What people do:** Accept one side of SKILL.md conflict

**Why it's wrong:** Silently drops template changes from the other branch.

**Do this instead:**
1. Resolve conflicts on `.tmpl` templates (source of truth)
2. Run `bun run gen:skill-docs` to regenerate
3. Stage regenerated files
4. Never accept either side of generated file conflicts

### Anti-Pattern 3: Hardcoded Host Paths

**What people do:** Hardcode `~/.claude/skills/` in skill instructions

**Why it's wrong:** Breaks on Codex, future hosts, or non-standard installs.

**Do this instead:**
1. Use `{{PLACEHOLDER}}` for host-specific paths
2. Let gen-skill-docs resolve based on `--host` flag
3. Reference `localSkillRoot` for project-relative paths

### Anti-Pattern 4: Cross-Skill Invocation Without Context

**What people do:** Invoke another skill without passing context

**Why it's wrong:** Skills start fresh, losing project understanding.

**Do this instead:**
1. Write shared context to known locations (e.g., `~/.spec-first/projects/$SLUG/`)
2. Next skill reads existing context files
3. Consider explicit dependency declaration (Improvement 4)

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10 skills | Current architecture is fine |
| 10-50 skills | Extract shared libraries, formalize interfaces |
| 50+ skills | Consider skill marketplace, versioned dependencies, A/B testing |

### Scaling Priorities

1. **First bottleneck:** Template complexity — too many `{{PLACEHOLDERS}}` become unmaintainable
   - Fix: Extract to shared libraries, reduce placeholder count
2. **Second bottleneck:** Test runtime — full E2E suite becomes slow
   - Fix: Smarter diff-based selection, parallel execution, caching

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude API | Via `claude -p` subprocess | E2E tests |
| Anthropic API | Via `@anthropic-ai/sdk` | LLM judge |
| Git | Via `child_process.spawn` | Branch detection, commits |
| Playwright | Via browse binary | Browser automation |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| skills ↔ gen-skill-docs | Template files | Build-time dependency |
| skills ↔ browse CLI | `$B <command>` | Runtime subprocess |
| gen-skill-docs ↔ commands.ts | TypeScript import | Shared registry |
| skill-parser ↔ commands.ts | TypeScript import | Shared registry |
| tests ↔ session-runner | TypeScript import | Test infrastructure |

## Build Order Recommendations

Based on the architecture analysis, suggested phase structure for optimization:

1. **Phase 1: Foundation**
   - Define `SkillManifest` interface
   - Extract shared libraries (`lib/context.ts`, `lib/preamble.ts`)
   - Document architecture decisions
   - Addresses: Module coupling, inconsistent patterns

2. **Phase 2: Structure**
   - Add phase definitions to skill templates
   - Implement dependency graph
   - Skill health dashboard improvements
   - Addresses: Implicit relationships, progress tracking

3. **Phase 3: Quality**
   - Improve diff-based test selection
   - Better eval comparison tooling
   - LLM judge prompt optimization
   - Addresses: Test runtime, eval quality

**Phase ordering rationale:**
- Foundation first because all other improvements depend on it
- Structure second because it needs the interface abstraction
- Quality last because it needs stable architecture to measure against

**Research flags for phases:**
- Phase 2: May need deeper research on skill orchestration patterns
- Phase 3: May need research on eval optimization techniques

## Sources

- [AI Agent Architecture — MCP, Skills, and Agent Design Patterns](https://shuji-bonji.github.io/ai-agent-architecture/) — Three-layer model, skill system design
- [Inside Claude Code Skills: Structure, Prompts, Invocation](https://mikhail.io/2025/10/claude-code-skills/) — Claude Code skill mechanics, progressive disclosure
- [Agent Skill Guide: Tools, Memory, and Modular AI Design](https://www.thesys.dev/blogs/agent-skill) — Agent skill components
- [Agentic AI Architectures And Design Patterns](https://medium.com/@anil.jain.baba/agentic-ai-architectures-and-design-patterns-288ac589179a) — Reflection, Tool Use patterns
- [Agent Design Pattern Catalogue (arXiv)](https://arxiv.org/html/2405.10467v2) — 17 architectural patterns
- [Choose a Design Pattern for Your Agentic AI System (Google Cloud)](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system) — Pattern selection guidance
- [Building Production-Grade AI Agents in 2025](https://pub.towardsai.net/building-production-grade-ai-agents-in-2025-the-complete-guide-9f02eff84ea2) — 3-tier memory architecture
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — Agent SDK patterns

---
*Architecture research for: spec-first Skill System*
*Researched: 2026-03-23*
