| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| B03 | fail | `skills/spec-simplify-code/SKILL.md:57-59`：规定何时可派发、如何探测候选和发送评审上下文，但未声明独立的数据外发授权、worker `mutation_scope=forbidden` 或调用前后状态观察；对照 `docs/contracts/workflows/worker-dispatch-capability.md:37-39,85-90`，这些是彼此独立的授权与结果消费边界。 | R1 指出的修改授权与派发授权区分成立，但不足以覆盖独立的数据授权和 worker 副作用观察要求；当前技能未完整消费 owning contract。 |
| B05 | fail | `skills/spec-simplify-code/SKILL.md:69`：容量错误后要求排队、等空位并重试，没有次数、时限或耗尽出口；`docs/contracts/workflows/worker-dispatch-capability.md:106` 明确要求排队、等待与重试有界，耗尽时记录 `dispatch_backpressure_exhausted`。 | R1 对容量错误属于背压而非 reviewer 失败的判断成立，但没有重试耗尽条件，仍与 owning contract 的有界等待要求不一致。 |
| X01 | fail | `skills/spec-simplify-code/SKILL.md:22`：有 base ref 时默认用分支与 base 的 diff，未合并 HEAD 到工作树的 staged/unstaged 差异；`skills/spec-lfg/references/review-followup.md:12-14`：LFG 要求简化步骤保留未提交实现并留在工作树；另见 `SKILL.md:69` 的无界等待条款。 | 跨模块边界与风险扩围已有约束，但未提交实现可能被默认范围遗漏，且持续零容量没有有界恢复出口。 |

**修复建议（B03、B05、X01）：**
- **B03：** 按需加载并遵循 `docs/contracts/workflows/worker-dispatch-capability.md`；在派发前分别核实派发授权与所需的数据外发授权，明确 reviewer 的 `mutation_scope=forbidden`；调用前后比较任务相关的可观察状态，若无法证明无越界变更，则阻断该 worker 结果，不纳入 finding 或验证证据。
- **B05：** 为排队重试规定有界预算，并在耗尽时记录 `dispatch_backpressure_exhausted`，转为串行或 inline 完成剩余 lens，同时如实披露降级，不声称独立评审覆盖。
- **X01：** 将默认范围定义为 base→HEAD 的提交差异与 HEAD→工作树的 staged/unstaged 差异的合并，并保留调用方授权路径限制；增加“仅有未提交实现”及“提交与工作树差异并存”的范围核对场景。
