# Intake

Classify the request into exactly one input shape — concept, diff, idea, or work-recap window — before any grounding runs. Parse by reasoning over the user's prompt; do not depend on argument-token substitution mechanics, which vary by harness.

## Flag tokens

Literal-prefix tokens are consumed and stripped; everything else is the request text.

| Token | Example | Effect |
|-------|---------|--------|
| `diff:<ref-or-range>` | `diff:abc1234`, `diff:main..HEAD`, `diff:PR#42` | Forces diff mode on that change |
| `since:<window-or-ref>` | `since:monday`, `since:7d`, `since:v2.1.0` | Forces recap mode over that window |
| `output:<md\|html>` | `output:md` | Overrides the artifact format (default `html`) |

- An explicit token always beats inference.
- `diff:` and `since:` together conflict — say so and ask which mode the user wants.
- An unrecognized `<word>:<word>` token (including conventional-commit prefixes like `feat:` appearing inside a topic) is not a flag — it passes through verbatim as request text.
- `output:` with an unknown value: drop the token, note `Ignored unknown output: value '<value>' — using html`, and continue.

## Inference (no forcing token)

Classify the remaining text by shape:

- **Diff** — the request names a resolvable change: a sha, branch, PR, "the last commit", "what you just did", "this change".
- **Recap** — the request asks what happened over time: "what did I do this week", "catch me up", "prep me for standup". Default window when unspecified: the last 7 days in the current repo.
- **Idea** — the request presents a proposal or notion of the user's to be understood: "explain my idea of X", "what would Y imply". The idea is a fixed given (see SKILL.md Boundaries).
- **Concept** — everything else: a topic, pattern, subsystem, or external subject to learn.

**Tiebreak — concept vs diff:** when the request is plausibly both (a repo topic that also names an identifiable recent change, e.g. "explain the retry logic we just added"), a concretely resolvable change wins: diff mode, with the concept as framing context. A topic with no resolvable change is a concept.

**Repo footprint check (concept mode):** a concept grounds in the repo only when it actually touches it. An external subject (a language feature, an interview topic, a paper) gets no repo grounding — do not force it.

## Audience

Default to the user as reader. An explicit request for a version the team or another audience will read changes voice and orientation, not depth: drop second person, name people only from evidence or the user's supplied names, and otherwise stay impersonal. Add only enough context for that reader to follow the same technical explanation. Meeting preparation and "so I can explain it" still teach the user. Do not silently turn an explainer into a terse status update or deck; route an explicit request for that different deliverable to its owner.

## Operational-question gate

When an inferred concept request is really an ordinary question about current behavior, configuration, status, or diagnosis, answer it directly in chat. Do not create a run directory or teaching artifact. Offer a durable visual explainer only when a substantial underlying concept is present and the user plausibly wants to learn it. Explicit teaching language, or a `diff:`/`since:` token, enters the full flow directly. A question with a colon in ordinary prose is not by itself a teaching or token signal.
