以下裁决基于当前隔离 worktree `/private/tmp/spec-first-fr-wt` 的源码读取；`AR/` 简写为 `skills/autoresearch/`。仅裁决静态合同，不代表行为评测结果；未修改文件、未运行测试。Git 身份核验及全局 `/Users/kuang/.codex/AGENTS.md` 读取未获许可，不作为对象缺陷计入。

| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| D03 | fail | `AR/scripts/orchestrate.sh:256-287` 未校验 `predicate_met`、`pending_verify` 类型，而 `:128-141,236-240` 直接按真值决定验证与完成。 | 其余字段合法且无待处理信号时，`predicate_met: "false"` 可通过校验并进入 `DONE`／`CONVERGED`，与 `AR/SKILL.md:106` 的畸形账本不得参与路由承诺冲突；这是静态可推导反例，并非已执行实验。 |
| D04 | fail | `AR/fix.md:103` 输出 `findings = unfixed errors`；`AR/SKILL.md:87,97` 仅要求折叠；`AR/scripts/orchestrate.sh:118-125` 实际读取 `errors`、`untested_gaps`，缺失时按无阻断处理。 | 生产者字段到消费者阻断信号没有明确转换约定，未解决事项不能保证进入路由判断。 |
| D05 | fail | `AR/SKILL.md:20-28` 同时规定顺序解析与后置强制标志；`:3` 排除不可检查目标，`:70-72` 却明确接管主观单次分发；`AR/references/orchestrator-routing.md:58` 确认该分支没有机械谓词。 | 即使将“Force”解释为隐含覆盖，入口对不可检查目标的排除与接管仍存在直接冲突，故不是密度或表达偏好问题。 |
| D06 | fail | `AR/predict.md:50-58`、`AR/references/predict-personas.md:46` 无条件要求隔离、独立分析；`AR/references/reason-judge-protocol.md:18` 的能力检查和共享上下文降级仅在 reason 协议中定义。 | predict 未引用或定义能力不足时的阻断／降级路径，reason 的局部规定不能自动证明 predict 的独立性承诺可兑现。 |
| D08 | fail | `AR/SKILL.md:24,34-49` 未建立所选模式到协议文件的必读关系，而 `AR/autoresearch.md:40-58,99` 承载所有权、冻结测量、唯一目录及恢复要求。 | 必要规则存在于包内不等于已进入执行上下文，入口摘要不足以替代这些承载性原文。 |
| B01 | fail | `AR/SKILL.md:3` 要求不能表达为可检查信号的目标转出，`:72` 却将主观／终结型目标分发到内部 learn、improve、reason。 | 自然触发边界和进入后的职责范围不一致；强制标志优先级含混是附加问题，而非唯一依据。 |
| B02 | fail | `AR/debug.md:95`、`AR/fix.md:103` 分别输出已确认 bugs 和未修复 errors；`AR/references/orchestrator-routing.md:27-29` 将它们描述为路由来源，但 `AR/scripts/orchestrate.sh:119-125` 消费另一组字段。 | 有 handoff 文件和概念关联不等于已有可执行的输入归一化合同，当前直接消费者无法可靠解释生产者输出。 |
| B03 | fail | `AR/ship.md:86` 明确正向发布批准门，但 `:112-115` 仅要求从最近日志找动作并反向执行，没有与 `Target`（`:12`）、当前对象及授权范围对账。 | 通用批准原则不能消除回滚对象选择歧义；本项以回滚边界缺口成立，不将本地 persona 委派一概认定为必须另行审批。 |
| B04 | fail | `AR/evals/eval.yaml:6-11` 配置本地 skill 与 Claude 引擎，但 `AR/evals/cases/dispatch-classic-mode.yaml:9-11`、`screen-cmd-refuses-unsafe-predicate.yaml:9-11` 明确指定读取 `.claude/skills/autoresearch/SKILL.md`。 | 指定镜像为被测定义却未绑定其与当前 source 的一致性，造成静态来源合同缺口；使用单一评测引擎本身不是 fail，也不据此否定多宿主投射能力。 |
| B05 | fail | `AR/autoresearch.md:58,99` 明确唯一目录和恢复对账；`AR/debug.md:45`、`fix.md:42`、`ship.md:104-108` 仍采用分钟级固定目录，未规定碰撞处理。 | 同子命令同分钟重入可指向同一组日志和 handoff，缺少排他创建／拒绝复用约定；并非要求各子命令复制全部 Classic 恢复规则。 |
| X01 | fail | `AR/SKILL.md:82-97` 支持多 hop 并折叠 handoff，但无 run/hop 身份与目录绑定；`AR/fix.md:42`、`reason.md:38` 仍按分钟命名输出。 | 循环预算与停止条件已经存在，但重复 hop 或恢复时不能唯一绑定当前运行的证据；缺陷在身份和隔离，不在没有统一编排框架。 |
| X03 | fail | `AR/regression.md:80,88` 限制 STABLE 权威并要求最终重验；`AR/ship.md:112-115` 的回滚仍仅依据最近日志反向操作。 | 正向验证与授权不能证明回滚目标仍是当前部署／产物，也不能证明后续变更不会被覆盖。 |
| X04 | fail | `AR/improve.md:22-25,40-46` 直接读取现存 handoff 和最近 learn 摘要；`AR/learn.md:63-65` 依据 manifest 状态跳过已生成页，未绑定来源版本或失效条件。 | `source` 子命令名和生成时间不等于来源身份与有效性；learn 的最终校验（`:83,101-104`）是正面约束，但不足以补齐 improve 复用旧摘要时的 freshness 合同。 |

**修复建议：**按共享根因最小收敛：① 为出口相关布尔值及实际消费的状态字段增加严格类型校验和非法账本反例；② 定义轻量 handoff 归一化约定，明确未解决错误、验证缺口、失败状态如何进入路由，语义不明时阻断完成声明，避免用通用 severity 阈值替代 LLM 判断；③ 统一 description 与主观目标分发边界，明确强制标志优先级及双标志冲突，并为各模式／子命令补协议路径和必读要求；④ 为 predict 明确能力与既有授权检查，无隔离能力时披露共享上下文或停止独立性相关动作；⑤ 将 eval 被测对象绑定当前 source，镜像加载另作版本可追溯场景，判据强度问题仅记 S3；⑥ 将 Classic 的唯一运行目录原则扩为共享约定，为 hop 分配独立身份并在恢复前核对产物，不新增中心化状态机；⑦ 回滚前核对目标、环境、版本／部署 ID、当前状态和授权范围，仅对新增重要后果追加确认；⑧ 为跨运行复用补最小来源引用、来源身份、适用限制与失效检查，源码变化后重新验证或标记过期，不以“最近”或“generated”替代有效性。
