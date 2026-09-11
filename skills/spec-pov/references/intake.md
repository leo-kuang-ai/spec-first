# Establish the Frame Before Grounding

Load this at every `spec-pov` Phase 0, before grounding. The job is to settle the output mode, invocation context, subject, intent, candidate set, and effort tier before spending the scout fan-out. Orient on what the user gave you and propose when needed — **never guessing**.

## Output mode and invocation context

By default `spec-pov` writes no document: the compact chat verdict is the deliverable. A full write-up and a durable `spec-compound` capture are opt-in at follow-up; do not resolve a format or load report rendering rules during intake.

Detect cold versus warm. Cold starts with an explicit external question and runs the full method at the warranted tier. Warm is a mid-session second opinion where the question is in the surrounding conversation or absent. Warm takes only the question and claims-to-verify from the conversation; all claims remain unverified until a scout or bounded authoritative read corroborates them. Warm output stays a guest verdict and does not offer capture or handoff unless the user asks. For the remaining warm provenance and adversarial rules, read `references/invocation.md`.

## Why this gate exists

The same subject supports very different verdicts. A link to a new sign-in method could mean "should we **adopt** it?", "should we **migrate** to it, and how costly?", "how does it **compare** to what we have?", or "I just have a **question** about it." Guessing "migrate" sends all three scouts after migration cost and answers a question the user never asked. The frame determines what the scouts even look for, so settle it first.

## Step 1 — Orient on what was provided (cheap, pre-grounding)

- **A bare link** → fetch it lightly (one fetch) to learn what the thing *is*; name it. If you cannot fetch it (no web tool, paywalled), ask the user what it is rather than assuming.
- **A bare topic or name** → recognize it from your own knowledge; a single search only if you genuinely can't place it.
- **A paste or provided context** → read it.

This is orientation, not grounding — keep it to one read/fetch. The project and external grounding (the scouts) come *after* the frame is set.

## Step 2 — Determine the POV intent

The subject is usually recoverable; the **intent** is the ambiguous part. Classify it:

- **Adopt** — use this new capability (net-new, or no incumbent)?
- **Migrate / replace** — switch *from an incumbent* to this?
- **Compare** — how does it stack up vs. what we have or the alternatives (no switch implied)?
- **Exposure** — is this (a CVE, deprecation, or ecosystem change) *our problem*?
- **Explainer** — they just want to understand it. This is **not** a verdict — handle it as a general research question (or a dedicated deep-research-style tool, *if the environment has one*), rather than forcing one.

## Step 3 — Infer, or propose; never guess

- **Subject AND intent clear** → state the frame in one line and proceed. Do not ask a question you can already answer: "Framing this as: should we replace `<incumbent>` with `<X>`? Say if you meant something else."
- **Intent ambiguous** → propose, built from Step 1's orientation. Use the blocking question tool with the **2-3 strongest concrete candidate framings this specific input suggests** (naming the incumbent where you know it), and rely on the tool's built-in free-text path for "something else" rather than adding it as an explicit option — some tools (e.g. Codex's `request_user_input`) cap explicit options at 2-3 and already provide the free-form fallback, so an extra explicit option can error or get trimmed. Do not offer a generic checklist; offer the real readings of *this* input. Example for a passkeys link on a password-auth project: *adopt passkeys* · *migrate auth to them (and at what cost)* · *compare them to our current sign-in*.
- **Reads as an explainer** → say so and answer it as a general research question (or hand to a dedicated research tool if one is available), rather than manufacturing a verdict.

## Discipline

`spec-pov` is not `spec-brainstorm`. **One** orientation read, **at most one** clarifying question, then go. If the user already stated the intent, skip straight to the one-line frame — do not interrogate. The cost of one cheap question is trivial; the cost of grounding the wrong frame is the whole run.

## Warm invocations

A warm invocation with no clear question is this same gate — the conversation is the material you orient on. Infer the decision from it, propose/confirm it, then proceed. For the rest of the warm contract (guest output, provenance buckets), see `references/invocation.md`.

## Selection, candidate set, and reversibility tier

Apply the selection escape hatch to every invocation. A selection over a bounded field (roughly five or fewer real candidates with knowable criteria) can be judged here. If the field cannot be bounded without inventing options, return Hold and route to `spec-ideate`; if criteria are unclear, return Hold and route to `spec-brainstorm`. A product-design question owned by this project routes to `spec-brainstorm` (WHAT) or `spec-plan` (HOW), never to a POV verdict. Read `references/boundaries.md` when the fit is uncertain.

Before grounding, freeze the complete approach set: every user-supplied candidate, the status quo when relevant, and the explicit option to reject the framing or all candidates. Preserve it through grounding, peer checks, and the final verdict. Every approach ends as recommended, rejected with a reason, deferred for missing evidence, or framing-rejected; omission is not a disposition.

Classify reversibility from project signals and state the tier in the verdict:

- **Tier 1 — two-way door:** dependency, lint rule, or config; one-screen verdict, a combined grounding pass, and no reversal trigger.
- **Tier 2 — one-way but bounded:** data store, internal API/contract, or bounded migration; full grounding fleet and alternatives pass.
- **Tier 3 — one-way and high-stakes:** security, legal, privacy, public contract, or irreversible migration; deep external research, precedent search, and durable-record offer.

Do not run a Tier-3 workup for a trivially reversible change or give a high-stakes decision a shallow Tier-2 treatment.
