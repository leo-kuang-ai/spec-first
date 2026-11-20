# App / Client Surface Template

> When used in combination with `00-generic.md`, only patching the App surface will alter the WHAT, acceptance, or release boundaries. Frontmatter, machine-owned section, and readiness receipt are provided by `references/prd-output-template.md`.
>
> All human-related questions are only directed to the currently executing conversation user. Do not read `../overlays/securities.md` when there are no securities/trading signals.

## App property confirmation

| Dimension | content |
| --- | --- |
| Platform | iOS / Android / KMP / Desktop / Others |
| Target users | |
| Minimum supported version / System | |
| Login and Permission Prerequisites | |
| Entry point | Tab / Home / List / Details / Deeplink / Push / Other |
| Deployment method | Full-scale / Gray release / Feature flag / Version strong dependency |
| Design evidence | Figma / Screenshot / Interaction Design / None; Annotation: read/unread/degraded |

## Entry, navigation, and return behavior

| Scenario | Current behavior | Target behavior | Return / Close results | evidence |
| --- | --- | --- | --- | --- |
| First time entering | | | | |
| Secondary entry | | | | |
| Deeplink / Push entry | | | | |
| After login expiration, recovery | | | | |

Clarify page hierarchy, Tab state, return stack, popup closure, external link navigation, and recovery after interruption. Do not replace difference explanation with "continue using existing interaction".

## Page and component state

| Page / Component | Default state | Loading state | Empty state | Error state | Privilege level 0 | Success feedback |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Clarify for buttons, input boxes, list items, floating layers, and confirmation boxes: appearance conditions, operable conditions, disable reasons, repeat click behavior, results after cancellation, and timing of status refresh.

## Input, Confirmation, and High-Risk Operations

| Operation | Input / Constraints | Confirm steps | Cancel result | Resubmitting | Tracing / User-visible credential |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Payment, privacy authorization, irreversible operations, or sensitive data submission or permission escalation triggering must have corrective actions, cancellation, timeout, failure, and duplicate submission verification.

## Poor network, offline, and lifecycle

| Scenario | Product behavior | User prompt | Recovery method | Data consistency requirements |
| --- | --- | --- | --- | --- |
| Request timeout | | | | |
| Offline / Online | | | | |
| App go to background / resume | | | | |
| The page has been recycled by the system | | | | |
| Partial success | | | | |

## Permissions, Privacy & Security

List the trigger timing, rejection paths, reauthorization entry points, and minimization principles for camera, photo album, location, notification, biometric recognition, clipboard, or local file permissions. When involving personal information, specify the boundaries for display, de-identification, export, deletion, and logging.

## Accessibility, internationalization, and display adaptation

- Large text, screen reader, color contrast, touch target area, and dynamic content announcements.
- Multilingual copy, plural/sex rules, date/time, number, and currency formatting.
- Small screen, landscape and portrait orientation, dark mode, foldable screen, or desktop size; fill in according to actual supported ranges.

## Analytics / Product Evidence

Define only the events to be observed, trigger conditions, success/failure outcomes, and acceptance criteria for products; do not specify SDK or code-based implementation.

| Event / Metric | Trigger condition | Required attributes (product meaning) | Acceptance purpose |
| --- | --- | --- | --- |
| | | | |

## Compatibility, Gradual Rollout, and Rollback

Clarify the old version, old data, remote configuration, gray-scale users, server execution order, and user experience after rollback. It is not appropriate to equate "technical rollback capability" directly with "no product impact."

## App Supplementary Acceptance Test

- First entry, second entry, return from stack, and interrupt recovery.
- Load, empty, error, no permission, and poor network status.
- Repeated clicks, repeated submissions, cancellation, and partial success.
- Minimum supported version, old client, and gradual rollout boundaries.
- When design evidence is met, read/unread/degraded and readiness consequence have been documented.

## App pending closure issue candidates

Here it only prompts candidate gaps and does not generate a second set of OQ schema. Only move issues that change the App's WHAT, acceptance, scope, permissions, fallback, or analytics/publishing behavior into the output contract's canonical `Outstanding Questions`; pure component implementations and architectural decisions go into `spec-plan`.
