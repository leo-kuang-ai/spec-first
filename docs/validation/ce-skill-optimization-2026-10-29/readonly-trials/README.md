# Read-only task trials: observed outcomes and limits

This continuation executed 24 native task responses across four skills, with three baseline and three candidate responses per skill. Each performer received a fresh context, one exact source package, and the same concrete request and fixture within its scenario. This is task execution, not a static source check or a skill-up CLI run.

Arm A is the original immutable U31 dirty baseline; arm B is the candidate after the independently rechecked repairs. Neither source arm was edited during these trials. The protocols were frozen before their respective dispatch waves. See [wave 1 protocol](protocol.json), [wave 2 protocol](protocol-wave2.json), and [all response receipts](trial-index.json).

## Results

Independent semantic reviewers judged all 24 responses as passing their bounded requests: baseline 12/12 and candidate 12/12, or 3/3 per arm for each scenario. See [wave 1 adjudication](judge-wave1.json) and [wave 2 adjudication](judge-wave2.json). No task failure or unauthorized side effect was observed. Uniform success does not demonstrate causal improvement or equivalence.

The wave 2 reviewer noted possible confusion about `producer_fix_candidates: 1` with `proposed_fixes_count: 0`. The owner rechecked `skills/spec-doc-review/references/synthesis-and-presentation.md`, lines 112–120: report-only confidence-100 safe fixes are deliberately reclassified as producer candidates for any document. This is contract-conforming, not a count defect; no skill patch is justified by these samples. Verbose operational metadata in A-3 and the optional future-facing sentence in Promote B-1 are editorial observations only. Original responses remain unchanged.

The reviewer also listed auto-fix, persona dispatch and publication as unexercised behaviors. They are outside these explicit read-only requests and are not newly added acceptance criteria for CEOPT-09 or CEOPT-21. Full-comparison limits come from the original frozen contract and the untested facets listed below, not expanded evaluator expectations.

## Scope

| Scenario | Skill | Observed task | Remaining frozen-scenario boundary |
|---|---|---|---|
| CEOPT-02 | `spec-brainstorm` | Chat-only alignment with settled user, goal, exclusions, feedback and keyboard requirements | No downstream implementation or field outcome assessed |
| CEOPT-09 | `spec-doc-review` | Actual inline report-only review, duplicate root cause and withdrawn decision | No persona execution, document mutation or runtime exposure confirmation assessed |
| CEOPT-21 | `spec-promote` | X post and changelog from implemented-but-unreleased evidence | Existing tracked/ignored preference configuration branch remains untested |
| CEOPT-34 | `using-spec-first` | Four independent next-response tasks: active-owner failure, quoted bug wording, concrete implementation outline, missing optional tool | Downstream filesystem execution and live tool routing remain untested |

Full frozen-comparison acceptance remains incomplete for all four: the actual serving model identity is not independently authenticated, and the host does not provide demonstrated filesystem or credential isolation. These limitations do not erase the observed responses; they limit the claims those responses support.

## Method and evidence authority

Two fresh reviewer contexts received the requests, fixtures and every response/tool trace for their wave. Arm mapping and parent conclusions were withheld. Their semantic judgments are stored separately from performer receipts. This is independent context review within the same host, not cross-model independence.

The request itself includes explicit boundaries. Both arms received those boundaries, so success cannot isolate the causal contribution of the changed skill instructions. This protocol has no zero-skill control. Three responses per arm cannot establish general equivalence or reliability.

Transcripts record requested/inherited `gpt-6-astra` with high effort. These are host metadata, not authenticated serving receipts. Source hashes establish byte identity, not execution authentication. No external model CLI, provider call, skill installation or runtime refresh was used.

One CEOPT-21-A-3 dispatch ended with host HTTP 429 before a successful final response. The unchanged task was retried once in the same agent context. Its receipt retains the failure and retry. No comparative time/cost claim is made, including for this delayed sample.

All captured performer tool calls were bounded file reads using `cat`, `nl`, `sed`, `head` or `tail`. The [preservation check](wave2-preservation.json) found no changes among 6,347 observed existing paths, 122 frozen inputs or 389 previously reviewed source paths; HEAD and index also matched. The workspace observation was captured after the initial three dispatches, as explicitly recorded in [observation timing](observation-timing.json). It must not be described as pre-dispatch enforcement. Before/after observations do not prove that transient writes were impossible.

Raw response and tool-output evidence is preserved as observed, including quoted source language. New report prose is English. Reasoning, base instructions and credential metadata were not exported.

## Whole-scope accounting

[All 34 dispositions](all34-disposition.json) retains each remaining scenario, its exact input/outcome binding, current capability gap and next action. Thirty scenarios have no task trials. Missing concrete inputs are distinguished from missing host capability; no blanket isolation blocker is assigned to every read-only scenario.

U6 positive authenticated worker admission remains unavailable. U29 is partial. U30 remains inconclusive: no causal quality advantage, comparable cost/rework measurement, or time-to-trusted-change improvement is established. Keep optional capabilities optional; retain necessary safety repairs.

## Closeout

[Structured closeout](closeout-envelope.json) records `degraded`, with U6, full U29 and U30 checks explicitly unrun. Evidence integrity, all 24 unique judgments and response/trace hashes, balanced per-arm counts, JSON, English report prose, report links, five Changelog checks and whitespace checks passed. Product behavior did not change in this continuation, so the prior product test results were not rerun or represented as new runs.

The first closeout claim incorrectly grouped passed and unrun checks under one status and was rejected. It was corrected into separate claims covering all checks; the immutable summary and evidence were unchanged. The successful successor remains degraded, not verified overall.

No commit, push, PR, runtime mirror edit or external publication occurred.
