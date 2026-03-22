# Project Research Summary

**Project:** spec-first Skill System Architecture Optimization
**Domain:** AI Engineering Workflow Toolkits / Skill Systems
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

This research covers the optimization of spec-first's skill system architecture, an AI engineering workflow toolkit built on TypeScript with Bun runtime. The 2025 ecosystem has matured significantly with frameworks like Vercel AI SDK, Mastra, and LangGraph providing production-ready patterns for agent orchestration, tool integration, and state management.

The recommended approach is to maintain the existing Bun + TypeScript foundation while adopting **progressive disclosure patterns** from Claude's official skill best practices, **modular architecture patterns** from Mastra/VoltAgent, and **validation/evaluation pipelines** from LangGraph. spec-first's unique differentiators—template system, static validation, health dashboard, and LLM evaluation—are industry-leading and should be preserved.

Key risks include template-generator coupling (changes ripple through the system), context bloat from oversized skills, and generated file drift when developers edit SKILL.md directly instead of .tmpl sources. Mitigation strategies include maintaining a Placeholder Registry, enforcing CI freshness checks, and keeping SKILL.md under 800 lines with resources/ for detailed content.

## Key Findings

### Recommended Stack

The 2025 standard stack for AI engineering workflow toolkits centers on **TypeScript 5.x** with **Bun 1.2.x** runtime for performance, **ES Modules** for modern module support, and **YAML frontmatter** for skill metadata. spec-first already uses this optimal stack.

**Core technologies:**
- **TypeScript 5.x** — Type safety for complex skill systems, native ES module support, excellent tooling. TypeScript has overtaken Python in GitHub's 2025 language report for AI agent development.
- **Bun 1.2.x** — Fastest startup time (~3x faster than Node.js), native TypeScript execution, built-in test runner. spec-first already uses Bun.
- **Custom Mustache-like templates** — `{{PLACEHOLDER}}` pattern in gen-skill-docs.ts is simpler than full Handlebars, sufficient for skill templates.
- **Progressive Disclosure pattern** — Claude loads SKILL.md only when triggered, reference files on-demand. Keep SKILL.md < 500 lines, split large content into separate files.

**Explicitly avoid:** mcp__claude-in-chrome tools (slow, unreliable), Python-first frameworks (LangChain, AutoGen, CrewAI), heavy framework adoption (full Mastra/LangGraph migration), and Windows-style paths.

### Expected Features

**Must have (table stakes):**
- SKILL.md format with YAML frontmatter — Standardized format adopted by 30+ agent products
- Progressive disclosure — Three-tier: catalog (name+desc) -> activate (full body) -> execute (scripts on demand)
- Slash command invocation — User types `/skill-name` to force-activate
- Auto-trigger via description matching — Description field acts as routing signal
- Project-level + user-level scopes — `.claude/skills/` (project) + `~/.claude/skills/` (user)
- allowed-tools restriction — Security baseline
- Supporting files (scripts/, references/) — Loaded on-demand

**Should have (competitive):**
- Template system (`.tmpl` + generator) — DRY: define once, generate for multiple hosts/contexts — spec-first UNIQUE
- Static validation tests — Catch errors early: invalid commands, broken flags — spec-first UNIQUE
- Health dashboard (skill-check) — Visibility into skill system status — spec-first UNIQUE
- LLM-as-judge evaluation — Quality assurance for skill outputs — spec-first UNIQUE
- Multi-host support — Same skill works on Claude Code, Codex, OpenClaw

**Defer (v2+):**
- Subagent forking (`context: fork`) — Run skill in isolated context
- Plugin packaging — Bundle skills for distribution to teams
- Skill creator / interactive builder — Lower barrier to creating new skills

### Architecture Approach

The industry-standard skill system architecture follows a **three-layer model**: Host Runtime (Claude Code/Codex) → Skill Registry (SKILL.md files) → Execution Layer (Bash tools, external tools, shared libs). spec-first's architecture aligns with this model and adds a unique Template System layer for DRY skill generation.

**Major components:**
1. **gen-skill-docs.ts** — Template generator that reads .tmpl files, resolves `{{PLACEHOLDERS}}` from source files (commands.ts, snapshot.ts), and writes SKILL.md
2. **skill-parser.ts + skill-check.ts** — Validation layer that validates commands against registry, checks freshness, produces health reports
3. **session-runner.ts + eval-store.ts + llm-judge.ts** — Test infrastructure for E2E testing, eval persistence, and quality scoring
4. **browse CLI** — Playwright-based browser automation invoked via `$B <command>` from skills

### Critical Pitfalls

1. **Template-Generator Tight Coupling** — Changes to placeholder resolution logic require updating both the generator and all templates. Prevent with a Placeholder Registry, plugin/resolver pattern, and CI validation for undeclared placeholders.

2. **Skill Invocation Ambiguity (Vague Descriptions)** — Skills fail to invoke because descriptions are too vague for LLM routing. Fix by writing descriptions with explicit trigger phrases: "Always activate when user says X, Y, or Z."

3. **Context Bloat from Progressive Disclosure Failures** — Skills load 5,000+ words on every invocation. Keep SKILL.md under 800 lines, use resources/ for detailed content.

4. **Generated File Drift (Stale SKILL.md)** — Developers edit generated files directly, changes get overwritten. Enforce CI freshness check, document that .tmpl is source of truth.

