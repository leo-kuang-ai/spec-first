# Routing Red Flags

These reminders are advisory. They help prevent rationalizing around the entry-governor boundary, but they are not a deterministic route table.

| Thought | Better move |
| --- | --- |
| "I'll just edit the file first." | Direct editing is fine for clearly scoped, low-risk small edits; stop and route when scope/risk is unclear, root cause is unresolved, or the change touches architecture, contracts, governance, runtime delivery, multi-file behavior, or sensitive surfaces (defined in `scope-guards.md` → Sensitive Surfaces). |
| "This is just a quick architecture/prompt change." | Treat architecture, prompt, workflow, and contract changes as substantial work. |
| "I need to inspect a bunch of files before deciding." | Do a minimal fact check only; route if the request is already clearly review/debug/plan/work. |
| "The user asked for a review, but I can answer informally." | Use `code-review` or `doc-review` when the review target is concrete. |
| "The task is vague, but I can probably implement something." | Use `brainstorm` or `plan` before work. |
| "A helper skill exists, so I should expose it." | Only public workflows are user entrypoints; internal helpers stay hidden. |
| "I should run init/update now." | Route to `spec-first update` (terminal) or `spec-mcp-setup` first unless the user explicitly requested the command. |

## Hard Rules

1. `workflow-first` does not mean `brainstorming-first`.
2. Do **not** make `spec-brainstorm` the universal default front door.
3. Do **not** adopt the `using-superpowers` rule that "if there is a 1% chance a skill applies, you must invoke it."
4. Do **not** turn ordinary lightweight requests into mandatory workflow traffic.
5. Do **not** describe `using-spec-first` itself as a command-backed workflow.
6. Do **not** restore legacy host-specific spellings as current product surfaces; normalize compatibility aliases to `spec-*`.
7. Do **not** create host-specific public workflow names when the unified `spec-*` id already exists.
8. Do **not** expose internal-only skills as user entrypoints. This includes delegated helpers such as `spec-worktree`.
9. Do **not** route to hidden helper skills such as git, browser, image, spec-proof, or xcode helpers unless a public workflow explicitly delegates to them.
10. Do **not** run `spec-first init`, `clean`, update, or other state-changing commands just because this governor matched; first route to the appropriate workflow or ask a narrow confirmation when required.
