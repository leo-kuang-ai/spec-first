## Core Principles

1. **Assess scope first** - Match the amount of ceremony to the size and ambiguity of the work.
2. **Be a thinking partner** - Suggest alternatives, challenge assumptions, and explore what-ifs instead of only extracting requirements.
3. **Resolve product decisions here** - User-facing behavior, scope boundaries, and success criteria belong in this workflow. Detailed implementation belongs in planning.
4. **Keep implementation out of the Product Contract by default** - Do not include libraries, schemas, endpoints, file layouts, or code-level design unless the brainstorm itself is inherently about a technical or architectural change.
5. **Right-size the artifact** - Simple work gets a compact requirements-only unified plan or brief alignment. Larger work gets a fuller Product Contract. Do not add ceremony that does not help planning.
6. **Apply YAGNI to carrying cost, not coding effort** - Prefer the simplest approach that delivers meaningful value. Avoid speculative complexity and hypothetical future-proofing, but low-cost polish or delight is worth including when its ongoing cost is small and easy to maintain.
7. **Keep product confirmation singular** - The current conversation user is the only human product confirmer. Ask one highest-impact independent product question at a time; specialist material is evidence, not a second confirmation route.
8. **Coverage is not decomposition** - Named devices, providers, and data sources are coverage requirements, not automatically separate workstreams. Split only when a shared access path cannot satisfy a requirement; planning owns connector selection unless it changes product behavior or scope.

## Interaction Rules

These rules apply to every brainstorm, including the universal (non-software) flow routed to `references/universal-brainstorming.md`.

1. **Ask one question at a time** - One question per turn, even when sub-questions feel related. Stacking several questions in a single message produces diluted answers; pick the single most useful one and ask it.
2. **Prefer single-select multiple choice** - Use single-select when choosing one direction, one priority, or one next step.
3. **Use multi-select rarely and intentionally** - Use it only for compatible sets such as goals, constraints, non-goals, or success criteria that can all coexist. If prioritization matters, follow up by asking which selected item is primary.
4. **Default to the platform's blocking question tool** - Use the host's blocking question tool already in the current tool list, matched by capability (if a matching tool is listed but unloaded, load it through the host's tool-discovery primitive). These tools include a free-text fallback, so well-chosen options scaffold the answer without confining it. This default holds for opening and elicitation questions too, not only narrowing. Fall back to numbered options in chat only when no such tool is in the list or a real question call errors. Never silently skip the question.
5. **Use an open-ended question only when the question is genuinely open** - Drop the blocking tool when the answer is inherently narrative, when presented options would steer a diagnostic or introspective answer, or when you cannot write 3-4 genuinely distinct, plausibly-correct options without padding. The test: if you'd be straining to fill the option slots, the question is open — ask it open-ended. Rule 1 still applies: one question per turn.
6. **Open-ended questions earn their place only when they're specific enough to elicit a substantive answer** - Apply Rule 5 silently: just ask the question, never narrate the form choice. The question must give the user something concrete to anchor on. Good: *"What's the most concrete thing someone's already done about this — paid for it, built a workaround, quit a tool over it?"* — it names what counts as an answer. Too thin: *"What's your take?"* — nothing to bite into, and framings that imply a short answer ("briefly", yes/no) waste the open question the same way.

## Facts And Decisions

Before putting a question to the user, check whether the current repo, verified source excerpts, or another authorized reachable source can settle it. Look up source facts instead of asking the user to restate them. A running lookup does not block independent product questions; only dependent decisions wait for its result. Product choices remain with the current user. If a source cannot be reached, disclose the specific gap rather than inventing the answer or treating an assumption as confirmed.

## Output Guidance

- **Prioritize decision-relevant detail** - Preserve the facts, tradeoffs, and caveats needed for the next decision; trim introductions, repetition, and optional background first.
