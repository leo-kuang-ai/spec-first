---
title: "CE Skill 优化实施计划"
type: refactor
status: active
date: 2026-10-29
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
target_repo: spec-first
---

# CE Skill 优化实施计划

## Goal Capsule

让研发人员在使用 spec-first 的规划、实现、审查和知识闭环时，保住已有工作，获得可信验证，并吸收 CE 中能降低遗漏与返工的能力。

建议按“数据与执行安全 → 验证结果可信 → 跨 Skill 闭环 → 研发能力融合 → 真实任务验收”推进。当前交付仅为计划，产品修复执行数为 0；`implementation-ready` 表示具备实施分解，不表示用户已授权执行、独立审查通过或收益兑现。

范围以既有 34 项源码审查为基准，四个用户排除项继续跳过。当前代码与角色契约优先于审查快照，审查快照优先于从 CE 直接复制。顶层实施 owner 负责每批 consumer 与最终树验证；发布、外发及宿主安装按实际授权处理。遇到 source 身份变化、证据与结论冲突或必需能力缺失，停止相关单元并保留其他独立工作的进展。

## Product Contract

### 问题与需求

审查发现数据保护、路径身份、验证准入和跨 Skill 证据消费存在缺口。已有本地增强有实际 consumer，整包覆盖 CE 会丢失 WHAT/HOW、授权、task-pack、最终树验证和知识失效边界。

- R1. 文件、Git、实验及状态操作保护既有 WIP 与目标仓库边界。
- R2. 评分、签收、观察窗口和验证结论由实际证据支持。
- R3. 跨 Skill 的证明、发布、反馈与恢复责任在 producer 和 consumer 两端闭合。
- R4. CE 能力沿既有 owner 窄化融合，保留本地有效增强。
- R5. 34 项均有明确处置与验收，四个排除项不因共享改动被默认为已审查。
- R6. 真实质量与研发成本按证据分层报告，不用结构测试或 token 下降代替收益。

### 范围与来源

主依据：[全量总报告](../validation/ce-skill-audit-2026-10-28/report.md)、[覆盖账](../validation/ce-skill-audit-2026-10-28/coverage.json)、[原审查计划](2026-10-28-001-ce-all-skills-source-audit-plan.md)。每项详情保留双方源码定位和原探针；本计划不声称重新完成了一轮全量源码审查。

审查 spec-first HEAD 为 `fe81bae9ee55ec336c85cf80c4a0460d86e3a412`，包含冻结的 dirty 内容；CE HEAD 为 `00d0a5bbf1300b2138b65ce724b325dd4dff77ba`。执行前对照 `baseline.json` 和 `full-asset-ledger.json` 检查相关文件漂移，漂移项重新阅读双方源与 consumer。不得重写旧 receipts 来让历史结论显示为当前验证。

不纳入：通用跨模型 runtime、approve-all、默认自动提交发布、第二 watch/stack 引擎、Pack/docs_root 新体系、实时语音远程服务、通用视觉 server、默认删除注释、泛化固定性能阈值。它们缺本地需求/owner/收益证据；仅在明确场景、授权与退出条件齐备时另立研究。

## Planning Contract

### 技术决策与边界

- KTD1. `reuse/extend` 现有 owner。源码修改限 `skills/`、相关 `src/cli/`、templates/contracts/tests/docs；不手改 generated runtime。修各自真实 writer/runner，不因漏洞表面相似新建万能路径框架。
- KTD2. 脚本负责路径、hash、schema、Git 身份、互斥与观测事实；LLM 负责后果、充分性、去重、机会与价值判断。关键词不得升级为语义硬门禁。
- KTD3. 对既有 artifact 兼容采取 reader 与 writer 同批修改。新增字段先明确 consumer；可识别旧合法值保留兼容，未知版本/值不静默归成功。需破坏性迁移时先保存原件、提供 fixture 和失败恢复，不就地重写历史审查证据。
- KTD4. proof-test 与 conversation completion 复用已有 handoff，新增最小来源/状态信息；不创建中央工作流状态机。外写结果未知先核远端状态再重试。
- KTD5. U31 在任何产品修改前保存可恢复的源码基线，并冻结失败/正常任务、质量规则和比较方法。U29 只执行已冻结的评测，不在看到优化结果后重新选基线或调整成功标准。现有会话缓存、fake provider 和静态 pin 不证明真实宿主效果。

### 批次、依赖与退出条件

| 批次 | 单元 | 优先处理 | 出口 |
| --- | --- | --- | --- |
| 实施前准备 | U31 | 源码恢复与评测冻结 | dirty 内容可在隔离目录恢复，34 项任务与评判规则已固定 |
| 1 数据与执行安全 | U1–U6 | F01–F05、F07、F15 | 隔离反例关闭，正常操作可用，WIP/外部 sentinel 保全 |
| 2 验证结果可信 | U7–U14 | F06、F08–F13 及局部事实缺口 | 原反例不误绿、正常回执不误拒、unknown 不冒充成功 |
| 3 跨 Skill 闭环 | U15–U17、U32 | F14、Sweep 发布与媒体授权 | producer/consumer 同时生效，恢复幂等，最终树重验 |
| 4 研发能力融合 | U18–U28 | 12 组 CE 建议及逐项局部建议 | 范围内 prose/script/contract 一致，针对性验证有证据 |
| 5 真实任务验收 | U29–U30 | 34 项行为与研发链收益 | 按实际能力给出 verified/not-run/inconclusive；不提前宣布整体完成 |

此顺序把 F07/F15 提前到第一批，以先保护执行边界；把 F06 与评分合同放第二批，并非降低风险等级。五批是建议顺序，U31 是五批之前的准备，不新增产品阶段。单元的“依赖”才是执行图的硬前置；无依赖且无文件/资源争用时可独立推进。U7 的评分器修复不依赖 U1 的实验目录修复；U14 的局部修复不依赖 Setup 或 browser；PR 模板和无代码回复不相互阻塞。U13 按 Skill 划分小变更，不等所有包都修改后才验证，提交仍以实际授权为准。

