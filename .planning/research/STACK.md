# Stack Research: AI Engineering Workflow Toolkits / Skill Systems

**Domain:** AI Engineering Workflow Toolkits
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

The 2025 standard stack for AI engineering workflow toolkits centers on **TypeScript** with **Bun runtime** for performance, **template-based prompt generation** for skill definitions, and **progressive disclosure patterns** for context efficiency. The ecosystem has matured significantly with frameworks like Vercel AI SDK, Mastra, and LangGraph providing production-ready patterns for agent orchestration, tool integration, and state management.

For spec-first's skill system architecture optimization, the recommended approach is to maintain the existing Bun + TypeScript foundation while adopting **progressive disclosure patterns** from Claude's official skill best practices, **modular architecture patterns** from Mastra/VoltAgent, and **validation/evaluation pipelines** from LangGraph.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **TypeScript** | 5.x | Primary language | Type safety for complex skill systems, native ES module support, excellent tooling. TypeScript has overtaken Python in GitHub's 2025 language report for AI agent development. |
| **Bun** | 1.2.x | JavaScript runtime | Fastest startup time (~3x faster than Node.js), native TypeScript execution, built-in test runner. spec-first already uses Bun — maintain for consistency. |
| **ES Modules** | Native | Module system | Standard for modern TypeScript, enables tree-shaking, better for skill hot-loading. spec-first already uses `"type": "module"`. |
| **YAML Frontmatter** | Standard | Skill metadata | Claude Code standard for skill discovery. `name` (max 64 chars) and `description` (max 1024 chars) are required fields. Enables progressive disclosure. |

### Template System

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Custom Mustache-like** | In-house | Prompt generation | spec-first already has `{{PLACEHOLDER}}` pattern in gen-skill-docs.ts. Simpler than full Handlebars, sufficient for skill templates. |
| **Progressive Disclosure** | Pattern | Context efficiency | Claude loads SKILL.md only when triggered, reference files on-demand. Keep SKILL.md < 500 lines, split large content into separate files. |

### Testing & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Bun Test** | Built-in | Unit/integration tests | Already in use. Fast, native TypeScript support, concurrent execution. |
| **LLM-as-Judge** | Custom | Quality evaluation | spec-first already has `llm-judge.ts` for skill quality assessment. |
| **E2E via `claude -p`** | Anthropic | Agent evaluation | spec-first's existing pattern. Tests actual skill behavior in real Claude sessions. |
| **Diff-based selection** | Custom | Test optimization | spec-first's `touchfiles.ts` pattern — only run tests affected by changes. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@anthropic-ai/sdk** | 0.78.x | Claude API access | For LLM-judge evaluations, skill quality assessments. Already in spec-first. |
| **Playwright** | 1.58.x | Browser automation | For browse skill, QA workflows. Already in spec-first. |
| **diff** | 7.0.x | Diff utilities | For snapshot diffing, change detection. Already in spec-first. |
| **Zod** | 3.x | Schema validation | Consider adding for skill template validation, config parsing. Used by Mastra, MCP SDK. |

### Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Symlinked skills** | — | Live skill development | spec-first's existing pattern: `.claude/skills/spec-first` → working directory. Enables rapid iteration. |
| **JSONL logging** | — | Telemetry/analytics | spec-first's existing pattern in `~/.spec-first/analytics/`. Efficient append-only format. |

---

## Architecture Patterns from 2025 Ecosystem

### Pattern 1: Progressive Disclosure (Claude Official)

**What:** Skills load metadata first, content on-demand, reference files lazily.

**Implementation:**
```
skill/
├── SKILL.md              # Main instructions (loaded when triggered)
├── DOMAIN_1.md           # Domain-specific guide (loaded as needed)
├── DOMAIN_2.md           # Another domain guide (loaded as needed)
└── scripts/
    ├── validate.py       # Utility script (executed, not loaded)
    └── transform.py      # Another utility
```

**Key rules:**
- SKILL.md body < 500 lines
- References one level deep (no nested file references)
- Table of contents for files > 100 lines
- Write in third person for descriptions

