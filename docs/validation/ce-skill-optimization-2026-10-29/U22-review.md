# U22 scoped commit and PR composition

Status: mechanism verified by local recipe/contract tests and producer self-review. Real host writing, remote PR application, Windows/PowerShell and semantic template decisions remain unverified.

Compared CE Commit and PR-description sources against local internal-helper, context, branch, compose, apply and caller handoff owners. Kept explicit commit/branch/landing authority, mixed-hunk preservation, author attribution, no-op rewrites and caller-owned watch.

Implemented project PR-body discovery and precedence: required fields/order/checklists survive compression; exact templates suppress optional sections; minimum templates permit useful additions. Existing evidence and branding are preserved on rewrite subject to actual project/user constraints. Caller-known planning decisions retain their real provenance, without searching for a plan or converting inferred choices into user approval.

Related issues now distinguish complete closure from partial/investigative/unknown relationships. GitHub closing requires the confirmed default target and full resolution. Rewrite retains references; an unsupported closing line becomes a neutral link with its correction disclosed. Project tracker conventions remain authoritative.

Removed base-name guessing and shell-dependent range construction. PR descriptions use exact head/base identities and detect API snapshot movement. Branch creation captures the single fetched base SHA, preserves carry-forward decisions and ignored/dirty collision safety. Apply names the exact repository/base/head, rechecks concurrent body changes and reads back actual identity/content. Push uses one authorized endpoint/refspec and disables unrelated tags, mirrors and submodule publication. These remain prompt-owned instructions, not a new runtime authorization gate.

Commit consumes owned/excluded paths with exclusion precedence, optional already-known U-ID and literal native temporary-message writing. Updated executable recipe tests invoke the documented argv commands, verify exact special-character/multiline message content, unrelated staged-path preservation, and ignored-file collision safety. No project Git mutation was performed; test commits occur only in isolated temporary repositories.

Verification: `U22-check.log` has 5 suites / 52 passed; after final source wording changes, `U22-final-recipes.log` reran the 3 directly affected recipe/context/pipeline suites successfully. `U22-entrypoints.log` passed; `git diff --check` passed. Existing U13 outcome judge calibration is included in the 52-test run. Template-only/minimum/additive, partial-vs-complete closure and decision-provenance interpretation were source-reviewed, not model-executed; they remain fresh-source evaluation obligations under U29/U30. No stack, babysit product, generic prose helper, global config or runtime mirror was added.