### 变更、恢复与风险

实施开始先完成 U31：记录 HEAD、index、dirty 内容与本次 ownership，并保存可恢复副本；hash 仅校验身份，不能代替内容备份。每单元限制 diff，禁止 `reset --hard`、宽泛 clean 或清除用户 dirty。测试危险操作仅在可丢弃 fixture。出现回归只逆转本次 owned patch；基线恢复只在隔离目录演练，不覆盖当前工作树；状态/schema 演练用副本，不覆盖用户状态。若共享 helper 波及排除 Skill，只核共享兼容边界，不扩展该 Skill 内容优化，必要时拆分实现。

每批补对应 CHANGELOG，用户行为变化更新相关文档；runtime drift 仅通过已授权的 `spec-first init` 修复。generator 改动按 `getSupportedPlatforms()` 实际列表检查投射，不能由单宿主绿色推断八宿主通过。无新增依赖的明确必要性时不加库。

## Implementation Units

所有单元初始状态为“待实施”。下表映射是本计划的全量处置表；执行时在单独运行证据中记录 U-ID、修改文件、source hash、命令、exit code、反例/正例、残余项，不把计划状态当运行证据。每个单元均须先核其所引详审的全部建议，逐条记录采用/已有等价/条件暂缓及理由，不仅修总报告中的 F 编号。

### U31. 在产品修改前冻结可恢复源码与评测基线

- 批次：实施前准备；来源：R1、R6；依赖：无；状态：待实施。保留 U1–U30 原编号，U31 的执行顺序在它们之前。
- 修改 owner：本次实施 owner 的本地私有证据目录；不修改被审产品、原审查 receipts、用户 index 或宿主 runtime。
- 实施：保存 HEAD、分支、index 清单与 staged/unstaged 二进制差分，保存未跟踪且属于实施/评测输入的文件内容；记录删除、文件模式、符号链接及依赖的外部输入版本。对纳入范围生成内容清单和 hash；凭据、用户数据、缓存与 generated runtime 不复制为源码。不能安全保存的必要输入标明缺口，仅阻断依赖它的复现与收益结论。
- 评测冻结：按 34 项映射固定主要任务、关键反例、正常对照、输入、质量 rubric、样本/重复与判定规则、runner/judge 版本及模型/宿主/工具身份要求。冻结记录与快照路径由实施 owner 留存，测试任务和结果分别保存。修改后新增案例只作补充，不替换原对照；若必须改标准，两侧使用同一新版本重跑。
- 验收：在可丢弃目录从保存内容恢复基线，核对文件 hash、删除/链接/模式以及 staged/unstaged 区分；当前工作树和 index 不变。34 项均有冻结案例或明确能力限制，必要输入缺口不能伪称可复现。基线真实运行可在 U29 执行，但必须使用这份修改前内容和预定规则；环境不可比时保持 inconclusive。
- 依据：[原审查基线](../validation/ce-skill-audit-2026-10-28/baseline.json)仅含身份与摘要，不能替代本单元的恢复副本；[完整文件账](../validation/ce-skill-audit-2026-10-28/full-asset-ledger.json)用于范围和漂移核对。

### U1. 修 experiment-worktree.sh 的重复 create、manifest ownership、dirty 检查及 cleanup-all 范围

- 批次：1；来源：F01；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-optimize/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：修 experiment-worktree.sh 的重复 create、manifest ownership、dirty 检查及 cleanup-all 范围；不删除同前缀普通目录。
- 验收：重复 create 保全 tracked/untracked/ignored WIP；陌生目录不删除；owned clean worktree 正常创建和清理。
- 双方源码与原反例：[spec-optimize 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-optimize.md)。

### U2. 修 path-safety.cjs、workspace-routing-inject.cjs、workspace-git-exclude.cjs 的链接/祖先安全写

- 批次：1；来源：F02、F05；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-runtime-setup/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：修 path-safety.cjs、workspace-routing-inject.cjs、workspace-git-exclude.cjs 的链接/祖先安全写；workspace-graph-state.cjs 复用隔离 GIT_* 的 runner。
- 验收：dangling/中间祖先链接、外部 sentinel 不被写；正常文件可更新；A/B 仓污染环境仍记录 A HEAD。
- 双方源码与原反例：[spec-runtime-setup 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-runtime-setup.md)。

### U3. 修 worktree-manager.sh 物理 containment 与 remote-only branch/ref 一致性，并核 Work caller 的转交合同

- 批次：1；来源：F03；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-worktree/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：修 worktree-manager.sh 物理 containment 与 remote-only branch/ref 一致性，并核 Work caller 的转交合同。
- 验收：外链 .worktrees 被拒且外部无 checkout；合法路径正常；remote-only 分支按请求跟踪且不意外 detached。
- 双方源码与原反例：[spec-worktree 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-worktree.md)。

### U4. 修 sweep-state.py 的锁创建、file type/no-follow、失败阻断

- 批次：1；来源：F04；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-sweep/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：修 sweep-state.py 的锁创建、file type/no-follow、失败阻断；持久化前校 close evidence，拒绝未知未来版本并统一 UTF-8。
- 验收：锁失败时 handler 零调用，sentinel 字节不变；并发互斥可复现；无 evidence 不写 closed；未来版本不被降级覆盖。
- 双方源码与原反例：[spec-sweep 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-sweep.md)。

### U5. 修 src/cli/task-pack.js 与 src/cli/helpers/target-repo.js 的真实目标/未来祖先、Git 元数据及宿主 runtime 边界

- 批次：1；来源：F07；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-write-tasks/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：修 src/cli/task-pack.js 与 src/cli/helpers/target-repo.js 的真实目标/未来祖先、Git 元数据及宿主 runtime 边界；区分 artifact root 与 mutation target。
- 验收：外链、未来文件外链祖先、.git/config、OpenCode runtime 均不获执行资格；合法源码及合法产物目录不误拒。
- 双方源码与原反例：[spec-write-tasks 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-write-tasks.md)。

