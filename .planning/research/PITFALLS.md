# Pitfalls Research: Skill System Architecture

**Domain:** AI Skill/Prompt Template System Architecture
**Researched:** 2026-03-23
**Confidence:** HIGH (verified against multiple authoritative sources and codebase analysis)

---

## Critical Pitfalls

### Pitfall 1: Template-Generator Tight Coupling

**What goes wrong:**
Template files (.tmpl) become tightly coupled to the generator script (gen-skill-docs.ts). Changes to placeholder resolution logic require updating both the generator and all templates that use affected placeholders. This creates a maintenance nightmare where seemingly simple changes ripple through the entire system.

**Why it happens:**
Developers add new placeholders directly in templates without documenting them in a registry, or the generator hardcodes logic for specific placeholders instead of using a plugin/resolver pattern. Over time, the relationship between templates and generator becomes implicit and undocumented.

**How to avoid:**
- Maintain a **Placeholder Registry** with explicit documentation for each placeholder
- Each placeholder should have a single resolver function with clear inputs/outputs
- Use a resolver plugin pattern: `resolvers.set('PLACEHOLDER_NAME', (ctx) => string)`
- Document placeholder dependencies in template frontmatter
- CI validation: detect undeclared placeholders in templates

**Warning signs:**
- Generator code contains `if (skillName === 'special-case')` branches
- Adding a new skill requires modifying gen-skill-docs.ts
- Placeholder behavior differs across skills unexpectedly
- Comments like "TODO: this is a hack for the brainstorm skill"

**Phase to address:** Phase 1 (Architecture Audit) — document all placeholders and their dependencies

---

### Pitfall 2: Skill Invocation Ambiguity (Vague Descriptions)

**What goes wrong:**
Skills fail to invoke when users expect them to, or the wrong skill activates. The LLM cannot determine which skill matches user intent because descriptions are vague, overlap with other skills, or lack explicit trigger phrases.

**Why it happens:**
Skill descriptions are written from the skill's perspective ("what I do") rather than the user's perspective ("when to use me"). Developers forget that LLM skill selection is pure language reasoning with no algorithmic matching.

**How to avoid:**
- Write descriptions that include **exact trigger phrases** users actually say
- Add explicit activation reinforcement: "Always activate when user says X, Y, or Z"
- List specific content types and subject matter the skill handles
- Test description clarity: ask "would this description match 'review this code'?"
- Include negative examples: "Do NOT activate when user asks for X"

**Example fix:**
```yaml
# Bad
description: Analyzes newsletter drafts for narrative structure.

# Good
description: Analyzes newsletter drafts for narrative structure. Always activate when user says "review this draft", "check the story", or "analyze the narrative". Focus on AI, tech, business content 2,000-4,000 words.
```

**Warning signs:**
- Skills that should activate don't
- Users manually invoke skills with `/skill-name` frequently
- Multiple skills seem to match the same request
- Skills activate at wrong times

**Phase to address:** Phase 2 (Module Decoupling) — standardize description patterns across all skills

---

### Pitfall 3: Context Bloat from Progressive Disclosure Failures

**What goes wrong:**
Skills load their entire instruction set (5,000+ words) on every invocation, even when only a fraction is needed. This consumes context tokens, slows performance, and degrades answer quality as the model gets overwhelmed with irrelevant instructions.

**Why it happens:**
Developers add more instructions over time without restructuring. The "just add it to SKILL.md" path of least resistance creates monolithic files. No clear separation between "must always see" and "load on demand."

**How to avoid:**
- Keep SKILL.md under 5,000 words (~800 lines)
- Use **resource files** for detailed content (examples, edge cases, references)
- Structure: Critical Rules (top) → Core Instructions → Brief Examples → Boundaries
- Explicitly tell Claude: "Load {baseDir}/references/detailed-examples.md when you need X"
- Token budget awareness: measure skill prompt size, set limits

**File structure pattern:**
```
your-skill/
├── SKILL.md (lean, <800 lines)
└── resources/
    ├── detailed-examples.md
    ├── edge-cases.md
    └── reference-material.md
```

**Warning signs:**
- SKILL.md files exceeding 1,500 lines
- Skills taking longer to "load"
- Claude missing instructions that are "buried" in the prompt
- Context window exhaustion errors