**Source:** [Claude API Docs - Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — HIGH confidence (official documentation)

### Pattern 2: Modular Agent Architecture (Mastra / VoltAgent)

**What:** Separate concerns into modules: core, tools, memory, workflows.

**Implementation:**
```
@voltagent/core        # Foundation — agent primitives
@voltagent/voice       # Optional — voice capabilities
@voltagent/memory      # Optional — persistent state
```

**For spec-first:**
```
scripts/
├── gen-skill-docs.ts   # Core: template processing
├── skill-check.ts      # Core: health validation
└── dev-skill.ts        # Dev: watch mode
```

**Source:** [VoltAgent Blog](https://voltagent.dev/blog/ai-agent-frameworks/) — MEDIUM confidence (framework documentation)

### Pattern 3: Workflow Primitives (Vercel AI SDK / LangGraph)

**What:** Structure complex operations as composable workflows with clear steps.

**Patterns:**
1. **Prompt Chaining** — Sequential prompt execution
2. **Routing** — Directing requests to appropriate handlers
3. **Parallel Execution** — Running tasks concurrently
4. **Orchestrators** — Coordinating multiple agents
5. **Evaluator-Optimizer** — Self-improving loops

**For spec-first:** Already implemented via checklist patterns in skill templates.

**Source:** [AI SDK Docs - Workflows](https://ai-sdk.dev/docs/agents/workflows) — HIGH confidence (official documentation)

### Pattern 4: Template Resolution Pipeline (spec-first existing)

**What:** Read .tmpl → Find `{{PLACEHOLDERS}}` → Resolve from source → Format → Write .md

**Current implementation (gen-skill-docs.ts):**
```typescript
// Placeholder resolvers
function generateCommandReference(ctx: TemplateContext): string
function generateSnapshotFlags(ctx: TemplateContext): string
function generatePreambleBash(ctx: TemplateContext): string
function generateAskUserFormat(ctx: TemplateContext): string
// ... etc
```

**This is a solid pattern — maintain and potentially modularize.**

---

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Runtime | Bun | Node.js | If ecosystem compatibility is critical (more packages tested on Node) |
| Runtime | Bun | Deno | If security sandboxing is priority (Deno has stronger security defaults) |
| Template | Custom `{{}}` | Handlebars | If complex helpers/conditionals needed (current pattern is simpler) |
| Template | Custom `{{}}` | EJS | If full JavaScript expressions in templates needed |
| Framework | None (DIY) | Mastra | If building new from scratch with full workflow orchestration |
| Framework | None (DIY) | LangGraph | If complex stateful multi-step workflows needed |
| Framework | None (DIY) | Vercel AI SDK | If React/Next.js UI integration is priority |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **mcp__claude-in-chrome__*** tools | Slow, unreliable — spec-first explicitly avoids these | Playwright-based browse CLI |
| **Python-first frameworks** (LangChain, AutoGen, CrewAI) | spec-first is TypeScript-native; mixing languages adds complexity | TypeScript-native tools |
| **Heavy framework adoption** (full Mastra/LangGraph) | spec-first already has working patterns; rewrite risk | Incremental pattern adoption |
| **Windows-style paths** (`\`) | Break cross-platform compatibility | Forward slashes (`/`) |
| **Time-sensitive information** in skills | Becomes outdated, breaks skill reliability | "Old patterns" sections with versioning |
| **Vague skill descriptions** | Claude can't discover skills effectively | Specific descriptions with trigger keywords |
| **Nested file references** (A → B → C) | Claude may partial-read, get incomplete info | One level deep from SKILL.md |

---

## Stack Patterns by Variant

**If building greenfield skill system:**
- Use Mastra or VoltAgent as foundation
- Built-in workflows, memory, tools, evals
- Faster time-to-production

**If optimizing existing skill system (spec-first's case):**
- Maintain current Bun + TypeScript + custom templates
- Adopt progressive disclosure patterns from Claude docs
- Add Zod for schema validation
- Modularize gen-skill-docs.ts resolvers
- Enhance skill-check.ts with deeper validation

**If need multi-agent orchestration:**
- Consider LangGraph for complex stateful workflows
- Or implement orchestrator pattern in existing system

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Bun 1.2.x | TypeScript 5.x | Native TS execution, no transpilation needed |
| @anthropic-ai/sdk 0.78.x | Node 18+, Bun 1.x | ESM compatible |
| Playwright 1.58.x | Bun 1.x | Some issues with Bun's native APIs, use subprocess |
| Zod 3.x | TypeScript 5.x | If added for validation |

---

## Installation (for new dependencies)

```bash
# If adding Zod for validation
bun add zod

# If adding MCP SDK (for future tool integration)
bun add @modelcontextprotocol/sdk

# Dev dependencies (already present)
bun add -D @anthropic-ai/sdk
```

---

## Key Recommendations for spec-first Skill System

Based on research, the following stack decisions are recommended for the architecture optimization:

### Maintain (Don't Change)
1. **Bun runtime** — Already optimal for TypeScript skill systems
2. **ES Modules** — Modern standard, already in use
3. **Custom `{{}}` template system** — Simpler than Handlebars, sufficient for needs
4. **YAML frontmatter** — Claude standard, already correct
5. **Symlinked development** — Enables rapid iteration

### Consider Adding
1. **Zod for schema validation** — Validate skill templates, config files
2. **Modular resolver architecture** — Split gen-skill-docs.ts into separate modules
3. **Deeper skill validation** — Enhance skill-check.ts with structural checks

### Adopt from Ecosystem
1. **Progressive disclosure patterns** — From Claude official docs
2. **Workflow primitives** — From AI SDK patterns (already partially implemented)
3. **Evaluation pipelines** — From LangGraph patterns (already have LLM-judge)

### Explicitly Avoid
1. **Framework migration** — Too risky, existing patterns work
2. **Python tooling** — Unnecessary complexity
3. **Heavy abstractions** — Keep skill templates readable by humans

---

## Sources

### HIGH Confidence
- [Claude API Docs - Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Official Anthropic documentation
- [AI SDK Docs - Workflows](https://ai-sdk.dev/docs/agents/workflows) — Official Vercel documentation
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — Official MCP SDK

### MEDIUM Confidence
- [FASHN.ai - Choosing Best AI Agent Framework 2025](https://fashn.ai/nl/blog/choosing-the-best-ai-agent-framework-in-2025) — Detailed comparison, verified with official sources
- [VoltAgent Blog - AI Agent Frameworks](https://voltagent.dev/blog/ai-agent-frameworks/) — Framework maintainer perspective
- [Reddit - Node vs Deno vs Bun 2025](https://www.reddit.com/r/javascript/comments/1n85kdg/askjs_node_vs_deno_vs_bun_what_are_you_actually/) — Community discussion, verified with benchmarks

### LOW Confidence (flagged for validation)
- Medium articles on Mastra/VoltAgent features — Marketing content, cross-referenced with official docs
- Chinese-language tutorials on MCP SDK — Translated content, verified against English official docs

---

*Stack research for: AI Engineering Workflow Toolkits / Skill Systems*
*Researched: 2026-03-23*