### U6. 让 cross-model-pov.sh 所有 worker 入口先过统一 receipt/scope/deadline/schema

- 批次：1；来源：F15；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-pov/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：让 cross-model-pov.sh 所有 worker 入口先过统一 receipt/scope/deadline/schema；修 dormant persona 引用，不激活默认跨模型运行。
- 验收：无/弱/过期 receipt 时 fake provider 零调用；合格 fixture 调用可追踪；正常 dormant 路径继续诚实降级。
- 双方源码与原反例：[spec-pov 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-pov.md)。

### U7. 统一 score-regression.sh 与生产协议的 regression-eligible/eligible、visual-ui/visual，兼容已有合法值，未知值拒绝安全结论

- 批次：2；来源：F06；依赖：U31；状态：待实施。
- 修改 owner：`skills/autoresearch/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：统一 score-regression.sh 与生产协议的 regression-eligible/eligible、visual-ui/visual，兼容已有合法值，未知值拒绝安全结论；核 candidate/check/提交 owner。
- 验收：HARD 反例不再 STABLE；旧合法值正常；未知字段不误绿；check 不修改候选，提交尊重既有 owner。
- 双方源码与原反例：[autoresearch 详审](../validation/ce-skill-audit-2026-10-28/skills/autoresearch.md)。

### U8. 让 decide.cjs 和 measurement-admission.cjs 使用独立真实样本/receipt及预注册噪声算法

- 批次：2；来源：F08；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-optimize/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：让 decide.cjs 和 measurement-admission.cjs 使用独立真实样本/receipt及预注册噪声算法；保留 holdout 与比较身份。
- 验收：虚报 sample_count 不足以准入；0/100 的 A/A 不能以自报 noise=0 过关；稳定正向样本可准入，缺样本保持 inconclusive。
- 双方源码与原反例：[spec-optimize 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-optimize.md)。

### U9. 分离正文 hash 与 input freshness，refresh-inputs 不能替正文修改重新签收

- 批次：2；来源：F09；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-prd/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：分离正文 hash 与 input freshness，refresh-inputs 不能替正文修改重新签收；WHAT 词表降为 advisory，保留确定性声明冲突检查。
- 验收：改正文后旧签收失效；只改允许输入可刷新；合法产品术语不被词表拒绝；release/授权 consumer 一致。
- 双方源码与原反例：[spec-prd 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-prd.md)。

### U10. 修 findings-mechanics.py 的字段形态、证据准入和大小写路径身份

- 批次：2；来源：F10；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-code-review/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：修 findings-mechanics.py 的字段形态、证据准入和大小写路径身份；最终语义改写后重跑 mechanics，并核 consumer 的有效/无效/未知三态。
- 验收：P0 无证据低置信、truthy 伪冲突不能进 primary；A.js/a.js 不错误合并；有效 finding 保留；无法校验不声称已通过。
- 双方源码与原反例：[spec-code-review 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-code-review.md)。

### U11. pr-watch-state.cjs 与实际采样 producer 共同定义 cadence、可接受 gap 和 resume

- 批次：2；来源：F11；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-lfg/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：pr-watch-state.cjs 与实际采样 producer 共同定义 cadence、可接受 gap 和 resume；失联窗口重建，已有失败不能被 quiet 覆盖。
- 验收：相隔 30 分钟的两个快照不证明连续 quiet；正常连续采样可收敛；崩溃恢复不虚构中间观测。
- 双方源码与原反例：[spec-lfg 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-lfg.md)。

### U12. wrapper 补 vitals 的 open 前置

- 批次：2；来源：F12；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-test-browser/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：wrapper 补 vitals 的 open 前置；conformance 将 cleanup 单独记录，失败保留诊断；server 仍归 caller。
- 验收：vitals→open 被拒；close exit9 不报整体 passed、不删失败证据；正常 open/vitals/close 及清理成功通过。
- 双方源码与原反例：[spec-test-browser 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-test-browser.md)。

### U13. 按逐项笔记把结果 judge 接到实际文件字节、HEAD/index、调用 trace 和 task outcome

- 批次：2；来源：F13；依赖：U5、U9、U10；状态：待实施。
- 修改 owner：`skills/spec-work/`、`skills/spec-plan/`、`skills/spec-code-review/`、`skills/spec-prd/`、`skills/spec-simplify-code/`、`skills/spec-debug/`、`skills/spec-doc-review/`、`skills/spec-commit/`、`skills/spec-commit-push-pr/`、`skills/spec-handoff/`、`skills/using-spec-first/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：按逐项笔记把结果 judge 接到实际文件字节、HEAD/index、调用 trace 和 task outcome；逐包替换话术/grep/提交总数误绿，先冻结反例和正常对照。
- 验收：Work 五类违例、Plan 删实现/新建未跟踪、Review tenant 未修、PRD 改正文、Simplify 删安全文件均失败；正确回执不因词表误拒；不把 recorder 冒称模型运行。
- 双方源码与原反例：[spec-work 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-work.md)；[spec-plan 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-plan.md)；[spec-code-review 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-code-review.md)；[spec-prd 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-prd.md)；[spec-simplify-code 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-simplify-code.md)；[spec-debug 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-debug.md)；[spec-doc-review 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-doc-review.md)；[spec-commit 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-commit.md)；[spec-commit-push-pr 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-commit-push-pr.md)；[spec-handoff 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-handoff.md)；[using-spec-first 详审](../validation/ce-skill-audit-2026-10-28/skills/using-spec-first.md)。

### U14. 修 Compound unknown/exit-code 摘要和正向 fixture

