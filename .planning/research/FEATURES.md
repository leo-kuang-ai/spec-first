# Feature Research

**Domain:** AI Agent Skill Systems (Claude Code, Codex, OpenClaw)
**Researched:** 2026-03-23
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **SKILL.md format with YAML frontmatter** | Standardized format adopted by 30+ agent products | LOW | Name + description required, optional fields for metadata. Agent Skills spec is the de facto standard. |
| **Progressive disclosure** | Token efficiency is critical; loading all skills at once wastes context | MEDIUM | Three-tier: catalog (name+desc only) -> activate (full body) -> execute (scripts on demand) |
| **Slash command invocation** | Natural way to trigger skills: `/brainstorm`, `/review` | LOW | User types `/skill-name` to force-activate |
| **Auto-trigger via description matching** | Skills should activate automatically when relevant | MEDIUM | Description field acts as routing signal; agent matches task to skill |
| **Project-level + user-level scopes** | Some skills are project-specific, others personal | MEDIUM | `.claude/skills/` (project) + `~/.claude/skills/` (user) |
| **allowed-tools restriction** | Security expectation: limit what a skill can do | LOW | Space-delimited allowlist: `Read, Grep, Bash` |
| **Supporting files (scripts/, references/)** | Skills often need helper scripts or docs | LOW | Loaded on-demand to save tokens |
| **Description-driven discovery** | How does the agent know when to use this skill? | MEDIUM | Rich keywords, trigger phrases essential |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Template system (`.tmpl` + generator)** | DRY: define once, generate for multiple hosts/contexts | HIGH | spec-first uses `gen-skill-docs.ts` to resolve `{{PLACEHOLDERS}}` |
| **Static validation tests** | Catch errors early: invalid commands, broken flags | MEDIUM | `skill-validation.test.ts` validates all $B commands are real browse commands |
| **Health dashboard (skill-check)** | Visibility into skill system status | MEDIUM | Dashboard showing all skills, validation status, freshness |
| **LLM-as-judge evaluation** | Quality assurance for skill outputs | HIGH | `skill-llm-eval.test.ts` uses LLM to judge skill quality |
| **E2E testing framework** | Skills need real-world validation | HIGH | Run skills via `claude -p` and verify outputs |
| **Multi-host support** | Same skill works on Claude Code, Codex, OpenClaw | MEDIUM | Different paths (`~/.claude/skills/` vs `~/.codex/skills/`), same SKILL.md |
| **Preamble pattern** | Session setup (telemetry, config, upgrade checks) | MEDIUM | Common bash block injected into all skills |
| **Subagent forking (`context: fork`)** | Run skill in isolated context, protect main session | HIGH | Heavy tasks don't pollute main context window |
| **Plugin packaging** | Bundle skills for distribution to teams | MEDIUM | Share across repos without copy-paste |
| **Skill creator / interactive builder** | Lower barrier to creating new skills | MEDIUM | Q&A flow that generates SKILL.md |
| **Cross-skill orchestration** | Skills that invoke other skills | HIGH | `/brainstorm` outputs feed into `/plan-ceo-review` |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Global configuration in SKILL.md** | "I want to set rules once" | Scope confusion: project vs user vs enterprise | Use `CLAUDE.md` for always-on rules, skills for on-demand |
| **Real-time skill sync** | "Keep skills updated automatically" | Breaking changes can break workflows without warning | Explicit upgrade flow with version pinning |
| **Skill inheritance/extension** | "DRY for skills" | Complex dependency graphs, hard to debug | Use templates with `{{PLACEHOLDERS}}` for shared content |
| **Automatic skill generation from docs** | "Point at docs, get a skill" | Generic output, misses team-specific patterns | Interactive skill creator with Q&A refinement |
| **Skills that modify themselves** | "Self-improving skills" | Infinite loops, context corruption, security risk | Skills output to separate files (design docs, not SKILL.md) |
| **Implicit skill chains** | "Automatically run A then B then C" | Hidden behavior, user loses control, hard to debug | Explicit orchestration: skill outputs suggest next skill |
| **Rich UI in skill output** | "I want formatted reports" | Locks into specific output format, harder to parse | Markdown output, let the agent present appropriately |

