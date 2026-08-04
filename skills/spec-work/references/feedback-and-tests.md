# Feedback And Tests

本 reference 是 `spec-work` 的反馈回路 owner。它负责 smallest loop、vertical slice、proof/characterization、test discovery、scenario completeness、system-wide check，以及无法运行验证时的 replacement evidence。它不决定产品范围，也不把 TDD 变成所有任务的仪式。

## Owned

- 为 behavior/CLI/browser/docs-schema/manual-only surface 选择最小可观察 feedback loop。
- 决定 proof-first、characterization-first、existing-test ownership 与 replacement evidence。
- 补齐适用 scenarios，检查真实跨层链路、failure/orphan/interface parity。
- 规定 not-run reason、claim ceiling 与复跑边界。

## Not Owned

- 改变 acceptance、public contract、架构 owner、task scope 或 source/runtime ownership。
- 把 TDD 变成所有任务的固定仪式，或让脚本裁决语义覆盖是否充分。
- 运行 shipping closeout、写 work run artifact、授权 commit/landing。

## Trigger

- 第一个 behavior-bearing mutation 之前；
- 当前 unit 的 `Execution note` 指定 proof-first、characterization-first、smoke/runtime 或其他验证方向时；
- task review、simplify 或 fix 改变了原验证覆盖面，需要重新选择或复跑 loop 时；
- docs/schema/config/manual-only 任务需要确定什么可观察证据足以支撑完成声明时。

## Fallback

纯文案、changelog-only、无行为变化且已有明确 diff-shape check 的小任务不必加载完整细节；执行最窄已知检查并保持 claim ceiling 即可。

## Smallest Feedback Loop

在改变行为前，先建立或尝试能观察当前 slice 的最小回路。优先顺序不是固定工具列表，而是“最小、真实、可复跑、能证明当前风险”：

- existing failing test 或最小新增 failing test；
- characterization test / baseline capture；
- CLI invocation、HTTP/API call、browser interaction 或 runnable example；
- trace replay、throwaway harness、property/fuzz loop；
- docs contract、schema validation、help/render check、generated catalog diff、link/path check；
- manual-only surface 的明确步骤、可观察信号和 limitation。

如果没有可用 loop，记录 `feedback_loop_not_possible` 与缺失条件。继续只允许使用最窄 replacement evidence，并明确它覆盖什么、不覆盖什么；不能把“没法跑”改写为 passed。

## Vertical Slices

当 scope 可以分成独立行为时，优先 tracer bullet：一个 behavior slice 同时关闭实现、focused verification、必要 docs/handoff evidence，再进入下一个 slice。

不要在多个独立 unit 上先“写完所有测试”，再“写完所有实现”。这会延迟反馈并扩大失败定位面。只有共享 contract/schema 必须先建立、或依赖图要求横向基座时，才先完成共同底层，并在最早可运行处建立反馈。

Docs-only、config-only 和 generated-catalog 任务使用 docs/schema/help/render/diff-shape 回路；不要强制编造行为测试。

## Slice Selection

- 默认选择 vertical slice：每个可独立观察的行为同时关闭实现、验证与必要 handoff evidence。
- 只有多个 consumer 共享同一输入/输出/error contract，且不先稳定该 contract 就无法得到最早可运行反馈时，才选择 contract-first；contract 稳定后立即回到 consumer 的 vertical slice。
- 当最高损失、最高不确定性或最难回滚的假设会决定后续方向时，选择 risk-first，先用最小 proof/characterization 证伪它，不从低风险清理开始。
- 保持 rollback-friendly：缩小同时变化的行为和状态面，保留可撤销 seam，并在进入下一 slice 前确认失败不会留下 orphan、重复效果或不可解释的中间状态。

这三种选择是语义判断，不是文件类型或关键词分类。不要用 contract-first 建一个长期不落地的横向框架，也不要把 risk-first 解释为先做最复杂的实现。

## Proof / Characterization Strategy

Test discovery 决定证据应该落在哪里：

| 当前情况 | 行动 |
| --- | --- |
| Existing test 已因目标行为失败 | 直接使用该 red evidence，不新增重复测试。 |
| Existing test 覆盖 contract 但断言旧/错误结果 | 修改或加强该测试，先观察预期失败，再改 production code。 |
| Existing test 过度 mock 或没走真实链路 | 窄化重构测试 seam，先证明真实风险可见。 |
| 没有测试覆盖目标行为 | 添加最小 focused failing test 或 characterization test。 |
| 当前任务不适合自动测试 | 在 mutation 前记录 no-test exception、原因、replacement verification 和 coverage limitation。 |

Proof-first 时，测试和实现不能在同一步同时完成；必须观察到与目标 root/behavior 对应的失败。Characterization-first 时，baseline 是“当前行为被观察到”，不是“当前行为正确”。

不要为证明纪律而复制测试。已有 test 是正确 owner 时，应 update/strengthen，而不是平行新增一份近似断言。

