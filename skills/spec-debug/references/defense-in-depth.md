# Defense-in-Depth

When a bug is caused by invalid state reaching a vulnerable code path, fixing just one layer leaves the door open for different code paths, refactors, or mocks to re-introduce the same bug. Defense-in-depth makes the bug structurally harder to re-create by validating at multiple layers.

Not every bug warrants this. Use when:

- The root-cause pattern exists in 3+ other files (grep the fix signature)
- The bug would have been catastrophic in production
- The vulnerable operation is dangerous regardless of caller (destructive side effects, security-sensitive, irreversible)

Skip when the root cause is a one-off logic error with no realistic recurrence path.

## First determine whether there is space to eliminate repeated errors.

In root-mode cross-file reexecution, adding more layers of checks may still allow the next caller to commit the same error again. After minimum repair validation passes, verify whether discovered locations can reuse existing shared entry points, value constructors/type constraints, or employ targeted lint/test rules to prevent recurrence of the same error; do not default to extracting helpers or introducing new abstractions. Preventive changes shall only be implemented when modifications are limited to discovered and authorized locations, do not alter the public interface, and are supported by current evidence; they shall be distinguished and verified from minimal fixes in the debug summary. Otherwise retain the structure, record specific follow-up recommendations in Prevention. Submission and release remain under the decision of the handoff owner; the following layered protection handling structure itself cannot eliminate risks.

## The four layers

Pick the layers that apply. Not every bug needs all four.

| Layer | Purpose | Apply when | Example |
|-------|---------|------------|---------|
| 1. Entry validation | Reject obviously invalid input at the API boundary | The bug was caused by a caller passing bad data that should have been rejected | Throw if `workingDirectory` is empty or doesn't exist, before any downstream code touches it |
| 2. Invariant / business-logic check | Enforce that data makes sense for this operation | The operation has preconditions that entry validation cannot express | Assert `user.state === 'verified'` before issuing a password reset |
| 3. Environment guard | Refuse dangerous operations in contexts where they make no sense | The operation can be catastrophic if run in the wrong environment | In tests (`NODE_ENV === 'test'`), refuse `git init` outside the OS temp dir |
| 4. Diagnostic breadcrumb | Capture forensic context before the risky operation | Other layers might still be bypassed; future failures need evidence | Log `{ directory, cwd, env, stack }` immediately before `git init` |

## Applying the pattern

1. Trace the data flow from the bad value's origin through every function that passed it along.
2. Map the checkpoints: at which of those points could validation have rejected the bad value earlier?
3. Add guards at the appropriate layers. Each guard should be as narrow as possible — validating exactly what this layer is responsible for, not duplicating checks from other layers.
4. Test each guard independently: construct a case that bypasses layer 1 and verify layer 2 still catches it.

## Common mistakes

- **Duplicating the same check at every layer.** Each layer should catch a distinct class of failure. If layer 2 just repeats layer 1, the second one is noise.
- **Adding guards speculatively without a bug to justify them.** Defense-in-depth is a response to an observed failure mode, not a generic code-hygiene practice.
- **Leaving layer 4 (diagnostic breadcrumb) out.** When layers 1-3 still get bypassed — they will, eventually — the breadcrumb is what makes the next bug debuggable.
