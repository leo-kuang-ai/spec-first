# Mixed / Cross-end Surface Template

> Used in combination with `00-generic.md`. Load only when there are real cross-surface, producer/consumer, or source-of-truth changes; do not use Mixed due to a possible association.
>
> All human-related questions are only directed to the currently executing conversation user. Industry overlay loads independently based on explicit signals.

## Mixed property confirmation

| Dimension | content |
| --- | --- |
| involves surface | App / H5-PC / Admin / Backend / CLI / Third-party |
| Main business outcomes | |
| Current source of truth | |
| Target source-of-truth | |
| producer | |
| consumers | |
| Synchronization method / Timeliness (product semantics) | |

## Source-Of-Truth Resolution

| item | current source | target source | non-authoritative mirrors | conflict rule | evidence |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Producer / Consumer Map

| producer | artifact / state / config | consumers | expected freshness | change effect | failure visibility |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Cross-end Consistency Matrix

| Ability / State | App | H5-PC | Admin | Backend / CLI | Allow differences | source |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Each entry must consistently define the content, reasons for allowed variations, update order, and resolution priority in case of conflicts.

## Asynchronous Synchronization and Degradation

| Scenario | producer status | consumer status | User-visible results | Restore / Compensate | Eventually consistent condition |
| --- | --- | --- | --- | --- | --- |
| delay | | | | | |
| lost / failed | | | | | |
| Repeat | | | | | |
| Out of order | | | | | |
| Some surfaces are unavailable | | | | | |

## Rollout / Backout

Clarify the release order, compatibility window, feature flag, behavior of previous versions, allowed temporary inconsistencies, and the source-of-truth after rollback for each surface. Do not list the technical deployment order as a task implementation sequence.

## End-to-end acceptance and regression protection

- The observable result for each consumer after the producer is updated.
- Delay, repetition, failure, partial success, and recovery.
- Compatibility with old clients / old callers / old data.
- Source-of-truth conflicts and negative acceptance.
- No double-write, erroneous overwrite, or user-unexplainable states occur after rollback.

## Mixed pending issues candidate

Here it only prompts candidate gaps and does not generate a second set of OQ schema. Will move issues related to source-of-truth, surface coverage, allowed differences, sync latency, fallback, or end-to-end acceptance into the output contract's canonical `Outstanding Questions`; protocols, messaging systems, databases, and deployment orchestration are moved into `spec-plan`.