5. **Cross-Platform Path Hardcoding** — Paths like `~/.claude/skills/` break on Codex. Use HostPaths interface and `{{PLACEHOLDER}}` for host-specific paths.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Architecture Audit & Foundation
**Rationale:** All other improvements depend on understanding and formalizing the current architecture. Must document all placeholders, establish patterns before scaling.
**Delivers:** Placeholder Registry, documented architecture decisions, SkillManifest interface definition
**Addresses:** Template-Generator Coupling, Generated File Drift
**Avoids:** Pitfall 1 (coupling), Pitfall 4 (drift)

### Phase 2: Module Decoupling & Structure
**Rationale:** After foundation is documented, extract shared libraries and standardize patterns. This enables scaling to 50+ skills.
**Delivers:** lib/ extraction (context.ts, preamble.ts, output.ts, validation.ts), standardized description patterns, resources/ structure for large skills
**Uses:** TypeScript, Bun, ES Modules from STACK.md
**Implements:** Shared Library Extraction from ARCHITECTURE.md
**Avoids:** Pitfall 2 (ambiguity), Pitfall 3 (context bloat), Pitfall 5 (path hardcoding)

### Phase 3: Clear Boundaries & Isolation
**Rationale:** With modular structure in place, ensure each skill works standalone. Test isolation, document prerequisites, formalize skill-to-skill communication.
**Delivers:** Skill isolation tests, explicit dependency declaration, cross-skill context contracts
**Implements:** Dependency Graph from ARCHITECTURE.md
**Avoids:** Pitfall 6 (implicit shared state)

### Phase 4: Quality Infrastructure Enhancement
**Rationale:** With stable architecture, optimize testing and evaluation. Better diff-based selection, improved LLM judge prompts, enhanced eval comparison.
**Delivers:** Optimized E2E test selection, better eval tooling, quality metrics
**Uses:** LLM-as-judge, session-runner, eval-store from STACK.md
**Implements:** Evaluation pipeline improvements from ARCHITECTURE.md

### Phase Ordering Rationale

- **Phase 1 first** because you cannot improve what you don't understand. Documenting placeholders and architecture decisions is foundational.
- **Phase 2 second** because shared libraries and standard patterns need the documentation from Phase 1.
- **Phase 3 third** because skill isolation testing needs the modular structure from Phase 2.
- **Phase 4 last** because quality metrics need a stable architecture to measure against.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** May need research on optimal lib/ extraction patterns — how to balance DRY vs complexity
- **Phase 3:** May need research on skill orchestration patterns — how to handle explicit dependencies

Phases with standard patterns (skip research-phase):
- **Phase 1:** Well-documented patterns for placeholder registries and interface definitions
- **Phase 4:** Existing LLM-as-judge and eval patterns are well-understood

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official documentation from Anthropic, Vercel, MCP SDK. Verified against spec-first codebase. |
| Features | HIGH | Multiple sources on skill ecosystem (Firecrawl, Prompt Index, Agent Skills spec). Cross-referenced with spec-first implementation. |
| Architecture | HIGH | Three-layer model from AI Agent Architecture guide. Patterns verified against spec-first codebase structure. |
| Pitfalls | HIGH | Community failure analysis (40+ skill failures), official Anthropic best practices, direct codebase analysis. |

**Overall confidence:** HIGH

### Gaps to Address

- **Multi-host testing:** Research mentions Codex and OpenClaw paths, but no actual testing on these hosts was documented. During execution, verify all `{{PLACEHOLDER}}` paths resolve correctly for each host.
- **Skill creator UX:** Defer to v2+, but may need user research on what questions to ask during interactive skill creation.
- **Scaling beyond 50 skills:** Architecture research suggests marketplace and versioned dependencies, but this is speculative. Address when scale demands it.

## Sources

### Primary (HIGH confidence)
- [Claude API Docs - Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Official Anthropic documentation
- [AI SDK Docs - Workflows](https://ai-sdk.dev/docs/agents/workflows) — Official Vercel documentation
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — Official MCP SDK
- [AI Agent Architecture — MCP, Skills, and Agent Design Patterns](https://shuji-bonji.github.io/ai-agent-architecture/) — Three-layer model, skill system design
- [I Analyzed 40+ Claude Skills Failures](https://cashandcache.substack.com/p/i-analyzed-40-claude-skills-failures) — Community analysis of skill failure patterns
- spec-first codebase analysis: gen-skill-docs.ts, skill-validation.test.ts, skill-check.ts, SKILL.md.tmpl files

### Secondary (MEDIUM confidence)
- [Best Claude Code Skills to Try in 2026](https://www.firecrawl.dev/blog/best-claude-code-skills) — Comprehensive skill ecosystem overview
- [A Mental Model for Claude Code: Skills, Subagents, and Plugins](https://levelup.gitconnected.com/a-mental-model-for-claude-code-skills-subagents-and-plugins-3dea9924bf05) — Mental model for skill system architecture
- [Agent Skills specification](https://agentskills.io) — Cross-platform standard for SKILL.md format
- [FASHN.ai - Choosing Best AI Agent Framework 2025](https://fashn.ai/nl/blog/choosing-the-best-ai-agent-framework-in-2025) — Detailed comparison
- [VoltAgent Blog - AI Agent Frameworks](https://voltagent.dev/blog/ai-agent-frameworks/) — Framework maintainer perspective

### Tertiary (LOW confidence)
- Medium articles on Mastra/VoltAgent features — Marketing content, cross-referenced with official docs
- Chinese-language tutorials on MCP SDK — Translated content, verified against English official docs

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