- 批次：2；来源：局部问题；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-compound/`、`skills/spec-riffrec-feedback-analysis/`、`skills/spec-product-pulse/`、`skills/spec-polish/`，以及 `skills/spec-sweep/scripts/analyze_riffrec_zip.py` 的同源副本；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：修 Compound unknown/exit-code 摘要和正向 fixture；Riffrec 聚合 egress receipt/partial coverage/事件事实；Pulse source 默认映射/not-run；Polish 缺参循环/port/Procfile。分析器只在 `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py` canonical owner 修复，再同步 Sweep 包内副本；该副本属于 `skills/` 源码资产，不是宿主 generated runtime，不建立第二份独立逻辑。
- 验收：正向 fixture 恢复且失败不报成功；缺 chunk 明确区间；无 finding 不造需求；revenue 读正确 source；缺参有限退出，端口来自实际启动事实。两份分析器字节一致，分别从两条包内路径运行缺 chunk、provider 失败、无外发授权的隔离案例，回执/coverage 一致且无未授权 provider 调用；回归 `tests/unit/spec-riffrec-feedback-analysis-contracts.test.js` 的同源断言及对应 safety/snapshots 测试。
- 双方源码与原反例：[spec-compound 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-compound.md)；[spec-riffrec-feedback-analysis 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-riffrec-feedback-analysis.md)；[spec-product-pulse 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-product-pulse.md)；[spec-polish 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-polish.md)。

### U15. 在现有 handoff 传 proof-test 来源/保护意图

- 批次：3；来源：F14；依赖：U5、U13；状态：待实施。
- 修改 owner：`skills/spec-work/`、`skills/spec-debug/`、`skills/spec-lfg/`、`skills/spec-simplify-code/`、`skills/spec-write-tasks/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：在现有 handoff 传 proof-test 来源/保护意图；Simplify 消费并保留 test-only seam；task-pack 无损派生，最终树重验归 caller。
- 验收：生产代码可等价重构，证明测试不被删弱；丢失/过期证据显式暴露；简化后复跑原症状和最终树验证。
- 双方源码与原反例：[spec-work 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-work.md)；[spec-debug 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-debug.md)；[spec-lfg 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-lfg.md)；[spec-simplify-code 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-simplify-code.md)；[spec-write-tasks 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-write-tasks.md)。

### U16. Resolver 输出最小 pending conversation actions

- 批次：3；来源：F14；依赖：U11、U13；状态：待实施。
- 修改 owner：`skills/spec-resolve-pr-feedback/`、`skills/spec-lfg/`、`skills/spec-commit-push-pr/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：Resolver 输出逐项 pending conversation actions，保留反馈 verdict、代码依赖、source/head、已有回复可见性与剩余条件；LFG 按下表消费，记录精确 repo/PR/thread 与幂等完成事实。pipeline-return 本身保持零远端写，外部动作由持有相应授权的 caller 完成。
- 验收：缺回复授权时 reply 零调用；缺解决授权时 resolve 零调用；修复尚未发布时不得回复“远端已修复”或解决对应线程；无需代码变更的已授权回复可独立完成。中断后只补未完成动作；外写结果未知先查状态；不重复 fix/POST，不把 pending 当 completed。

| 反馈类别 | 回复前提 | 解决线程前提 |
| --- | --- | --- |
| fixed / fixed-differently | 验证通过，精确修复 SHA 已到实际 PR head，并有回复授权 | 修复发布证据、可见且已提交的回复、无 pending review，以及独立解决授权 |
| replied / not-addressing / declined，且不依赖代码修改 | 当前判断与来源仍有效，并有回复授权；不要求为此创建 commit/push | 可见回复及独立解决授权；存在 pending review 或状态未知时保持 pending |
| needs-human | 有回复授权时可发送完整决策分析，不要求发布代码 | 始终保持开放，等待实际决策 |

- 恢复：逐来源核对 PR/head、评论与当前代码；已有回复不得重复 POST，旧 fixed 回复仍核修复 SHA 可达性；pending review 的可见性规则适用于全部类别。
- 当前合同：[Full Mode 回复协议](../../skills/spec-resolve-pr-feedback/references/full-mode.md)、[pipeline-return](../../skills/spec-resolve-pr-feedback/references/pipeline-return.md)。
- 双方源码与原反例：[spec-resolve-pr-feedback 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-resolve-pr-feedback.md)；[spec-lfg 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-lfg.md)；[spec-commit-push-pr 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-commit-push-pr.md)。

### U17. 修 Plan research leaf 与 Work Figma leaf 的 authority/intent 冲突

- 批次：3；来源：F14；依赖：U13；状态：待实施。
- 修改 owner：`skills/spec-plan/`、`skills/spec-work/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：修 Plan research leaf 与 Work Figma leaf 的 authority/intent 冲突；parent 保留 WHAT、目标及最终判定，leaf 回事实与限制。
- 验收：leaf 不重写上游 WHAT、不扩大 Figma/UI 目标；缺 capability 明示；parent 真正消费证据，字段不是孤立装饰。
- 双方源码与原反例：[spec-plan 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-plan.md)；[spec-work 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-work.md)。

### U32. 接通 Sweep 共享状态发布尾部与媒体授权回执

- 批次：3；来源：Sweep 逐项审查的 shared publication 与媒体授权缺口；依赖：U4、U14；状态：待实施。
- 修改 owner：`skills/spec-sweep/SKILL.md`、`skills/spec-sweep/references/run.md`、`skills/spec-sweep/references/subagent-template.md`、`skills/spec-sweep/references/agents/media-analyzer.md` 及其具名状态合同/测试；媒体分析器本体与副本同步归 U14。
- 共享状态实施：在既有 shared-branch opt-in、commit/branch/landing 授权边界内，让本次 run-record 和仅本次 lease-release 的成功结果进入最终 publication。保留开始时先发布租约再触碰 source 的顺序；末次发布后读回精确远端状态，核 run identity、last_run 与租约结果。本地释放成功不能等同远端释放成功。
- 共享状态验收：用临时本地 bare remote 验证正常结束、record/release 失败、push 被拒、推送结果未知及中断恢复。失败停止后续 source 写，保留恢复依据且不报远端 cleanup 完成；恢复先读远端，不覆盖新 writer 的租约，不 force-push。repo-local/committed-local 模式不因本单元增加远端写。
- 媒体实施：在现有 worker packet 传递 run/item identity、普通/敏感标记、授权来源、精确媒体/provider 范围及有效的 transcription-egress fact；输出携带实际 request-sent/provider 状态、coverage 与 receipt 引用。parent 消费并保留这些事实；inline 路径遵守同样规则，不以 dispatch 授权替代外发授权。
- 媒体验收：缺失、范围不符或无法确认的授权使用 no-transcribe；敏感媒体始终不转写；合法普通媒体授权只允许范围内调用。用 recorder 检查零调用和正向调用，provider 失败/未知不得伪报未外发，缺 chunk 必须返回 partial 区间；parent 的最终摘要与回执一致。
- 依据：[Sweep 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-sweep.md)、[现有 wrap-up](../../skills/spec-sweep/SKILL.md)、[媒体模板](../../skills/spec-sweep/references/subagent-template.md)。

