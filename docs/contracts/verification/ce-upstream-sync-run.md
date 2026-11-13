# CE 固定窗口同步证据合同

`scripts/check-ce-upstream-reconciliation.cjs` 是本合同的唯一 producer/validator；语义裁决由执行 owner 完成。JSON envelope 见 [schema](ce-upstream-sync-run.schema.json)。存在文件、hash 校验通过或自述 `confirmed`，均不证明审查语义充分。

## 输入、快照与输出

先以完整 commit SHA 运行 `--create-window-facts`，再以相同 refs、`--window-facts` 和显式输出路径运行 `--refresh --prepare-adjudication`。facts 来自 Git 两端对象，A 的旧对象、D 的新对象为 null，rename 同时绑定旧路径和新路径。消费时重新计算，不接受可移动 ref 或手写计数。

`target_source_snapshot` 覆盖 canonical source 和 dirty manifest。窗口自身精确列出的运行输出排除在 source hash 外；计划、合同、实现、测试、冻结和审查依据仍参与。旧输入只可用于证明实施前的状态，不可改 hash 冒充当前输入。源码变化后使用新的 `runs/<run-id>/` 目录重新 prepare。

发布使用同目录排他锁、staging、文件独占创建和最后发布的 artifact-set manifest。已有不同内容拒绝覆盖；崩溃留下的锁不会自动抢占，使用新 run 目录恢复。消费者必须验证 manifest 中所有文件的 hash 以及必需文件的覆盖；这不保证任意外部进程不会篡改文件。

## 三类 envelope

- `package-admission`：绑定精确 package/path subset、unit、逐路径动作和理由、review/authority/dependency/source 引用；只授予记录范围内的实现准入。真实任务授权仍来自用户，引用存在不能代替授权判断。
  v1 增量兼容：Skill 路径的 `package_id` 保持精确包路径；CLI、根脚本等非 Skill 路径沿用输入的 `null`，不发明伪 Skill 包。每条路径仍须匹配 package 身份、固定窗口子集和逐路径决策，因此 `null` 不允许混入 Skill 路径；receipt/handoff 的覆盖与 unit/action 对账不变。
- `owner-receipt`：绑定 admission 原始字节 hash、before snapshot、当前 input/window/snapshot、实际 changed_files、命令 argv、exit code 和日志 hash。等价复用可为 `changed_files=[]`，仍需 source 引用和实际检查。跨实施快照必须显式提供 `admission_input_ref` 与 `admission_window_ref`，不重签历史准入。
- `handoff`：绑定当前输入及 receipts，包含 summary、freshness、limitations、next_owner、claim_ceiling。完整窗口出口另将最终 ledger 逐路径 join receipt 与 admission，拒绝缺失/重复覆盖、unit/action 不一致，以及 planned/degraded 记录。产品排除保留显式产品依据，不伪装为实施完成。

validator 强制结构、引用可读性、路径边界、快照及 hash 一致性；owner 负责裁决依据是否足够、日志是否支持 claim、授权是否来自真实 owner。该机制没有实现宿主层写入拦截，不能宣称其在 mutation 之前硬强制准入。

## Ledger reader 迁移

历史 `ce-upstream-reconciliation/v2` 保留固定 `Pxx` package summary 结构和历史 fixture。具名窗口输出 `ce-upstream-reconciliation/v3`：逐路径 records 的合同沿用 [adjudication schema](ce-upstream-adjudication.schema.json)，package_id 使用 `skills/ce-*` 或 `.agents/skills/ce-skill-work` 路径身份；共享 `skills/CODING_STANDARDS.md` 不冒充 Skill package。

v3 的 `package_summary` 每条为 `{package_id, surface, changed_path_count, record_paths, actions, closure_profiles}`；后两项为动作/closure 计数映射。reader 必须根据 schema_version 分支，不将 mixed actions 压为单值。逐路径 records 是权威，package summary 只作导航。脚本的 Markdown 摘要和 CLI 输出消费相同版本；旧 v2 不改变。deferred/unresolved 仍在工作账本中，不能伪造为正式 action 或完整同步节点。

## 验证与限制

`tests/unit/ce-upstream-reconciliation-v2.test.js` 覆盖新窗口对象、重放、篡改、快照失效、发布碰撞、receipt 与 handoff join；历史窗口由 `ce-upstream-3-20-reconciliation.test.js` 回归。此处是确定性结构/行为合同验证，不证明 1,023 条语义审查完成、真实宿主加载或现场收益。
