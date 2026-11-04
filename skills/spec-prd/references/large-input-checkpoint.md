# Large-Input Checkpoint

Load this reference only for oversized, multi-source, long-chain, or resume-risk PRD work where run-local state may be lost or whole-document judgment would be unreliable.

This is a trigger-only reference. Ordinary short PRDs still wait until closure before durable write-in. This branch does not create a transcript, progress schema, vector reducer, persistent Map/Reduce artifact, or second PRD topology.

## Trigger Boundary

Use this branch when any of these are true:

- the input is too large for reliable whole-document judgment
- multiple sources must be reconciled: PDF, screenshots, meeting notes, chat logs, existing PRD, design source, source excerpts, or review notes
- multi-round owner grill may exceed one stable context window
- `resume-prd` must recover from an existing PRD artifact
- cross-chunk contradictions or duplicate requirements would make a simple summary unsafe

Skip this branch for ordinary compact PRDs, small source-resolved increments, and route-out/bypass cases.

## Flow

```text
Large input -> Map/Shuffle/Reduce -> Product Expert Lens risk ordering
  -> PRD checkpoint write-in -> owner/source closure -> readiness
```

The existing Large-Input Map-Reduce in `domain-language-and-decision-ledger.md` remains the reduction method. This reference only defines how the reduced candidates feed Product Expert Lens and how PRD sections become checkpoints.

## External Interface

Callers consume this run-local external interface:

```text
reduced_candidate:
  source_ref:
  evidence_tag:
  confirmation_posture:
  claim:
  load_bearing_gap:
  owner_question_candidate:
  affected_write_targets:
  conflicts:
  assumptions:
```

- `source_ref` is the recovery anchor back to original material.
- `evidence_tag` uses existing PRD tags such as `source-candidate`, `provider_untrusted`, `user-stated`, `confirmed-source`, or `assumption`.
- `confirmation_posture` names whether the candidate is closed, needs owner confirmation, needs source recheck, conflicts, or is a safe assumption.
- `affected_write_targets` connects directly into Product Expert Lens `PRD_write_target`.

Do not expose Map/Shuffle/Reduce internals as a required downstream interface.

## Internal Implementation Notes

The internal reduction can still use these private scratch concepts:

- Map chunk-level requirement atoms and keep source refs, claims, actor/flow/state, gaps, evidence tags, confirmation posture, and write-target candidates.
- Shuffle semantically by actor, flow, feature, data object, state, permission, exception, PRD section, and source contradiction.
- Reduce duplicates into canonical requirement candidates while preserving conflicting refs, assumptions, load-bearing gaps, blocker clusters, and owner question candidates.

Tests may assert source-ref preservation, external interface fields, and no persistent schema. They must not lock exact Map/Shuffle/Reduce algorithms.

## Product Expert Lens Handoff

Feed reduced candidates into Product Expert Lens:

```text
load_bearing_gap / owner_question_candidate / affected_write_targets
  -> downstream_confirmation_risk
  -> owner_question_or_assumption
  -> PRD_write_target
  -> closure_state
```

Lens ranks reduced candidates by downstream confirmation risk and suggests semantic split boundaries when reduced candidates span multiple business capabilities. Owner confirmation is required before writing split summary and child PRDs.

## Checkpoint Write-In

For long-chain or oversized runs, write reduced candidates into the PRD earlier than ordinary short PRDs:

- closed candidates go into formal PRD sections such as `Requirements`, `Acceptance Examples`, `Scope Boundaries`, `Interaction Requirements`, or `Feature Slices`
- reduced but unconfirmed candidates go into `Evidence And Assumptions` with evidence tag / confirmation posture and `source_ref`
- owner decisions go into `Decision Notes` or the relevant target section
- owner questions go into `Outstanding Questions`
- planning-time advisory claims go into `Planning Recheck`

This makes the PRD file the checkpoint. Progress is derived from PRD sections:

- formal sections = closed or accepted content
- `Evidence And Assumptions` = advisory or assumption content
- `Outstanding Questions` = owner closure still needed
- `Planning Recheck` = downstream must re-read, re-run, or re-confirm before selecting HOW

`checkpoint-prd` is not a final PRD. When checkpoint write-in is used, set `write_mode=checkpoint-prd`, `can_enter_spec_plan: no`, and `next_owner_question` in Readiness Self-Check or closeout, and list the unclosed owner/source gaps. The checkpoint preserves recoverable context; it must not be described as `ready-for-planning`.

## Resume Discipline

On resume:

1. Re-read the PRD artifact and recover formal sections, `Evidence And Assumptions`, `Outstanding Questions`, `Planning Recheck`, and `source_ref` anchors.
2. Prefer source-ref targeted recovery over full re-reading.
3. If `source_ref` is stale, missing, inaccessible, or contradicted, do a degraded re-reduce of the relevant chunk and record the reason.
4. Re-enter Product Expert Lens with recovered unresolved candidates and continue risk-ranked closure.

Do not claim that a stale or missing source ref proves the original claim.

## Downstream Boundary

Putting advisory candidates into `Planning Recheck` satisfies the `spec-prd` producer side of the handoff. It does not prove that `spec-plan` has re-confirmed them. If downstream planning does not yet honor a named re-confirm semantic, record that as an out-of-scope cross-workflow gap instead of claiming the advisory item is confirmed.

## Write-Timing Boundary

Ordinary short PRDs still write after closure. Checkpoint write-in is reserved for large, multi-source, long-chain, or resume-risk runs where waiting until the end would risk context loss or unrecoverable ambiguity. Do not make checkpointing mandatory for every PRD.
