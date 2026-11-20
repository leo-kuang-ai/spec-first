# Technical Design for Team Review

Use this draft to help engineers, testers, and release owners decide whether to adopt the design. Write the deliverable in the user's language. When reorganizing an existing plan, identify its authoritative version. Move, combine, or explain existing content; mark omissions as gaps in the source rather than making new decisions for its author. For a new design, start from the requirements and current code, and flag unknowns that could change the recommendation.

| Section | Questions the reader should be able to answer |
|---|---|
| Background, goals, and scope | Who has the problem? What do you recommend, what changes for them, and what stays the same? Link to the PRD instead of repeating it. |
| Current behavior and problem | Trace a request from its entry point to where the problem occurs. Cite the code or contract. Distinguish a confirmed limitation from a capability you have not found. |
| Proposed design and alternatives | Walk through one request end to end. What is the strongest case for a feasible alternative, including leaving the system unchanged? Which constraint makes the cost of the recommendation acceptable? Use a diagram when it resolves ambiguity. |
| Detailed design | Explain entry points, rules, state ownership, interfaces, and errors by business flow or module. For cross-client work, follow the same scenario across clients before listing client-specific changes. |
| Impact and compatibility | Who must change and who need not? Describe what each side actually reads when old clients, historical data, or external callers coexist with the change. |
| Tests and acceptance | Which test would catch a violation of each key promise? Reading a disabled preference and failing to read the preference may both require zero sends: trigger each separately and observe the actual send boundary. Distinguish existing coverage, proposed tests, and verified results. |
| Implementation and rollout | What must happen first, who depends on it, and what needs integration testing? For a risky release, name the signals and stop condition. Stopping new traffic does not undo data already written or notifications already sent. Flag gaps rather than promising rollback. |

Use descriptive headings such as “Detailed design: check notification preferences before sending.” For a small change, combine the sections into current behavior and proposal, impact, and verification. Omit irrelevant sections. A section number is a pointer, not a conclusion.

**Delivery boundary.** Deliver one review draft, not a second execution plan. If a source plan is specified, cite its path and version; do not overwrite it or change product decisions outside their authoritative source. Deliver in chat unless a file is requested. Save Markdown at the requested path or as `docs/reviews/*-design-review.md` with `type: design-review` and `status: draft`. Do not declare a unified plan contract, execution readiness, or implementation authority. Do not silently substitute Markdown for another requested format. Before delivery, check whether each reader can find the answers they need and name what is missing. Author self-review is not independent reader acceptance. Stop here; do not transition plan status or start execution.
