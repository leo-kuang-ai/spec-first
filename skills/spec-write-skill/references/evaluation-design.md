# Shape-Aware Evaluation Design

**trigger_condition：** full apply 已确认单一 source owner，准备写 core 前的 baseline、protected behavior 与 pre-patch eval plan。**must_read：** full apply 必须读完；Tier A behavior-preserving revise 不触发。**fallback_if_unread：** 不得开始 full apply source patch，只能报告 structural-only evidence，且不得声称 baseline、semantic adequacy 或行为改善。**eval_case：** `prepatch-entry-governor` 触发。

先选择目标项目已有 native eval owner；没有时创建 target-local maintainer cases，不把 `spec-write-skill` promotion validator 变成通用平台。fresh reviewer 只接收 raw source、真实 request 和 artifact，不能收到 intended fix。

| Shape | Baseline and protected behavior | Minimum eval family |
| --- | --- | --- |
| entry governor | with-skill vs bare-menu、route collision、near-neighbor | route/discipline，必要时重复 run 报告波动 |
| artifact producer | artifact contract、错误输出和 consumer | machine assertion + semantic artifact rubric |
| deterministic setup/validation | facts、reason code、failure boundary | unit/integration assertion，不用 prose 替代 deterministic facts |
| prose/agentic workflow | authority、输出 contract、good/bad/why | positive、near-neighbor、failure fresh-source cases |
| long-horizon loop | checkpoint、stop/resume/recovery | authority + checkpoint + recovery path |
| hybrid | 每个承重面各自 evidence | 组合必要 case，不强迫统一总分 |

新增 protected behavior 必须有 `protected_behavior → source carrier → contract assertion → semantic eval case` 映射。不能把 fixture pass、模型自检或 source bytes 当作 runtime quality。反馈/transcript/issue 先是 advisory：绑定 source/host/model，脱敏、最小复现、确认 expected behavior，并取得 eval-source mutation authorization后才可转 regression；否则只记录 observation。

## Model-Family Adaptation

用户要求升级或适配模型系列时，分开报告 `model-configured`、`skill-source-adapted`、`runtime-projected` 与 `optional-capability-validated`；这些是 claim 标签，不是新 schema。修改 prompt 前先用相同 source、cases、tools、endpoint contract 与有效 reasoning 运行 model-only baseline，再把候选 source 作为单变量 treatment。至少记录 source hash、host/runtime、请求模型与实际返回模型、effective reasoning、treatment、quality gates、token/latency/calls/cost、limitations 与 keep/revert/iterate/defer 决策。

如果真实模型调用需要未获授权的外部成本，或缺少 fresh-source 隔离 runner，则对应 treatment 保持 `not_run`。可以继续做有独立依据的 source hygiene，但只能称为 prompt-hygiene candidate；不得从 source 文案、runtime projection 或 structural fixture 推断模型已配置、语义已适配或效率已提升。`model-family-source-adaptation` 覆盖这一边界。

closeout 分开报告 deterministic checks、eval adequacy、五轴 readiness、default-source bytes、field outcome（默认 `not-run`）、not-run reasons、generated runtime status 和 residual risks。`manual_observation` 不能支持 default promotion。

## Restructure Coverage

Evaluate current on-disk source in fresh context. Give the subject a realistic request and raw inputs without the diagnosis, intended fix, or expected answer. Keep the grader's rubric separate. A cached Skill invocation, matching version label, or committed snapshot that omits the working-tree edit does not prove that the candidate ran. Do not patch runtime caches to force a reload. Reuse the project's actual evaluation tools; an optional installed helper is not a repository capability.

Require read evidence only when the scenario's decision depends on a reference the body requires at that step. A body-owned refusal may correctly stop without opening a procedure reference. Pair it with a complementary case that exercises the reference-owned path. Extra authorized reads are not failures; never add a must-not-read rule merely to enforce an extraction target.

Grade observable decisions and surviving artifacts. Mentioning a forbidden command to explain a refusal is not executing it, while a failed command attempt still counts as an attempt. A read-only sandbox makes forbidden writes impossible, so restraint alone is not a behavioral pass: require a meaningful positive decision or output. To test voluntary restraint with writes available, use an authorized isolated subject and inspect file changes and commit history. Missing evidence, timeout, an empty selected case set, or no executed host cannot count as passing. Self-reported action/read/delegation trailers are advisory and need corroboration for execution claims.

For a restructure, derive cases from the Skill's entry paths and modes, including conditional reads, early exits, and recovery. Compare before and after on the same cases. Choose available, authorized hosts and repetitions in proportion to usage and risk; disclose omitted paths and hosts instead of importing a fixed upstream matrix. Add any missed path that yields a review defect before claiming coverage of the fix.

Use surviving artifacts, logs, read traces, and actual dispatch receipts as evidence. A model's account of what it did cannot establish that a file was read or a delegate ran. If delegation is the behavior under test, a dispatch-forbidden recognition case cannot verify it; live checks require current authorization and an isolated subject. Without that authorization, keep the delegation claim `not-run` and continue independent checks.

Use `not-run` for a path never attempted. Use `unexercised` only after an attempt failed to reach it, with the attempt and reason recorded. Neither state counts as passing.

### Fresh Reader

Interview-skill behavioral tests must isolate their question tools from the authoring conversation. Use an authorized isolated harness with scripted input or a noninteractive question-capture path; do not let a test subject's clarification request reach the real user. If that isolation is unavailable, record the behavioral case as `not-run`. Keep cases in the project's actual evaluation owner instead of creating a foreign helper's default suite layout.

After a prose or placement restructure, use a fresh reader that did not author the change. Give it the pre-change and current body, ask it to identify sentences that require rereading and any meaning drift, then fix by restating plainly or relocating the block. Source size or a passing structural validator cannot substitute for this semantic check; if a fresh reader is unavailable, record the evaluation as `not-run`.