## Feature Dependencies

```
[Template System (.tmpl)]
    └──requires──> [Generator Script (gen-skill-docs.ts)]
                       └──requires──> [Command Registry (commands.ts)]
                       └──requires──> [Snapshot Flags (snapshot.ts)]

[Static Validation]
    └──requires──> [Command Registry]
    └──requires──> [Skill Parser (skill-parser.ts)]

[Health Dashboard]
    └──requires──> [Static Validation]
    └──requires──> [Template System (for freshness check)]

[E2E Testing]
    └──requires──> [Session Runner (session-runner.ts)]
    └──requires──> [Eval Store (eval-store.ts)]

[Multi-Host Support]
    └──requires──> [Template System]
    └──requires──> [Host Path Resolution]

[Preamble Pattern]
    └──requires──> [Template System]
    └──requires──> [Bin Helpers (spec-first-config, etc.)]

[Subagent Forking]
    └──conflicts──> [Skills with no task] (forking guidelines = no work to do)

[Cross-Skill Orchestration]
    └──requires──> [Standard Output Format] (skills must produce parseable outputs)
```

### Dependency Notes

- **Template System requires Generator Script:** The `.tmpl` files are useless without the resolver that expands `{{PLACEHOLDERS}}` from source files like `commands.ts` and `snapshot.ts`.
- **Static Validation requires Command Registry:** To validate that `$B goto` is a real command, we need the authoritative list of valid commands.
- **Health Dashboard requires Static Validation + Template System:** Dashboard shows validation results and checks if generated SKILL.md matches committed version (freshness).
- **Multi-Host Support requires Template System:** The same `.tmpl` generates different paths for Claude Code (`~/.claude/skills/`) vs Codex (`~/.codex/skills/`).
- **Subagent Forking conflicts with Skills with no task:** `context: fork` only makes sense for skills that contain an actual task. Guidelines-only skills produce nothing useful when forked.
- **Cross-Skill Orchestration requires Standard Output Format:** For `/brainstorm` output to feed into `/plan-ceo-review`, both must agree on the output format (design doc location, structure).

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **SKILL.md format with frontmatter** — Core format, already standardized
- [x] **Progressive disclosure** — Token efficiency
- [x] **Slash command invocation** — User-triggered execution
- [x] **Project + user scopes** — Where skills live
- [x] **allowed-tools restriction** — Security baseline
- [x] **Supporting files** — scripts/, references/

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Template system** — DRY for shared content across skills
- [ ] **Static validation** — Catch errors in CI
- [ ] **Multi-host support** — Claude Code + Codex
- [ ] **Health dashboard** — Visibility

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **LLM-as-judge evaluation** — Quality assurance at scale
- [ ] **E2E testing framework** — Real-world validation
- [ ] **Subagent forking** — Context isolation for heavy tasks
- [ ] **Plugin packaging** — Team distribution
- [ ] **Skill creator** — Lower barrier to entry

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| SKILL.md format | HIGH | LOW | P1 (done) |
| Progressive disclosure | HIGH | MEDIUM | P1 (done) |
| Slash commands | HIGH | LOW | P1 (done) |
| Project/user scopes | HIGH | MEDIUM | P1 (done) |
| allowed-tools | HIGH | LOW | P1 (done) |
| Supporting files | MEDIUM | LOW | P1 (done) |
| Template system | HIGH | HIGH | P2 |
| Static validation | HIGH | MEDIUM | P2 |
| Multi-host support | MEDIUM | MEDIUM | P2 |
| Health dashboard | MEDIUM | MEDIUM | P2 |
| LLM-as-judge | MEDIUM | HIGH | P3 |
| E2E testing | MEDIUM | HIGH | P3 |
| Subagent forking | MEDIUM | HIGH | P3 |
| Plugin packaging | LOW | MEDIUM | P3 |
| Skill creator | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (already done for spec-first)
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Claude Code | OpenAI Codex | OpenClaw | spec-first |
|---------|-------------|--------------|----------|------------|
| Skill directory | `.claude/skills/` | `.agents/skills/` | `~/.openclaw/skills/` | Both (multi-host) |
| Auto-trigger | Yes (description) | Yes (implicit) | Yes (with gating) | Yes |
| Slash commands | `/skill-name` | `$skill-name` | Configurable | `/skill-name` |
| Script bundling | Yes | Yes | Yes | Yes |
| Template system | No | No | No | **Yes (unique)** |
| Static validation | No | No | No | **Yes (unique)** |
| Health dashboard | No | No | No | **Yes (unique)** |
| LLM evaluation | No | No | No | **Yes (unique)** |
| Public registry | Plugin marketplace | Built-in installers | ClawHub | No (manual) |
| Platform sidecar | Extended frontmatter | `agents/openai.yaml` | `metadata.openclaw` | Host path resolution |

