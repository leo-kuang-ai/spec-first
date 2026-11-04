| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| D01 | pass | `skills/spec-app-consistency-audit/SKILL.md:169`；约束委派授权与能力降级，不把调用意图当作委派授权。 | 约束守护授权与执行边界，未见需要硬编码补偿模型基础能力的强制推理流程。 |
| D02 | pass | `skills/spec-app-consistency-audit/prompts/audit-planner.md:36`；Planner 读取审计事实并选择专家；`prompts/engineering-quality-expert.md:27` 包含移动端领域风险。 | 领域知识提供审查线索，具体覆盖与问题判断仍由 LLM 承担。 |
| D03 | fail | `scripts/merge-contracts.js:411-417` 将 `confirmed + static_confirmed:false` 归一化为 `true`；`:479-485` 对未知家族返回空证据要求；`scripts/validate-artifacts.js:368-370` 只校验家族是非空字符串。 | 确认状态冲突被静默提升，未知家族也能绕过家族证据要求，属于可确定的证据门缺口。 |
| D04 | fail | `SKILL.md:107` 列出 canonical 输入；`scripts/run-audit.js:359-397` 传递参数时只纳入 source、PRD、Figma context 与扫描限制；`:465-482` 行业 profile/rule-pack 调用也未传行业、技术计划、任务文档、深度或预期输入。 | 入口接受的部分 scope/lens 参数没有投递到相应生产者，影响能力事实和实际审计范围。 |
| D05 | fail | `references/mode-output-contract.md:101-117` 要求 default 模式通过 Figma MCP 获取并物化；`SKILL.md:101,197` 声明 default orchestration deferred，但又称 interactive/default 可物化；`:108` 只明确禁止 headless/report-only 远程获取。 | default 模式当前实现范围与远程设计物化承诺不唯一，执行 owner 和能力状态不清。 |
| D06 | pass | `SKILL.md:158-169` 规定派发授权记录、能力探测前提、隔离与并发降级。 | 未授权不派发；未知隔离、模型覆盖或并发能力有明确降级方式，且不冒称独立覆盖。 |
| D07 | pass | `references/pilot-validation.md:14,54`；`scripts/merge-contracts.js:341-353` 缺少 pilot 证据时将 `ready_for_v0_2` 置为 false。 | 升级依据要求 pilot/人工确认，缺证据时不会宣称已就绪。 |
| D08 | pass | `SKILL.md:288-294` 标注 references 按需加载；`prompts/audit-planner.md:63` 限制专家预算；`scripts/lib/audit-utils.js:217` 有界读取。 | 按需加载、专家预算和读取边界均有静态依据；成本或运行开销不作为本次 fail 理由。 |
| B01 | pass | `SKILL.md:15-17,83-91` 明确 near-neighbor 路由及“直接修复”必须路由出去。 | 正负向入口与退出目的地清楚，未发现审计流程越权承接相邻工作。 |
| B02 | fail | 既定事实：`SKILL.md:294` 的 ECC 消费者表述已确认失实并修复；另 `scripts/run-audit.js:534` 无条件传入 `from:code-review`，`scripts/merge-contracts.js:425-427` 因此附加启用的 handoff，`scripts/render-headless-envelope.js:90-93` 将其渲染。 | 除已修复的 stale 引用，runner 仍会在普通审计中激活文档声明为休眠、无当前 consumer 的字段。 |
| B03 | fail | `SKILL.md:109` 承诺对产品源只读；`scripts/run-audit.js:296-309` 只校验 run 根与 envelope 路径；`:323-325` 递归创建 run 子目录；`scripts/lib/audit-utils.js:330-347` 写文件前未检查目标及父目录 realpath。 | 在安全 run 根内预置指向产品路径的子目录符号链接时，artifact 写入可能跟随链接越界，脚本写入边界未兑现只读承诺。 |
| B04 | pass | `SKILL.md:131-144` 明确 source/runtime 边界；`scripts/lib/audit-utils.js:20`；`tests/unit/spec-app-consistency-audit-host-boundaries.test.js:66-101` 与 `tests/unit/plugin-modules.test.js:706-711` 覆盖宿主与来源锁投射约束。 | 来源权威与生成资产边界有实现/测试证据；这不等于本次声明 runtime 已无漂移。 |
| B05 | fail | `scripts/run-audit.js:504-517` 在缺输入时生成空 `input/raw-issues.json`，`autoStubbed` 仅为本次进程内状态；`:519-526` 重试时会将已存在文件按外部输入要求 synthesis status。 | 相同 run-id 重试无法区分 runner 自产 stub 与调用方输入，恢复行为不一致。 |
| B06 | fail | `prompts/report-writer.md:15,17-31` 要求披露 coverage、degraded modes 等输入；`scripts/run-audit.js:540-550` 报告阶段只传 routes、quality、issues；`scripts/merge-contracts.js:198-225` 仅从传入 artifacts 汇总覆盖和降级；`scripts/render-headless-envelope.js:124-128` 只合并报告降级与 metadata reason codes。 | 生产报告未接收大部分领域合同及其降级事实，与报告披露要求不一致，envelope 也无法补回缺失信息。 |
| X01 | fail | `prompts/audit-planner.md:63` 规定多专家预算；`scripts/run-audit.js:501-526` 同 run 重试会把已生成空 stub 当成需要显式来源标记的输入。 | 多模块长链路恢复存在确定性断点，与计划的长链路场景相关。 |
| X02 | fail | `references/mode-output-contract.md:33-34` 声明技术计划/任务文档输入；`scripts/lib/audit-utils.js:427-437` 暴露架构意图、任务符合性能力；`scripts/run-audit.js:359-397` 未将这些参数传给 preflight、metadata 或 impact producer。 | 架构意图和任务符合性能力虽有声明，但 runner 的生产链未接通对应输入。 |
| X03 | not-applicable | `SKILL.md:60-62,97` 将范围限定为静态一致性审计并明确不替代 runtime 验证；`SKILL.md:81,127` 排除产品代码编辑与运行时执行。 | 本维度所涉产品实现/发布/回滚执行不在该 Skill 的工作范围，风险提示与验证建议不构成实际实现面。 |
| X04 | pass | `prompts/report-writer.md:15,56-57` 要求来源、新鲜度、限制及非自动执行的 handoff；`references/headless-runner.md:13-16` 规定 latest pointer 需对 metadata 校验。 | 交接与来源校验承诺可定位；报告覆盖缺口已在 B06 单独判定。 |

