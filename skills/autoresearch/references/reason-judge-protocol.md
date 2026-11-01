# Reason Judge Protocol

## Adversarial Refinement Loop

```
Round N:
  1. Author-A generates candidate (or incumbent from previous round)
  2. Critic looks for evidence-supported weaknesses; none is a valid result
  3. Author-B reads task + candidate-A + critique → produces candidate-B
  4. Unless debate/no-synthesis mode, synthesizer reads A + B → produces candidate-AB
  5. Judge panel ranks only produced candidates with randomized labels
  6. Winner becomes incumbent for round N+1
```

## Agent Isolation Rules

- Each agent (Author-A, Critic, Author-B, Synthesizer, Judges) runs COLD START
- Separate agents require existing dispatch authorization and live capability. Otherwise apply the roles inline, disclose the shared-context limitation, and make no independence claim. A reasoning request alone does not authorize external consultation.
- No shared session state between agents — prevents sycophancy
- Agents receive ONLY: task description + relevant candidate(s) + critique
- Judges receive randomized labels for only the produced candidates, with the label-to-candidate identity map retained by the owner in lineage.md.
- Judges compare on the stated criteria; ties and insufficient evidence are valid outcomes.

## Critic Protocol

The critic MUST:
1. Identify evidence-supported weaknesses without a minimum count; report none when appropriate
2. Provide concrete evidence for each weakness
3. Suggest what a superior candidate would do differently
4. Rate candidate on domain-specific criteria (1-10 scale)
5. Never compliment the candidate — role is purely adversarial

## Judge Protocol

Each judge receives:
- Task description (identical for all judges)
- Two candidates (A/B), or three (A/B/AB) only when synthesis ran, with randomized labels
- Evaluation criteria relevant to the domain

Each judge MUST:
1. Evaluate each candidate independently on all criteria
2. Rank the actual candidate set with reasoning; allow ties or insufficient evidence
3. Justify a supported winner, or explain why no unique winner is supported
4. Label randomization prevents position bias

Verdict: advisory majority ranking, resolved through the recorded identity map, not label position. On a tie retain a tied incumbent; without one, report the tied set and do not increment convergence. An absent synthesized candidate cannot win. Neither agreement nor convergence substitutes for source facts, task correctness or authorization.

## Convergence Detection

| Mode | Stop Condition |
|---|---|
| Convergent (default) | Same incumbent wins N consecutive rounds (default N=3) |
| Creative | Never auto-stops; runs until iteration limit |
| Debate | Same as convergent but no synthesis step |

## Oscillation Guard

If the incumbent changes more than 5 times in the last 8 rounds → recommend early stop. The candidates are not converging — further rounds waste context.

## Domain-Specific Judge Criteria

| Domain | Criteria |
|---|---|
| Software architecture | Scalability, maintainability, performance, security, simplicity |
| Product strategy | Market fit, feasibility, differentiation, risk, timeline |
| Business decision | ROI, risk, alignment, resource requirements, reversibility |
| Security approach | Coverage, false positive rate, practicality, compliance |
| Research hypothesis | Testability, novelty, evidence support, explanatory power |
| Content/writing | Clarity, accuracy, engagement, completeness, actionability |

## Output Files

| File | Content |
|---|---|
| `reason-results.tsv` | Per-round: round, candidate_label, judge_verdict, convergence_count, description |
| `lineage.md` | Full history of all candidates + critiques + judge reasoning |
| `summary.md` | Final winner, convergence trajectory, key insights |
| `handoff.json` | Chain handoff with winner as primary finding |

## TSV Schema

```
round	timestamp	candidate_label	judge_verdict	convergence_count	description
1	2026-05-19T00:00:00Z	Candidate-A	winner	1	Event sourcing with CQRS
2	2026-05-19T00:05:00Z	Candidate-AB	winner	1	Hybrid: event sourcing for writes, read projections
3	2026-05-19T00:10:00Z	Candidate-AB	winner	2	Refined hybrid with materialized views
4	2026-05-19T00:15:00Z	Candidate-AB	winner	3	CONVERGED — same approach refined
```