## Architecture Implications for spec-first

### Current Strengths (Differentiators)

1. **Template system (`gen-skill-docs.ts`)** — Unique in the ecosystem. Enables:
   - DRY across 26 skill templates
   - Multi-host support (Claude Code + Codex)
   - Single source of truth for shared content (preamble, command reference, snapshot flags)
   - Freshness validation (CI checks generated = committed)

2. **Static validation (`skill-validation.test.ts`)** — Catches:
   - Invalid browse commands in skill markdown
   - Invalid snapshot flags
   - Command registry consistency

3. **Testing pyramid** — Three tiers:
   - Tier 1: Static validation (free, <1s)
   - Tier 2: E2E via `claude -p` (paid, ~$3.85/run)
   - Tier 3: LLM-as-judge (paid, ~$0.15/run)

### Current Gaps

1. **No public registry** — Skills are manually installed via git clone or symlink
2. **No plugin packaging** — No way to bundle skills for team distribution
3. **No skill creator** — New skills require manual SKILL.md.tmpl creation
4. **No subagent forking** — Heavy skills pollute main context

### Recommended Architecture Improvements

Based on feature analysis, the following architectural improvements would strengthen the skill system:

1. **Extract shared validation logic** — `skill-parser.ts` could be used by both `skill-validation.test.ts` and a future `skill-check.ts` CLI
2. **Standardize output format** — Define a convention for skill outputs (e.g., design docs go in `~/.spec-first/projects/$SLUG/`) so cross-skill orchestration works reliably
3. **Document the template system** — The `{{PLACEHOLDER}}` resolver is powerful but undocumented; adding docs would help contributors
4. **Add a skill creator** — Interactive Q&A that generates SKILL.md.tmpl with proper frontmatter and placeholder usage

## Sources

- [Best Claude Code Skills to Try in 2026](https://www.firecrawl.dev/blog/best-claude-code-skills) — Comprehensive skill ecosystem overview
- [A Mental Model for Claude Code: Skills, Subagents, and Plugins](https://levelup.gitconnected.com/a-mental-model-for-claude-code-skills-subagents-and-plugins-3dea9924bf05) — Mental model for skill system architecture
- [How to Use AI Agent Skills in 2026: The Complete Guide](https://www.thepromptindex.com/how-to-use-ai-agent-skills-the-complete-guide.html) — Agent Skills specification details
- [Agent Skills specification](https://agentskills.io) — Cross-platform standard for SKILL.md format
- spec-first codebase: `scripts/gen-skill-docs.ts`, `test/skill-validation.test.ts`, `SKILL.md.tmpl`

---
*Feature research for: AI Agent Skill Systems*
*Researched: 2026-03-23*