### 修复建议

- **D03：** 将 `confirmed + static_confirmed:false` 拒绝或降为 candidate；对未知 `claim_family` 拒绝 confirmed 或降级。证据门与 validator 共用家族枚举，并分别补充冲突状态和未知家族反例。
- **D04 / X02：** 建立显式参数投递映射，把已支持的行业、技术计划、任务文档、深度、预期输入及 Figma reference 传给相关 producer；暂不支持的输入应明确拒绝或在产物中披露，补入口到 producer 的合同测试。
- **D05：** 统一 default 模式 Figma 处理规则：要么说明 default orchestration 暂未实现且移交后续 workflow，要么明确 MCP 读取的授权条件、执行方和物化范围，并同步更新两处文档。
- **B02：** 移除无条件 `from:code-review`，只在真实调用方明确提供时透传；或如实修改休眠兼容声明并确保 envelope 不把该字段呈现为当前下游通道。
- **B03：** 在共享 artifact 写入边界校验目标文件及父目录的 realpath，拒绝 run 目录内指向边界外的符号链接；补 run 根安全但子路径链接越界的反例测试。
- **B05 / X01：** 为 runner 自产 stub 持久化来源标记，或将其移出外部输入发现路径；明确同 run-id 重放策略，并确保该拒绝路径也完成 metadata failed 收尾。
- **B06：** report 阶段消费完整领域合同，并将 preflight/impact 降级纳入报告；优先复用已有 artifact 清单，测试非核心领域降级必须出现在报告与 envelope。