**Phase to address:** Phase 2 (Module Decoupling) — refactor large skills into modular structure

---

### Pitfall 4: Generated File Drift (Stale SKILL.md)

**What goes wrong:**
Developers edit generated SKILL.md files directly instead of the .tmpl source. Later regeneration overwrites their changes. Or, templates are updated but SKILL.md files aren't regenerated, causing deployed skills to behave differently than expected.

**Why it happens:**
No enforcement mechanism prevents direct edits. Developers forget the generation pipeline exists. CI doesn't validate freshness. Merge conflicts on SKILL.md are resolved incorrectly (accepting one side instead of regenerating).

**How to avoid:**
- **CI freshness check**: `bun run gen:skill-docs --dry-run` must pass
- **.gitattributes**: mark SKILL.md as generated (helps merge tools)
- **Documentation**: CLAUDE.md explicitly warns against direct edits
- **Conflict protocol**: Never resolve SKILL.md conflicts — resolve .tmpl, regenerate
- **Health check**: `skill:check` validates freshness

**Warning signs:**
- `git diff` shows changes to SKILL.md but not .tmpl
- Merge conflicts on SKILL.md files
- Skill behavior doesn't match template changes
- CI freshness check failures

**Phase to address:** Phase 1 (Architecture Audit) — verify all CI gates are in place

---

### Pitfall 5: Cross-Platform Path Hardcoding

**What goes wrong:**
Skills contain hardcoded paths like `~/.claude/skills/spec-first/` that don't work on Codex (uses `.agents/skills/`), Windows, or alternative installation locations. Skills break silently or with confusing errors.

**Why it happens:**
Templates are written for one host (Claude) and not parameterized. Path resolution is scattered throughout templates rather than centralized. New host support is added as an afterthought.

**How to avoid:**
- Use **HostPaths interface** for all platform-specific paths
- Generate paths dynamically via placeholders: `{{BIN_DIR}}`, `{{SKILL_ROOT}}`
- Test skills on all supported hosts before shipping
- Centralize path configuration in gen-skill-docs.ts
- Document host differences in template comments

**Current spec-first pattern (good):**
```typescript
const HOST_PATHS: Record<Host, HostPaths> = {
  claude: {
    skillRoot: '~/.claude/skills/spec-first',
    localSkillRoot: '.claude/skills/spec-first',
    binDir: '~/.claude/skills/spec-first/bin',
  },
  codex: {
    skillRoot: '~/.codex/skills/spec-first',
    localSkillRoot: '.agents/skills/spec-first',
    binDir: '~/.codex/skills/spec-first/bin',
  },
};
```

**Warning signs:**
- Paths like `/home/user/...` or `~/.claude/...` in template content
- Skills fail on different hosts
- Host-specific conditionals scattered in templates

**Phase to address:** Phase 2 (Module Decoupling) — audit all paths for host neutrality

---

### Pitfall 6: Implicit Shared State Between Skills

**What goes wrong:**
Skills implicitly depend on state created by other skills (environment variables, files, git state). When used independently, they fail or behave unexpectedly. The dependency is undocumented and hard to debug.

**Why it happens:**
Skills are developed in a workflow context where previous skills always run. Developers don't test skills in isolation. State created "just for this session" becomes a hidden dependency.