## Test Design Quality

- 测试应保持 DAMP（descriptive and meaningful phrases）：名称、setup 与断言直接表达行为和业务状态，允许为可读性保留少量重复，不用隐藏意图的过度 helper 压缩测试。
- 默认验证 state over interaction：优先断言调用者可观察的返回值、状态转换、持久化结果、事件或错误。只有 interaction itself is the contract（例如协议必须调用一次、顺序本身可见、禁止某个 sink）时，才把调用次数或调用顺序作为主要 proof。
- test double 选择顺序是 `real implementation -> high-fidelity fake -> stub -> mock`。越靠后越需要解释为什么更真实的 seam 不可用，以及该 double 仍能观察当前风险。
- No observed RED means no TDD-history claim。最终 diff 里同时存在实现和绿测，只能证明测试当前通过；只有 run-local evidence 在 production change 前观察到与目标行为对应的失败，才能声称 RED/TDD 历史。
- 一个 fake/mock 若跳过 serialization、middleware、callback、permission、retry 或 error translation，不能作为真实跨层链路的 integration proof；补最窄真实对象或 integration check。

## Test Discovery

在修改 implementation file 前：

1. 从 plan/task 声明的 test files 与 scenarios 开始；
2. 查找 import/reference/命名对应的 existing tests；
3. 找到跨层链路上的 integration/contract/smoke tests；
4. 确认删除或改变行为时，旧测试是否也应更新/删除；
5. 只在当前 source 证据不足时扩大搜索，不为“完整感”做无界 archaeology。

## Scenario Completeness

对 feature-bearing unit，只补适用类别，不按数量凑场景：

| 类别 | 何时适用 | 从哪里派生 |
| --- | --- | --- |
| happy path | 所有 feature-bearing unit | Goal、Approach、真实 input/output contract。 |
| edge/boundary | 有输入、状态、并发、分页、顺序或生命周期边界 | boundary values、empty/nil、重复/并发、状态转换。 |
| error/failure | 有 validation、权限、外部调用、I/O、retry/fallback | invalid input、deny path、downstream failure、timeout、partial failure。 |
| integration | 跨 callback/middleware/service/provider/source-runtime seam | 真实跨层调用链，避免把参与交互的层全部 mock。 |

Plan scenarios 过于泛化时，从当前 unit 的 source/contract 补足；如果补充会改变 acceptance 或 public contract，停止并返回 plan/task owner，不在 work 阶段发明 WHAT。

## System-Wide Check

在 unit closeout 前，用实际代码回答：

- 这段行为运行时还会触发什么 callback、middleware、observer、event handler 或 generated consumer？
- 测试是否走了真实交互链，还是只证明一个 isolated mock？
- failure/timeout/rollback 会不会留下 orphaned DB row、cache、file、lock、runtime artifact 或 duplicate retry？
- 是否有 alternate interface（CLI/API/DSL/agent/chat/mobile/web）需要 parity？
- 多层 retry/rescue/fallback 是否可能 double execution、吞错或改变错误类型？

Leaf-node 且无 callback/state/parallel interface 时，这个检查可以快速得出“不适用”。不要为了存在该章节强行新增 integration test。

## Verification By Surface

| Surface | 优先 feedback | 完成声明边界 |
| --- | --- | --- |
| behavior/library | focused unit/contract + 必要 integration | 只有真实执行并覆盖目标链路才可声称 passed。 |
| CLI | 命令、exit code、stdout/stderr contract、help/smoke | 文档中的命令示例不等于已运行。 |
| browser/UI | runnable route、关键状态、desktop/mobile、console/a11y信号 | 无 browser 时只能声明 code-level/bounded coverage。 |
| docs/schema/config | parser/schema/render/help/link/diff-shape | 不要求伪 TDD，但需要可观察的 artifact check。 |
| manual-only/external | 明确步骤、observable signal、owner、limitation | 不得声称 automated coverage。 |

## Not-Run And Replacement Evidence

- dry-run / schedulable but not executed -> `not-run` + `schedulable`；
- missing tool -> `not-run` + `missing_dependency` + `missing_tools`；
- unavailable environment/data/credential -> 记录具体 reason，不用模糊“环境问题”；
- replacement evidence 必须说明 proof surface、source/log/artifact ref 和 limitation；
- required verification 没有 replacement evidence 时，unit 不能 complete；optional evidence 缺失只限制对应 claim。

Fallback 是最窄已知验证，不是零验证。无法确认 system-wide coverage 时，返回 bounded conclusion，不声称 full coverage。

## Ownership Boundary

Scripts 可以记录命令、exit code、路径、hash、schema 结果和 reason_code；LLM 决定选择哪些 checks、scenario 是否语义充分、replacement evidence 是否足以支持当前 claim。不要让脚本替代 test design，也不要让自然语言声明冒充脚本事实。
