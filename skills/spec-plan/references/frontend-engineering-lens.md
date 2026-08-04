# Frontend Engineering Planning Lens

Read this reference when the request, Product Contract, or current source concerns a user-visible page, form, navigation path, shared-component behavior, asynchronous UI state, responsive layout, or accessibility contract. It owns plan-time frontend-engineering decisions and does not replace visual polish, browser execution, or diff review.

## Trigger And Negative Boundary

Trigger this lens when the work:

- creates or materially changes a user-visible page, interactive form, navigation path, public component behavior, or state transition;
- adds loading, success, empty, error, permission, retry, offline, or concurrent-interaction semantics;
- affects keyboard/focus behavior, semantic structure, label/error announcements, contrast, motion, or responsive layout;
- makes a CSS-only change that reduces contrast, removes a focus indicator, breaks a breakpoint/layout, or changes motion/state expression.

Normally do not trigger this lens for:

- backend-only handlers, type-only changes, fixture-only changes, or token-value-only changes that do not alter contrast, focus, layout, responsive behavior, motion, or state expression;
- visual polish with no structural, behavioral, state, or accessibility-contract change;
- a post-implementation race, visual defect, or browser runtime failure, each of which belongs to its corresponding execution or review owner.

A file extension cannot determine the trigger by itself. The LLM judges applicability from user-visible behavior and current source; scripts may validate only deterministic facts about readable routes, tests, artifacts, or commands.

## Required Planning Landing

When applicable, the plan records the following minimum decisions in proportion to risk instead of appending a fixed UI checklist:

- **Component boundary and reuse:** the existing design-system/component owner, reusable pieces, local state owner, and the condition that justifies a new component boundary;
- **State matrix:** applicable initial/loading/success/empty/error/permission/retry/offline/concurrent states, observable transitions, and the retry/cancel/duplicate-submission posture;
- **Accessible interaction:** semantic element/role, keyboard path, focus order/restoration, label/help/error announcements, contrast, and reduced-motion boundaries;
- **Responsive behavior:** key viewports, content reflow, overflow/touch targets, and breakpoint or container constraints;
- **Runtime verification:** which routes/states require browser/runtime evidence, which component/unit/contract checks can support, and the claim ceiling when those checks do not run.

Preserve the current project's design system, framework, and component conventions. Do not turn a specific CSS framework, ARIA template, breakpoint number, or visual style into a rigid cross-project rule.

## State And Async Safety

When the interface contains an async action, subscription, timer, observer, or repeatable interaction, the plan makes these decisions explicit:

- the action's pending, success, failure, and cancellation/cleanup edges;
- the outcome of duplicate clicks, late responses, unmount/remount, permission changes, or network failure;
- which state is visible to the user and when repeated actions are blocked, allowed, or coalesced;
- where real runtime/race verification is required instead of static component assertions alone.

Do not prescribe an implementation hook or dependency library directly in the plan. If timing/race behavior is a diff-time defect, hand it to `julik-frontend-races-reviewer`; this lens only ensures that the plan does not omit state contracts that must be implemented and verified.

## Owner Boundaries

- The `spec-plan` frontend lens owns pre-implementation component/state/a11y/responsive/runtime-verification decisions.
- `spec-polish` owns browser-visible visual iteration and detail polish for an implemented interface.
- `spec-test-browser` owns browser runtime verification when capability is available; it does not decide UI product design.
- `spec-dogfood` owns branch/PR user-flow QA and bounded feedback fixes.
- `julik-frontend-races-reviewer` owns lifecycle, timer, async, concurrency, and cleanup-race findings in the diff.
- The frontend-quality reviewer, when selected by code review, owns a11y/state/responsive quality findings in the diff and deduplicates them against adjacent owners.

Do not create a new public `spec-frontend` Skill or let this planning lens execute browser, polish, or review work directly.

## Failure And Degradation

When a design artifact, runnable route, browser capability, or current component source is missing, record the source ref, owner, reason, and narrowest substitute verification; do not claim that visual/a11y/runtime checks passed. If the work requires a new public workflow, a second design-system truth source, or an ownership boundary that cannot distinguish planning from execution/review, stop and return to the plan owner.