### U18. 补 concern 的具体 harm/后补代价、considered-not-built、规范单 owner、稳定 KTD 与按需研究 dossier

- 批次：4；来源：CE 融合 2；依赖：U17；状态：待实施。
- 修改 owner：`skills/spec-plan/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：补 concern 的具体 harm/后补代价、considered-not-built、规范单 owner、稳定 KTD 与按需研究 dossier；不强制每次额外产文件。
- 验收：上游 WHAT 字节保真；被否决方案不塞 deferred；决策引用稳定；研究回传可追溯且上下文成本可记录。
- 双方源码与原反例：[spec-plan 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-plan.md)。

### U19. 统一 synthesis 与来源合同

- 批次：4；来源：CE 融合 3；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-brainstorm/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：统一 synthesis 与来源合同；表达 problem/outcome/means，补 settled/no-doc 闭包。
- 验收：已有选择不重问；no-doc 不声明已写文件；需求无偷偷加入 HOW；合法新歧义能定位。
- 双方源码与原反例：[spec-brainstorm 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-brainstorm.md)。

### U20. 补可重复复现 instrumentation、性能 baseline/profile、missing-seam 替代证据

- 批次：4；来源：CE 融合 4；依赖：U15；状态：待实施。
- 修改 owner：`skills/spec-debug/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：补可重复复现 instrumentation、性能 baseline/profile、missing-seam 替代证据；清理隐式 port 与未来 CI 已验证措辞。
- 验收：修前原症状可见、修后同条件重验；无测试 seam 仍给可重跑证据；性能故障归 Debug，正常相对优化归 Optimize。
- 双方源码与原反例：[spec-debug 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-debug.md)。

### U21. Doc-review 补后果准入/事实重评/语义去重/Withdraw/恢复幂等

- 批次：4；来源：CE 融合 5、7；依赖：U10、U13、U15；状态：待实施。
- 修改 owner：`skills/spec-doc-review/`、`skills/spec-code-review/`、`skills/spec-simplify-code/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：Doc-review 补后果准入/事实重评/语义去重/Withdraw/恢复幂等；Review 窄补资源释放、测试隔离、migration；Simplify 按需测试价值 lens。
- 验收：同根因不重复修复；撤回项不作为 residual 复活；report-only 零写入；proof 不弱化；reviewer 数量/depth/batch 默认值暂不改。
- 双方源码与原反例：[spec-doc-review 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-doc-review.md)；[spec-code-review 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-code-review.md)；[spec-simplify-code 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-simplify-code.md)。

### U22. 读取项目 PR 模板、tracker close-vs-link 和已知决策来源

- 批次：4；来源：CE 融合 8；依赖：U13；状态：待实施。
- 修改 owner：`skills/spec-commit/`、`skills/spec-commit-push-pr/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：读取项目 PR 模板、tracker close-vs-link 和已知决策来源；统一精确 repo/base/portable recipe，复用现有 mixed-hunk/作者 owner。
- 验收：模板和链接含义正确；不误关闭仅相关 issue；非 main/子目录/dirty 场景不混入无关变更；本地演练不发真实 PR。
- 双方源码与原反例：[spec-commit 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-commit.md)；[spec-commit-push-pr 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-commit-push-pr.md)。

### U23. Compound 父上下文分类起草、按需 finder/corpus 去重

- 批次：4；来源：CE 融合 9；依赖：U14；状态：待实施。
- 修改 owner：`skills/spec-compound/`、`skills/spec-compound-refresh/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：Compound 父上下文分类起草、按需 finder/corpus 去重；Refresh 用既有 invalidation/alias 找历史术语消费者。
- 验收：独有知识保留；发布失败不报成功；来源变更可失效；不新增并列 retire_when、不自动 promotion/landing。
- 双方源码与原反例：[spec-compound 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-compound.md)；[spec-compound-refresh 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-compound-refresh.md)。

### U24. 补机会定位、Goodhart 反证、独立比较身份和可共享报告，复用现有预算、holdout、persistence

- 批次：4；来源：CE 融合 10；依赖：U1、U7、U8；状态：待实施。
- 修改 owner：`skills/spec-optimize/`、`skills/autoresearch/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：补机会定位、Goodhart 反证、独立比较身份和可共享报告，复用现有预算、holdout、persistence。
- 验收：原 baseline→final 同口径确认；不把轮次百分比相加；无 holdout 或噪声不明保持未定；报告不泄私有路径/数据。
- 双方源码与原反例：[spec-optimize 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-optimize.md)；[autoresearch 详审](../validation/ce-skill-audit-2026-10-28/skills/autoresearch.md)。

### U25. Explain 补 trigger/state/failure/untraced 与理由来源

