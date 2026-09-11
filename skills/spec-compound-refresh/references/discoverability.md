# Discoverability check

## Discoverability Check

After the refresh report is generated, check whether the project's instruction files would lead an agent to discover and search `docs/solutions/` before starting work in a documented area. This runs every time — the knowledge store only compounds value when agents can find it. If this check produces edits, they stay under the same Phase 5 commit and landing authority facts — see step 6 below.

1. Identify the project's root instruction surface: AGENTS.md, CLAUDE.md, GEMINI.md, or the equivalent it actually uses. Read it and identify the substantive source; ignore include-only shims. If none exists, skip this check. A generated managed block is not a direct edit target: recommend its owning source and generator instead.
2. Assess whether an agent reading the instruction files would learn three things:
   - That a searchable knowledge store of documented solutions exists
   - Enough about its structure to search effectively (category organization, YAML frontmatter fields like `module`, `tags`, `problem_type`)
   - When to search it (before implementing features, debugging issues, or making decisions in documented areas — learnings may cover bugs, best practices, workflow patterns, or other institutional knowledge)

   This is a semantic assessment, not a string match. The information could be a line in an architecture section, a bullet in a gotchas section, spread across multiple places, or expressed without ever using the exact path `docs/solutions/`. Use judgment — if an agent would reasonably discover and use the knowledge store after reading the file, the check passes.

3. If the spirit is already met, no action needed.
4. If not:
   a. Based on the file's existing structure, tone, and density, identify where a mention fits naturally. Before creating a new section, check whether the information could be a single line in the closest related section — an architecture tree, a directory listing, a documentation section, or a conventions block. A line added to an existing section is almost always better than a new headed section. Only add a new section as a last resort when the file has clear sectioned structure and nothing is even remotely related.
   b. Draft the smallest addition that communicates the three things. Match the file's existing style and density. The addition should describe the knowledge store itself, not the plugin.

      Keep the tone informational, not imperative. Express timing as description, not instruction — "relevant when implementing or debugging in documented areas" rather than "check before implementing or debugging." Imperative directives like "always search before implementing" cause redundant reads when a workflow already includes a dedicated search step. The goal is awareness: agents learn the folder exists and what's in it, then use their own judgment about when to consult it.

      Examples of calibration (not templates — adapt to the file):

      When there's an existing directory listing or architecture section — add a line:
      ```
      docs/solutions/  # documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (module, tags, problem_type)
      ```

      When nothing in the file is a natural fit — a small headed section is appropriate:
      ```
      ## Documented Solutions

      `docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.
      ```
   c. In interactive mode, explain to the user why this matters — agents working in this repo (including fresh sessions, other tools, or collaborators without the plugin) won't know to check `docs/solutions/` unless the instruction file surfaces it. Show the proposed change and where it would go, then use the platform's blocking question tool to get consent before making the edit: the host's blocking question tool already in the current tool list, matched by capability (if a matching tool is listed but unloaded, load it through the host's tool-discovery primitive). Fall back to presenting the proposal in chat only when no such tool is in the list or a real question call errors. Never silently skip the question. In headless mode, include it as a "Discoverability recommendation" line in the report — do not attempt to edit instruction files (headless scope is doc maintenance, not project config).

5. **If `CONCEPTS.md` exists at repo root, run a parallel discoverability check for it.** Use the same workflow as the `docs/solutions/` check above: same target file, same edit-placement judgment, same consent-then-edit interaction shape per mode. Example calibration when a directory listing is present:

   ```
   CONCEPTS.md  # shared domain vocabulary — read when orienting to the codebase or before discussing domain concepts
   ```

   **Skip this step entirely if `CONCEPTS.md` does not exist** — never nag for an artifact the project has not adopted. When skipped, this step produces no output and no edit.

6. **Keep discoverability edits under the same authority facts.** If step 4 or step 5 edited an instruction file and an authorized local commit already exists, stage only that run-owned file and amend or create a focused follow-up commit. Without commit authorization, leave it unstaged with the other verified refresh changes. Without landing authorization, do not push either commit; an existing remote branch or PR does not widen authority.