**How to avoid:**
- Each skill should be **self-contained** — work correctly when invoked alone
- Document required preconditions in a Prerequisites section
- Use the Preamble to establish necessary state (but don't rely on previous skills)
- Test skills in isolation during development
- If skill-to-skill communication is needed, make it explicit via file contracts

**Warning signs:**
- Skill A works after skill B, but fails standalone
- "Run X first" instructions in skill documentation
- Hidden assumptions about `_VARIABLE` state from preamble

**Phase to address:** Phase 3 (Clear Boundaries) — document and test skill isolation

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy-paste instructions across skills | Fast initial development | Divergence, maintenance burden | Never — use shared placeholders |
| Skip examples section | Ship faster | Generic, low-quality output | Never — examples are critical |
| Hardcode model/tool references | Simpler template | Breaks on model updates | Never |
| Skip CI freshness check | Faster PR merges | Deployed skills drift from source | Never |
| Add instructions without versioning | Iteration speed | No rollback capability | Draft skills only |
| Mix logic and templating | Quick fixes | Fragile composition, token bloat | Never — use Builder pattern |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Browse CLI | Hardcoding `$B` path | Use `{{BROWSE_BIN}}` placeholder |
| Bash commands | Assuming tool availability | Check prerequisites in Preamble |
| Git operations | Assuming repo state | Verify branch/remote in skill instructions |
| File system | Hardcoding output paths | Use `{baseDir}` or user-provided paths |
| Config system | Direct file reads | Use `spec-first-config` CLI for persistence |
| Analytics | Inline analytics code | Centralize in Preamble, use session ID |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Skill prompt token bloat | Slow skill loading, degraded quality | <800 lines, progressive disclosure | 5,000+ lines |
| Regeneration on every build | Slow CI/CD | Cache generated files, validate freshness | >10 skills |
| Eager resource loading | Context exhaustion | Lazy load via `resources/` directory | 50k+ tokens loaded |
| Undiffable templates | Merge conflicts, lost changes | Use placeholders, avoid embedded content | Multi-contributor |

---

## "Looks Done But Isn't" Checklist

- [ ] **Skill Template:** Often missing `{{PREAMBLE}}` placeholder — verify all skills have it
- [ ] **Generated Files:** Often stale after .tmpl edits — run `gen:skill-docs` and verify CI passes
- [ ] **Description:** Often too vague for reliable invocation — test with "would this match X?"
- [ ] **Examples:** Often abbreviated instead of complete — include full input/output pairs
- [ ] **Boundaries:** Often missing out-of-scope section — explicit "does NOT handle X"
- [ ] **Host Paths:** Often hardcoded for Claude only — test on Codex, check placeholders
- [ ] **Isolation:** Often depends on previous skill state — test standalone invocation
- [ ] **Error Handling:** Often missing "when input is unclear" section — add fallback behavior

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Template-Generator Coupling | HIGH | 1. Document all placeholders 2. Create registry 3. Refactor generators 4. Update all templates |
| Invocation Ambiguity | MEDIUM | 1. Audit all descriptions 2. Add trigger phrases 3. Test with real queries |
| Context Bloat | MEDIUM | 1. Measure current sizes 2. Extract to resources/ 3. Update SKILL.md to reference |
| Generated File Drift | LOW | 1. Run `gen:skill-docs` 2. Commit 3. Add CI check if missing |
| Path Hardcoding | MEDIUM | 1. Audit all paths 2. Add to HostPaths 3. Create placeholders 4. Test on all hosts |
| Implicit Shared State | HIGH | 1. Identify dependencies 2. Document or remove 3. Test isolation 4. Add prerequisites |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Template-Generator Coupling | Phase 1: Architecture Audit | Placeholder registry exists, all placeholders documented |
| Invocation Ambiguity | Phase 2: Module Decoupling | All descriptions have trigger phrases, test matrix passes |
| Context Bloat | Phase 2: Module Decoupling | All SKILL.md <800 lines, resources/ used for detail |
| Generated File Drift | Phase 1: Architecture Audit | CI freshness check passes, .gitattributes configured |
| Path Hardcoding | Phase 2: Module Decoupling | No hardcoded paths in templates, all hosts tested |
| Implicit Shared State | Phase 3: Clear Boundaries | All skills work standalone, prerequisites documented |

---

## Sources

- [I Analyzed 40+ Claude Skills Failures](https://cashandcache.substack.com/p/i-analyzed-40-claude-skills-failures) — Community analysis of skill failure patterns (HIGH confidence)
- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) — Architecture analysis of skill invocation (HIGH confidence)
- [Prompt Library Design Patterns and Anti-Patterns](https://www.paulserban.eu/blog/post/prompt-library-design-patterns-and-anti-patterns-every-ai-engineer-should-know/) — Systematic patterns for prompt management (HIGH confidence)
- [Why Chaotic Prompting is Technical Debt](https://rokoss21.tech/en/posts/prompt-chaos-technical-debt/) — FACET deterministic approach analysis (MEDIUM confidence)
- [Anthropic Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Official documentation (HIGH confidence)
- spec-first codebase analysis: gen-skill-docs.ts, skill-validation.test.ts, skill-check.ts, SKILL.md.tmpl files (HIGH confidence — direct analysis)

---

*Pitfalls research for: spec-first Skill System Architecture Optimization*
*Researched: 2026-03-23*