- 批次：4；来源：CE 融合 11；依赖：U31；状态：待实施。
- 修改 owner：`skills/spec-explain/`、`skills/spec-ideate/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：Explain 补 trigger/state/failure/untraced 与理由来源；Ideate 唯一 dossier、来源覆盖、杠杆排序及数量/预算闭包。
- 验收：代码事实与原设计意图区分；断链明确；不按 issue 数量判价值；低置信高风险线索可保留待证。
- 双方源码与原反例：[spec-explain 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-explain.md)；[spec-ideate 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-ideate.md)。

### U26. Work 补同 frame/token 比较

- 批次：4；来源：CE 融合 12；依赖：U12、U14、U17；状态：待实施。
- 修改 owner：`skills/spec-work/`、`skills/spec-polish/`、`skills/spec-dogfood/`、`skills/spec-prototype/`、`skills/spec-test-xcode/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：Work 补同 frame/token 比较；Polish 反馈/验证/residual；Dogfood criteria/stale-rule/resume/server 身份；Prototype 授权/stop/最小 reload；Xcode flow/bundle ID/操作结果及准确 setup handoff。
- 验收：成功点击不等于状态变化；缺工具零调用不造 PASS；恢复沿原 server/来源；prototype 不进入生产；页面批注单独条件实验。
- 双方源码与原反例：[spec-work 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-work.md)；[spec-polish 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-polish.md)；[spec-dogfood 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-dogfood.md)；[spec-prototype 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-prototype.md)；[spec-test-xcode 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-test-xcode.md)。

### U27. Setup 按需能力与原配置 owner 修复，命令身份/文档/consumer 对齐

