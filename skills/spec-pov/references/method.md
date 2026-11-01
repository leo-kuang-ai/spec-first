# Method and Verdict Contract

Load this before reasoning about the verdict (SKILL.md Phase 2). It defines the Verify and Verdict steps, the two cross-cutting properties, the two-floor gate, and the verdict contract.

## The four steps

1. **Frame** (Phase 0) — the question, incumbent, horizon, and success criteria are pinned, and the selection escape hatch has fired if the field is unbounded.
2. **Precedent** (Phase 1) — a scoped inline read or authorized precedent scout has reported whether a prior stance exists. Precedent-aware, not rigidly first: a CVE's urgency can lead, but you still consume precedent before grading.
3. **Verify** (Phase 2) — apply the two-floor gate below to source-checked dossiers or fresh bounded inline evidence.
4. **Verdict** (Phase 3) — emit the verdict contract below.

## Two cross-cutting properties (not phases)

- **Skeptic stance.** At every step, seek disconfirming evidence and name the real alternatives — including "keep the incumbent" and "do nothing." "No", "Reject", and "Not-our-problem" are first-class outcomes, not failures to complete. Do not let the framing (or, in warm mode, the conversation's momentum) pull the grade upward.
- **Reversibility-tiered effort.** The Phase 0 tier sizes the work. Tier 1 (two-way door): one screen, 1-2 project facts plus external facts when required by the subject, no reversal trigger, single combined grounding pass. Tier 2 (one-way but bounded): all relevant grounding lenses, inline or through authorized scouts, and a fuller alternatives pass. Tier 3 (one-way and high-stakes — security/legal/privacy, public contract, or irreversible migration): deep research, precedent search, durable record offered. A shallow Tier 1 verdict is defensible *because* the tier is stated — not lazy.

## Subject-specific grounding

All three subject shapes require a concrete, current project fact relevant to the judgment. A supplied document or developed approach set needs external verification only for load-bearing external claims; when there are none, mark that leg not applicable. If project evidence is missing, return **Blocked — insufficient project grounding**; if a necessary external claim is unsupported, return **Blocked — external evidence unavailable**. Name the exact missing evidence. For adoption, retain both absolute floors below.

A call site proves invocation, not the callee's guarantee. Trace that guarantee to its implementation or meaningful tests; otherwise leave it unknown. Label inferred purpose where stated. Before proposing another mechanism, identify the current owner (skill, script, setting or decision), or describe the bounded search and remaining coverage gap. Empty search results establish absence only within that search, never universal absence.

## The two-floor Invalid-Verdict gate (external adoption)

The verdict must clear **two absolute floors**. They are independent: strong external evidence never compensates for a thin project leg, and vice versa. This is a pass/fail checklist, **not** a comparison of leg sizes.

- **Project floor** — PASS requires the verdict to rest on a concrete, *verified* project fact relevant to the decision, in one of these forms: a **named incumbent plus at least one concrete touchpoint** (a `file:line`, dependency, issue, PR, or doc passage from the dossiers) for a replace/migrate; the **verified absence of an incumbent plus a concrete integration/fit point** (where it would slot in, the conventions it must match) for a net-new adoption; or a **prior decision** on the question. FAIL means the project was not actually inspected — return **"Hold — insufficient project grounding"** with a numbered list of exactly what to inspect to make the floor passable. Forbidden from Adopt/Reject on a failed project floor, regardless of how strong the external evidence is.
- **External floor** — PASS requires at least one verified external source whose text supports the claim it backs. Tier 3 requires two independent sources for every load-bearing external claim, as specified in `references/grounding.md`. FAIL (including missing Tier 3 corroboration or no reachable research tools) → return **"Hold — external evidence unavailable"**, not a graded verdict at lowered confidence.

A conversation claim (warm mode) never satisfies a floor until a source-checked scout or fresh bounded inline read corroborates it — it sits in the *conversation hypotheses* bucket, never the *verified facts* bucket.

## The adoption verdict contract

Every verdict carries a fixed vocabulary and a fixed shape so it is comparable and the next run's precedent search can find it.

**Grade** — exactly one of:

- **Adopt** — proven fit for us; use it.
- **Trial** — promising; use on a low-risk slice first; the next step is a scoped spike.
- **Hold** — a complete, valid decision to *wait* (promising but unstable, migration cost exceeds current pain, category moving too fast). "Hold — insufficient project grounding" and "Hold — external evidence unavailable" are the two gate-failure subtypes.
- **Reject** — judged not worth it for us.
- **Not-our-problem** — for an exposure question (CVE / deprecation) that does not reach us — avoids forcing an adopt/reject.

**Render the grade so the reader never has to decode it.** Lead the chat verdict with the call in plain words and attach the label — "Hold — wait, don't switch now," "Trial — pilot it on a low-risk slice first" — not a bare "Grade: Trial." The fixed vocabulary exists for the durable record and precedent search; it tags a plain-language verdict, it does not replace one.

**Schema** — every adoption verdict states these fields:

`Grade` (the label **plus** its one-line plain-language meaning — never the bare token, e.g. *Trial — promising; pilot it on a low-risk slice first*) · `Incumbent` · `Verified facts (project + external, kept distinct)` · `Conversation hypotheses (unverified — warm only)` · `Conditions ("yes, if ...")` · `Handoff (recommended next skill)` · `Reversal trigger (Tier 2/3 only — what would flip this verdict)`

Keep the verified-facts field split into its project and external halves, and keep conversation hypotheses in their own field — never let an unverified claim sit among verified facts.

## Document and approach output

For a document, explain its overall direction, strengths, material risks and the verified project facts that determine the judgment. Return actionable revisions to the document owner; do not replace findings review. For supplied approaches, account for every frozen candidate and the status quo; choose on evidence or say **Either is viable** with the deciding tradeoffs. Preserve uncertainties and conditions, without inventing adoption grades or numeric rankings for these shapes.

For Trial or a non-gate Hold, name a small read-only experiment when it could settle the decision: exact input/scope, command or observation, expected discriminating result and stopping budget. Recommending an experiment does not authorize executing it or changing project files.

## Output economy

`spec-pov` writes no document, so the chat block *is* the whole deliverable — make it a tight verdict, not a transcript of the investigation. Lead with the subject-appropriate position; adoption uses the grade. Keep each applicable field to one line or a few bullets. The `Verified facts` field **cites** from the dossiers (`file:line`, issue/PR number, url) rather than reproducing them, and the dossiers themselves are never printed to chat. Length is governed by the tier, not by how much was found:

- **Tier 1** — one screen: the position, relevant incumbent or integration point, 1-2 project facts plus required external facts, conditions and an applicable handoff. No reversal trigger, no alternatives walk-through.
- **Tier 2/3** — fuller (alternatives, the reversal trigger, deeper conditions), but still leads with the grade and keeps evidence to cited bullets, never walls of quoted text.

If the verdict is running past its tier's budget, you are pasting evidence that belongs in a citation — cut it.