- 批次：4；来源：本地接口收敛；依赖：U2、U3、U6、U13；状态：待实施。
- 修改 owner：`skills/spec-runtime-setup/`、`skills/using-spec-first/`、`skills/spec-worktree/`、`skills/spec-pov/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：Setup 按需能力与原配置 owner 修复，命令身份/文档/consumer 对齐；入口包外引用经 generator 解析核验；POV subject/grounding/callee 证据统一。
- 验收：在隔离异仓投射检查引用，不假设安装目标拥有源码 docs；按实际支持宿主枚举；不手改 runtime、不默认启用外部 worker/native fork。
- 双方源码与原反例：[spec-runtime-setup 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-runtime-setup.md)；[using-spec-first 详审](../validation/ce-skill-audit-2026-10-28/skills/using-spec-first.md)；[spec-worktree 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-worktree.md)；[spec-pov 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-pov.md)。

### U28. Strategy 判别式压力测试/拒绝原则

- 批次：4；来源：剩余逐项建议；依赖：U13、U14；状态：待实施。
- 修改 owner：`skills/spec-strategy/`、`skills/spec-product-pulse/`、`skills/spec-promote/`、`skills/spec-handoff/`、`skills/spec-riffrec-feedback-analysis/`；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：Strategy 判别式压力测试/拒绝原则；Pulse capability fallback；Promote 准确交付 claims、本地草稿/ignore/target；Handoff 受管路径与研究/review 继续；Riffrec 私有 manifest 与共享文本区分；各自补结果 eval。
- 验收：不把 commit 当上线、不代答策略、不把无数据当零；既有授权不重复问；handoff 不强路由 Work；Riffrec scaffold 不冒充确认需求。
- 双方源码与原反例：[spec-strategy 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-strategy.md)；[spec-product-pulse 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-product-pulse.md)；[spec-promote 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-promote.md)；[spec-handoff 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-handoff.md)；[spec-riffrec-feedback-analysis 详审](../validation/ce-skill-audit-2026-10-28/skills/spec-riffrec-feedback-analysis.md)。

### U29. 按已冻结的 34 项场景执行 fresh-source 行为验收

- 批次：5；来源：真实行为验收；依赖：U4、U16、U18、U19、U20、U21、U22、U23、U24、U25、U26、U27、U28、U32；状态：待实施。
- 修改 owner：34 项当前源码及其真实 consumer；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：从 U31 的恢复副本和冻结任务分别运行 baseline 与 candidate，核对 source 身份与实际环境可比性；在可用真实宿主按 34 项逐项执行，覆盖主研发链及各 Skill 的具体职责。不得在此补造修改前基线或按 candidate 表现改成功标准。
- 验收：每项记录实际 source 身份、调用与产物、结果和限制；没有执行的项写 not-run；独立评审与真实 UI/跨模型/Windows 分层记录。
- 双方源码与原反例：[全量映射](#全部-skill-处置映射)。

### U30. 对能力融合项比较正确性、遗漏、返工、权限事件、context 与 time-to-trusted-change

- 批次：5；来源：收益与默认策略；依赖：U29；状态：待实施。
- 修改 owner：34 项当前源码及其真实 consumer；共享源码以详审具名路径为界，相关现有 tests/evals 同步。
- 实施：对能力融合项比较正确性、遗漏、返工、权限事件、context 与 time-to-trusted-change；使用预先冻结的任务和质量优先准入规则。
- 验收：确定性缺陷全部关闭；任何证据/权限回归阻止采用；质量不降低才评成本收益；不足样本写 inconclusive，保留可选或撤回融合，不撤回必要安全修复。
- 双方源码与原反例：[全量映射](#全部-skill-处置映射)。

### 全部 Skill 处置映射

| Skill | CE 对应 | 实施单元 | 优化建议与处置 | 初始状态 |
| --- | --- | --- | --- | --- |
| `autoresearch` | `无直接对应` | U7、U24 | 先修评分/候选/check协议，再接本地实验和提交owner；补结果/恢复eval，不建立第二研发总路由 | 待实施 |
| `spec-app-consistency-audit` | `无直接对应` | — | 本轮不评估；此前读取仅保留历史记录 | 用户排除，跳过 |
| `spec-brainstorm` | `ce-brainstorm` | U19 | 先修synthesis本地自洽，再目标/范围标准与结果eval；暂缓视觉及通用跨模型runtime | 待实施 |
| `spec-code-review` | `ce-code-review` | U10、U13、U21 | 先修finding地板与修复judge，再窄吸收条件depth、末轮重算和persona证据条目；跨模型保持dormant | 待实施 |
| `spec-commit` | `ce-commit` | U13、U22 | 复用共享 native 消息写入、exclude 与已知 U-ID；保留授权/mixed-hunk/作者保护；补 outcome eval | 待实施 |
| `spec-commit-push-pr` | `ce-commit-push-pr` | U13、U16、U22 | 先补模板/close-vs-link和真实状态eval；统一portable recipe；不引入stack/babysit产品面 | 待实施 |
| `spec-compound` | `ce-compound` | U14、U23 | 先合同自洽/状态摘要/fixture；吸收parent-owned正文和corpus去重；配置root按需 | 待实施 |
| `spec-compound-refresh` | `ce-compound-refresh` | U23 | 先补知识保留和发布失败结果eval；不并列retire_when、不恢复自动landing或全词表扫库 | 待实施 |
| `spec-debug` | `ce-debug` | U13、U15、U20 | 优先集成复现/性能/测试保护，消除隐式port/未来CI措辞，增强全角问句和真实行为eval | 待实施 |
| `spec-doc-review` | `ce-doc-review` | U13、U21 | 先修schema/eval/Withdraw闭包，再融合语义准入/去重与恢复幂等；跨模型保持dormant | 待实施 |
| `spec-dogfood` | `ce-dogfood` | U26 | 先补criteria与resume/server身份；不直接导入Pack分发器，增强零调用结果eval | 待实施 |
| `spec-explain` | `ce-explain` | U25 | 先补trace/理由和真实fallback eval，再融合source links/provider边界；不扩发布面 | 待实施 |
| `spec-handoff` | `ce-handoff` | U13、U28 | 补真实受管路径、HEAD差分与继续执行eval；不导入临时store/一律等待 | 待实施 |
| `spec-ideate` | `ce-ideate` | U25 | 先局部自洽，再分层样本与结果eval；保留独立授权/单次scratch/Brainstorm决策owner | 待实施 |
| `spec-lfg` | `lfg` | U11、U15、U16 | 先补watch连续观测和feedback completion；复用当前plan/发布owner；不复制CE通用路由/stack合并 | 待实施 |
| `spec-optimize` | `ce-optimize` | U1、U8、U24 | 先数据保护与真实样本地板，再定位/Goodhart/比较身份/报告；remote调度暂缓 | 待实施 |
| `spec-plan` | `ce-plan` | U13、U17、U18 | 保留字节级WHAT/授权/readiness；吸收concern裁定、稳定KTD、研究dossier和决策去重，先修自洽与eval | 待实施 |
| `spec-polish` | `ce-polish` | U14、U26 | 优先修resolver输入与Procfile事实选择；补反馈/验证/residual；暂缓整体语音/远程runtime | 待实施 |
| `spec-pov` | `ce-pov` | U6、U27 | 先补worker/admission/schema，再统一subject/grounding；窄吸收callee证据、owner与最小实验，不导入品牌推定独立性 | 待实施 |
| `spec-prd` | `无直接对应` | U9、U13 | 先修freshness/词表gate/评测，再统一release闭包与授权；有界吸收CE单owner和concern，不上线eval-only拓扑 | 待实施 |
| `spec-product-pulse` | `ce-product-pulse` | U14、U28 | 保留本地增强；先统一metric source默认值、not-run枚举与结果eval | 待实施 |
| `spec-project-rules` | `无直接对应` | — | 本轮不评估；此前读取仅保留历史记录 | 用户排除，跳过 |
| `spec-promote` | `ce-promote` | U28 | 收敛空draft commentary例外、准确交付claims和结果eval；不扩发布或config层 | 待实施 |
| `spec-prototype` | `ce-prototype` | U26 | 先统一授权/eval和stop文案，再最小reload，最后真实任务验证可选批注 | 待实施 |
| `spec-resolve-pr-feedback` | `ce-resolve-pr-feedback` | U16 | 先接pending-actions消费者和publication证明；精确repo示例与隔离结果eval；不默认自动commit/外发/模型裁定 | 待实施 |
| `spec-riffrec-feedback-analysis` | `ce-riffrec-feedback-analysis` | U14、U28 | 先聚合egress receipt和partial coverage，再补事件事实/结果eval | 待实施 |
| `spec-rule-miner` | `无直接对应` | — | 本轮不评估；此前读取仅保留历史记录 | 用户排除，跳过 |
| `spec-runtime-setup` | `ce-setup` | U2、U27 | 先修共享路径和Git runner，再统一命令/文档/consumer；窄吸收按需能力与原owner修复，不导入Pack和跨模型runtime | 待实施 |
| `spec-simplify-code` | `ce-simplify-code` | U13、U15、U21 | 先接caller proof-test保护与真实产物eval；条件式测试价值lens；不默认五reviewer或删除注释 | 待实施 |
| `spec-strategy` | `ce-strategy` | U28 | 保留本地标题/ownership；先补压力测试质量与真实diff评测 | 待实施 |
| `spec-sweep` | `ce-sweep` | U4、U14、U32 | U4 修锁/close/版本/UTF-8；U14 同步媒体分析器副本；U32 完成共享状态末次发布和媒体授权/回执消费 | 待实施 |
| `spec-test-browser` | `ce-test-browser` | U12 | 先补顺序/cleanup，再按等价能力实验自适应/native；不导回server管理 | 待实施 |
| `spec-test-xcode` | `ce-test-xcode` | U26 | 补bundle ID来源、setup准确handoff和零调用eval；保留source绑定/URL/Fail边界 | 待实施 |
| `spec-work` | `ce-work` | U13、U15、U17、U26 | 先修结果eval并与simplify/Debug接proof-test保护，再吸收同frame/token比较；不导入外部runtime或自动提交 | 待实施 |
| `spec-worktree` | `ce-worktree` | U3、U27 | 先修containment/ref一致性并补caller合同；native/fork能力有条件吸收，保留env/trust边界 | 待实施 |
| `spec-write-skill` | `无直接对应` | — | 本轮不评估；此前读取仅保留历史记录 | 用户排除，跳过 |
| `spec-write-tasks` | `无直接对应` | U5、U15 | 先统一路径owner与结果eval，再无损投射proof/settled/external done intent；不复制CE默认并行或自动commit | 待实施 |
| `using-spec-first` | `无直接对应` | U13、U27 | 增强真实routing eval与包外引用投射检查；不把CE模型carrier搬入入口 | 待实施 |

34 项均进入实施处置，不等于每个 CE 差异都要迁入。Handoff 无 repo schema 扩展、Prototype 页面批注、Browser native、自适应测试、Worktree native/fork、Review depth/batch 仅作条件实验：必须先有真实任务需求、可用能力、质量对照与退出条件；否则保持现状并记录暂缓，不能被纳入已兑现收益。其余逐项建议由对应 U-ID 承接，不以“低优先级”为由静默遗漏。

## Verification Contract

### 检查层次与方法

| 层次 | 验证方式 | 能证明什么 | 不能证明什么 |
| --- | --- | --- | --- |
| 源码与合同 | 每单元当前 source、producer/consumer、schema、路径和 diff 核对 | 声明、接口与修改范围一致 | 模型按文案执行 |
| 确定性机制 | 在临时仓运行详审原反例与正常/失败恢复对照；固定 bug 的回归测试入现有 owner suite | 实际 helper/CLI/状态/文件行为 | 真实 provider 和现场效果 |
| Fresh-source 行为 | 新执行上下文注入当前 source，记录工具调用和真实产物；按 34 项逐项核验 | 当前源在所测模型/宿主/任务中的行为 | 未测宿主或普遍收益 |
| 真实研发对照 | 冻结任务、基线、质量 rubric、样本与评判规则后比较 | 指定场景的质量、返工、成本与耗时 | 无样本能力或未部署环境 |

原反例位于审查根各 `*-probes.json`/脚本与逐项笔记；修复时将可重复最小案例移入对应现有 tests/evals，旧证据只读。先读原命令和 fixture，禁止盲跑可能改旧 receipts 的 `verify-audit.py`。测试命令须从当前 `package.json` 与对应测试文件核实，不假设脚本名或复制历史通过数。

按修改面执行最窄测试；脚本/CLI 变化运行 `npm run typecheck`，Skill 入口变化运行 `npm run lint:skill-entrypoints`。共享路径、artifact、generator 变化加 consumer integration；最终合并候选按影响运行 `npm test`、`npm run build`，记录实际结果，不把计划里的命令当已执行。

### 关键验收示例

- AE1（R1）：实验目录已有未提交/未跟踪文件，再 create 或 cleanup；原文件保持，未获 ownership 的目录不删除。
- AE2（R2）：PRD 正文改变但输入可刷新；正文旧签收不得复活，合法仅输入刷新仍可用。
- AE3（R3）：发布后回复途中断线；重启先查远端，已完成动作不重复，未发布时不回复“已发布”。无需改代码的解释/拒绝反馈有回复授权即可完成，不等待无意义的 commit/push；needs-human 回复后仍开放。
- AE4（R4）：CE lens 能提出建议，但与上游 WHAT 或 proof-test 冲突；保留上游合同，报告取舍而非静默覆盖。
- AE5（R5/R6）：Xcode/provider 不可用；该项保留 not-run，不以静态合同通过关闭真实验收。
- AE6（R1/R3）：Sweep 本地 release 成功但末次 push 失败；不得称远端租约已释放，恢复先读取远端且不覆盖新 writer。
- AE7（R2/R3）：同一媒体输入从 Riffrec 与 Sweep 包内路径执行；缺 chunk 和 provider 失败的回执一致，未授权路径零调用，parent 保留 partial/unknown。

U31 在产品修改前冻结各 Skill 至少一个主要研发场景及其关键反例，保存可恢复的修改前源码、输入与 judge 版本，并预定 host/model/工具身份要求。U29 记录两侧实际运行身份、产物和原始 trace；模型或环境无法保持可比时如实标记 inconclusive，不从旧日志补造对照。U30 比较先看正确性和严重遗漏，再看返工与成本；不预造统一百分比阈值。任何权限或证据退化不得采用；语义质量差异由独立结果评审判定，未提供独立能力时写 inconclusive。真实外写、安装、视觉和跨模型分别核既有授权与能力，阻塞仅影响依赖场景。

## Definition of Done

本轮计划交付：单份文档落盘，15 个 F 编号、32 个单元（保留原 U1–U30，新增 U31/U32）、34 纳入/4 排除映射及依赖可核验，必要文档检查完成。本计划已按文档审查修订，没有执行产品修复或产品测试。

后续单元完成：相关详审条目逐条处置；现有反例关闭且正常路径通过；producer/consumer/恢复验证完成；source/docs/changelog 同步；残余问题与真实能力限制有记录。仅修改文案或新增字段不算跨 Skill 闭环完成。

后续整体完成：U31 的基线准备完成，U1–U28 及 U32 的必要改动与回归完成；U29 的 34 项真实行为状态均明确；U30 形成按场景的采用/保持可选/撤回结论。必需真实场景仍 not-run 或收益仍 inconclusive 时，只能报告机制完成和具体未完成项，不能宣称“完美融合”或全部验收通过。

### 本计划审查边界

本计划已针对本会话提出的五项 P2 文档问题修订：U16 区分反馈回复条件；U31 提前冻结可恢复基线；依赖图接入 Sweep 并区分硬前置与建议顺序；U32 承接共享发布和媒体授权；U14 明确两份分析器源码同步及双入口验收。产品执行状态仍全部为待实施。

本次仅由当前模型进行源码核对和有界自审，未运行独立 reviewer，不宣称独立审查通过。记录为 `review_source: producer-self-review`、`review_status: degraded`、`independent_review: not_run`；未分派的原因是本次未获独立 worker 授权，而非已证明工具能力不存在。真实模型/宿主/收益验证均留在对应实施单元。

本次文档检查通过：32 个唯一 U-ID、依赖无环、U30 前置闭包包含其余 31 个单元、所有产品修改单元可追溯到 U31；F01–F15 与 34/4 映射保留；本地链接和具名源码路径有效；本次写入限计划与 CHANGELOG，6,022 个既有文件中仅这两份授权目标变化，index 保持；`git diff --check` 通过。以上检查不证明产品修复、真实行为或语义收益。
